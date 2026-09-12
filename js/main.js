// ========================================
// 游戏入口
// ========================================

(function () {
    'use strict';

    // 等待 DOM 和字体加载完成
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Game('game-canvas');

        // 启动游戏
        game.start();

        // 暴露到全局，方便调试
        window.__game = game;
    });
})();