// ========================================
// 游戏全局常量
// ========================================

const CANVAS = {
    WIDTH: 480,
    HEIGHT: 720
};

const COLORS = {
    NEON_BLUE: '#00f0ff',
    NEON_PURPLE: '#b000ff',
    NEON_ORANGE: '#ff6a00',
    NEON_PINK: '#ff2d78',
    NEON_GREEN: '#00ff88',
    DEEP_BLUE: '#0a0e27',
    DARK_PURPLE: '#1a1040',
    WHITE: '#e0e8ff',
    YELLOW: '#ffdd00'
};

const PLAYER = {
    SPEED: 5,
    FIRE_RATE: 8,
    MAX_HP: 5,
    WEAPON_MAX_LEVEL: 5,
    INVINCIBLE_TIME: 1500,  // 无敌时间 (ms)
    SKILL_COOLDOWN: 8000      // 技能冷却 (ms)
};

const BULLET = {
    PLAYER_SPEED: 10,
    ENEMY_SPEED: 5,
    DEFAULT_DAMAGE: 1
};

// 敌人配置
const ENEMY_TYPES = {
    SCOUT: {
        name: '侦察兵',
        hp: 1,
        speed: 2.5 + Math.random() * 1.5,
        width: 24,
        height: 24,
        color: '#00f0ff',
        score: 100,
        pattern: 'LINEAR'
    },
    ASSAULT: {
        name: '突击兵',
        hp: 2,
        speed: 1.5 + Math.random(),
        width: 30,
        height: 30,
        color: '#ff6a00',
        score: 200,
        pattern: 'SINUSOIDAL',
        shootInterval: 2000
    },
    SNIPER: {
        name: '狙击手',
        hp: 2,
        speed: 0.8,
        width: 28,
        height: 28,
        color: '#b000ff',
        score: 300,
        pattern: 'STATIONARY',
        shootInterval: 2500
    },
    SUICIDE: {
        name: '自爆兵',
        hp: 1,
        speed: 4 + Math.random(),
        width: 22,
        height: 22,
        color: '#ff2d78',
        score: 150,
        pattern: 'CHASE'
    },
    SHIELD: {
        name: '护盾兵',
        hp: 3,
        speed: 1,
        width: 34,
        height: 34,
        color: '#00ff88',
        score: 400,
        pattern: 'LINEAR',
        shootInterval: 1800,
        hasShield: true
    },
    ELITE: {
        name: '精英怪',
        hp: 6,
        speed: 1.2,
        width: 40,
        height: 40,
        color: '#ffdd00',
        score: 800,
        pattern: 'ELITE',
        shootInterval: 1200
    }
};

// Boss 配置
const BOSS_CONFIG = {
    BOSS_1: {
        name: '巨像级',
        hp: 50,
        width: 80,
        height: 80,
        color: '#ff6a00',
        score: 3000,
        phaseThresholds: [0.5]
    },
    BOSS_2: {
        name: '毁灭级',
        hp: 80,
        width: 90,
        height: 90,
        color: '#b000ff',
        score: 5000,
        phaseThresholds: [0.5]
    },
    BOSS_3: {
        name: '虚空级',
        hp: 120,
        width: 100,
        height: 100,
        color: '#ff2d78',
        score: 10000,
        phaseThresholds: [0.66, 0.33]
    }
};

// 道具配置（低频率掉落：每分钟约 5~10 个）
const POWERUP_TYPES = {
    WEAPON: {
        name: '武器升级',
        color: '#ff6a00',
        symbol: 'W',
        dropChance: 0.0014,
        storable: false
    },
    SHIELD: {
        name: '保护罩',
        color: '#00f0ff',
        symbol: 'S',
        dropChance: 0.0014,
        storable: true,
        duration: 10000
    },
    WINGMAN: {
        name: '僚机',
        color: '#00ff88',
        symbol: 'F',
        dropChance: 0.0014,
        storable: false
    },
    BOMB: {
        name: '全屏炸弹',
        color: '#ff2d78',
        symbol: 'B',
        dropChance: 0.0014,
        storable: true
    },
    HEALTH: {
        name: '恢复药水',
        color: '#ffdd00',
        symbol: '+',
        dropChance: 0.0014,
        storable: false
    },
    SCORE: {
        name: '分数加成',
        color: '#ffdd00',
        symbol: '★',
        dropChance: 0.0014,
        storable: false
    }
};

// 按键映射
const KEY_BINDINGS = {
    MOVE_UP:    ['ArrowUp', 'w', 'W'],
    MOVE_DOWN:  ['ArrowDown', 's', 'S'],
    MOVE_LEFT:  ['ArrowLeft', 'a', 'A'],
    MOVE_RIGHT: ['ArrowRight', 'd', 'D'],
    FIRE:       ['j', 'J', ' '],
    ITEM:       ['k', 'K'],
    SKILL:      ['x', 'X'],
    BOMB:       ['b', 'B'],
    SHIELD:     ['h', 'H'],
    PAUSE:      ['Escape', 'p', 'P'],
    MENU:       ['m', 'M', 'Backspace'],
    CONFIRM:    ['Enter']
};

// 波次配置
const WAVE = {
    BOSS_INTERVAL: 5,
    MAX_BOSS_WAVE: 15
};

// 分数升级系统
const SCORE_UPGRADE = {
    BASE_KILL_SCORE: 10,
    BOSS_KILL_SCORE: 100,
    UPGRADE_LEVEL2: 5000,
    UPGRADE_LEVEL3: 20000
};

// 连击系统
const COMBO = {
    TIMEOUT: 3000,  // 连击超时 (ms)
    MULTIPLIERS: [
        { threshold: 0,  mult: 1.0 },
        { threshold: 3,  mult: 1.5 },
        { threshold: 6,  mult: 2.0 },
        { threshold: 11, mult: 3.0 },
        { threshold: 20, mult: 5.0 }
    ]
};

// 战机配置
const SHIP_TYPES = [
    {
        name: '先锋号',
        type: '均衡型',
        hp: 5,
        fireRate: 8,
        speed: 5,
        bulletPattern: 'dual',
        skill: null,
        desc: '双发子弹 · 性能均衡'
    },
    {
        name: '速射号',
        type: '敏捷型',
        hp: 3,
        fireRate: 12,
        speed: 7,
        bulletPattern: 'triple',
        skill: 'flash',
        skillCooldown: 8000,
        desc: '三发散射 · 闪现技能',
        unlockScore: 5000
    },
    {
        name: '毁灭号',
        type: '重装型',
        hp: 8,
        fireRate: 4,
        speed: 3,
        bulletPattern: 'cannon',
        skill: 'shield',
        skillCooldown: 12000,
        desc: '加农炮 · 护盾技能',
        unlockScore: 10000
    }
];