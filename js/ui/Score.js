// ========================================
// 分数与连击系统
// ========================================

class ScoreSystem {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.kills = 0;
        this.multiplier = 1.0;
    }

    /**
     * 增加击杀
     */
    addKill(baseScore) {
        this.kills++;
        this.combo++;
        this.comboTimer = COMBO.TIMEOUT;

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        this._updateMultiplier();
        const earnedScore = Math.floor(baseScore * this.multiplier);

        this.score += earnedScore;
        return {
            earnedScore,
            combo: this.combo,
            multiplier: this.multiplier
        };
    }

    /**
     * 添加分数
     */
    addScore(amount) {
        this.score += amount;
    }

    /**
     * 重置连击
     */
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
        this._updateMultiplier();
    }

    /**
     * 更新连击计时器
     */
    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
    }

    /**
     * 更新倍率
     */
    _updateMultiplier() {
        let mult = 1.0;
        for (const level of COMBO.MULTIPLIERS) {
            if (this.combo >= level.threshold) {
                mult = level.mult;
            }
        }
        this.multiplier = mult;
    }

    /**
     * 获取结算数据
     */
    getResults() {
        return {
            score: this.score,
            maxCombo: this.maxCombo,
            kills: this.kills
        };
    }

    /**
     * 重置
     */
    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.kills = 0;
        this.multiplier = 1.0;
    }
}