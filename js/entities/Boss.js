// ========================================
// Boss 系统
// ========================================

class Boss extends Entity {
    /**
     * @param {string} bossKey - 'BOSS_1' | 'BOSS_2' | 'BOSS_3'
     * @param {object} playerRef
     */
    constructor(bossKey, playerRef) {
        const config = BOSS_CONFIG[bossKey];
        super(CANVAS.WIDTH / 2, -config.height, config.width, config.height);
        this.bossKey = bossKey;
        this.config = config;
        this.player = playerRef;

        this.name = config.name;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.color = config.color;
        this.score = config.score;
        this.phaseThresholds = config.phaseThresholds;
        this.phase = 1;
        this.maxPhase = this.phaseThresholds.length + 1;

        // 入场动画
        this.entering = true;
        this.enterTargetY = 100;
        this.enterSpeed = 1.5;

        // 攻击计时器
        this.attackTimer = 0;
        this.attackInterval = 1500;
        this.attackPattern = 0;
        this.patternTimer = 0;
        this.patternDuration = 5000;

        // 分身
        this.clones = [];

        // 旋转激光
        this.laserAngle = 0;

        // 血量条
        this.showHealthBar = true;
    }

    update(dt) {
        this.age += dt;

        // 入场
        if (this.entering) {
            this.y += this.enterSpeed;
            if (this.y >= this.enterTargetY) {
                this.y = this.enterTargetY;
                this.entering = false;
            }
            return;
        }

        // 轻微浮动
        this.x = CANVAS.WIDTH / 2 + Math.sin(this.age * 0.001) * 30;

        // 阶段检测
        this.checkPhase();

        // 攻击
        this.attackTimer += dt;
        this.patternTimer += dt;

        if (this.patternTimer >= this.patternDuration) {
            this.patternTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % this.getPatternCount();
        }

        this.executeAttack(dt);

        // 更新分身
        for (const clone of this.clones) {
            clone.age += dt;
            clone.x = this.x + Math.sin(clone.age * 0.003 + clone.offset) * 80;
            clone.y = this.y + Math.cos(clone.age * 0.003 + clone.offset) * 40;
        }

        // 旋转激光
        this.laserAngle += dt * 0.001;
    }

    checkPhase() {
        const hpPercent = this.hp / this.maxHp;
        for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
            const threshold = this.phaseThresholds[i];
            if (hpPercent <= threshold) {
                const newPhase = i + 2;
                if (newPhase !== this.phase) {
                    this.phase = newPhase;
                    this.attackTimer = 0;
                    this.patternTimer = 0;
                    this.attackInterval = Math.max(600, this.attackInterval - 300);
                }
                break;
            }
        }
    }

    getPatternCount() {
        // Boss 1: 2 patterns, Boss 2: 2 patterns, Boss 3: 3 patterns
        return this.bossKey === 'BOSS_3' ? 3 : 2;
    }

    executeAttack(dt) {
        if (this.attackTimer < this.attackInterval) return;
        this.attackTimer = 0;

        const bx = this.x;
        const by = this.y + this.height / 2;

        let bullets = [];

        if (this.bossKey === 'BOSS_1') {
            bullets = this.boss1Attack(bx, by);
        } else if (this.bossKey === 'BOSS_2') {
            bullets = this.boss2Attack(bx, by);
        } else if (this.bossKey === 'BOSS_3') {
            bullets = this.boss3Attack(bx, by);
        }

        return bullets;
    }

    /**
     * Boss 1 - 巨像级
     */
    boss1Attack(bx, by) {
        const bullets = [];
        const speed = BULLET.ENEMY_SPEED * 1.2;

        if (this.phase === 1) {
            // 扇形弹幕
            const count = 8;
            const spread = Math.PI / 3;
            for (let i = 0; i < count; i++) {
                const angle = Math.PI / 2 + (i - (count - 1) / 2) * (spread / (count - 1));
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed, Math.sin(angle) * speed, 1, this.color, false));
            }
        } else {
            // 旋转激光 + 扇形弹幕
            const count = 12;
            const spread = Math.PI * 0.8;
            for (let i = 0; i < count; i++) {
                const angle = Math.PI / 2 + (i - (count - 1) / 2) * (spread / (count - 1));
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.3, Math.sin(angle) * speed * 1.3, 1, COLORS.NEON_ORANGE, false));
            }
        }

        return bullets;
    }

    /**
     * Boss 2 - 毁灭级
     */
    boss2Attack(bx, by) {
        const bullets = [];
        const speed = BULLET.ENEMY_SPEED;

        if (this.phase === 1) {
            // 追踪弹
            if (this.player) {
                for (let i = 0; i < 3; i++) {
                    const angle = MathUtils.angle(bx, by, this.player.x, this.player.y) + (i - 1) * 0.3;
                    bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.5, Math.sin(angle) * speed * 1.5, 1, this.color, false));
                }
            }
            // 全屏弹幕
            const count = 16;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + this.age * 0.001;
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed, Math.sin(angle) * speed, 1, COLORS.NEON_PURPLE, false));
            }
        } else {
            // 旋转弹幕环
            const count = 20;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + this.laserAngle;
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.2, Math.sin(angle) * speed * 1.2, 1, COLORS.NEON_PURPLE, false));
            }
            // 额外追踪弹
            if (this.player) {
                const angle = MathUtils.angle(bx, by, this.player.x, this.player.y);
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.8, Math.sin(angle) * speed * 1.8, 1, this.color, false));
            }
        }

        return bullets;
    }

    /**
     * Boss 3 - 虚空级（最终 Boss）
     */
    boss3Attack(bx, by) {
        const bullets = [];
        const speed = BULLET.ENEMY_SPEED;

        const pattern = this.attackPattern % 3;

        if (pattern === 0) {
            // 扇形弹幕 + 激光
            const count = 10;
            const spread = Math.PI / 2.5;
            for (let i = 0; i < count; i++) {
                const angle = Math.PI / 2 + (i - (count - 1) / 2) * (spread / (count - 1));
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.4, Math.sin(angle) * speed * 1.4, 1, COLORS.NEON_PINK, false));
            }
        } else if (pattern === 1) {
            // 追踪弹
            if (this.player) {
                for (let i = 0; i < 5; i++) {
                    const angle = MathUtils.angle(bx, by, this.player.x, this.player.y) + (i - 2) * 0.25;
                    bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.6, Math.sin(angle) * speed * 1.6, 1, COLORS.NEON_PURPLE, false));
                }
            }
        } else {
            // 全屏弹幕 + 旋转激光
            const count = 24;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + this.laserAngle * 1.5;
                bullets.push(new Bullet(bx, by, Math.cos(angle) * speed * 1.3, Math.sin(angle) * speed * 1.3, 1, COLORS.NEON_PINK, false));
            }
        }

        return bullets;
    }

    /**
     * 受伤
     */
    takeDamage(amount) {
        if (this.entering) return false;
        this.hp -= amount;
        return this.hp <= 0;
    }

    /**
     * 渲染
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 旋转激光效果
        if (this.bossKey === 'BOSS_2' && this.phase === 2 ||
            this.bossKey === 'BOSS_3' && this.attackPattern === 2) {
            this.renderLaser(ctx);
        }

        // 主体
        this.renderBody(ctx);

        // 分身
        if (this.phase >= 2 && this.bossKey === 'BOSS_3') {
            for (const clone of this.clones) {
                this.renderClone(ctx, clone);
            }
        }

        ctx.restore();
    }

    renderLaser(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        for (let i = 0; i < 4; i++) {
            const angle = this.laserAngle + (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 300, Math.sin(angle) * 300);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    renderBody(ctx) {
        const s = this.width / 2;
        const pulse = Math.sin(this.age * 0.003) * 0.2 + 0.8;

        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 * pulse;

        // 主体
        ctx.fillStyle = '#1a1a3e';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.7, -s * 0.3);
        ctx.lineTo(-s, s * 0.3);
        ctx.lineTo(-s * 0.5, s * 0.8);
        ctx.lineTo(0, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(s * 0.7, -s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 核心
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7 * pulse;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Boss 名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(this.name, 0, s * 0.65);
    }

    renderClone(ctx, clone) {
        ctx.save();
        ctx.translate(clone.x - this.x, clone.y - this.y);
        ctx.globalAlpha = 0.5;
        const s = this.width / 2 * 0.6;
        ctx.fillStyle = '#1a1a3e';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.7, -s * 0.3);
        ctx.lineTo(-s, s * 0.3);
        ctx.lineTo(-s * 0.5, s * 0.8);
        ctx.lineTo(0, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(s * 0.7, -s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 初始化分身
     */
    initClones() {
        if (this.bossKey === 'BOSS_3' && this.clones.length === 0) {
            this.clones = [
                { x: this.x, y: this.y, offset: 0, age: 0 },
                { x: this.x, y: this.y, offset: Math.PI * 2 / 3, age: 0 }
            ];
        }
    }

    /**
     * 生成召唤的小兵
     */
    getSummonedEnemies() {
        const enemies = [];
        if (this.bossKey === 'BOSS_1' && this.phase === 1 && Math.random() < 0.3) {
            enemies.push(new Enemy('SCOUT', MathUtils.randFloat(40, CANVAS.WIDTH - 40), this.y + 40, this.player));
        }
        if (this.bossKey === 'BOSS_3' && this.phase === 3 && Math.random() < 0.5) {
            enemies.push(new Enemy('ASSAULT', MathUtils.randFloat(40, CANVAS.WIDTH - 40), this.y + 40, this.player));
        }
        return enemies;
    }
}