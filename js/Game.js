// ========================================
// 游戏核心引擎
// ========================================

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 逻辑分辨率
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;

        // 响应式缩放
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // 主循环
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.STEP = 1000 / 60; // 固定 60fps 更新
        this.running = false;

        // 子系统
        this.input = new InputSystem(this.canvas);
        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.scene = new SceneManager();
        this.menu = new MenuManager();
        this.hud = new HUD();
        this.highScore = Storage.getHighScore();

        // 游戏状态
        this.state = 'menu'; // menu | playing | paused | gameover
        this.mode = 'endless'; // endless | bossrush

        // 实体列表
        this.player = null;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;

        // 系统
        this.wave = new WaveSystem();
        this.scoreSystem = new ScoreSystem();

        // 背景星星
        this.stars = this._generateStars();

        // 屏幕震动
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // 定时道具掉落（每 10 秒 1~3 个）
        this.dropTimer = 10000;

        // 菜单回调
        this._setupMenuCallbacks();

        // 初始化场景
        this._setupScenes();
    }

    // ==========================================
    // 初始化
    // ==========================================

    _resize() {
        const maxW = window.innerWidth;
        const maxH = window.innerHeight;
        const ratio = CANVAS.WIDTH / CANVAS.HEIGHT;
        let w, h;

        if (maxW / maxH > ratio) {
            h = maxH;
            w = h * ratio;
        } else {
            w = maxW;
            h = w / ratio;
        }

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
    }

    _generateStars() {
        const stars = [];
        for (let i = 0; i < 150; i++) {
            stars.push({
                x: Math.random() * CANVAS.WIDTH,
                y: Math.random() * CANVAS.HEIGHT,
                speed: MathUtils.randFloat(0.3, 2),
                size: MathUtils.randFloat(0.5, 2),
                brightness: MathUtils.randFloat(0.3, 1),
                twinkleSpeed: MathUtils.randFloat(0.001, 0.003)
            });
        }
        return stars;
    }

    _setupMenuCallbacks() {
        this.menu.on('onStart', (mode) => this.startGame(mode));
        this.menu.on('onResume', () => this.resumeGame());
        this.menu.on('onQuit', () => this.quitToMenu());
        this.menu.on('onRetry', () => this.startGame(this.mode));
    }

    _setupScenes() {
        this.scene.register('menu', {
            enter: () => { this.menu.showMenu(); },
            exit: () => {},
            update: () => {},
            render: () => {}
        });

        this.scene.register('playing', {
            enter: () => { this.menu.hideAll(); },
            exit: () => {},
            update: (dt) => { this._updatePlaying(dt); },
            render: (ctx) => { this._renderPlaying(ctx); }
        });

        this.scene.register('paused', {
            enter: () => { this.menu.showPause(); },
            exit: () => {},
            update: () => {},
            render: () => {}
        });

        this.scene.register('gameover', {
            enter: () => {
                const stats = this.scoreSystem.getResults();
                const isNewRecord = Storage.updateHighScore(this.scoreSystem.score);
                const hs = Storage.getHighScore();
                stats.isNewRecord = isNewRecord;
                this.menu.showGameOver(stats);
                this.audio.playGameOver();
            },
            exit: () => {},
            update: () => {},
            render: () => {}
        });
    }

    // ==========================================
    // 游戏状态管理
    // ==========================================

    startGame(mode) {
        this.audio.resume();
        this.mode = mode;
        this.state = 'playing';

        // 获取选择的战机
        const shipIndex = this.menu.selectedShip;
        this.player = new Player(shipIndex);
        this.player.shipIndex = shipIndex;

        // 重置实体
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;

        // 重置系统
        this.wave = new WaveSystem();
        this.scoreSystem = new ScoreSystem();
        this.particles = new ParticleSystem();
        this.hud = new HUD();
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // Boss Rush 模式从第 4 波开始，直接跳到 Boss 波
        if (mode === 'bossrush') {
            this.wave.waveNumber = 4;
        }

        // 开始第一波
        const result = this.wave.startNextWave();
        if (result.hasBoss) {
            this._spawnBoss(result.bossKey);
        }

        this.scene.switchTo('playing');
        Storage.incrementGamesPlayed();
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.scene.switchTo('paused');
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.scene.switchTo('playing');
    }

    quitToMenu() {
        this.state = 'menu';
        this.scene.switchTo('menu');
    }

    gameOver() {
        this.state = 'gameover';
        Storage.addKills(this.scoreSystem.kills);
        this.scene.switchTo('gameover');
    }

    // ==========================================
    // 主循环
    // ==========================================

    start() {
        this.running = true;
        this.scene.switchTo('menu');
        this.lastTimestamp = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min(timestamp - this.lastTimestamp, 50); // 防止大帧跳跃
        this.lastTimestamp = timestamp;

        this.accumulator += dt;
        while (this.accumulator >= this.STEP) {
            this._update(this.STEP);
            this.accumulator -= this.STEP;
        }

        this._render();
        requestAnimationFrame((t) => this._loop(t));
    }

    // ==========================================
    // 更新逻辑
    // ==========================================

    _update(dt) {
        this.input.update();

        if (this.state === 'playing') {
            this._updatePlaying(dt);
        }
    }

    _updatePlaying(dt) {
        // 暂停检测
        if (this.input.isPausePressed()) {
            this.pauseGame();
            return;
        }

        // 返回菜单键（M / Backspace）
        if (this.input.isMenuPressed()) {
            this.quitToMenu();
            return;
        }

        // 屏幕震动
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const shake = this.particles.screenShake(this.shakeIntensity);
            this.shakeX = shake.x;
            this.shakeY = shake.y;
            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }

        // 定时道具掉落（每 10 秒 1~3 个随机道具）
        this.dropTimer -= dt;
        if (this.dropTimer <= 0) {
            this.dropTimer = 10000;
            this._spawnTimedDrops();
        }

        // 玩家输入
        const dir = this.input.getDirection();
        this.player.vx = dir.x;
        this.player.vy = dir.y;
        this.player.update(dt);
        this.player.updateWingmen();

        // 技能
        if (this.input.isSkillPressed()) {
            const result = this.player.useSkill();
            if (result) {
                this.audio.playSkill();
                if (result.type === 'flash') {
                    this.particles.explode(result.x, result.y, COLORS.NEON_BLUE, 1.5);
                }
            }
        }

        // 炸弹
        if (this.input.isBombPressed()) {
            if (this.player.useBomb()) {
                this._useBomb();
            }
        }

        // 使用存储道具（K 键）
        if (this.input.isItemPressed()) {
            const result = this.player.useStoredItem();
            if (result) {
                this.audio.playPowerUp();
                this.particles.pickupEffect(this.player.x, this.player.y - 20, COLORS.NEON_BLUE);
                this.hud.showWarning(`${result.name} 已使用!`);
            }
        }

        // 保护罩（H 键）
        if (this.input.isShieldPressed()) {
            if (this.player.storedItem === 'SHIELD') {
                this.player.storedItem = null;
                this.player.shieldActive = true;
                this.player.shieldTimer = POWERUP_TYPES.SHIELD.duration || 10000;
                this.audio.playPowerUp();
                this.particles.pickupEffect(this.player.x, this.player.y - 20, COLORS.NEON_BLUE);
                this.hud.showWarning('保护罩启动! 10秒');
            }
        }

        // 玩家射击（手动发射 J / 触屏，或自动射击）
        if (this.input.isFirePressed()) {
            const newBullets = this.player.shoot();
            if (newBullets.length > 0) {
                this.playerBullets.push(...newBullets);
                this.audio.playShoot();
            }
        }

        // 更新波次
        const spawnedEnemies = this.wave.update(dt, this.player);
        this.enemies.push(...spawnedEnemies);

        // Boss 召唤小兵
        if (this.boss && this.boss.active) {
            const summoned = this.boss.getSummonedEnemies();
            this.enemies.push(...summoned);
        }

        // 更新敌人
        for (const enemy of this.enemies) {
            enemy.update(dt);
            const eBullets = enemy.tryShoot();
            if (eBullets.length > 0) {
                this.enemyBullets.push(...eBullets);
            }
        }

        // 更新 Boss
        if (this.boss && this.boss.active) {
            this.boss.update(dt);
            const bBullets = this.boss.executeAttack(dt);
            if (bBullets && bBullets.length > 0) {
                this.enemyBullets.push(...bBullets);
            }
            this.hud.setBossHp(this.boss.hp, this.boss.maxHp, this.boss.name);
        }

        // 更新子弹
        for (const bullet of this.playerBullets) bullet.update(dt);
        for (const bullet of this.enemyBullets) bullet.update(dt);

        // 更新道具
        for (const pu of this.powerUps) pu.update(dt);

        // 更新粒子
        this.particles.update(dt);

        // 更新连击
        this.scoreSystem.update(dt);

        // 更新 HUD
        this.hud.update(dt);

        // 碰撞检测
        this._processCollisions();

        // 清理
        this._cleanup();

        // 波次管理
        if (!this.wave.bossActive && this.wave.checkWaveClear(this.enemies, this.boss)) {
            this.wave.markWaveClear();
        }
        if (this.wave.updateWaveDelay(dt)) {
            const result = this.wave.startNextWave();
            if (result.hasBoss) {
                this._spawnBoss(result.bossKey);
            }
        }

        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.particles.explode(this.player.x, this.player.y, COLORS.NEON_BLUE, 2);
            this.gameOver();
        }
    }

    _processCollisions() {
        // 玩家子弹 vs 敌人
        const result = CollisionSystem.processPlayerBulletsVsEnemies(
            this.playerBullets,
            this.enemies,
            this.boss,
            (score) => this.scoreSystem.addScore(score),
            (x, y, color, size) => {
                this.particles.explode(x, y, color, size);
                this.audio.playExplosion(size);
            }
        );

        if (result.enemyKilled) {
            const killResult = this.scoreSystem.addKill(SCORE_UPGRADE.BASE_KILL_SCORE);
            if (killResult.combo >= 3) {
                this.hud.showCombo(
                    killResult.combo,
                    killResult.multiplier,
                    result.enemyKilled.x,
                    result.enemyKilled.y
                );
            }
            this._checkScoreUpgrade();
        }

        if (result.bossKilled) {
            const killResult = this.scoreSystem.addKill(SCORE_UPGRADE.BOSS_KILL_SCORE);
            this.particles.bossEntrance(this.boss.x, this.boss.y, this.boss.color);
            this.shakeDuration = 500;
            this.shakeIntensity = 8;
            this.hud.clearBossHp();
            this.boss = null;
            this.wave.bossActive = false;
            this._checkScoreUpgrade();
        }

        // 敌人子弹 vs 玩家
        const playerDead = CollisionSystem.processEnemyBulletsVsPlayer(
            this.enemyBullets,
            this.player,
            this.particles,
            this.audio
        );
        if (playerDead) {
            this.scoreSystem.resetCombo();
        }

        // 敌人 vs 玩家
        const collided = CollisionSystem.processEnemiesVsPlayer(
            this.enemies,
            this.boss,
            this.player,
            this.particles,
            this.audio
        );
        if (collided) {
            this.scoreSystem.resetCombo();
        }

        // 玩家 vs 道具
        const pickedUp = CollisionSystem.processPlayerVsPowerUps(
            this.player,
            this.powerUps,
            this.particles,
            this.audio
        );
        if (pickedUp) {
            this._applyPowerUp(pickedUp);
        }
    }

    _spawnBoss(bossKey) {
        this.boss = new Boss(bossKey, this.player);
        this.hud.showWarning(`⚠ 警报: ${this.boss.name} ⚠`);
        this.audio.playBossAlert();
        this.shakeDuration = 300;
        this.shakeIntensity = 4;
        this.particles.bossEntrance(CANVAS.WIDTH / 2, 100, this.boss.color);
    }

    _useBomb() {
        // 清除所有敌人子弹
        this.enemyBullets.forEach(b => b.destroy());
        this.enemyBullets = [];

        // 清除所有敌人
        for (const enemy of this.enemies) {
            this.particles.explode(enemy.x, enemy.y, enemy.color, 0.8);
            this.scoreSystem.addKill(SCORE_UPGRADE.BASE_KILL_SCORE);
            enemy.destroy();
        }
        this.enemies = [];

        // 屏幕震动
        this.shakeDuration = 400;
        this.shakeIntensity = 6;
        this.audio.playExplosion(2);
    }

    _tryDropPowerUp(x, y) {
        // 保留备用（不再使用击杀掉落）
        const rand = Math.random();
        let cumulative = 0;
        for (const [type, config] of Object.entries(POWERUP_TYPES)) {
            cumulative += config.dropChance;
            if (rand < cumulative) {
                this.powerUps.push(new PowerUp(x, y, type));
                return;
            }
        }
    }

    /**
     * 定时掉落道具：每 25 秒在屏幕随机位置生成 1~3 个道具
     */
    _spawnTimedDrops() {
        const count = MathUtils.randInt(1, 3);
        const types = Object.keys(POWERUP_TYPES);
        for (let i = 0; i < count; i++) {
            const x = MathUtils.randFloat(60, CANVAS.WIDTH - 60);
            const y = MathUtils.randFloat(60, CANVAS.HEIGHT * 0.6);
            const type = MathUtils.randChoice(types);
            this.powerUps.push(new PowerUp(x, y, type));
        }
        this.hud.showWarning(`道具投放! ×${count}`);
    }

    _applyPowerUp(powerUp) {
        // 可存储的道具：放入存储槽
        const config = POWERUP_TYPES[powerUp.type];
        if (config && config.storable) {
            this.player.storeItem(powerUp.type);
            this.hud.showWarning(`${config.name} 已存储 (按K使用)`);
            return;
        }

        // 不可存储的道具：立即生效
        switch (powerUp.type) {
            case 'WEAPON':
                this.player.upgradeWeapon();
                this.hud.showWarning(`武器升级! LV.${this.player.weaponLevel}`);
                break;
            case 'HEALTH':
                if (this.player.hp < this.player.maxHp) {
                    this.player.heal(1);
                    this.hud.showWarning(`生命恢复! HP ${this.player.hp}/${this.player.maxHp}`);
                } else {
                    this.player.storeItem('HEALTH');
                    this.hud.showWarning('HP已满，药水已存储 (按K使用)');
                }
                break;
            case 'WINGMAN':
                this.player.addWingman();
                this.hud.showWarning('僚机已部署!');
                break;
            case 'SCORE':
                this.scoreSystem.addScore(500);
                this.hud.showWarning('+500 分!');
                break;
        }
    }

    /**
     * 检查分数升级
     */
    _checkScoreUpgrade() {
        const score = this.scoreSystem.score;
        let result = null;

        if (score >= SCORE_UPGRADE.UPGRADE_LEVEL3) {
            result = this.player.applyUpgrade(3);
        } else if (score >= SCORE_UPGRADE.UPGRADE_LEVEL2) {
            result = this.player.applyUpgrade(2);
        }

        if (result) {
            this.hud.showWarning(`${result.name}!`);
            this.particles.bossEntrance(this.player.x, this.player.y, COLORS.NEON_ORANGE);
            this.shakeDuration = 300;
            this.shakeIntensity = 3;
            this.audio.playPowerUp();
        }
    }

    _cleanup() {
        this.enemies = this.enemies.filter(e => e.active);
        this.playerBullets = this.playerBullets.filter(b => b.active);
        this.enemyBullets = this.enemyBullets.filter(b => b.active);
        this.powerUps = this.powerUps.filter(p => p.active);
    }

    // ==========================================
    // 渲染
    // ==========================================

    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        // 背景
        this._renderBackground(ctx);

        if (this.state === 'playing') {
            this._renderPlaying(ctx);
        }
    }

    _renderBackground(ctx) {
        // 深空背景
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
        gradient.addColorStop(0, '#0a0e27');
        gradient.addColorStop(0.5, '#0f1535');
        gradient.addColorStop(1, '#0a0e27');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        // 星空
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > CANVAS.HEIGHT + 5) {
                star.y = -5;
                star.x = Math.random() * CANVAS.WIDTH;
            }
            const twinkle = Math.sin(Date.now() * star.twinkleSpeed) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(224, 232, 255, ${star.brightness * twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _renderPlaying(ctx) {
        ctx.save();

        // 屏幕震动偏移
        ctx.translate(this.shakeX, this.shakeY);

        // 渲染道具
        for (const pu of this.powerUps) pu.render(ctx);

        // 渲染敌人子弹
        for (const bullet of this.enemyBullets) bullet.render(ctx);

        // 渲染敌人
        for (const enemy of this.enemies) enemy.render(ctx);

        // 渲染 Boss
        if (this.boss && this.boss.active) {
            this.boss.render(ctx);
        }

        // 渲染玩家子弹
        for (const bullet of this.playerBullets) bullet.render(ctx);

        // 渲染玩家
        this.player.render(ctx);

        // 渲染粒子
        this.particles.render(ctx);

        ctx.restore();

        // 渲染 HUD（不受震动影响）
        this.hud.render(
            ctx,
            this.scoreSystem.score,
            this.scoreSystem.combo,
            this.scoreSystem.multiplier,
            this.player,
            this.wave.waveNumber,
            this.mode
        );
    }
}