// ========================================
// 波次生成系统 + 持续敌机生成器
// ========================================

class WaveSystem {
    constructor() {
        this.waveNumber = 0;
        this.waveActive = false;
        this.waveClear = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveDelay = 2000;
        this.waveDelayTimer = 0;
        this.bossActive = false;

        // 持续后台生成器：每秒 10~20 架
        this.continuousTimer = 0;
        this.continuousInterval = 80; // 约 12.5 架/秒
    }

    /**
     * 开始下一波
     */
    startNextWave() {
        this.waveNumber++;
        this.waveActive = true;
        this.waveClear = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveDelayTimer = 0;

        // 检查是否 Boss 波
        if (this.waveNumber % WAVE.BOSS_INTERVAL === 0) {
            this.bossActive = true;
            const bossKey = this.waveNumber <= 5 ? 'BOSS_1' :
                           this.waveNumber <= 10 ? 'BOSS_2' : 'BOSS_3';
            return { bossKey, hasBoss: true };
        }

        this.bossActive = false;
        this._generateWave(this.waveNumber);
        return { hasBoss: false };
    }

    /**
     * 生成波次敌人
     */
    _generateWave(wave) {
        const enemyTypes = this._getEnemyTypes(wave);

        for (const etype of enemyTypes) {
            const count = etype.count;
            const interval = etype.interval || 200;
            for (let i = 0; i < count; i++) {
                this.spawnQueue.push({
                    type: etype.type,
                    delay: i * interval
                });
            }
        }
    }

    /**
     * 根据波次获取敌人类型（高速生成模式）
     */
    _getEnemyTypes(wave) {
        const types = [];
        const r = () => MathUtils.randFloat(0.7, 1.3);

        if (wave <= 2) {
            types.push({ type: 'SCOUT', count: Math.floor((10 + wave * 3) * r()), interval: 80 });
            types.push({ type: 'ASSAULT', count: Math.floor(4 * r()), interval: 120 });
        } else if (wave <= 4) {
            types.push({ type: 'SCOUT', count: Math.floor(10 * r()), interval: 70 });
            types.push({ type: 'ASSAULT', count: Math.floor((5 + wave) * r()), interval: 100 });
            types.push({ type: 'SUICIDE', count: Math.floor(4 * r()), interval: 90 });
        } else if (wave <= 6) {
            types.push({ type: 'ASSAULT', count: Math.floor(8 * r()), interval: 80 });
            types.push({ type: 'SNIPER', count: Math.floor((3 + Math.floor(wave / 3)) * r()), interval: 150 });
            types.push({ type: 'SUICIDE', count: Math.floor(7 * r()), interval: 70 });
            types.push({ type: 'SHIELD', count: Math.floor(2 * r()), interval: 180 });
        } else if (wave <= 9) {
            types.push({ type: 'ASSAULT', count: Math.floor(10 * r()), interval: 70 });
            types.push({ type: 'SNIPER', count: Math.floor(5 * r()), interval: 130 });
            types.push({ type: 'SUICIDE', count: Math.floor(8 * r()), interval: 60 });
            types.push({ type: 'SHIELD', count: Math.floor(3 * r()), interval: 150 });
            types.push({ type: 'ELITE', count: Math.floor(2 * r()), interval: 200 });
        } else if (wave <= 12) {
            types.push({ type: 'ASSAULT', count: Math.floor(8 * r()), interval: 60 });
            types.push({ type: 'SNIPER', count: Math.floor(6 * r()), interval: 110 });
            types.push({ type: 'SUICIDE', count: Math.floor(12 * r()), interval: 50 });
            types.push({ type: 'SHIELD', count: Math.floor(5 * r()), interval: 120 });
            types.push({ type: 'ELITE', count: Math.floor(3 * r()), interval: 180 });
        } else if (wave <= 14) {
            types.push({ type: 'SCOUT', count: Math.floor(14 * r()), interval: 45 });
            types.push({ type: 'ASSAULT', count: Math.floor(10 * r()), interval: 55 });
            types.push({ type: 'SNIPER', count: Math.floor(8 * r()), interval: 90 });
            types.push({ type: 'SUICIDE', count: Math.floor(14 * r()), interval: 45 });
            types.push({ type: 'SHIELD', count: Math.floor(5 * r()), interval: 110 });
            types.push({ type: 'ELITE', count: Math.floor(5 * r()), interval: 150 });
        } else {
            types.push({ type: 'ASSAULT', count: Math.floor(14 * r()), interval: 45 });
            types.push({ type: 'SNIPER', count: Math.floor(8 * r()), interval: 80 });
            types.push({ type: 'SUICIDE', count: Math.floor(18 * r()), interval: 35 });
            types.push({ type: 'SHIELD', count: Math.floor(6 * r()), interval: 90 });
            types.push({ type: 'ELITE', count: Math.floor(5 * r()), interval: 120 });
        }

        return types;
    }

    /**
     * 持续后台生成：每秒 10~20 架随机敌机
     */
    _continuousSpawn(dt, playerRef) {
        const spawned = [];
        this.continuousTimer += dt;

        // 动态间隔：50~100ms，即 10~20 架/秒
        const interval = MathUtils.randFloat(50, 100);
        if (this.continuousTimer >= interval) {
            this.continuousTimer = 0;

            const types = this._getContinuousTypes();
            const type = MathUtils.randChoice(types);
            const x = MathUtils.randFloat(30, CANVAS.WIDTH - 30);
            const damage = this._getDamage();
            spawned.push(new Enemy(type, x, -30, playerRef, damage));
        }

        return spawned;
    }

    /**
     * 持续生成的可选敌人类型
     */
    _getContinuousTypes() {
        if (this.waveNumber <= 2) return ['SCOUT'];
        if (this.waveNumber <= 4) return ['SCOUT', 'SCOUT', 'ASSAULT', 'SUICIDE'];
        if (this.waveNumber <= 6) return ['SCOUT', 'ASSAULT', 'ASSAULT', 'SNIPER', 'SUICIDE'];
        if (this.waveNumber <= 9) return ['ASSAULT', 'ASSAULT', 'SNIPER', 'SUICIDE', 'SUICIDE', 'SHIELD'];
        if (this.waveNumber <= 12) return ['ASSAULT', 'SNIPER', 'SUICIDE', 'SUICIDE', 'SHIELD', 'ELITE'];
        return ['ASSAULT', 'SNIPER', 'SUICIDE', 'SUICIDE', 'SHIELD', 'SHIELD', 'ELITE'];
    }

    /**
     * 根据波次计算敌机子弹伤害
     * 波次越高伤害越大
     */
    _getDamage() {
        return Math.ceil(this.waveNumber / 3);
    }

    /**
     * 更新，生成敌人（波次 + 持续）
     * @param {object} playerRef
     * @returns {Enemy[]}
     */
    update(dt, playerRef) {
        const spawned = [];

        // 持续后台生成（始终运行，不受波次影响）
        if (!this.bossActive) {
            const continuous = this._continuousSpawn(dt, playerRef);
            spawned.push(...continuous);
        }

        if (!this.waveActive) return spawned;

        this.spawnTimer += dt;

        // 生成队列中的敌人
        for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
            const entry = this.spawnQueue[i];
            if (this.spawnTimer >= entry.delay) {
                const x = MathUtils.randFloat(40, CANVAS.WIDTH - 40);
                const y = -30;
                spawned.push(new Enemy(entry.type, x, y, playerRef, this._getDamage()));
                this.spawnQueue.splice(i, 1);
            }
        }

        return spawned;
    }

    /**
     * 检查波次是否清理完毕
     */
    checkWaveClear(enemies, boss) {
        if (this.bossActive) {
            return boss && !boss.active;
        }
        return this.spawnQueue.length === 0 && enemies.length === 0;
    }

    /**
     * 标记波次已清理
     */
    markWaveClear() {
        this.waveActive = false;
        this.waveClear = true;
        this.waveDelayTimer = this.waveDelay;
    }

    /**
     * 获取波次间延迟
     */
    updateWaveDelay(dt) {
        if (this.waveDelayTimer > 0) {
            this.waveDelayTimer -= dt;
            return this.waveDelayTimer <= 0;
        }
        return false;
    }

    /**
     * 检查是否所有敌人清理完毕
     */
    isAllClear(enemies) {
        return this.spawnQueue.length === 0 && enemies.length === 0 && !this.bossActive;
    }
}