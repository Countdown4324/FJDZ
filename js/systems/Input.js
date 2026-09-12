// ========================================
// 输入系统（键盘 + 触屏）
// ========================================

class InputSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this._keyDown = {};
        this._keyConsumed = {};
        this.touch = null;
        this.touchStart = null;
        this.touchFireArea = false;
        this.touchBombArea = null;
        this.touchSkillArea = null;
        this.touchItemArea = null;

        this._bindKeyboard();
        this._bindTouch();
    }

    _isKeyInBind(bindName, key) {
        const bindings = KEY_BINDINGS[bindName];
        return bindings && bindings.includes(key);
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this._keyDown[e.key] = true;
            // 防止方向键滚动页面
            if (this._isKeyInBind('MOVE_UP', e.key) ||
                this._isKeyInBind('MOVE_DOWN', e.key) ||
                this._isKeyInBind('MOVE_LEFT', e.key) ||
                this._isKeyInBind('MOVE_RIGHT', e.key) ||
                this._isKeyInBind('FIRE', e.key) ||
                this._isKeyInBind('ITEM', e.key) ||
                this._isKeyInBind('SKILL', e.key) ||
                this._isKeyInBind('BOMB', e.key) ||
                this._isKeyInBind('SHIELD', e.key) ||
                this._isKeyInBind('PAUSE', e.key) ||
                this._isKeyInBind('MENU', e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this._keyDown[e.key] = false;
            this._keyConsumed[e.key] = false;
        });
    }

    _bindTouch() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            for (const touch of e.changedTouches) {
                const tx = touch.clientX - rect.left;
                const ty = touch.clientY - rect.top;
                const scaleX = CANVAS.WIDTH / rect.width;
                const scaleY = CANVAS.HEIGHT / rect.height;
                const x = tx * scaleX;
                const y = ty * scaleY;

                if (x < CANVAS.WIDTH * 0.5) {
                    // 左半屏：移动
                    this.touch = { x, y, startX: x, startY: y };
                    this.touchStart = { x, y };
                } else if (y > CANVAS.HEIGHT * 0.8) {
                    // 右下角：道具
                    this.touchItemArea = true;
                } else if (y > CANVAS.HEIGHT * 0.65) {
                    // 右中：技能
                    this.touchSkillArea = true;
                } else if (y > CANVAS.HEIGHT * 0.5) {
                    // 右上：炸弹
                    this.touchBombArea = true;
                } else {
                    // 右上方：发射
                    this.touchFireArea = true;
                }
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touch) return;
            const rect = this.canvas.getBoundingClientRect();
            for (const touch of e.changedTouches) {
                const tx = touch.clientX - rect.left;
                const ty = touch.clientY - rect.top;
                const scaleX = CANVAS.WIDTH / rect.width;
                const scaleY = CANVAS.HEIGHT / rect.height;
                this.touch.x = tx * scaleX;
                this.touch.y = ty * scaleY;
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch = null;
            this.touchStart = null;
            this.touchFireArea = false;
            this.touchBombArea = null;
            this.touchSkillArea = null;
            this.touchItemArea = null;
        });
    }

    /**
     * 获取移动方向
     */
    getDirection() {
        let dx = 0, dy = 0;

        if (this.touch && this.touchStart) {
            dx = this.touch.x - this.touchStart.x;
            dy = this.touch.y - this.touchStart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                dx = (dx / dist) * PLAYER.SPEED;
                dy = (dy / dist) * PLAYER.SPEED;
            } else {
                dx = 0;
                dy = 0;
            }
        } else {
            if (KEY_BINDINGS.MOVE_LEFT.some(k => this.keys[k])) dx = -PLAYER.SPEED;
            if (KEY_BINDINGS.MOVE_RIGHT.some(k => this.keys[k])) dx = PLAYER.SPEED;
            if (KEY_BINDINGS.MOVE_UP.some(k => this.keys[k])) dy = -PLAYER.SPEED;
            if (KEY_BINDINGS.MOVE_DOWN.some(k => this.keys[k])) dy = PLAYER.SPEED;
        }

        return { x: dx, y: dy };
    }

    /**
     * 是否按下发射键（J / Space）
     */
    isFirePressed() {
        if (this.touchFireArea) return true;
        return KEY_BINDINGS.FIRE.some(k => this.keys[k] === true);
    }

    /**
     * 是否按下道具使用键（K）
     */
    isItemPressed() {
        if (this.touchItemArea) {
            this.touchItemArea = null;
            return true;
        }
        return this._consumeBind('ITEM');
    }

    /**
     * 是否按下技能键
     */
    isSkillPressed() {
        if (this.touchSkillArea) {
            this.touchSkillArea = null;
            return true;
        }
        return this._consumeBind('SKILL');
    }

    /**
     * 是否按下炸弹键
     */
    isBombPressed() {
        if (this.touchBombArea) {
            this.touchBombArea = null;
            return true;
        }
        return this._consumeBind('BOMB');
    }

    /**
     * 是否按下暂停键
     */
    isPausePressed() {
        return this._consumeBind('PAUSE');
    }

    /**
     * 是否按下返回菜单键（M / Backspace）
     */
    isMenuPressed() {
        return this._consumeBind('MENU');
    }

    /**
     * 是否按下保护罩键（H）
     */
    isShieldPressed() {
        return this._consumeBind('SHIELD');
    }

    /**
     * 是否按下确认键
     */
    isConfirmPressed() {
        return this._consumeBind('CONFIRM');
    }

    /**
     * 消费按键绑定（按下后标记为已处理）
     */
    _consumeBind(bindName) {
        const bindings = KEY_BINDINGS[bindName];
        if (!bindings) return false;
        for (const key of bindings) {
            if (this._keyDown[key] && !this._keyConsumed[key]) {
                this._keyConsumed[key] = true;
                return true;
            }
        }
        return false;
    }

    /**
     * 每帧更新时调用
     */
    update() {
        for (const key in this._keyDown) {
            if (this._keyDown[key] && !this.keys[key]) {
                this._keyDown[key] = false;
                this._keyConsumed[key] = false;
            }
        }
    }
}