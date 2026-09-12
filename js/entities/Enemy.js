// ========================================
// 敌人系统
// ========================================

class Enemy extends Entity {
    /**
     * @param {string} type - KEY of ENEMY_TYPES
     * @param {number} x
     * @param {number} y
     * @param {object} playerRef - 玩家引用
     * @param {number} damage - 子弹伤害（随波次增强）
     */
    constructor(type, x, y, playerRef, damage = 1) {
        const config = ENEMY_TYPES[type];
        super(x, y, config.width, config.height);
        this.type = type;
        this.config = config;
        this.player = playerRef;

        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.color = config.color;
        this.pattern = config.pattern;
        this.score = config.score;
        this.shootInterval = config.shootInterval || 0;
        this.shootTimer = Math.random() * this.shootInterval;
        this.hasShield = config.hasShield || false;
        this.shieldHp = this.hasShield ? 1 : 0;
        this.damage = damage;

        this.vy = this.speed;
        this.phase = 0;
        this.startX = x;
    }

    update(dt) {
        const dtNorm = dt / 16.67;
        this.age += dt;

        switch (this.pattern) {
            case 'LINEAR':
                this.y += this.speed * dtNorm;
                break;
            case 'SINUSOIDAL':
                this.y += this.speed * dtNorm;
                this.x = this.startX + Math.sin(this.y * 0.04) * 60;
                break;
            case 'STATIONARY':
                if (this.y < 120) {
                    this.y += this.speed * dtNorm;
                }
                break;
            case 'CHASE':
                if (this.player) {
                    const dx = this.player.x - this.x;
                    const dy = this.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    this.vx = (dx / dist) * this.speed * 1.2;
                    this.vy = (dy / dist) * this.speed * 1.2;
                }
                this.x += this.vx * dtNorm;
                this.y += this.vy * dtNorm;
                break;
            case 'ELITE':
                if (this.y < 80) {
                    this.y += this.speed * dtNorm;
                } else {
                    this.x = this.startX + Math.sin(this.age * 0.002) * 80;
                }
                break;
        }

        // 射击
        if (this.shootInterval > 0) {
            this.shootTimer += dt;
        }

        if (this.y > CANVAS.HEIGHT + 60) {
            this.destroy();
        }
    }

    /**
     * 尝试射击
     * @returns {Bullet[]}
     */
    tryShoot() {
        if (this.shootInterval <= 0) return [];
        if (this.shootTimer < this.shootInterval) return [];
        this.shootTimer = 0;

        const bullets = [];
        const bx = this.x;
        const by = this.y + this.height / 2;

        if (this.player) {
            const angle = MathUtils.angle(bx, by, this.player.x, this.player.y);
            const speed = BULLET.ENEMY_SPEED;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            bullets.push(new Bullet(bx, by, vx, vy, this.damage, this.color, false));
        }

        return bullets;
    }

    /**
     * 受伤
     */
    takeDamage(amount) {
        if (this.shieldHp > 0) {
            this.shieldHp -= amount;
            return false;
        }
        this.hp -= amount;
        return this.hp <= 0;
    }

    /**
     * 渲染
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 护盾渲染
        if (this.shieldHp > 0) {
            ctx.strokeStyle = COLORS.NEON_GREEN;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.shadowColor = COLORS.NEON_GREEN;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 3, this.width * 0.6, Math.PI, 0);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;

        switch (this.type) {
            case 'SCOUT':
                this.renderTriangle(ctx, 0.8);
                break;
            case 'ASSAULT':
                this.renderDiamond(ctx, 1);
                break;
            case 'SNIPER':
                this.renderHexagon(ctx, 0.9);
                break;
            case 'SUICIDE':
                this.renderCircle(ctx, 0.8);
                break;
            case 'SHIELD':
                this.renderDiamond(ctx, 1.1);
                break;
            case 'ELITE':
                this.renderOctagon(ctx, 1.1);
                break;
        }

        ctx.restore();
    }

    renderTriangle(ctx, scale) {
        const s = this.width / 2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.lineTo(-s, -s * 0.5);
        ctx.lineTo(s, -s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    renderDiamond(ctx, scale) {
        const s = this.width / 2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    renderHexagon(ctx, scale) {
        const s = this.width / 2 * scale;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i - Math.PI / 2;
            const px = Math.cos(angle) * s;
            const py = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    renderCircle(ctx, scale) {
        const s = this.width / 2 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        // 自爆兵内部 X 标记
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, -s * 0.4);
        ctx.lineTo(s * 0.4, s * 0.4);
        ctx.moveTo(s * 0.4, -s * 0.4);
        ctx.lineTo(-s * 0.4, s * 0.4);
        ctx.stroke();
    }

    renderOctagon(ctx, scale) {
        const s = this.width / 2 * scale;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = Math.PI / 4 * i - Math.PI / 2;
            const px = Math.cos(angle) * s;
            const py = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 精英标记
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', 0, 1);
    }
}