// ========================================
// 实体基类
// ========================================

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.active = true;
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
    }

    update(dt) {
        this.age += dt;
        this.x += this.vx * (dt / 16.67);
        this.y += this.vy * (dt / 16.67);
    }

    render(ctx) {
        // 子类重写
    }

    destroy() {
        this.active = false;
    }

    /**
     * 获取包围盒
     */
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * 是否在屏幕内
     */
    isOnScreen() {
        return this.y > -this.height &&
               this.y < CANVAS.HEIGHT + this.height &&
               this.x > -this.width &&
               this.x < CANVAS.WIDTH + this.width;
    }
}