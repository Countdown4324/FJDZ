// ========================================
// 数学工具函数
// ========================================

const MathUtils = {
    /**
     * 两点间距离
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 两点间角度 (弧度)
     */
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    /**
     * 限制值在范围内
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 限制值在 Canvas 范围内
     */
    clampToCanvas(x, y, w, h) {
        return {
            x: Math.max(0, Math.min(CANVAS.WIDTH - w, x)),
            y: Math.max(0, Math.min(CANVAS.HEIGHT - h, y))
        };
    },

    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * 范围随机整数
     */
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 范围随机浮点数
     */
    randFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 随机选择数组元素
     */
    randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 概率测试
     * @param {number} probability - 0 到 1
     */
    chance(probability) {
        return Math.random() < probability;
    },

    /**
     * 角度转弧度
     */
    degToRad(deg) {
        return deg * (Math.PI / 180);
    },

    /**
     * 弧度转角度
     */
    radToDeg(rad) {
        return rad * (180 / Math.PI);
    }
};