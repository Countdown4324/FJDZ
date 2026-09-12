// ========================================
// 道具类
// ========================================

class PowerUp extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} type - KEY of POWERUP_TYPES
     */
    constructor(x, y, type) {
        super(x, y, 28, 28);
        this.type = type;
        this.config = POWERUP_TYPES[type];
        this.vy = 1.5;
        this.color = this.config.color;
        this.rotation = 0;
        this.pulseTimer = 0;
    }

    update(dt) {
        const dtNorm = dt / 16.67;
        this.age += dt;
        this.y += this.vy * dtNorm;
        this.rotation += dt * 0.003;
        this.pulseTimer += dt;

        if (this.y > CANVAS.HEIGHT + 50) {
            this.destroy();
        }
    }

    render(ctx) {
        const pulse = Math.sin(this.pulseTimer * 0.005) * 0.3 + 0.7;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;

        // 外框
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        const s = this.width / 2;
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.stroke();

        // 填充
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3 * pulse;
        ctx.fill();

        // 符号文字
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.symbol, 0, 1);

        ctx.restore();
    }
}