// ========================================
// 游戏内 HUD（平视显示器）
// ========================================

class HUD {
    constructor() {
        this.comboTexts = [];
        this.warningTexts = [];
        this.bossHpBar = null;
    }

    /**
     * 添加连击提示
     */
    showCombo(combo, multiplier, x, y) {
        this.comboTexts.push({
            text: `${combo} COMBO!`,
            sub: `x${multiplier.toFixed(1)}`,
            x: x,
            y: y,
            life: 1500,
            maxLife: 1500,
            color: multiplier >= 5 ? COLORS.NEON_PINK :
                   multiplier >= 3 ? COLORS.NEON_ORANGE :
                   COLORS.NEON_BLUE
        });

        // 限制数量
        if (this.comboTexts.length > 5) {
            this.comboTexts.shift();
        }
    }

    /**
     * 添加警告提示
     */
    showWarning(text) {
        this.warningTexts.push({
            text: text,
            life: 2000,
            maxLife: 2000
        });
    }

    /**
     * 设置 Boss 血量条
     */
    setBossHp(hp, maxHp, name) {
        this.bossHpBar = { hp, maxHp, name };
    }

    /**
     * 清除 Boss 血量条
     */
    clearBossHp() {
        this.bossHpBar = null;
    }

    update(dt) {
        // 更新连击文本
        for (let i = this.comboTexts.length - 1; i >= 0; i--) {
            this.comboTexts[i].life -= dt;
            this.comboTexts[i].y -= 0.5 * (dt / 16.67);
            if (this.comboTexts[i].life <= 0) {
                this.comboTexts.splice(i, 1);
            }
        }

        // 更新警告文本
        for (let i = this.warningTexts.length - 1; i >= 0; i--) {
            this.warningTexts[i].life -= dt;
            if (this.warningTexts[i].life <= 0) {
                this.warningTexts.splice(i, 1);
            }
        }
    }

    /**
     * 渲染 HUD
     */
    render(ctx, score, combo, multiplier, player, waveNumber, mode) {
        // 分数
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'left';
        ctx.shadowColor = COLORS.NEON_BLUE;
        ctx.shadowBlur = 8;
        ctx.fillText(`SCORE: ${score}`, 10, 28);

        // 波次
        if (mode === 'endless') {
            ctx.fillText(`WAVE: ${waveNumber}`, 10, 52);
        }

        // 连击
        if (combo >= 3) {
            ctx.fillStyle = multiplier >= 5 ? COLORS.NEON_PINK :
                           multiplier >= 3 ? COLORS.NEON_ORANGE :
                           COLORS.NEON_BLUE;
            ctx.fillText(`COMBO: x${multiplier.toFixed(1)}`, CANVAS.WIDTH - 10, 28);
            ctx.textAlign = 'right';
        }

        // 武器等级
        ctx.fillStyle = COLORS.NEON_ORANGE;
        ctx.textAlign = 'right';
        ctx.fillText(`LV.${player.weaponLevel}`, CANVAS.WIDTH - 10, 52);

        // 战机进化等级
        const evoLabel = player.upgradeLevel === 3 ? '终极' :
                         player.upgradeLevel === 2 ? '精英' : '基础';
        const evoColor = player.upgradeLevel === 3 ? COLORS.NEON_PINK :
                         player.upgradeLevel === 2 ? COLORS.NEON_ORANGE : COLORS.WHITE;
        ctx.fillStyle = evoColor;
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText(`${evoLabel}`, CANVAS.WIDTH - 10, 72);

        // 升级进度条
        if (player.upgradeLevel < 3) {
            const nextThreshold = player.upgradeLevel === 1
                ? SCORE_UPGRADE.UPGRADE_LEVEL2
                : SCORE_UPGRADE.UPGRADE_LEVEL3;
            const progress = Math.min(1, score / nextThreshold);
            const barX = CANVAS.WIDTH - 80;
            const barY = 78;
            const barW = 70;
            const barH = 4;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = evoColor;
            ctx.fillRect(barX, barY, barW * progress, barH);
        }

        // 血量条
        const hpBarX = 10;
        const hpBarY = CANVAS.HEIGHT - 20;
        const hpBarW = 120;
        const hpBarH = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
        const hpRatio = player.hp / player.maxHp;
        const hpColor = hpRatio > 0.5 ? COLORS.NEON_GREEN :
                        hpRatio > 0.25 ? COLORS.NEON_ORANGE : COLORS.NEON_PINK;
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
        ctx.font = '9px Rajdhani';
        ctx.fillStyle = COLORS.WHITE;
        ctx.shadowBlur = 0;
        ctx.fillText(`HP`, hpBarX - 2, hpBarY + hpBarH);

        // 技能冷却
        const skillX = CANVAS.WIDTH - 60;
        const skillY = CANVAS.HEIGHT - 30;
        if (player.skill) {
            ctx.fillStyle = player.skillReady ? COLORS.NEON_BLUE : 'rgba(255,255,255,0.3)';
            ctx.font = '10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(
                player.skillReady ? '技能 就绪' : `技能 ${Math.ceil(player.skillTimer / 1000)}s`,
                skillX, skillY
            );
        }

        // 炸弹
        ctx.fillStyle = player.bombs > 0 ? COLORS.NEON_PINK : 'rgba(255,255,255,0.3)';
        ctx.fillText(`💣 x${player.bombs}`, skillX, skillY - 16);

        // 护盾指示
        if (player.shieldActive) {
            ctx.fillStyle = COLORS.NEON_BLUE;
            ctx.fillText('🛡', CANVAS.WIDTH - 85, CANVAS.HEIGHT - 30);
        }

        // 存储道具指示器
        const itemX = CANVAS.WIDTH - 115;
        const itemY = CANVAS.HEIGHT - 50;
        if (player.storedItem) {
            const config = POWERUP_TYPES[player.storedItem];
            ctx.fillStyle = config.color;
            ctx.font = 'bold 11px Orbitron';
            ctx.textAlign = 'center';
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 8;
            ctx.fillText(`[K] ${config.name}`, itemX, itemY);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '10px Orbitron';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText('[K] 空槽', itemX, itemY);
        }

        // 发射模式指示
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px Rajdhani';
        ctx.fillText('[J] 发射', CANVAS.WIDTH - 115, CANVAS.HEIGHT - 66);

        // 返回菜单提示
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '8px Rajdhani';
        ctx.textAlign = 'left';
        ctx.fillText('[M] 返回菜单', 10, CANVAS.HEIGHT - 34);

        // Boss 血量条
        if (this.bossHpBar) {
            const bx = CANVAS.WIDTH / 2 - 100;
            const by = 8;
            const bw = 200;
            const bh = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(bx, by, bw, bh);
            const br = this.bossHpBar.hp / this.bossHpBar.maxHp;
            ctx.fillStyle = br > 0.5 ? COLORS.NEON_ORANGE : COLORS.NEON_PINK;
            ctx.fillRect(bx, by, bw * br, bh);
            ctx.strokeStyle = COLORS.WHITE;
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);

            // Boss 名称
            ctx.font = 'bold 10px Orbitron';
            ctx.fillStyle = COLORS.WHITE;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText(this.bossHpBar.name, CANVAS.WIDTH / 2, by + bh + 14);
        }

        // 渲染连击文字
        for (const ct of this.comboTexts) {
            const alpha = ct.life / ct.maxLife;
            const scale = 1 + (1 - alpha) * 0.5;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ct.color;
            ctx.font = `bold ${Math.floor(24 * scale)}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.shadowColor = ct.color;
            ctx.shadowBlur = 10;
            ctx.fillText(ct.text, ct.x, ct.y);
            ctx.font = `${Math.floor(14 * scale)}px Rajdhani`;
            ctx.fillText(ct.sub, ct.x, ct.y + 22);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // 渲染警告文字
        for (const wt of this.warningTexts) {
            const alpha = Math.min(1, wt.life / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.NEON_PINK;
            ctx.font = 'bold 20px Orbitron';
            ctx.textAlign = 'center';
            ctx.shadowColor = COLORS.NEON_PINK;
            ctx.shadowBlur = 15;
            ctx.fillText(wt.text, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 - 50);
            ctx.restore();
        }

        ctx.shadowBlur = 0;
    }
}