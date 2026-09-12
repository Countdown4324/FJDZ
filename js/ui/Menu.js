// ========================================
// 菜单界面管理
// ========================================

class MenuManager {
    constructor() {
        this.screens = {
            menu: document.getElementById('menu-screen'),
            select: document.getElementById('select-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        this.selectedShip = 0;
        this.callbacks = {};

        this._init();
    }

    _init() {
        // 主菜单按钮
        document.getElementById('btn-start').addEventListener('click', () => {
            if (this.callbacks.onStart) this.callbacks.onStart('endless');
        });

        document.getElementById('btn-select').addEventListener('click', () => {
            this.showSelect();
        });

        document.getElementById('btn-bossrush').addEventListener('click', () => {
            if (this.callbacks.onStart) this.callbacks.onStart('bossrush');
        });

        document.getElementById('btn-back-select').addEventListener('click', () => {
            this.showScreen('menu');
        });

        // 暂停按钮
        document.getElementById('btn-resume').addEventListener('click', () => {
            if (this.callbacks.onResume) this.callbacks.onResume();
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            if (this.callbacks.onQuit) this.callbacks.onQuit();
        });

        // 游戏结束按钮
        document.getElementById('btn-retry').addEventListener('click', () => {
            if (this.callbacks.onRetry) this.callbacks.onRetry();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            if (this.callbacks.onQuit) this.callbacks.onQuit();
        });

        // 战机选择卡片
        const cards = document.querySelectorAll('.ship-card');
        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const unlocked = Storage.getUnlockedShips();
                if (unlocked.includes(index)) {
                    this.selectShip(index);
                }
            });
        });
    }

    /**
     * 注册回调
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * 显示指定屏幕
     */
    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
        }
    }

    /**
     * 隐藏所有屏幕
     */
    hideAll() {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
    }

    /**
     * 显示主菜单
     */
    showMenu() {
        this.showScreen('menu');
        document.getElementById('menu-high-score').textContent =
            Storage.getHighScore();
    }

    /**
     * 显示战机选择
     */
    showSelect() {
        this.showScreen('select');
        const unlocked = Storage.getUnlockedShips();
        const cards = document.querySelectorAll('.ship-card');
        cards.forEach((card, index) => {
            if (unlocked.includes(index)) {
                card.classList.remove('locked');
            } else {
                card.classList.add('locked');
            }
            if (index === this.selectedShip) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        this._drawShipPreviews();
    }

    /**
     * 显示暂停
     */
    showPause() {
        this.showScreen('pause');
    }

    /**
     * 显示游戏结束
     */
    showGameOver(stats) {
        this.showScreen('gameover');
        document.getElementById('result-score').textContent = stats.score;
        document.getElementById('result-combo').textContent = stats.maxCombo;
        document.getElementById('result-kills').textContent = stats.kills;

        if (stats.isNewRecord) {
            document.getElementById('new-record').style.display = 'flex';
        } else {
            document.getElementById('new-record').style.display = 'none';
        }
    }

    /**
     * 选择战机
     */
    selectShip(index) {
        this.selectedShip = index;
        const cards = document.querySelectorAll('.ship-card');
        cards.forEach((c, i) => {
            if (i === index) c.classList.add('selected');
            else c.classList.remove('selected');
        });
    }

    /**
     * 绘制战机预览
     */
    _drawShipPreviews() {
        for (let i = 0; i < 3; i++) {
            const canvas = document.getElementById(`preview-${i}`);
            if (!canvas) continue;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 80, 80);

            const ship = SHIP_TYPES[i];
            const cx = 40, cy = 40;
            const w = 20, h = 24;

            ctx.save();
            ctx.translate(cx, cy);

            // 引擎尾焰
            const gradient = ctx.createLinearGradient(0, h, 0, h + 10);
            gradient.addColorStop(0, COLORS.NEON_BLUE);
            gradient.addColorStop(0.5, COLORS.NEON_PURPLE);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-6, h);
            ctx.lineTo(6, h);
            ctx.lineTo(2, h + 10);
            ctx.lineTo(-2, h + 10);
            ctx.closePath();
            ctx.fill();

            // 机身
            ctx.fillStyle = '#1a1a3e';
            ctx.strokeStyle = COLORS.NEON_BLUE;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = COLORS.NEON_BLUE;
            ctx.shadowBlur = 6;
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

            ctx.restore();
        }
    }
}