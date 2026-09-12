// ========================================
// 碰撞检测系统
// ========================================

class CollisionSystem {
    /**
     * AABB 碰撞检测
     */
    static check(a, b) {
        const ab = a.getBounds();
        const bb = b.getBounds();
        return ab.x < bb.x + bb.width &&
               ab.x + ab.width > bb.x &&
               ab.y < bb.y + bb.height &&
               ab.y + ab.height > bb.y;
    }

    /**
     * 处理玩家子弹 vs 敌人
     */
    static processPlayerBulletsVsEnemies(playerBullets, enemies, boss, addScore, createExplosion) {
        for (const bullet of playerBullets) {
            if (!bullet.active) continue;

            // 检查 Boss
            if (boss && boss.active && !boss.entering) {
                if (this.check(bullet, boss)) {
                    bullet.destroy();
                    const dead = boss.takeDamage(bullet.damage);
                    createExplosion(bullet.x, bullet.y, boss.color, 0.5);
                    addScore(10);
                    if (dead) return { bossKilled: true };
                    continue;
                }
            }

            // 检查普通敌人
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                if (this.check(bullet, enemy)) {
                    bullet.destroy();
                    const dead = enemy.takeDamage(bullet.damage);
                    createExplosion(bullet.x, bullet.y, enemy.color, 0.4);
                    if (dead) {
                        enemy.destroy();
                        addScore(enemy.score);
                        return { enemyKilled: enemy };
                    }
                    break;
                }
            }
        }
        return {};
    }

    /**
     * 处理敌人子弹 vs 玩家
     */
    static processEnemyBulletsVsPlayer(enemyBullets, player, particleSystem, audioSystem) {
        for (const bullet of enemyBullets) {
            if (!bullet.active) continue;
            if (this.check(bullet, player)) {
                bullet.destroy();
                const isDead = player.takeDamage(1);
                if (particleSystem) {
                    particleSystem.explode(player.x, player.y, COLORS.NEON_PINK, 0.8);
                }
                if (audioSystem) {
                    audioSystem.playHit();
                }
                if (isDead) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 处理敌人 vs 玩家（碰撞）
     */
    static processEnemiesVsPlayer(enemies, boss, player, particleSystem, audioSystem) {
        // 普通敌人碰撞
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            if (this.check(enemy, player)) {
                enemy.destroy();
                if (particleSystem) {
                    particleSystem.explode(enemy.x, enemy.y, enemy.color, 0.6);
                }
                const isDead = player.takeDamage(1);
                if (audioSystem) {
                    audioSystem.playHit();
                }
                if (isDead) return true;
            }
        }

        // Boss 碰撞
        if (boss && boss.active && !boss.entering) {
            if (this.check(boss, player)) {
                const isDead = player.takeDamage(2);
                if (particleSystem) {
                    particleSystem.explode(player.x, player.y, COLORS.NEON_PINK, 1);
                }
                if (audioSystem) {
                    audioSystem.playHit();
                }
                if (isDead) return true;
            }
        }

        return false;
    }

    /**
     * 处理玩家 vs 道具
     */
    static processPlayerVsPowerUps(player, powerUps, particleSystem, audioSystem) {
        for (const pu of powerUps) {
            if (!pu.active) continue;
            if (this.check(player, pu)) {
                pu.destroy();
                if (particleSystem) {
                    particleSystem.pickupEffect(pu.x, pu.y, pu.color);
                }
                if (audioSystem) {
                    audioSystem.playPowerUp();
                }
                return pu;
            }
        }
        return null;
    }
}