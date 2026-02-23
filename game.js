document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const gachaButton = document.getElementById('gacha-button');
    const startWaveButton = document.getElementById('start-wave-button');
    const currencyEl = document.getElementById('currency');
    const waveEl = document.getElementById('wave');
    const healthEl = document.getElementById('health');
    const unitInventoryEl = document.getElementById('unit-inventory');
    const selectedUnitNameEl = document.getElementById('selected-unit-name');
    const selectedUnitLevelEl = document.getElementById('selected-unit-level');
    const selectedUnitDamageEl = document.getElementById('selected-unit-damage');
    const selectedUnitRangeEl = document.getElementById('selected-unit-range');
    const selectedUnitFireRateEl = document.getElementById('selected-unit-firerate');
    const selectedUnitDescriptionEl = document.getElementById('selected-unit-description');
    const upgradePanel = document.getElementById('upgrade-panel');
    const upgradeButton = document.getElementById('upgrade-button');
    const awakenButton = document.getElementById('awaken-button');
    const statPointsEl = document.getElementById('stat-points');
    const statButtons = document.getElementById('stat-buttons');
    let sellUnitButton = document.getElementById('sell-unit-button');
    let moveUnitButton = document.getElementById('move-unit-button');
    const enemyInfoPanel = document.getElementById('enemy-info-panel');
    const enemyTypeNameEl = document.getElementById('enemy-type-name');
    const enemyHealthEl = document.getElementById('enemy-health');
    const enemySpeedEl = document.getElementById('enemy-speed');
    const notificationArea = document.getElementById('notification-area');
    const bossInfoContainer = document.getElementById('boss-info-container');
    const bossNameEl = document.getElementById('boss-name');
    const bossHealthBar = document.getElementById('boss-health-bar');

    // Game State
    let currency = 9999999;
    let health = 9999;
    let wave = 0;
    let enemies = [];
    let units = [];
    let projectiles = [];
    let explosions = [];
    let stickyTiles = [];
    let placingUnit = null;
    let selectedPlacedUnit = null;
    let selectedEnemy = null;
    let isGameOver = false;
    let waveSpawning = false;
    let isHardMode = false;
    let waveBonusGiven = [];
    let currentBoss = null;
    let globalDamageMultiplier = 1;
    let isMovingUnit = false;
    let frameCount = 0;
    let animationFrameId;

    const sounds = {
        laser: 'URL_TO_LASER_SOUND.wav',
        hit: 'URL_TO_HIT_SOUND.wav',
        coin: 'URL_TO_COIN_SOUND.wav',
        upgrade: 'URL_TO_UPGRADE_SOUND.wav',
        gacha: 'URL_TO_GACHA_SOUND.wav'
    };

    const tileSize = 40;
    const mapWidth = canvas.width;
    const mapHeight = canvas.height;

    const maps = {
        map1: [
            { x: 0, y: tileSize * 6 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 6 + tileSize / 2 }
        ],
        map2: [ // ㄹ shape
            { x: 0, y: tileSize * 2 + tileSize / 2 },
            { x: mapWidth - tileSize * 2 + tileSize / 2, y: tileSize * 2 + tileSize / 2 },
            { x: mapWidth - tileSize * 2 + tileSize / 2, y: tileSize * 6 + tileSize / 2 },
            { x: tileSize * 2 + tileSize / 2, y: tileSize * 6 + tileSize / 2 },
            { x: tileSize * 2 + tileSize / 2, y: tileSize * 10 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 10 + tileSize / 2 }
        ],
        map3: [ // Loop shape (O)
            { x: 0, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth - tileSize * 4 + tileSize / 2, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth - tileSize * 4 + tileSize / 2, y: mapHeight - tileSize * 4 + tileSize / 2 },
            { x: tileSize * 4 + tileSize / 2, y: mapHeight - tileSize * 4 + tileSize / 2 },
            { x: tileSize * 4 + tileSize / 2, y: tileSize * 7 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 7 + tileSize / 2 }
        ]
    };

    let currentPath = maps.map1;

    const towerData = {
        'basic': { name: '총 타워', rarity: 'common', color: '#A9A9A9', damage: 25, range: 110, fireRate: 40, description: '단일 적에게 발사체를 발사하는 기본적인 타워입니다. 5레벨에 개틀링으로 각성할 수 있습니다.' },
        'tesla': { name: '테슬라 타워', rarity: 'common', color: '#00CED1', damage: 20, range: 80, fireRate: 90, canDetectGhost: true, description: '범위 내 모든 적에게 전기 피해를 입힙니다. 5레벨에 번개 생성기로 각성할 수 있습니다. 유령을 탐지할 수 있습니다.' },
        'bomb': { name: '폭탄 타워', rarity: 'common', color: '#696969', damage: 18, range: 120, fireRate: 60, blastRadius: 20, canDetectGhost: true, description: '착탄 시 폭발하여 범위 피해를 입히는 폭탄을 발사합니다. 유령을 탐지할 수 있습니다.' },
        'flame': { name: '화염 타워', rarity: 'rare', color: '#FF4500', damage: 10, range: 100, fireRate: 30, description: '적에게 화염 발사체를 발사하여 3초간 20의 지속 피해를 입힙니다. 5레벨에 용암 타워로 각성할 수 있습니다.' },
        'glue': { name: '접착 타워', rarity: 'rare', color: '#7CFC00', damage: 0, range: 80, fireRate: 60, description: '적의 경로에 끈끈한 타일을 생성하여 2초 동안 적을 멈추게 합니다.' },
        'ice': { name: '냉각 타워', rarity: 'rare', color: '#ADD8E6', range: 60, slowFactor: 0.5, slowDuration: 120, damage: 0, fireRate: 90, description: '범위 내 적들을 얼려 이동 속도를 감소시킵니다. 5레벨에 급속냉동기로 각성할 수 있습니다.' },
        'laser': { name: '레이저 발사기', rarity: 'epic', color: '#FF1493', damage: 4, range: 150, fireRate: 20, canDetectGhost: true, description: '빠른 속도로 레이저를 발사하여 지속적인 피해를 입힙니다. 유령을 탐지할 수 있습니다.' },
        'sword': { name: '검기 타워', rarity: 'epic', color: '#DB7093', damage: 35, range: 50, fireRate: 40, description: '근접 범위 내 모든 적에게 피해를 입히고, 일정 킬 수 달성 시 관통하는 검기를 발사합니다.' },
        'magnifying_glass': { name: '돋보기 타워', rarity: 'epic', color: '#FBC02D', damage: 10, range: 110, fireRate: 180, description: '반경 안의 유령 적의 투명 속성을 영구적으로 제거합니다. 추가로 유령 적만 공격하며, 이 타워의 상하좌우 1칸에 위치한 타워의 사거리를 40 증가시킵니다.' },

        // 각성 및 신규 타워
        'lava_tower': { name: '용암 타워', rarity: 'legendary', color: '#FF8C00', damage: 15, range: 0, fireRate: 300, description: '적 기지 반대편(경로 끝)에서 5초마다 역주행하는 용암 유닛을 출격시켜 경로의 적에게 15의 피해와 3.5초간 15의 지속 피해를 줍니다.' },
        'gatling': { name: '개틀링', rarity: 'legendary', color: '#FFD700', damage: 15, range: 120, fireRate: 10, description: '매우 빠른 속도로 발사체를 난사하여 다수의 적에게 지속적인 피해를 입힙니다. 기본 공격이 1회 관통합니다.' },
        'freezer': { name: '급속냉동기', rarity: 'legendary', color: '#00FFFF', damage: 0, range: 100, fireRate: 90, description: '범위 내 최대 3명의 적을 3초동안 완전히 얼려 움직임을 멈추게 합니다.' },
        'lightning': { name: '번개 생성기', rarity: 'legendary', color: '#9400D3', damage: 70, range: 130, fireRate: 70, description: '랜덤 적에게 자성을 부여하고, 1.5초 후 번개를 내리쳐 강력한 피해와 2초간 정지 효과를 입힙니다.' },
        'sphinx': { name: '스핑크스', rarity: 'legendary', color: '#DAA520', damage: 5, range: 100, fireRate: 60, description: '1초 간격으로 6개의 발사체를 발사하여 2초간 지속 피해를 줍니다. 매 웨이브 시작 시 5초간 랜덤한 색상의 버프를 받습니다.' },
        'water_bomb': { name: '워터 밤', rarity: 'legendary', color: '#1E90FF', damage: 45, range: 100, fireRate: 150, blastRadius: 50, description: '2.5초마다 광역 피해를 주고, 맞은 적을 12.5% 느려지게 합니다 (최대 4중첩).' },
        'night_hunter': { name: '나이트 헌터', rarity: 'legendary', color: '#483D8B', damage: 45, range: 90, fireRate: 45, description: '웨이브에서 적 5명 처치 시 6초간 공격력이 30% 증가합니다.' },
        'painter': { name: '페인터', rarity: 'legendary', color: '#FFFFFF', damage: 4, range: 150, fireRate: 5, description: '매우 빠른 속도로 각기 다른 색의 발사체를 발사합니다. 4% 확률로 적이 밟은 타일을 칠해 지속 피해를 주는 장판을 만듭니다.' },
    };

    const gachaRates = [
        { type: 'common', rate: 0.44 },
        { type: 'rare', rate: 0.29 },
        { type: 'epic', rate: 0.19 },
        { type: 'legendary', rate: 0.08 }
    ];

    const upgradeCosts = {
        common: [100, 150, 250, 400, 600, 800, 1050, 1400, 1800],
        rare: [150, 250, 400, 600, 850, 1100, 1350, 1600, 1800],
        epic: [250, 450, 650, 850, 1100, 1300, 1500, 1650, 1800],
        legendary: [500, 700, 900, 1100, 1300, 1450, 1600, 1750, 1800]
    };

    const enemyTypes = {
        'basic': { name: '기본', health: 100, speed: 1, color: '#ff7675', reward: 10 },
        'tank': { name: '탱크', health: 300, speed: 0.6, color: '#d63031', reward: 20 },
        'speedy': { name: '스피디', health: 50, speed: 2.5, color: '#fdcb6e', reward: 15 },
        'stunner': { name: '기절', health: 80, speed: 0.9, color: '#0984e3', reward: 25, stunRadius: 120, stunDuration: 120 },
        'transparent': { name: '투명', health: 90, speed: 1, color: 'rgba(200, 200, 200, 0.5)', reward: 30, isTransparent: true },
        'jumper': { name: '점퍼', health: 70, speed: 1.2, color: '#6c5ce7', reward: 35, isJumper: true, jumpCooldownTime: 15, jumpDistance: 80 },
        'regenerator': { name: '재생', health: 150, speed: 0.8, color: '#27ae60', reward: 20, regenRate: 1 },
        'splitter': { name: '분열', health: 120, speed: 1, color: '#8B4513', reward: 15, splitsInto: 'basic', splitCount: 2 },
        'healer': { name: '힐러', health: 100, speed: 1, color: '#87CEEB', reward: 15, isHealer: true, healRange: 60, healAmount: 8, healCooldown: 90 },
        'aggro': { name: '어그로', health: 200, speed: 0.5, color: '#8B0000', reward: 30, isAggro: true },
        'burning': { name: '불붙은 적', health: 150, speed: 1, color: '#FF4500', reward: 20, isImmuneToIce: true },
        'superspeed': { name: '슈퍼 스피드', health: 60, speed: 1.5, color: '#ccff9fff', reward: 20, isSuperSpeed: true, speedIncreaseRate: 0.005, maxSpeed: 5 },
        'heavytank': { name: '헤비 탱크', health: 300, speed: 1, color: '#404040', reward: 25, isHeavyTank: true, damageReduction: 5 },
        'stickyhealer': { name: '접착힐러', health: 80, speed: 1.2, color: 'rgb(0, 255, 0)', reward: 40, isStickyHealer: true, isImmuneToFreeze: true },
        'shockwave': { name: '충격파', health: 200, speed: 0.9, color: '#f1c40f', reward: 45, isShockwave: true },
        'boss_hunter': { name: '헌터', health: 1200, speed: 0.7, color: '#2c3e50', reward: 200, isBoss: true, isImmuneToFreeze: true },
        'boss_shielder': { name: '쉴더', health: 1050, speed: 0.7, color: '#9b59b6', reward: 300, isBoss: true, isImmuneToFreeze: true },
        'boss_theking': { name: '더 킹', health: 1950, speed: 0.4, color: '#e74c3c', reward: 500, isBoss: true, isImmuneToFreeze: true },
    };

    const waves = [
        ['basic', 'basic', 'basic', 'basic', 'basic'], // 1
        ['basic', 'basic', 'speedy', 'speedy', 'basic', 'basic'], // 2
        ['tank', 'basic', 'basic', 'speedy', 'speedy'], // 3
        ['stunner', 'stunner', 'basic', 'basic', 'basic'], // 4
        ['tank', 'tank', 'speedy', 'speedy', 'speedy', 'speedy'], // 5
        ['transparent', 'transparent', 'basic', 'basic', 'basic'], // 6
        ['jumper', 'jumper', 'speedy', 'speedy', 'speedy'], // 7
        ['tank', 'tank', 'tank', 'stunner', 'stunner', 'stunner'], // 8
        ['transparent', 'transparent', 'jumper', 'jumper', 'speedy'], // 9 - Boss Warning
        ['boss_hunter'], // 10 - BOSS
        ['regenerator', 'transparent', 'regenerator', 'regenerator', 'basic', 'basic'], // 11
        ['splitter', 'basic', 'basic', 'splitter', 'speedy', 'speedy'], // 12
        ['speedy', 'speedy', 'regenerator', 'regenerator', 'speedy', 'tank'], // 13
        ['tank', 'splitter', 'splitter', 'tank', 'jumper', 'jumper'], // 14
        ['healer', 'basic', 'basic', 'healer', 'regenerator', 'burning'], // 15
        ['jumper', 'jumper', 'splitter', 'splitter', 'jumper', 'burning'], // 16
        ['tank', 'regenerator', 'tank', 'regenerator', 'tank', 'burning', 'burning'], // 17
        ['stunner', 'stunner', 'splitter', 'splitter', 'stunner', 'aggro'], // 18
        ['healer', 'transparent', 'jumper', 'regenerator', 'splitter', 'burning', 'aggro'], // 19
        ['aggro', 'basic', 'speedy', 'tank', 'stunner', 'transparent', 'jumper', 'regenerator', 'splitter', 'burning', 'aggro'], // 20
        ['regenerator', 'regenerator', 'regenerator', 'tank', 'tank', 'burning', 'burning'], // 21
        ['splitter', 'splitter', 'splitter', 'speedy', 'speedy', 'aggro', 'aggro'], // 22
        ['transparent', 'transparent', 'transparent', 'jumper', 'jumper', 'burning', 'burning'], // 23
        ['tank', 'tank', 'tank', 'tank', 'regenerator', 'regenerator', 'aggro', 'aggro'], // 24 - Boss Warning
        ['boss_shielder', 'heavytank', 'heavytank', 'tank', 'tank', 'tank', 'tank', 'tank'], // 25 - BOSS
        ['stunner', 'stunner', 'stunner', 'transparent', 'transparent', 'aggro', 'aggro'], // 26
        ['jumper', 'jumper', 'jumper', 'regenerator', 'regenerator', 'regenerator', 'burning', 'burning'], // 27
        ['tank', 'splitter', 'tank', 'splitter', 'tank', 'splitter', 'aggro', 'aggro'], // 28
        ['transparent', 'regenerator', 'jumper', 'splitter', 'stunner', 'tank', 'speedy', 'burning', 'aggro'], // 29
        ['tank', 'tank', 'tank', 'tank', 'speedy', 'speedy', 'speedy', 'speedy', 'basic', 'basic', 'basic', 'basic'], // 30
        ['superspeed', 'superspeed', 'basic', 'basic', 'speedy', 'speedy', 'superspeed', 'superspeed', 'basic', 'basic', 'speedy', 'speedy'], // 31
        ['heavytank', 'heavytank', 'tank', 'tank', 'basic', 'basic', 'heavytank', 'heavytank', 'tank', 'tank', 'basic', 'basic'], // 32
        ['superspeed', 'superspeed', 'burning', 'burning', 'superspeed', 'superspeed', 'burning', 'burning', 'superspeed', 'superspeed', 'burning', 'burning'], // 33
        ['heavytank', 'heavytank', 'regenerator', 'regenerator', 'heavytank', 'heavytank', 'regenerator', 'regenerator', 'heavytank', 'heavytank', 'regenerator', 'regenerator'], // 34
        ['aggro', 'aggro', 'superspeed', 'superspeed', 'aggro', 'aggro', 'superspeed', 'superspeed', 'aggro', 'aggro', 'superspeed', 'superspeed'], // 35
        ['healer', 'healer', 'heavytank', 'stickyhealer', 'healer', 'tank', 'heavytank', 'shockwave', 'tank', 'tank', 'heavytank', 'stickyhealer'],
        ['superspeed', 'splitter', 'superspeed', 'splitter', 'shockwave', 'splitter', 'superspeed', 'splitter', 'stickyhealer', 'splitter', 'superspeed', 'splitter'], // 37
        ['heavytank', 'jumper', 'heavytank', 'jumper', 'stickyhealer', 'jumper', 'heavytank', 'jumper', 'shockwave', 'jumper', 'heavytank', 'jumper'], // 38
        ['burning', 'burning', 'superspeed', 'heavytank', 'burning', 'shockwave', 'superspeed', 'heavytank', 'burning', 'burning', 'superspeed', 'stickyhealer'], // 39
        ['aggro', 'healer', 'superspeed', 'heavytank', 'regenerator', 'splitter', 'burning', 'aggro', 'healer', 'superspeed', 'shockwave', 'stickyhealer'], // 40
        ['superspeed', 'superspeed', 'superspeed', 'heavytank', 'heavytank', 'shockwave', 'superspeed', 'superspeed', 'heavytank', 'heavytank', 'superspeed', 'stickyhealer'], // 41
        ['heavytank', 'heavytank', 'heavytank', 'superspeed', 'superspeed', 'stickyhealer', 'heavytank', 'heavytank', 'superspeed', 'superspeed', 'heavytank', 'shockwave'], // 42
        ['burning', 'burning', 'burning', 'aggro', 'aggro', 'shockwave', 'burning', 'burning', 'aggro', 'aggro', 'burning', 'stickyhealer'], // 43
        ['regenerator', 'regenerator', 'regenerator', 'healer', 'healer', 'regenerator', 'regenerator', 'regenerator', 'healer', 'tank', 'regenerator', 'regenerator'],
        ['boss_theking', 'heavytank', 'heavytank', 'heavytank', 'heavytank', 'heavytank', 'heavytank'], // 45 - BOSS
        ['superspeed', 'heavytank', 'superspeed', 'heavytank', 'shockwave', 'heavytank', 'superspeed', 'heavytank', 'stickyhealer', 'heavytank', 'superspeed', 'heavytank'], // 46
        ['aggro', 'burning', 'aggro', 'burning', 'aggro', 'burning', 'aggro', 'burning', 'shockwave', 'burning', 'aggro', 'stickyhealer'], // 47
        ['healer', 'regenerator', 'healer', 'regenerator', 'healer', 'regenerator', 'tank', 'regenerator', 'tank', 'regenerator', 'tank', 'regenerator'],
        ['superspeed', 'heavytank', 'aggro', 'healer', 'burning', 'regenerator', 'splitter', 'jumper', 'shockwave', 'transparent', 'stickyhealer', 'speedy'], // 49
        ['heavytank', 'heavytank', 'superspeed', 'superspeed', 'aggro', 'aggro', 'burning', 'burning', 'regenerator', 'regenerator', 'splitter', 'splitter', 'healer', 'healer', 'heavytank', 'superspeed', 'aggro', 'burning', 'regenerator', 'splitter', 'healer', 'tank'] // 50
    ];

    function getPointAheadOnPath(enemy, distance) {
        let currentX = enemy.x;
        let currentY = enemy.y;
        let pIndex = enemy.pathIndex;
        let remainingDistance = distance;

        while (pIndex < currentPath.length - 1 && remainingDistance > 0) {
            let nextNode = currentPath[pIndex + 1];
            let dx = nextNode.x - currentX;
            let dy = nextNode.y - currentY;
            let distToNextNode = Math.sqrt(dx * dx + dy * dy);

            if (distToNextNode > remainingDistance) {
                return {
                    x: currentX + (dx / distToNextNode) * remainingDistance,
                    y: currentY + (dy / distToNextNode) * remainingDistance,
                    pathIndex: pIndex
                };
            } else {
                remainingDistance -= distToNextNode;
                currentX = nextNode.x;
                currentY = nextNode.y;
                pIndex++;
            }
        }

        return {
            x: currentX,
            y: currentY,
            pathIndex: pIndex
        };
    }

    // --- Classes ---
    // --- Classes ---
    class Enemy {
        constructor(type) {
            const startNode = currentPath[0];
            this.x = startNode.x;
            this.y = startNode.y;
            this.width = type.isStickyHealer ? tileSize * 0.6 : tileSize * 0.8;
            this.height = type.isStickyHealer ? tileSize * 0.6 : tileSize * 0.8;
            this.type = type;
            this.health = isHardMode ? type.health * 1.5 : type.health;
            this.maxHealth = isHardMode ? type.health * 1.5 : type.health;
            this.speed = isHardMode ? type.speed * 1.2 : type.speed;
            this.reward = isHardMode ? type.reward * 1.5 : type.reward;
            this.pathIndex = 0;
            this.burnTimer = 0;
            this.burnDamagePerFrame = 0;
            this.isStuck = false;
            this.slowed = false;
            this.slowResistanceTimer = 0;
            this.isSlowResistant = false;
            this.slowTimer = 0;
            this.appliedSlowFactor = 1;
            this.frozenHitCount = 0;
            this.isMagnetized = false;
            this.magnetismTimer = 0;
            if (this.type.isJumper) this.jumpCooldown = 0;
            this.regenRate = type.regenRate || 0;
            this.isHealer = type.isHealer || false;
            if (this.isHealer) {
                this.healRange = type.healRange;
                this.healAmount = type.healAmount;
                this.healCooldown = type.healCooldown;
                this.currentHealCooldown = 0;
            }
            this.isImmuneToIce = type.isImmuneToIce || false;
            this.isSuperSpeed = type.isSuperSpeed || false;
            if (this.isSuperSpeed) {
                this.speedIncreaseRate = type.speedIncreaseRate;
                this.maxSpeed = type.maxSpeed;
            }
            this.isHeavyTank = type.isHeavyTank || false;
            if (this.isHeavyTank) this.damageReduction = type.damageReduction;
            this.isStickyHealer = type.isStickyHealer || false;
            this.isShockwave = type.isShockwave || false;
            if (this.isShockwave) this.hitsTaken = 0;
            this.hasStickyHealer = false;
            this.isBoss = type.isBoss || false;
            if (this.isBoss) {
                this.abilityCooldown = 0;
                this.isInvincible = false;
            }
        }

        move() {
            if (this.pathIndex >= currentPath.length - 1) return;
            if (this.isStuck) {
                setTimeout(() => { this.isStuck = false; }, 2000);
                return;
            }

            if (this.type.isJumper) {
                if (this.jumpCooldown > 0) {
                    this.jumpCooldown--;
                } else {
                    let jumped = false;
                    for (const otherEnemy of enemies) {
                        if (this === otherEnemy) continue;
                        const distToOther = Math.sqrt(Math.pow(this.x - otherEnemy.x, 2) + Math.pow(this.y - otherEnemy.y, 2));
                        if (distToOther < tileSize) {
                            const newPos = getPointAheadOnPath(this, this.type.jumpDistance);
                            this.x = newPos.x;
                            this.y = newPos.y;
                            this.pathIndex = newPos.pathIndex;
                            this.jumpCooldown = this.type.jumpCooldownTime;
                            jumped = true;
                            break;
                        }
                    }
                    if (jumped) return;
                }
            }

            const target = currentPath[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let currentSpeed = this.speed;
            if (this.slowed && this.slowTimer > 0) {
                currentSpeed *= this.appliedSlowFactor;
                this.slowTimer--;
            } else {
                this.slowed = false;
                this.frozenHitCount = 0;
            }

            if (this.slowResistanceTimer > 0) {
                this.slowResistanceTimer--;
            } else {
                this.isSlowResistant = false;
            }

            if (distance < currentSpeed) {
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * currentSpeed;
                this.y += (dy / distance) * currentSpeed;
            }

            if (this.burnTimer > 0) {
                this.health -= this.burnDamagePerFrame;
                this.burnTimer--;
            }

            if (this.isMagnetized) {
                this.magnetismTimer--;
                if (this.magnetismTimer <= 0) {
                    this.health -= (this.magnetismDamage || 70);
                    this.isMagnetized = false;
                    this.isStuck = true; // 2 seconds stun
                    setTimeout(() => { this.isStuck = false; }, 2000);
                    explosions.push(new Explosion(this.x, this.y, 30));
                    showNotification(`${this.type.name}에게 번개 강타!`);
                }
            }

            if (this.regenRate > 0 && this.health < this.maxHealth) {
                this.health += this.regenRate;
                if (this.health > this.maxHealth) {
                    this.health = this.maxHealth;
                }
            }

            if (this.isHealer) {
                if (this.currentHealCooldown > 0) {
                    this.currentHealCooldown--;
                } else {
                    enemies.forEach(otherEnemy => {
                        if (otherEnemy !== this) {
                            const distance = Math.sqrt(Math.pow(this.x - otherEnemy.x, 2) + Math.pow(this.y - otherEnemy.y, 2));
                            if (distance <= this.healRange && otherEnemy.health < otherEnemy.maxHealth) {
                                otherEnemy.health += this.healAmount;
                                if (otherEnemy.health > otherEnemy.maxHealth) {
                                    otherEnemy.health = otherEnemy.maxHealth;
                                }
                            }
                        }
                    });
                    this.currentHealCooldown = this.healCooldown;
                }
            }

            if (this.isSuperSpeed && this.speed < this.maxSpeed) {
                this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncreaseRate);
            }
        }

        draw() {
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, 5);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, Math.max(0, this.width * (this.health / this.maxHealth)), 5);
        }

        updateAbilities() {
            if (this.abilityCooldown > 0) {
                this.abilityCooldown--;
            }

            if (this.isStickyHealer) {
                const targetEnemy = enemies.find(e =>
                    !e.isBoss &&
                    !e.isStickyHealer &&
                    !e.hasStickyHealer &&
                    Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2)) < 20
                );

                if (targetEnemy) {
                    if (Math.random() < 0.5) {
                        targetEnemy.hasStickyHealer = true;
                        showNotification(`${targetEnemy.type.name}에게 접착 힐러 부착!`);
                        const myIndex = enemies.indexOf(this);
                        if (myIndex > -1) {
                            enemies.splice(myIndex, 1);
                        }
                    }
                }
            }

            if (this.isBoss && this.abilityCooldown <= 0) {
                switch (this.type.name) {
                    case '헌터':
                        units.sort((a, b) => {
                            const distA = Math.sqrt(Math.pow(this.x - a.x, 2) + Math.pow(this.y - a.y, 2));
                            const distB = Math.sqrt(Math.pow(this.x - b.x, 2) + Math.pow(this.y - b.y, 2));
                            return distA - distB;
                        });
                        for (let i = 0; i < 2 && i < units.length; i++) {
                            units[i].stunTimer = 60;
                        }
                        showNotification('헌터가 타워 2개를 기절시킵니다!');
                        this.abilityCooldown = 180;
                        break;
                    case '쉴더':
                        this.isInvincible = true;
                        globalDamageMultiplier = 2 / 3;
                        showNotification('쉴더가 무적 장막을 펼칩니다!');
                        setTimeout(() => {
                            this.isInvincible = false;
                            showNotification('쉴더의 무적 장막 해제.');
                        }, 2000);
                        this.abilityCooldown = 360;
                        break;
                    case '더 킹':
                        const summonType = Math.random() < 0.5 ? 'tank' : 'basic';
                        const count = summonType === 'tank' ? 3 : 5;
                        showNotification(`더 킹이 ${enemyTypes[summonType].name} ${count}마리를 소환합니다!`);
                        for (let i = 0; i < count; i++) {
                            const newEnemy = new Enemy(enemyTypes[summonType]);
                            const offset = (i % 2 === 0 ? 1 : -1) * (Math.floor(i / 2) + 1) * tileSize;
                            newEnemy.x = this.x + offset;
                            newEnemy.y = this.y;
                            newEnemy.pathIndex = this.pathIndex;
                            enemies.push(newEnemy);
                        }
                        this.abilityCooldown = 360;
                        break;
                }
            }
        }
    }

    class BaseTower {
        constructor(x, y, towerId) {
            this.x = x;
            this.y = y;
            this.towerId = towerId;
            const template = towerData[towerId];
            this.width = tileSize;
            this.height = tileSize;
            this.stats = JSON.parse(JSON.stringify(template));
            this.originalStats = JSON.parse(JSON.stringify(this.stats));
            this.stats.canSeeTransparent = this.stats.range >= 140;
            this.target = null;
            this.fireCooldown = 0;
            this.isSelected = false;
            this.rangeAnimationRadius = 0;
            this.level = 1;
            this.statPoints = 0;
            this.stunTimer = 0;
            this.isMoving = false;
        }

        findTarget() {
            const potentialTargets = [];
            for (let enemy of enemies) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.stats.range) {
                    if (enemy.type.isTransparent) {
                        if (this.stats.canDetectGhost || (this.stats.canSeeTransparent && distance <= 80)) {
                            potentialTargets.push(enemy);
                        }
                    } else {
                        potentialTargets.push(enemy);
                    }
                }
            }
            if (potentialTargets.length > 0) {
                potentialTargets.sort((a, b) => {
                    if (a.type.isAggro && !b.type.isAggro) return -1;
                    if (!a.type.isAggro && b.type.isAggro) return 1;
                    return b.health - a.health;
                });
                this.target = potentialTargets[0];
            } else {
                this.target = null;
            }
        }

        attack() { }

        update() {
            if (this.stunTimer > 0 || this.isMoving) {
                if (this.isMoving) {
                    this.target = null;
                }
                this.stunTimer--;
                return;
            }
            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else {
                if (this.target) {
                    const dx = this.x - this.target.x;
                    const dy = this.y - this.target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (this.target.health <= 0 || distance > this.stats.range) {
                        this.target = null;
                    }
                }
                if (!this.target) {
                    this.findTarget();
                }
                if (this.target) {
                    this.attack();
                }
            }
        }

        draw() {
            ctx.fillStyle = this.stats.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            // Draw border based on rarity
            ctx.lineWidth = 2;
            switch (this.stats.rarity) {
                case 'common': ctx.strokeStyle = '#b0bec5'; break; // light grey
                case 'rare': ctx.strokeStyle = '#42a5f5'; break; // blue
                case 'epic': ctx.strokeStyle = '#ab47bc'; break; // purple
                case 'legendary': ctx.strokeStyle = '#ffca28'; break; // gold
                default: ctx.strokeStyle = '#000000';
            }
            ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            if (this.isSelected && this.rangeAnimationRadius < this.stats.range) {
                this.rangeAnimationRadius += 10;
                if (this.rangeAnimationRadius > this.stats.range) {
                    this.rangeAnimationRadius = this.stats.range;
                }
            } else if (!this.isSelected && this.rangeAnimationRadius > 0) {
                this.rangeAnimationRadius -= 10;
                if (this.rangeAnimationRadius < 0) {
                    this.rangeAnimationRadius = 0;
                }
            }
            if (this.rangeAnimationRadius > 0) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(100, 100, 255, 0.7)`;
                ctx.lineWidth = 2;
                ctx.arc(this.x, this.y, this.rangeAnimationRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (this.stunTimer > 0) {
                ctx.fillStyle = 'blue';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Stunned', this.x, this.y - this.height / 2 - 5);
            }
        }
    }

    class BasicTower extends BaseTower {
        attack() {
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this));
                playSound('laser');
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class TeslaTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound
            this.fireCooldown = this.stats.fireRate;
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) {
                    enemy.health -= this.stats.damage;
                }
            });
        }
    }

    class BombTower extends BaseTower {
        attack() {
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                projectiles.push(new BombProjectile(this.x, this.y, this.target.x, this.target.y, this.stats, this));
                playSound('laser');
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class FlameTower extends BaseTower {
        attack() {
            playSound('laser');
            this.fireCooldown = this.stats.fireRate;
            if (!this.target || this.target.health <= 0) {
                this.findTarget();
            }
            if (this.target) {
                // 3초간 20의 피해 -> 180프레임간 20의 피해 -> 프레임당 20/180의 피해
                projectiles.push(new FlameProjectile(this.x, this.y, this.target, this.stats.damage, 20, 180, this));
            }
        }
    }

    class GlueTower extends BaseTower {
        attack() {
            playSound('laser');
            this.fireCooldown = this.stats.fireRate;
            if (!this.target || this.target.health <= 0) {
                this.findTarget();
            }
            if (this.target) {
                const targetTileX = Math.floor(this.target.x / tileSize) * tileSize + tileSize / 2;
                const targetTileY = Math.floor(this.target.y / tileSize) * tileSize + tileSize / 2;
                let existingStickyTile = stickyTiles.find(tile => tile.x === targetTileX && tile.y === targetTileY);
                if (existingStickyTile) {
                    existingStickyTile.duration = 120; // 2초
                    if (existingStickyTile.stuckEnemy && existingStickyTile.stuckEnemy !== this.target) {
                        existingStickyTile.stuckEnemy.isStuck = false;
                        existingStickyTile.stuckEnemy = null;
                    }
                } else {
                    stickyTiles.push(new StickyTile(targetTileX, targetTileY, 120)); // 2초
                }
            }
        }
    }

    class IceTower extends BaseTower {
        attack() {
            playSound('laser');
            this.fireCooldown = this.stats.fireRate;
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) {
                    if (!enemy.isImmuneToIce && !enemy.isSlowResistant) {
                        if (enemy.burnTimer > 0) {
                            enemy.burnTimer = 0;
                            enemy.burnDamagePerFrame = 0;
                            enemy.slowResistanceTimer = this.stats.slowDuration;
                        }
                        enemy.slowed = true;
                        enemy.slowTimer = this.stats.slowDuration;
                        enemy.appliedSlowFactor = this.stats.slowFactor;
                    }
                }
            });
        }
    }

    class SwordTower extends BaseTower {
        constructor(x, y, towerId) {
            super(x, y, towerId);
            this.kills = 0;
        }
        attack() {
            playSound('laser');
            this.fireCooldown = this.stats.fireRate;
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) {
                    enemy.health -= this.stats.damage;
                }
            });
            if (this.kills >= 2) {
                let nearestEnemy = null;
                let minDistance = Infinity;
                for (const enemy of enemies) {
                    const dist = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestEnemy = enemy;
                    }
                }
                if (nearestEnemy) {
                    projectiles.push(new SwordWaveProjectile(this.x, this.y, nearestEnemy, 10, this));
                    playSound('laser');
                    this.kills -= 2;
                }
            }
        }
    }

    class LaserTower extends BaseTower {
        attack() {
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                projectiles.push(new LaserProjectile(this.x, this.y, this.target, this.stats.damage, this));
                playSound('laser');
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class MagnifyingGlassTower extends BaseTower {
        constructor(x, y, towerId) {
            super(x, y, towerId);
            this.bursting = false;
            this.burstCooldown = 0;
            this.burstCount = 0;
        }

        removeGhostPropertyFromEnemies() {
            enemies.forEach(enemy => {
                if (enemy.type.isTransparent) {
                    const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                    if (distance <= this.stats.range) {
                        enemy.type.isTransparent = false;
                        enemy.type.color = '#cccccc'; // Optional: visibly change back to a solid grey to show it's no longer ghost
                    }
                }
            });
        }

        findTarget() {
            const potentialTargets = enemies.filter(e => e.type.isTransparent);
            let closestEnemy = null;
            let minDistance = Infinity;
            for (const enemy of potentialTargets) {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance < this.stats.range) {
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
            this.target = closestEnemy;
        }

        attack() {
            this.bursting = true;
            this.burstCount = 3;
            this.burstCooldown = 0;
            this.fireCooldown = this.stats.fireRate;
        }

        update() {
            this.removeGhostPropertyFromEnemies(); // Continuously strip ghost

            if (this.stunTimer > 0 || this.isMoving) {
                if (this.isMoving) this.target = null;
                this.stunTimer--;
                return;
            }

            if (this.bursting) {
                if (this.burstCooldown > 0) this.burstCooldown--;
                if (this.burstCount > 0 && this.burstCooldown <= 0) {
                    if (this.target && this.target.health > 0) {
                        projectiles.push(new MagnifyingBeam(this.x, this.y, this.target, this.stats.damage, this));
                        playSound('laser');
                    } else {
                        this.bursting = false;
                        this.burstCount = 0;
                    }
                    this.burstCount--;
                    this.burstCooldown = 20;
                }
                if (this.burstCount <= 0) {
                    this.bursting = false;
                }
                return;
            }

            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else {
                this.findTarget();
                if (this.target) {
                    this.attack();
                }
            }
        }
    }

    class LavaRock {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.speed = 1.5; // Slightly faster
            this.width = tileSize * 0.6; // 접착힐러 크기
            this.height = tileSize * 0.6;
            this.damage = 15;
            this.burnDamage = 15;
            this.burnDuration = 210; // 3.5 seconds
            this.pathIndex = currentPath.length - 1; // 기지(끝)에서 시작
            this.angle = 0;
        }

        move() {
            if (this.pathIndex <= 0) return true; // Mark for deletion when it reaches enemy spawn

            const target = currentPath[this.pathIndex - 1]; // 이전 경로 노드를 타겟으로
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.pathIndex--; // 감소
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }

            this.angle += 0.2; // Rotate

            for (let enemy of enemies) {
                const distToEnemy = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distToEnemy < (this.width + enemy.width) / 2) {
                    enemy.health -= this.damage;
                    enemy.burnTimer = this.burnDuration;
                    enemy.burnDamagePerFrame = this.burnDamage / this.burnDuration;
                    return true; // Mark for deletion
                }
            }
            return false;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#FF4500'; // Orange-Red color for lava
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    let lavaRocks = [];

    class LavaTower extends BaseTower {
        update() {
            if (this.stunTimer > 0 || this.isMoving) {
                this.stunTimer--;
                return;
            }
            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else {
                this.attack();
            }
        }

        attack() {
            // This tower spawns units, doesn't attack directly
            this.fireCooldown = this.stats.fireRate;
            const endNode = currentPath[currentPath.length - 1]; // 경로 끝에서 생성
            lavaRocks.push(new LavaRock(endNode.x, endNode.y));
        }
    }

    class GatlingTower extends BaseTower {
        attack() {
            if (!this.target) return;
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                // 1회 관통하는 발사체 생성
                projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this, { pierce: 1 }));
                playSound('laser');
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class FreezerTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder
            this.fireCooldown = this.stats.fireRate;
            let frozenCount = 0;
            enemies.forEach(enemy => {
                if (frozenCount >= 3) return;
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range && !enemy.isStuck && !enemy.isImmuneToFreeze) {
                    enemy.isStuck = true; // 3초간 정지
                    setTimeout(() => { enemy.isStuck = false; }, 3000);
                    frozenCount++;
                }
            });
        }
    }

    class LightningTower extends BaseTower {
        attack() {
            if (!this.target) return;
            playSound('laser'); // Placeholder
            this.fireCooldown = this.stats.fireRate;
            this.target.isMagnetized = true;
            this.target.magnetismTimer = 90; // 1.5초
            this.target.magnetismDamage = this.stats.damage; // Record scaled damage
        }
    }

    class SphinxTower extends BaseTower {
        constructor(x, y, towerId) {
            super(x, y, towerId);
            this.specialAbilityDuration = 0;
            this.activeBuff = null;
        }

        attack() {
            this.fireCooldown = this.stats.fireRate;
            if (!this.target) return;

            let projectileCount = 6;
            let fireInterval = 60; // 1 second
            let damage = this.stats.damage;

            if (this.activeBuff === 'red') damage += 1;
            if (this.activeBuff === 'blue') {
                projectileCount = 7;
                fireInterval = 30; // 0.5 seconds
            }
            if (this.activeBuff === 'green') {
                projectiles.push(new Projectile(this.x, this.y, this.target, 60, this));
                this.specialAbilityDuration = 120; // 2 seconds instead of 5
                return;
            }

            for (let i = 0; i < projectileCount; i++) {
                setTimeout(() => {
                    if (this.target && this.target.health > 0) {
                        projectiles.push(new Projectile(this.x, this.y, this.target, damage, this));
                    }
                }, i * (fireInterval / projectileCount));
            }
        }

        update() {
            super.update();
            if (this.specialAbilityDuration > 0) {
                this.specialAbilityDuration--;
            } else {
                this.activeBuff = null;
            }
        }

        triggerWaveBuff() {
            this.specialAbilityDuration = 300; // 5 seconds duration
            const buffs = ['red', 'green', 'blue'];
            this.activeBuff = buffs[Math.floor(Math.random() * buffs.length)];
            showNotification(`스핑크스 타워 ${this.activeBuff} 버프 활성화!`);
        }
    }

    class NightHunterTower extends BaseTower {
        constructor(x, y, towerId) {
            super(x, y, towerId);
            this.killsInWave = 0;
            this.buffDuration = 0;
        }

        attack() {
            this.fireCooldown = this.stats.fireRate;
            if (!this.target) return;
            let currentDamage = this.stats.damage;
            if (this.buffDuration > 0) {
                currentDamage *= 1.3;
            }
            projectiles.push(new Projectile(this.x, this.y, this.target, currentDamage, this));
        }

        update() {
            super.update();
            if (this.buffDuration > 0) {
                this.buffDuration--;
            }
        }

        // This needs to be called from enemy defeat logic
        recordKill() {
            this.killsInWave++;
            if (this.killsInWave >= 5) {
                this.buffDuration = 360; // 6 seconds
                this.killsInWave = 0; // Reset after buff
                showNotification('나이트 헌터 공격력 증가!');
            }
        }
    }

    class PainterTower extends BaseTower {
        attack() {
            this.fireCooldown = this.stats.fireRate;
            if (!this.target) return;

            const color = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
            projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this, { color: color }));

            if (Math.random() < 0.04) {
                const tileX = Math.floor(this.target.x / tileSize) * tileSize + tileSize / 2;
                const tileY = Math.floor(this.target.y / tileSize) * tileSize + tileSize / 2;
                // Avoid placing on top of each other
                if (!stickyTiles.some(t => t.x === tileX && t.y === tileY && t.isPaint)) {
                    stickyTiles.push(new StickyTile(tileX, tileY, 300, { isPaint: true, color: color, damage: 2, interval: 15 }));
                }
            }
        }
    }

    class Projectile {
        constructor(x, y, target, damage, source, options = {}) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.source = source;
            this.speed = 5;
            this.width = 5;
            this.height = 5;
            this.pierce = options.pierce || 0;
            this.hitEnemies = [];
            this.color = options.color || 'black'; // For Painter Tower
        }

        move() {
            if (!this.target || this.target.health <= 0) {
                return true; // Mark for deletion
            }
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.target.x;
                this.y = this.target.y;
                this.hitTarget();
                return true; // Mark for deletion
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
            return false;
        }

        hitTarget() {
            if (this.hitEnemies.includes(this.target)) return;

            let damageToDeal = this.damage;
            if (this.target.isHeavyTank) {
                damageToDeal = Math.max(0, this.damage - this.target.damageReduction);
            }
            this.target.health -= damageToDeal;
            playSound('hit');
            this.hitEnemies.push(this.target);

            if (this.pierce > 0) {
                this.pierce--;
                this.target = null;
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    class WaterBombProjectile extends Projectile {
        constructor(x, y, target, stats, source) {
            super(x, y, target, stats.damage, source);
            this.blastRadius = stats.blastRadius;
            this.speed = 4;
            this.midAirExplosionTimer = 12; // 0.2초
            this.hasDoneMidAirExplosion = false;
        }

        move() {
            // 중간 폭발 로직
            if (!this.hasDoneMidAirExplosion) {
                this.midAirExplosionTimer--;
                if (this.midAirExplosionTimer <= 0) {
                    this.hasDoneMidAirExplosion = true;
                    explosions.push(new Explosion(this.x, this.y, this.blastRadius, 'rgba(0, 100, 255, 0.5)')); // 시각 효과
                    enemies.forEach(enemy => {
                        const dx = this.x - enemy.x;
                        const dy = this.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < this.blastRadius) {
                            // 둔화 효과만 적용
                            if (enemy.slowed && enemy.appliedSlowFactor <= 0.5) return;
                            enemy.slowed = true;
                            enemy.slowTimer = 180;
                            enemy.appliedSlowFactor = (enemy.appliedSlowFactor || 1) * 0.875;
                        }
                    });
                }
            }

            // 원래 이동 및 최종 폭발 로직
            if (!this.target || this.target.health <= 0) {
                return true; // 타겟이 없으면 소멸
            }
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.target.x;
                this.y = this.target.y;
                this.hitTarget(); // 최종 목표물 도달 시 폭발
                return true;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
            return false;
        }

        hitTarget() {
            // 최종 폭발 (데미지 + 둔화)
            explosions.push(new Explosion(this.x, this.y, this.blastRadius, 'rgba(0, 100, 255, 0.7)'));
            enemies.forEach(enemy => {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.blastRadius) {
                    enemy.health -= this.damage;
                    if (enemy.slowed && enemy.appliedSlowFactor <= 0.5) return;
                    enemy.slowed = true;
                    enemy.slowTimer = 180;
                    enemy.appliedSlowFactor = (enemy.appliedSlowFactor || 1) * 0.875;
                }
            });
        }
    }

    class WaterBombTower extends BaseTower {
        attack() {
            if (!this.target) {
                this.findTarget();
            }
            if (this.target) {
                this.fireCooldown = this.stats.fireRate;
                projectiles.push(new WaterBombProjectile(this.x, this.y, this.target, this.stats, this));
                playSound('laser');
            }
        }
    }

    class LaserProjectile extends Projectile {
        constructor(x, y, target, damage, source) {
            super(x, y, target, damage, source);
            this.speed = 10;
        }
        draw() {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.source.x, this.source.y);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        }
    }

    class FlameProjectile extends Projectile {
        constructor(x, y, target, damage, burnDamage, burnDuration, source) {
            super(x, y, target, damage, source);
            this.burnDamage = burnDamage;
            this.burnDuration = burnDuration;
        }

        hitTarget() {
            super.hitTarget();
            if (this.target && !this.target.isImmuneToIce) {
                this.target.burnTimer = this.burnDuration;
                this.target.burnDamagePerFrame = this.burnDamage / this.burnDuration;
            }
        }
    }

    class BombProjectile extends Projectile {
        constructor(x, y, targetX, targetY, stats, source) {
            super(x, y, { x: targetX, y: targetY, health: 1 }, stats.damage, source);
            this.blastRadius = stats.blastRadius;
        }

        hitTarget() {
            explosions.push(new Explosion(this.x, this.y, this.blastRadius));
            enemies.forEach(enemy => {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.blastRadius) {
                    enemy.health -= this.damage;
                }
            });
        }
    }

    class SwordWaveProjectile extends Projectile {
        constructor(x, y, target, damage, source) {
            super(x, y, target, damage, source, { pierce: 3 });
            this.speed = 4;
        }
        draw() {
            ctx.fillStyle = '#DB7093';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class MagnifyingBeam extends Projectile {
        constructor(x, y, target, damage, source) {
            super(x, y, target, damage, source);
            this.duration = 5; // Draw for 5 frames
        }
        move() {
            this.duration--;
            if (this.duration <= 0) {
                this.hitTarget();
                return true;
            }
            return false;
        }
        draw() {
            if (!this.target) return;
            ctx.strokeStyle = '#FBC02D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.source.x, this.source.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }
    }

    class Explosion {
        constructor(x, y, radius, color = 'rgba(255, 165, 0, 0.7)') {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.maxRadius = radius;
            this.life = 20;
            this.color = color;
        }

        update() {
            this.life--;
            this.radius = this.maxRadius * (this.life / 20);
        }

        draw() {
            const colorString = this.color.startsWith('rgba') ? this.color.substring(5, this.color.lastIndexOf(',')) : '255, 165, 0';
            ctx.fillStyle = `rgba(${colorString}, ${this.life / 20})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class StickyTile {
        constructor(x, y, duration, options = {}) {
            this.x = x;
            this.y = y;
            this.duration = duration;
            this.stuckEnemy = null;
            this.isPaint = options.isPaint || false;
            this.color = options.color || 'rgba(124, 252, 0, 0.5)';
            this.paintDamage = options.damage || 0;
            this.paintInterval = options.interval || 0;
            this.paintCooldown = 0;
        }

        update() {
            this.duration--;
            if (this.isPaint) {
                if (this.paintCooldown > 0) this.paintCooldown--;
                for (const enemy of enemies) {
                    const dx = this.x - enemy.x;
                    const dy = this.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < tileSize / 2 && this.paintCooldown <= 0) {
                        enemy.health -= this.paintDamage;
                        this.paintCooldown = this.paintInterval;
                    }
                }
            } else {
                if (this.stuckEnemy && this.stuckEnemy.health <= 0) {
                    this.stuckEnemy = null;
                }
                if (!this.stuckEnemy) {
                    for (const enemy of enemies) {
                        const dx = this.x - enemy.x;
                        const dy = this.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < tileSize / 2) {
                            enemy.isStuck = true;
                            this.stuckEnemy = enemy;
                            break;
                        }
                    }
                }
            }
        }

        draw() {
            ctx.fillStyle = this.isPaint ? this.color : 'rgba(124, 252, 0, 0.5)';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x - tileSize / 2, this.y - tileSize / 2, tileSize, tileSize);
            ctx.globalAlpha = 1.0;
        }
    }

    const towerClasses = {
        'basic': BasicTower,
        'tesla': TeslaTower,
        'bomb': BombTower,
        'flame': FlameTower,
        'glue': GlueTower,
        'ice': IceTower,
        'laser': LaserTower,
        'sword': SwordTower,
        'magnifying_glass': MagnifyingGlassTower,
        'gatling': GatlingTower,
        'freezer': FreezerTower,
        'lightning': LightningTower,
        'lava_tower': LavaTower,
        'sphinx': SphinxTower,
        'water_bomb': WaterBombTower,
        'night_hunter': NightHunterTower,
        'painter': PainterTower,
    };

    function playSound(name) {
        // In a real game, you would use the Web Audio API
        console.log(`Playing sound: ${name}`);
    }

    function startNextWave() {
        if (waveSpawning || isGameOver) return;
        waveSpawning = true;
        wave++;

        // Trigger Sphinx Tower wave buffs
        units.forEach(unit => {
            if (unit.towerId === 'sphinx') {
                unit.triggerWaveBuff();
            }
        });

        if (wave > 20 && !isHardMode) {
            isHardMode = true;
            showNotification("하드 모드가 시작됩니다!");
        }

        if (wave % 5 === 0 && !waveBonusGiven.includes(wave)) {
            const bonus = wave * 10;
            currency += bonus;
            waveBonusGiven.push(wave);
            showWaveBonusNotification(`${wave} 웨이브 보너스! +${bonus} 재화`);
        }

        updateUI();

        const waveEnemies = waves[wave - 1];
        if (!waveEnemies) {
            showNotification("모든 웨이브를 클리어했습니다!");
            isGameOver = true;
            return;
        }

        let spawnCount = 0;
        const spawnInterval = setInterval(() => {
            if (spawnCount < waveEnemies.length) {
                const enemyType = enemyTypes[waveEnemies[spawnCount]];
                enemies.push(new Enemy(enemyType));
                spawnCount++;
            } else {
                clearInterval(spawnInterval);
                waveSpawning = false;
            }
        }, 500);
    }

    function handleEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.move();
            enemy.draw();
            enemy.updateAbilities();

            if (enemy.health <= 0) {
                currency += enemy.reward; // Hard mode reward is baked into the enemy object

                // For Night Hunter
                units.forEach(u => {
                    if (u.towerId === 'night_hunter') {
                        u.recordKill();
                    }
                });

                if (selectedPlacedUnit && selectedPlacedUnit.towerId === 'sword') {
                    selectedPlacedUnit.kills++;
                }
                enemies.splice(i, 1);

                // Check for wave clear bonus
                if (enemies.length === 0 && !waveSpawning) {
                    currency += wave * 5;
                    showNotification(`웨이브 클리어 보너스! +${wave * 5} 재화`);
                }

                updateUI();
                continue;
            }

            if (enemy.pathIndex >= currentPath.length - 1) {
                health--;
                enemies.splice(i, 1);

                // Check for wave clear bonus (even if enemy reached end, if it was the last one)
                if (enemies.length === 0 && !waveSpawning) {
                    currency += wave * 5;
                    showNotification(`웨이브 클리어 보너스! +${wave * 5} 재화`);
                }

                updateUI();
                if (health <= 0) {
                    isGameOver = true;
                    showNotification("게임 오버!");
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }
    }

    function handleUnits() {
        units.forEach(unit => {
            unit.update();
            unit.draw();
        });
    }

    function handleLavaRocks() {
        for (let i = lavaRocks.length - 1; i >= 0; i--) {
            const rock = lavaRocks[i];
            if (rock.move()) {
                lavaRocks.splice(i, 1);
            } else {
                rock.draw();
            }
        }
    }

    function handleExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            explosion.update();
            explosion.draw();
            if (explosion.life <= 0) {
                explosions.splice(i, 1);
            }
        }
    }

    function handleProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.move()) {
                projectiles.splice(i, 1);
            } else {
                p.draw();
            }
        }
    }

    function updateUI() {
        currencyEl.textContent = currency;
        waveEl.textContent = wave;
        healthEl.textContent = health;
    }

    function updateBossUI() {
        if (currentBoss) {
            bossInfoContainer.classList.remove('hidden');
            bossNameEl.textContent = currentBoss.type.name;
            const healthPercentage = (currentBoss.health / currentBoss.maxHealth) * 100;
            bossHealthBar.style.width = `${healthPercentage}%`;
        } else {
            bossInfoContainer.classList.add('hidden');
        }
    }

    function updateEnemyInfoPanel(enemy) {
        if (enemy) {
            enemyInfoPanel.classList.remove('hidden');
            enemyTypeNameEl.textContent = enemy.type.name;
            enemyHealthEl.textContent = `${Math.ceil(enemy.health)} / ${enemy.maxHealth}`;
            enemySpeedEl.textContent = enemy.speed.toFixed(2);
        } else {
            enemyInfoPanel.classList.add('hidden');
        }
    }

    function drawGrid() {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let x = 0; x <= mapWidth; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, mapHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= mapHeight; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(mapWidth, y + 0.5);
            ctx.stroke();
        }
    }

    function drawMap() {
        ctx.strokeStyle = '#a0a0a0';
        ctx.fillStyle = '#c0c0c0';
        ctx.lineWidth = tileSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
        ctx.lineWidth = 1; // Reset line width
    }

    function flashElement(element, color) {
        const className = color === 'green' ? 'flash-green' : 'flash-red';
        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), 500);
    }

    function showNotification(message) {
        notificationArea.textContent = message;
        notificationArea.classList.remove('hidden');
        notificationArea.classList.add('show');
        setTimeout(() => {
            notificationArea.classList.remove('show');
            setTimeout(() => notificationArea.classList.add('hidden'), 500);
        }, 2000);
    }

    function showWaveBonusNotification(message) {
        const el = document.getElementById('wave-bonus-notification');
        el.textContent = message;
        el.classList.remove('hidden');
        el.classList.add('show');
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.classList.add('hidden'), 500);
        }, 3000);
    }

    function isPointOnPath(x, y) {
        for (let i = 0; i < currentPath.length - 1; i++) {
            const p1 = currentPath[i];
            const p2 = currentPath[i + 1];

            // Check if point is within the bounding box of the segment (with half-tile padding)
            const minX = Math.min(p1.x, p2.x) - tileSize / 2;
            const maxX = Math.max(p1.x, p2.x) + tileSize / 2;
            const minY = Math.min(p1.y, p2.y) - tileSize / 2;
            const maxY = Math.max(p1.y, p2.y) + tileSize / 2;

            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                // If the segment is strictly horizontal or vertical, the bounding box check is enough for orthogonal paths.
                return true;
            }
        }
        return false;
    }

    function performGacha() {
        if (currency < 50) {
            showNotification("재화가 부족합니다.");
            return;
        }
        currency -= 50;
        updateUI();
        playSound('gacha');

        const rand = Math.random();
        let cumulativeRate = 0;
        let drawnRarity = null;

        for (const rateInfo of gachaRates) {
            cumulativeRate += rateInfo.rate;
            if (rand < cumulativeRate) {
                drawnRarity = rateInfo.type;
                break;
            }
        }

        const awakenedTowers = ['lava_tower', 'gatling', 'freezer', 'lightning'];
        const availableTowers = Object.keys(towerData).filter(id =>
            towerData[id].rarity === drawnRarity && !awakenedTowers.includes(id)
        );

        if (availableTowers.length === 0) {
            // Fallback to common if no towers of the drawn rarity are available (should not happen with current setup)
            const commonTowers = Object.keys(towerData).filter(id => towerData[id].rarity === 'common');
            const drawnTowerId = commonTowers[Math.floor(Math.random() * commonTowers.length)];
            addUnitToInventory(drawnTowerId);
            showNotification(`${towerData[drawnTowerId].name} 획득! (폴백)`);
            return;
        }

        const drawnTowerId = availableTowers[Math.floor(Math.random() * availableTowers.length)];

        addUnitToInventory(drawnTowerId);
        showNotification(`${towerData[drawnTowerId].name} 획득!`);
    }

    function addUnitToInventory(towerId) {
        const unitIcon = document.createElement('div');
        unitIcon.classList.add('unit-icon', towerData[towerId].rarity);
        unitIcon.dataset.towerId = towerId;
        unitIcon.style.backgroundColor = towerData[towerId].color;
        unitIcon.addEventListener('click', () => {
            if (placingUnit && placingUnit.dataset.towerId === towerId) {
                placingUnit.classList.remove('selected');
                placingUnit = null;
            } else {
                if (placingUnit) {
                    placingUnit.classList.remove('selected');
                }
                placingUnit = unitIcon;
                unitIcon.classList.add('selected');
                selectedPlacedUnit = null;
                updateSelectedUnitInfo(null);
            }
        });
        unitInventoryEl.appendChild(unitIcon);
    }

    function updateSelectedUnitInfo(unit) {
        const awakenButton = document.getElementById('awaken-button');
        if (unit) {
            selectedUnitNameEl.textContent = unit.stats.name;
            selectedUnitLevelEl.textContent = unit.level;
            selectedUnitDamageEl.textContent = unit.stats.damage.toFixed(2);
            selectedUnitRangeEl.textContent = unit.stats.range.toFixed(2);
            selectedUnitFireRateEl.textContent = unit.stats.fireRate.toFixed(2);
            selectedUnitDescriptionEl.textContent = unit.stats.description;
            upgradePanel.classList.remove('hidden');
            const cost = upgradeCosts[unit.stats.rarity][unit.level - 1];
            upgradeButton.textContent = `업그레이드 (비용: ${cost || 'MAX'})`;
            statPointsEl.textContent = unit.statPoints;

            // 각성 버튼 로직
            const canAwaken = awakeningMap[unit.towerId] && unit.level >= 5 && isHardMode;
            if (canAwaken) {
                const awakenCost = (upgradeCosts[unit.stats.rarity][4] || 0) * 1.5;
                awakenButton.textContent = `각성 (비용: ${awakenCost})`;
                awakenButton.classList.remove('hidden');
            } else {
                awakenButton.classList.add('hidden');
            }

        } else {
            selectedUnitNameEl.textContent = '-';
            selectedUnitLevelEl.textContent = '-';
            selectedUnitDamageEl.textContent = '-';
            selectedUnitRangeEl.textContent = '-';
            selectedUnitFireRateEl.textContent = '-';
            selectedUnitDescriptionEl.textContent = '-';
            upgradePanel.classList.add('hidden');
            awakenButton.classList.add('hidden');
        }
    }

    const awakeningMap = {
        'basic': 'gatling',
        'tesla': 'lightning',
        'flame': 'lava_tower',
        'ice': 'freezer'
    };

    function handleAwaken() {
        if (!selectedPlacedUnit) return;

        const awakenedTowerId = awakeningMap[selectedPlacedUnit.towerId];

        if (!isHardMode) {
            showNotification("20 웨이브 클리어 (하드모드 진입)이 안 되었습니다.");
            return;
        }

        if (selectedPlacedUnit.level < 5) {
            showNotification("각성하려면 레벨이 5 이상이어야 합니다.");
            return;
        }

        if (!awakenedTowerId) {
            showNotification("각성 가능한 타워가 아닙니다.");
            return;
        }

        const awakenCost = (upgradeCosts[selectedPlacedUnit.stats.rarity][4] || 0) * 1.5;
        if (currency < awakenCost) {
            showNotification("각성 비용이 부족합니다.");
            return;
        }

        currency -= awakenCost;
        const unitIndex = units.findIndex(u => u === selectedPlacedUnit);
        if (unitIndex !== -1) {
            const oldUnit = units[unitIndex];
            const TowerClass = towerClasses[awakenedTowerId];
            const newUnit = new TowerClass(oldUnit.x, oldUnit.y, awakenedTowerId);
            newUnit.level = 1; // 각성된 타워는 1레벨로 초기화 (기본 능력치)
            units[unitIndex] = newUnit;

            selectedPlacedUnit = newUnit;
            newUnit.isSelected = true;
            applyAuraEffects(); // Recalculate auras after awakening
            updateSelectedUnitInfo(newUnit);
            showNotification(`${oldUnit.stats.name}이(가) ${newUnit.stats.name}(으)로 각성했습니다!`);
            playSound('upgrade'); // Placeholder sound
        }
        updateUI();
    }

    function applyAuraEffects() {
        // 1. Reset all tower ranges to their original values
        units.forEach(unit => {
            unit.stats.range = unit.originalStats.range;
        });

        // 2. Find all magnifying glass towers
        const magnifyingTowers = units.filter(u => u.towerId === 'magnifying_glass');

        // 3. Apply buffs from each magnifying tower
        magnifyingTowers.forEach(magnifier => {
            units.forEach(unit => {
                if (unit === magnifier) return; // Don't buff self

                const isAdjacentX = Math.abs(magnifier.x - unit.x) < tileSize * 1.5 && magnifier.y === unit.y;
                const isAdjacentY = Math.abs(magnifier.y - unit.y) < tileSize * 1.5 && magnifier.x === unit.x;

                if (isAdjacentX || isAdjacentY) {
                    unit.stats.range += 40;
                }
            });
        });
    }

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gridX = Math.floor(x / tileSize) * tileSize + tileSize / 2;
        const gridY = Math.floor(y / tileSize) * tileSize + tileSize / 2;

        if (isMovingUnit && selectedPlacedUnit) {
            if (!isPointOnPath(gridX, gridY) && !units.some(u => u.x === gridX && u.y === gridY)) {
                selectedPlacedUnit.x = gridX;
                selectedPlacedUnit.y = gridY;
                isMovingUnit = false;
                selectedPlacedUnit.isMoving = false;
                applyAuraEffects(); // Recalculate auras after moving
                showNotification("유닛 이동 완료.");
            } else {
                showNotification("그곳에는 배치할 수 없습니다.");
            }
            return;
        }

        if (placingUnit) {
            if (!isPointOnPath(gridX, gridY) && !units.some(u => u.x === gridX && u.y === gridY)) {
                const towerId = placingUnit.dataset.towerId;
                const TowerClass = towerClasses[towerId];
                if (TowerClass) {
                    units.push(new TowerClass(gridX, gridY, towerId));
                    placingUnit.remove();
                    placingUnit = null;
                    applyAuraEffects(); // Recalculate auras after placing
                }
            } else {
                showNotification("그곳에는 배치할 수 없습니다.");
            }
        } else {
            let clickedOnUnit = units.find(unit => x >= unit.x - unit.width / 2 && x <= unit.x + unit.width / 2 && y >= unit.y - unit.height / 2 && y <= unit.y + unit.height / 2);
            if (clickedOnUnit) {
                if (selectedPlacedUnit) {
                    selectedPlacedUnit.isSelected = false;
                }
                selectedPlacedUnit = clickedOnUnit;
                selectedPlacedUnit.isSelected = true;
                updateSelectedUnitInfo(clickedOnUnit);
            } else {
                if (selectedPlacedUnit) {
                    selectedPlacedUnit.isSelected = false;
                    selectedPlacedUnit = null;
                }
                updateSelectedUnitInfo(null);
            }

            let clickedOnEnemy = enemies.find(enemy => Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)) < enemy.width / 2);
            if (clickedOnEnemy) {
                selectedEnemy = clickedOnEnemy;
                updateEnemyInfoPanel(clickedOnEnemy);
            } else {
                selectedEnemy = null;
                updateEnemyInfoPanel(null);
            }
        }
    }

    function loadMap(mapName) {
        currentPath = maps[mapName];
        document.querySelectorAll('.map-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.map === mapName);
        });
        enemies = [];
        units = [];
        projectiles = [];
        lavaRocks = [];
        wave = 0;
        health = 9999;
        currency = 9999999;
        isHardMode = false;
        waveBonusGiven = [];
        updateUI();
    }

    function handleSellUnit() {
        if (selectedPlacedUnit) {
            currency += 30;
            updateUI();
            const index = units.indexOf(selectedPlacedUnit);
            if (index > -1) {
                units.splice(index, 1);
            }
            selectedPlacedUnit = null;
            updateSelectedUnitInfo(null);
            applyAuraEffects(); // Recalculate auras after selling
            showNotification("유닛 판매 완료.");
        }
    }

    function handleMoveUnit() {
        if (selectedPlacedUnit && currency >= 100) {
            currency -= 100;
            updateUI();
            isMovingUnit = true;
            selectedPlacedUnit.isMoving = true;
            showNotification("이동할 위치를 클릭하세요.");
        } else if (selectedPlacedUnit && currency < 100) {
            showNotification("이동 비용(100)이 부족합니다.");
        }
    }

    function handleStickyTiles() {
        for (let i = stickyTiles.length - 1; i >= 0; i--) {
            const tile = stickyTiles[i];
            tile.update();
            tile.draw();
            if (tile.duration <= 0) {
                if (tile.stuckEnemy) {
                    tile.stuckEnemy.isStuck = false;
                }
                stickyTiles.splice(i, 1);
            }
        }
    }

    function handleUpgrade() {
        if (!selectedPlacedUnit) return;
        const rarity = selectedPlacedUnit.stats.rarity;
        const currentLevel = selectedPlacedUnit.level;

        if (currentLevel >= 10) {
            showNotification("최대 레벨입니다.");
            return;
        }

        const cost = upgradeCosts[rarity][currentLevel - 1];

        if (cost && currency >= cost) {
            currency -= cost;
            selectedPlacedUnit.level++;
            selectedPlacedUnit.statPoints += 2;

            // 돋보기 타워 특별 업그레이드 효과
            if (selectedPlacedUnit.towerId === 'magnifying_glass') {
                selectedPlacedUnit.stats.fireRate = Math.max(1, selectedPlacedUnit.stats.fireRate - 12); // 0.2초
            }

            updateUI();
            updateSelectedUnitInfo(selectedPlacedUnit);
            playSound('upgrade');
        } else if (!cost) {
            showNotification("최대 레벨입니다.");
        } else {
            showNotification("재화가 부족합니다.");
        }
    }

    function handleStatAllocation(e) {
        if (!selectedPlacedUnit || selectedPlacedUnit.statPoints <= 0) return;
        const stat = e.target.dataset.stat;
        if (stat) {
            selectedPlacedUnit.statPoints--;
            switch (stat) {
                case 'damage':
                    selectedPlacedUnit.stats.damage += selectedPlacedUnit.originalStats.damage * 0.1;
                    break;
                case 'range':
                    selectedPlacedUnit.stats.range += selectedPlacedUnit.originalStats.range * 0.05;
                    break;
                case 'fireRate':
                    selectedPlacedUnit.stats.fireRate = Math.max(1, selectedPlacedUnit.stats.fireRate * 0.95);
                    break;
            }
            updateSelectedUnitInfo(selectedPlacedUnit);
        }
    }

    function gameLoop() {
        if (isGameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frameCount++;

        drawGrid();
        drawMap();
        handleStickyTiles();
        handleEnemies();
        handleUnits();
        handleProjectiles();
        handleExplosions();
        handleLavaRocks();

        if (selectedEnemy) {
            updateEnemyInfoPanel(selectedEnemy);
        }

        currentBoss = enemies.find(e => e.isBoss) || null;
        updateBossUI();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Event Listeners ---
    gachaButton.addEventListener('click', performGacha);
    startWaveButton.addEventListener('click', startNextWave);
    canvas.addEventListener('click', handleCanvasClick);
    upgradeButton.addEventListener('click', handleUpgrade);
    awakenButton.addEventListener('click', handleAwaken);
    statButtons.addEventListener('click', handleStatAllocation);
    sellUnitButton.addEventListener('click', handleSellUnit);
    moveUnitButton.addEventListener('click', handleMoveUnit);
    document.querySelectorAll('.map-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            loadMap(e.target.dataset.map);
        });
    });

    // Start the game
    loadMap('map1');
    gameLoop();

});