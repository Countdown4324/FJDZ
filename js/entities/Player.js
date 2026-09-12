// ========================================
// 玩家战机
// ========================================

class Player extends Entity {
    constructor(shipIndex) {
        const w = 40, h = 48;
        super(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 100, w, h);

        this.shipIndex = shipIndex;
        this.config = SHIP_TYPES[shipIndex];

        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.fireRate = this.config.fireRate;
        this.bulletPattern = this.config.bulletPattern;
        this.skill = this.config.skill;

        // 武器
        this.weaponLevel = 1;
        this.shootTimer = 0;
        this.shootInterval = 1000 / this.fireRate;

        // 技能
        this.skillCooldown = this.config.skillCooldown || 0;
        this.skillTimer = 0;
        this.skillReady = true;

        // 状态
        this.invincible = false;
        this.invincibleTimer = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;

        // 僚机
        this.wingmen = [];
        this.maxWingmen = 2;

        // 炸弹
        this.bombs = 1;

        // 道具存储槽
        this.storedItem = null;

        // 分数升级等级
        this.upgradeLevel = 1;
        this.upgradedTo2 = false;
        this.upgradedTo3 = false;

        // 引擎尾焰
        this.engineFlame = 0;
    }

    update(dt) {
        const dtNorm = dt / 16.67;
        this.age += dt;

        // 移动
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;

        // 边界限制
        const clamped = MathUtils.clampToCanvas(this.x, this.y, this.width, this.height);
        this.x = clamped.x;
        this.y = clamped.y;

        // 射击计时器
        this.shootTimer += dt;

        // 无敌计时器
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // 技能冷却
        if (!this.skillReady) {
            this.skillTimer -= dt;
            if (this.skillTimer <= 0) {
                this.skillReady = true;
            }
        }

        // 护盾计时器
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }

        // 引擎尾焰动画
        this.engineFlame = Math.sin(this.age * 0.02) * 0.3 + 0.7;
    }

    /**
     * 发射子弹
     * @returns {Bullet[]}
     */
    shoot() {
        if (this.shootTimer < this.shootInterval) return [];
        this.shootTimer = 0;

        const bullets = [];
        const bx = this.x;
        const by = this.y - this.height / 2;
        const speed = BULLET.PLAYER_SPEED;
        const dmg = BULLET.DEFAULT_DAMAGE;
        const color = COLORS.NEON_BLUE;

        // 根据武器等级发射不同弹幕
        switch (this.weaponLevel) {
            case 1: // 单发
                bullets.push(new Bullet(bx, by, 0, -speed, dmg, color, true));
                break;
            case 2: // 双发
                bullets.push(new Bullet(bx - 8, by, 0, -speed, dmg, color, true));
                bullets.push(new Bullet(bx + 8, by, 0, -speed, dmg, color, true));
                break;
            case 3: // 三发散射
                bullets.push(new Bullet(bx, by, 0, -speed, dmg, color, true));
                bullets.push(new Bullet(bx - 10, by, -1.5, -speed, dmg, color, true));
                bullets.push(new Bullet(bx + 10, by, 1.5, -speed, dmg, color, true));
                break;
            case 4: // 扇形弹幕
                bullets.push(new Bullet(bx, by, 0, -speed, dmg, color, true));
                bullets.push(new Bullet(bx - 12, by, -2, -speed, dmg, color, true));
                bullets.push(new Bullet(bx + 12, by, 2, -speed, dmg, color, true));
                bullets.push(new Bullet(bx - 6, by, -1, -speed, dmg, color, true));
                bullets.push(new Bullet(bx + 6, by, 1, -speed, dmg, color, true));
                break;
            case 5: // 追踪型弹幕
                bullets.push(new Bullet(bx, by, 0, -speed, dmg, color, true));
                bullets.push(new Bullet(bx - 10, by, -1.5, -speed, dmg, color, true));
                bullets.push(new Bullet(bx + 10, by, 1.5, -speed, dmg, color, true));
                bullets.push(new Bullet(bx - 5, by, -0.5, -speed, dmg, COLORS.NEON_PURPLE, true));
                bullets.push(new Bullet(bx + 5, by, 0.5, -speed, dmg, COLORS.NEON_PURPLE, true));
                break;
        }

        // 僚机射击
        for (const wingman of this.wingmen) {
            if (wingman.shootTimer <= 0) {
                wingman.shootTimer = wingman.shootInterval;
                bullets.push(new Bullet(wingman.x, wingman.y - 10, 0, -speed, dmg, COLORS.NEON_GREEN, true));
            }
        }

        return bullets;
    }

    /**
     * 使用技能
     */
    useSkill() {
        if (!this.skillReady || !this.skill) return null;

        this.skillReady = false;
        this.skillTimer = this.skillCooldown;

        if (this.skill === 'flash') {
            // 闪现：向前移动一段距离
            this.y = Math.max(60, this.y - 150);
            this.invincible = true;
            this.invincibleTimer = 500;
            return { type: 'flash', x: this.x, y: this.y };
        }

        if (this.skill === 'shield') {
            // 护盾
            this.shieldActive = true;
            this.shieldTimer = 5000;
            return { type: 'shield' };
        }

        return null;
    }

    /**
     * 使用炸弹
     */
    useBomb() {
        if (this.bombs <= 0) return false;
        this.bombs--;
        return true;
    }

    /**
     * 受伤
     */
    takeDamage(amount) {
        if (this.invincible) return false;

        if (this.shieldActive) {
            this.shieldActive = false;
            this.shieldTimer = 0;
            return false;
        }

        this.hp -= amount;
        this.invincible = true;
        this.invincibleTimer = PLAYER.INVINCIBLE_TIME;

        // 武器降级
        if (this.weaponLevel > 1) {
            this.weaponLevel--;
        }

        return this.hp <= 0;
    }

    /**
     * 升级武器
     */
    upgradeWeapon() {
        if (this.weaponLevel < PLAYER.WEAPON_MAX_LEVEL) {
            this.weaponLevel++;
            return true;
        }
        return false;
    }

    /**
     * 添加僚机
     */
    addWingman() {
        if (this.wingmen.length < this.maxWingmen) {
            this.wingmen.push({
                x: this.x + (this.wingmen.length === 0 ? -30 : 30),
                y: this.y,
                shootTimer: 0,
                shootInterval: 400
            });
            return true;
        }
        return false;
    }

    /**
     * 治疗
     */
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * 存储道具
     */
    storeItem(type) {
        this.storedItem = type;
    }

    /**
     * 分数升级战机
     * @param {number} level - 目标等级 (2 或 3)
     * @returns {object|null} 升级信息
     */
    applyUpgrade(level) {
        if (level === 2 && !this.upgradedTo2) {
            this.upgradedTo2 = true;
            this.upgradeLevel = 2;
            this.maxHp += 2;
            this.hp = this.maxHp;
            this.fireRate += 3;
            this.shootInterval = 1000 / this.fireRate;
            this.speed += 1;
            if (this.weaponLevel < 3) this.weaponLevel = 3;
            return { level: 2, name: '进化 · 精英战机' };
        }
        if (level === 3 && !this.upgradedTo3) {
            this.upgradedTo3 = true;
            this.upgradeLevel = 3;
            this.maxHp += 3;
            this.hp = this.maxHp;
            this.fireRate += 3;
            this.shootInterval = 1000 / this.fireRate;
            this.speed += 1;
            this.weaponLevel = 5;
            return { level: 3, name: '终极 · 虚空战机' };
        }
        return null;
    }

    /**
     * 使用存储的道具
     * @returns {object|null} 使用结果
     */
    useStoredItem() {
        if (!this.storedItem) return null;
        const type = this.storedItem;
        this.storedItem = null;

        switch (type) {
            case 'BOMB':
                this.bombs++;
                return { type: 'BOMB', name: '全屏炸弹' };
            case 'HEALTH':
                this.heal(1);
                return { type: 'HEALTH', name: '恢复药水' };
            default:
                return null;
        }
    }

    render(ctx) {
        // 无敌闪烁
        if (this.invincible && Math.floor(this.invincibleTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // 引擎尾焰
        this.renderEngineFlame(ctx);

        // 机身
        this.renderBody(ctx);

        // 护盾
        if (this.shieldActive) {
            this.renderShield(ctx);
        }

        // 僚机
        for (const wingman of this.wingmen) {
            this.renderWingman(ctx, wingman);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    renderEngineFlame(ctx) {
        const flameLen = 12 + this.engineFlame * 8;
        const gradient = ctx.createLinearGradient(0, this.height / 2, 0, this.height / 2 + flameLen);
        gradient.addColorStop(0, COLORS.NEON_BLUE);
        gradient.addColorStop(0.5, COLORS.NEON_PURPLE);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-8, this.height / 2 - 2);
        ctx.lineTo(8, this.height / 2 - 2);
        ctx.lineTo(3, this.height / 2 + flameLen);
        ctx.lineTo(-3, this.height / 2 + flameLen);
        ctx.closePath();
        ctx.fill();

        // 左引擎
        ctx.beginPath();
        ctx.moveTo(-14, this.height / 2 - 4);
        ctx.lineTo(-6, this.height / 2 - 4);
        ctx.lineTo(-8, this.height / 2 + flameLen * 0.7);
        ctx.lineTo(-12, this.height / 2 + flameLen * 0.7);
        ctx.closePath();
        ctx.fill();

        // 右引擎
        ctx.beginPath();
        ctx.moveTo(6, this.height / 2 - 4);
        ctx.lineTo(14, this.height / 2 - 4);
        ctx.lineTo(12, this.height / 2 + flameLen * 0.7);
        ctx.lineTo(8, this.height / 2 + flameLen * 0.7);
        ctx.closePath();
        ctx.fill();
    }

    renderBody(ctx) {
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.shadowColor = COLORS.NEON_BLUE;
        ctx.shadowBlur = 10;

        // 主翼
        ctx.fillStyle = '#1a1a3e';
        ctx.strokeStyle = COLORS.NEON_BLUE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(-w, h * 0.5);
        ctx.lineTo(-w * 0.3, h * 0.2);
        ctx.lineTo(0, h);
        ctx.lineTo(w * 0.3, h * 0.2);
        ctx.lineTo(w, h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 驾驶舱
        ctx.fillStyle = COLORS.NEON_BLUE;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.2, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 武器等级指示器
        for (let i = 0; i < this.weaponLevel; i++) {
            ctx.fillStyle = COLORS.NEON_ORANGE;
            ctx.beginPath();
            ctx.arc(-10 + i * 5, h * 0.7, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderShield(ctx) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.strokeStyle = COLORS.NEON_BLUE;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 * pulse;
        ctx.shadowColor = COLORS.NEON_BLUE;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    renderWingman(ctx, wingman) {
        const dx = wingman.x - this.x;
        const dy = wingman.y - this.y;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillStyle = COLORS.NEON_GREEN;
        ctx.shadowColor = COLORS.NEON_GREEN;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * 更新僚机位置
     */
    updateWingmen() {
        for (let i = 0; i < this.wingmen.length; i++) {
            const targetX = this.x + (i === 0 ? -25 : 25);
            this.wingmen[i].x = MathUtils.lerp(this.wingmen[i].x, targetX, 0.1);
            this.wingmen[i].y = MathUtils.lerp(this.wingmen[i].y, this.y - 10, 0.1);
            this.wingmen[i].shootTimer -= 16.67;
        }
    }
}