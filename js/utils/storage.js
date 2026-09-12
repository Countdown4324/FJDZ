// ========================================
// 本地存储管理
// ========================================

const Storage = {
    STORAGE_KEY: 'delta_plane_war_save',

    defaults: {
        version: '1.0',
        highScore: 0,
        totalKills: 0,
        gamesPlayed: 0,
        unlockedShips: [0],
        settings: {
            bgmVolume: 0.7,
            sfxVolume: 1.0,
            autoShoot: true,
            vibration: true
        }
    },

    /**
     * 加载存档
     */
    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return { ...this.defaults };
            const data = JSON.parse(raw);
            return { ...this.defaults, ...data };
        } catch (e) {
            console.warn('Failed to load save data:', e);
            return { ...this.defaults };
        }
    },

    /**
     * 保存存档
     */
    save(data) {
        try {
            const current = this.load();
            const merged = { ...current, ...data };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    },

    /**
     * 获取最高分
     */
    getHighScore() {
        return this.load().highScore;
    },

    /**
     * 更新最高分
     */
    updateHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true;
        }
        return false;
    },

    /**
     * 获取已解锁战机列表
     */
    getUnlockedShips() {
        return this.load().unlockedShips;
    },

    /**
     * 解锁战机
     */
    unlockShip(shipIndex) {
        const data = this.load();
        if (!data.unlockedShips.includes(shipIndex)) {
            data.unlockedShips.push(shipIndex);
            this.save(data);
        }
    },

    /**
     * 增加游戏次数
     */
    incrementGamesPlayed() {
        const data = this.load();
        data.gamesPlayed++;
        this.save(data);
    },

    /**
     * 增加击杀数
     */
    addKills(count) {
        const data = this.load();
        data.totalKills += count;
        this.save(data);
    },

    /**
     * 获取设置
     */
    getSettings() {
        return this.load().settings;
    },

    /**
     * 更新设置
     */
    updateSettings(newSettings) {
        const data = this.load();
        data.settings = { ...data.settings, ...newSettings };
        this.save(data);
    }
};