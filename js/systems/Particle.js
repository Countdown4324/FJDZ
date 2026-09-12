// ========================================
// 粒子特效系统
// ========================================

class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.color = '#fff';
        this.size = 2;
        this.gravity = 0;
        this.friction = 1;
    }

    init(x, y, vx, vy, life, color, size, gravity = 0, friction = 0.98) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.gravity = gravity;
        this.friction = friction;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        const dtNorm = dt / 16.67;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dtNorm;
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }
}

class ParticleSystem {
    constructor() {
        this.pool = [];
        this.poolSize = 500;
        this._initPool();
    }

    _initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Particle());
        }
    }

    /**
     * 获取一个空闲粒子
     */
    _get() {
        for (const p of this.pool) {
            if (!p.active) return p;
        }
        return null;
    }

    /**
     * 爆炸特效
     */
    explode(x, y, color, size = 1) {
        const count = Math.floor(8 * size);
        for (let i = 0; i < count; i++) {
            const p = this._get();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = MathUtils.randFloat(1, 4) * size;
            p.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                MathUtils.randFloat(200, 500),
                color,
                MathUtils.randFloat(1.5, 3.5) * size,
                0.02,
                0.97
            );
        }
    }

    /**
     * 引擎尾焰粒子
     */
    engineTrail(x, y, color) {
        const p = this._get();
        if (!p) return;
        p.init(
            x + MathUtils.randFloat(-3, 3),
            y,
            MathUtils.randFloat(-0.5, 0.5),
            MathUtils.randFloat(0.5, 2),
            MathUtils.randFloat(200, 400),
            color,
            MathUtils.randFloat(1, 3),
            0,
            0.96
        );
    }

    /**
     * 道具拾取特效
     */
    pickupEffect(x, y, color) {
        const count = 6;
        for (let i = 0; i < count; i++) {
            const p = this._get();
            if (!p) break;
            const angle = (Math.PI * 2 / count) * i;
            p.init(
                x, y,
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                400,
                color,
                2,
                0,
                0.95
            );
        }
    }

    /**
     * 连击提示特效
     */
    comboText(x, y, text, color) {
        // 文字特效通过生成光点粒子
        const count = 10;
        for (let i = 0; i < count; i++) {
            const p = this._get();
            if (!p) break;
            p.init(
                x + MathUtils.randFloat(-20, 20),
                y + MathUtils.randFloat(-10, 10),
                MathUtils.randFloat(-1, 1),
                MathUtils.randFloat(-2, -0.5),
                600,
                color,
                MathUtils.randFloat(2, 4),
                0.01,
                0.98
            );
        }
    }

    /**
     * Boss 出场特效
     */
    bossEntrance(x, y, color) {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const p = this._get();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = MathUtils.randFloat(2, 6);
            p.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                MathUtils.randFloat(500, 1000),
                color,
                MathUtils.randFloat(2, 5),
                0.01,
                0.98
            );
        }
    }

    /**
     * 屏幕震动粒子
     */
    screenShake(intensity) {
        // 不生成粒子，返回震动偏移
        return {
            x: MathUtils.randFloat(-intensity, intensity),
            y: MathUtils.randFloat(-intensity, intensity)
        };
    }

    /**
     * 更新所有粒子
     */
    update(dt) {
        for (const p of this.pool) {
            if (p.active) p.update(dt);
        }
    }

    /**
     * 渲染所有粒子
     */
    render(ctx) {
        for (const p of this.pool) {
            if (!p.active) continue;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * 获取活跃粒子数
     */
    getActiveCount() {
        return this.pool.filter(p => p.active).length;
    }
}