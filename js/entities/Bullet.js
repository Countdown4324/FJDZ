// ========================================
// 子弹类
// ========================================

class Bullet extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} vx - x 方向速度
     * @param {number} vy - y 方向速度
     * @param {number} damage
     * @param {string} color
     * @param {boolean} isPlayerBullet
     */
    constructor(x, y, vx, vy, damage, color, isPlayerBullet) {
        const size = isPlayerBullet ? 6 : 8;
        super(x, y, size, size);
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.isPlayerBullet = isPlayerBullet;
        this.trail = [];
        this.maxTrail = 5;
    }

    update(dt) {
        const dtNorm = dt / 16.67;
        this.age += dt;
        this.x += this.vx * dtNorm;
        this.y += this.vy * dtNorm;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        if (!this.isOnScreen()) {
            this.destroy();
        }
    }

    render(ctx) {
        // 拖尾效果
        if (this.trail.length > 1) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < this.trail.length - 1; i++) {
                const t = this.trail[i];
                const alpha = i / this.trail.length * 0.4;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.isPlayerBullet ? 2 : 2.5;
                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 子弹主体
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.isPlayerBullet) {
            // 玩家子弹：小菱形
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        } else {
            // 敌人子弹：圆
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // 光晕
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}