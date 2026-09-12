// ========================================
// 场景管理器
// ========================================

class SceneManager {
    constructor() {
        this.currentScene = null;
        this.scenes = {};
    }

    /**
     * 注册场景
     */
    register(name, scene) {
        this.scenes[name] = scene;
    }

    /**
     * 切换场景
     */
    switchTo(name) {
        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].exit();
        }
        this.currentScene = name;
        if (this.scenes[name]) {
            this.scenes[name].enter();
        }
    }

    /**
     * 更新当前场景
     */
    update(dt) {
        if (this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].update(dt);
        }
    }

    /**
     * 渲染当前场景
     */
    render(ctx) {
        if (this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].render(ctx);
        }
    }
}