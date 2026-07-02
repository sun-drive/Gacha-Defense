// 전역 안전 초기화 함수 정의 (글로벌 스코프에 초조기 바인딩하여 타이밍 이슈 차단)
window.resetGameData = function() {
    try {
        localStorage.removeItem('gacha_td_dc');
        localStorage.removeItem('gacha_td_towers');
        localStorage.removeItem('gacha_td_deck');
        localStorage.removeItem('gacha_td_inv_limit');
        alert('게임 데이터가 성공적으로 초기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
    } catch (e) {
        alert('데이터 초기화에 실패했습니다: ' + e.message);
    }
};

function initGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Lobby Map Preview Canvas
    const lobbyPreviewCanvas = document.getElementById('lobby-preview-canvas');
    const previewCtx = lobbyPreviewCanvas ? lobbyPreviewCanvas.getContext('2d') : null;

    // UI Elements - Screens
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const bottomPanel = document.getElementById('bottom-panel');

    // UI Elements - Main Menu
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const dcCurrencyEl = document.getElementById('dc-currency');
    const mapCards = document.querySelectorAll('.map-card');
    const startGameButton = document.getElementById('start-game-button');
    const gachaResultEl = document.getElementById('gacha-result');
    const deckSlotsContainer = document.getElementById('deck-slots-container');
    const menuInventoryGrid = document.getElementById('menu-inventory-grid');
    const manageInventoryGrid = document.getElementById('manage-inventory-grid');
    const manageDetailPanel = document.getElementById('manage-detail-panel');
    const manageDetailContent = document.getElementById('manage-detail-content');
    const manageTowerName = document.getElementById('manage-tower-name');
    const manageTowerPrefix = document.getElementById('manage-tower-prefix');
    const manageTowerRarity = document.getElementById('manage-tower-rarity');
    const manageTowerLevel = document.getElementById('manage-tower-level');
    const manageTowerDamage = document.getElementById('manage-tower-damage');
    const manageTowerRange = document.getElementById('manage-tower-range');
    const manageTowerFireRate = document.getElementById('manage-tower-firerate');
    const manageTowerDesc = document.getElementById('manage-tower-desc');
    const menuUpgradeButton = document.getElementById('menu-upgrade-button');
    const menuAwakenButton = document.getElementById('menu-awaken-button');
    
    // 메인메뉴 타워 판매 버튼
    const menuSellButton = document.getElementById('menu-sell-button');
    
    // 대기 한도 업그레이드 UI 엘리먼트
    const lobbyLimitDisplayEl = document.getElementById('lobby-limit-display');
    const upgradeLimitButton = document.getElementById('upgrade-limit-button');

    // UI Elements - In Game
    const gachaButton = document.getElementById('gacha-button');
    const startWaveButton = document.getElementById('start-wave-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');
    const currencyEl = document.getElementById('currency');
    const waveEl = document.getElementById('wave');
    const healthEl = document.getElementById('health');
    const placedTowersCountEl = document.getElementById('placed-towers-count');
    const slotLimitDisplayEl = document.getElementById('slot-limit-display');
    const waitTowersCountEl = document.getElementById('wait-towers-count');
    const waitLimitDisplayEl = document.getElementById('wait-limit-display');
    const buySlotContainer = document.getElementById('buy-slot-container');
    const buySlotButton = document.getElementById('buy-slot-button');
    const unitInventoryEl = document.getElementById('unit-inventory');
    
    // UI Elements - Selected Tower
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
    const sellUnitButton = document.getElementById('sell-unit-button');
    const moveUnitButton = document.getElementById('move-unit-button');
    const enemyInfoPanel = document.getElementById('enemy-info-panel');
    const enemyTypeNameEl = document.getElementById('enemy-type-name');
    const enemyHealthEl = document.getElementById('enemy-health');
    const enemySpeedEl = document.getElementById('enemy-speed');
    const enemyDescriptionEl = document.getElementById('enemy-description');
    const notificationArea = document.getElementById('notification-area');
    const bossInfoContainer = document.getElementById('boss-info-container');
    const bossNameEl = document.getElementById('boss-name');
    const bossHealthBar = document.getElementById('boss-health-bar');

    // ==================== SYSTEM STATE ====================
    let dc = 1000;
    let userTowers = []; 
    let userDeck = [];   
    let selectedMap = 'grassland';
    let gameState = 'MENU'; 

    let maxInventoryLimit = 4; 

    // In-Game State
    let currency = 200;
    let health = 20;
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

    // 단축키 제어 상태 변수
    let showTileTypes = false;   
    let showEnemyPath = false;   
    let showGrid = true;         

    // Slot limits
    let slotPurchasedCount = 0; 

    // Constants
    const tileSize = 40;
    const mapWidth = canvas.width;  
    const mapHeight = canvas.height; 
    const cols = 20;
    const rows = 13;

    // ==================== DATA DEFINITIONS ====================

    // Prefix definitions
    const positivePrefixes = [
        { name: '신속한', dmg: 1.0, range: 1.0, rate: 0.8 },
        { name: '강력한', dmg: 1.25, range: 1.0, rate: 1.0 },
        { name: '날카로운', dmg: 1.15, range: 1.0, rate: 0.9 },
        { name: '전설적인', dmg: 1.3, range: 1.2, rate: 0.9 },
        { name: '저격의', dmg: 1.0, range: 1.3, rate: 1.0 },
        { name: '야생의', dmg: 1.2, range: 1.0, rate: 1.0 },
        { name: '숙련된', dmg: 1.1, range: 1.1, rate: 0.95 },
        { name: '치명적인', dmg: 1.35, range: 1.0, rate: 1.0 },
        { name: '광활한', dmg: 1.0, range: 1.25, rate: 1.0 },
        { name: '질풍의', dmg: 1.0, range: 1.0, rate: 0.75 }
    ];

    const negativePrefixes = [
        { name: '녹슨', dmg: 0.8, range: 1.0, rate: 1.0 },
        { name: '둔한', dmg: 1.0, range: 1.0, rate: 1.2 },
        { name: '눈먼', dmg: 1.0, range: 0.75, rate: 1.0 },
        { name: '조잡한', dmg: 0.85, range: 1.0, rate: 1.1 },
        { name: '망가진', dmg: 0.7, range: 1.0, rate: 1.0 },
        { name: '무거운', dmg: 1.0, range: 1.0, rate: 1.25 },
        { name: '낡은', dmg: 1.0, range: 0.85, rate: 1.0 },
        { name: '저주받은', dmg: 0.8, range: 0.8, rate: 1.15 }
    ];

    const normalPrefix = { name: '일반', dmg: 1.0, range: 1.0, rate: 1.0 };

    // Tower base templates
    const towerData = {
        'basic': { name: '총 타워', rarity: 'common', color: '#7f8c8d', damage: 25, range: 110, fireRate: 40, description: '단일 적에게 발사체를 발사하는 기본적인 타워입니다. 메인메뉴 각성 해금 시 인게임 5레벨에서 개틀링으로 각성할 수 있습니다.' },
        'tesla': { name: '테슬라 타워', rarity: 'common', color: '#16a085', damage: 20, range: 80, fireRate: 90, canDetectGhost: true, description: '범위 내 모든 적에게 전기 피해를 입힙니다. 메인메뉴 각성 해금 시 인게임 5레벨에서 번개 생성기로 각성할 수 있습니다. 유령을 탐지할 수 있습니다.' },
        'bomb': { name: '폭탄 타워', rarity: 'common', color: '#2c3e50', damage: 18, range: 120, fireRate: 60, blastRadius: 55, canDetectGhost: true, description: '착탄 시 폭발하여 범위 피해를 입히는 폭탄을 발사합니다. 유령을 탐지할 수 있습니다.' },
        'flame': { name: '화염 타워', rarity: 'rare', color: '#d35400', damage: 10, range: 100, fireRate: 30, description: '적에게 화염 발사체를 발사하여 3초간 20의 지속 피해를 입힙니다. 메인메뉴 각성 해금 시 인게임 5레벨에서 용암 타워로 각성할 수 있습니다.' },
        'glue': { name: '접착 타워', rarity: 'rare', color: '#27ae60', damage: 0, range: 80, fireRate: 60, description: '적의 경로에 끈끈한 타일을 생성하여 2초 동안 적을 멈추게 합니다.' },
        'ice': { name: '냉각 타워', rarity: 'rare', color: '#2980b9', range: 60, slowFactor: 0.5, slowDuration: 120, damage: 0, fireRate: 90, description: '범위 내 적들을 얼려 이동 속도를 감소시킵니다. 메인메뉴 각성 해금 시 인게임 5레벨에서 급속냉동기로 각성할 수 있습니다.' },
        'laser': { name: '레이저 발사기', rarity: 'epic', color: '#8e44ad', damage: 4, range: 150, fireRate: 20, canDetectGhost: true, description: '빠른 속도로 레이저를 발사하여 지속적인 피해를 입힙니다. 유령을 탐지할 수 있습니다.' },
        'sword': { name: '검기 타워', rarity: 'epic', color: '#c0392b', damage: 35, range: 50, fireRate: 40, description: '근접 범위 내 모든 적에게 피해를 입히고, 일정 킬 수 달성 시 관통하는 검기를 발사합니다.' },
        'magnifying_glass': { name: '돋보기 타워', rarity: 'epic', color: '#d35400', damage: 10, range: 110, fireRate: 180, description: '반경 안의 유령 적의 투명 속성을 영구적으로 제거합니다. 추가로 유령 적만 공격하며, 이 타워의 상하좌우 1칸에 위치한 타워의 사거리를 40 증가시킵니다.' },

        // 각성 타워
        'lava_tower': { name: '용암 타워', rarity: 'legendary', color: '#e67e22', damage: 15, range: 0, fireRate: 300, description: '적 기지 반대편(경로 끝)에서 5초마다 역주행하는 용암 유닛을 출격시켜 경로의 적에게 15의 피해와 3.5초간 15의 지속 피해를 줍니다.' },
        'gatling': { name: '개틀링', rarity: 'legendary', color: '#f1c40f', damage: 15, range: 120, fireRate: 10, description: '매우 빠른 속도로 발사체를 난사하여 다수의 적에게 지속적인 피해를 입힙니다. 기본 공격이 1회 관통합니다.' },
        'freezer': { name: '급속냉동기', rarity: 'legendary', color: '#3498db', damage: 0, range: 100, fireRate: 90, description: '범위 내 최대 3명의 적을 3초동안 완전히 얼려 움직임을 멈추게 합니다.' },
        'lightning': { name: '번개 생성기', rarity: 'legendary', color: '#9b59b6', damage: 70, range: 130, fireRate: 70, description: '랜덤 적에게 자성을 부여하고, 1.5초 후 번개를 내리쳐 강력한 피해와 2초간 정지 효과를 입힙니다.' }
    };

    const gachaRates = [
        { type: 'common', rate: 0.44 },
        { type: 'rare', rate: 0.29 },
        { type: 'epic', rate: 0.19 },
        { type: 'legendary', rate: 0.08 }
    ];

    const awakeningMap = {
        'basic': 'gatling',
        'tesla': 'lightning',
        'flame': 'lava_tower',
        'ice': 'freezer'
    };

    // 맵 경로 정의
    const maps = {
        grassland: [ 
            { x: 0, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth / 3, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth / 3, y: mapHeight - tileSize * 3 + tileSize / 2 },
            { x: (mapWidth * 2) / 3, y: mapHeight - tileSize * 3 + tileSize / 2 },
            { x: (mapWidth * 2) / 3, y: tileSize * 4 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 4 + tileSize / 2 }
        ],
        mountain: [ 
            { x: tileSize * 2 + tileSize / 2, y: 0 },
            { x: tileSize * 2 + tileSize / 2, y: tileSize * 4 + tileSize / 2 },
            { x: mapWidth - tileSize * 3 + tileSize / 2, y: tileSize * 4 + tileSize / 2 },
            { x: mapWidth - tileSize * 3 + tileSize / 2, y: tileSize * 8 + tileSize / 2 },
            { x: tileSize * 3 + tileSize / 2, y: tileSize * 8 + tileSize / 2 },
            { x: tileSize * 3 + tileSize / 2, y: mapHeight },
        ],
        ice: [ 
            { x: 0, y: tileSize * 2 + tileSize / 2 },
            { x: mapWidth - tileSize * 2 + tileSize / 2, y: tileSize * 2 + tileSize / 2 },
            { x: mapWidth - tileSize * 2 + tileSize / 2, y: tileSize * 6 + tileSize / 2 },
            { x: tileSize * 2 + tileSize / 2, y: tileSize * 6 + tileSize / 2 },
            { x: tileSize * 2 + tileSize / 2, y: tileSize * 10 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 10 + tileSize / 2 }
        ],
        desert: [ 
            { x: 0, y: tileSize * 2 + tileSize / 2 },
            { x: mapWidth - tileSize * 3 + tileSize / 2, y: tileSize * 2 + tileSize / 2 },
            { x: tileSize * 3 + tileSize / 2, y: mapHeight - tileSize * 3 + tileSize / 2 },
            { x: mapWidth, y: mapHeight - tileSize * 3 + tileSize / 2 }
        ],
        heaven: [ 
            { x: 0, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth - tileSize * 4 + tileSize / 2, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth - tileSize * 4 + tileSize / 2, y: mapHeight - tileSize * 4 + tileSize / 2 },
            { x: tileSize * 4 + tileSize / 2, y: mapHeight - tileSize * 4 + tileSize / 2 },
            { x: tileSize * 4 + tileSize / 2, y: tileSize * 7 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 7 + tileSize / 2 }
        ],
        classic: [ 
            { x: 0, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth / 2, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth / 2, y: mapHeight - tileSize * 3 + tileSize / 2 },
            { x: mapWidth, y: mapHeight - tileSize * 3 + tileSize / 2 }
        ]
    };

    // 타일맵 데이터 저장소
    let currentTileMap = []; 

    // 몬스터 종류 정의
    const baseEnemyTypes = {
        'basic': { name: '기본', health: 100, speed: 1.0, color: '#e74c3c', reward: 4, rewardDC: 2 },
        'tank': { name: '탱크', health: 300, speed: 0.6, color: '#c0392b', reward: 8, rewardDC: 4 },
        'speedy': { name: '스피디', health: 50, speed: 2.2, color: '#f1c40f', reward: 5, rewardDC: 3 },
        'stunner': { name: '기절', health: 80, speed: 0.9, color: '#2980b9', reward: 9, rewardDC: 5, stunRadius: 120, stunDuration: 120 },
        'transparent': { name: '투명', health: 90, speed: 1.0, color: 'rgba(180, 180, 180, 0.6)', reward: 10, rewardDC: 6, isTransparent: true },
        'jumper': { name: '점퍼', health: 70, speed: 1.2, color: '#9b59b6', reward: 12, rewardDC: 7, isJumper: true, jumpCooldownTime: 15, jumpDistance: 80 },
        'regenerator': { name: '재생', health: 150, speed: 0.8, color: '#27ae60', reward: 8, rewardDC: 4, regenRate: 1 },
        'splitter': { name: '분열', health: 120, speed: 1.0, color: '#a0522d', reward: 6, rewardDC: 3, splitsInto: 'basic', splitCount: 2 },
        'healer': { name: '힐러', health: 100, speed: 1.0, color: '#3498db', reward: 6, rewardDC: 3, isHealer: true, healRange: 60, healAmount: 8, healCooldown: 90 },
        'aggro': { name: '어그로', health: 200, speed: 0.5, color: '#800000', reward: 10, rewardDC: 5, isAggro: true },
        
        // 맵별 전용 몬스터들
        'ice_spirit': { name: '얼음 정령', health: 120, speed: 1.2, color: '#3498db', reward: 7, rewardDC: 4, isIceSpirit: true },
        'rock_golem': { name: '돌 갑옷 골렘', health: 260, speed: 0.4, color: '#34495e', reward: 12, rewardDC: 6, isHeavyTank: true, damageReduction: 20 },
        'regen_spider': { name: '재생 거미', health: 130, speed: 1.6, color: '#2ecc71', reward: 8, rewardDC: 5, regenRate: 3 },
        'desert_scorpion': { name: '모래전갈', health: 110, speed: 1.4, color: '#f39c12', reward: 8, rewardDC: 5, isScorpion: true },
        'heavenly_wisp': { name: '유령 날개', health: 80, speed: 2.0, color: '#ecf0f1', reward: 10, rewardDC: 6, isTransparent: true },
        
        // 맵별 보스들 (체력 40% 하향 보정)
        'boss_hunter': { name: '헌터', health: 800, speed: 0.7, color: '#2c3e50', reward: 80, rewardDC: 40, isBoss: true, isImmuneToFreeze: true },
        'boss_shielder': { name: '쉴더', health: 700, speed: 0.7, color: '#8e44ad', reward: 100, rewardDC: 50, isBoss: true, isImmuneToFreeze: true },
        'boss_theking': { name: '더 킹', health: 1200, speed: 0.4, color: '#c0392b', reward: 150, rewardDC: 75, isBoss: true, isImmuneToFreeze: true },
 
        'boss_ice_king': { name: '빙하의 제왕', health: 1300, speed: 0.5, color: '#2980b9', reward: 120, rewardDC: 60, isBoss: true, isIceKing: true, isImmuneToFreeze: true },
        'boss_mountain_titan': { name: '산사태 골렘', health: 1500, speed: 0.4, color: '#7f8c8d', reward: 120, rewardDC: 60, isBoss: true, isMountainTitan: true, isImmuneToFreeze: true },
        'boss_meadow_keeper': { name: '초원의 파수꾼', health: 1200, speed: 0.6, color: '#27ae60', reward: 120, rewardDC: 60, isBoss: true, isMeadowKeeper: true, isImmuneToFreeze: true },
        'boss_sandstorm_lord': { name: '모래 폭풍 군주', health: 1200, speed: 0.6, color: '#f39c12', reward: 120, rewardDC: 60, isBoss: true, isSandstormLord: true, isImmuneToFreeze: true },
        'boss_fallen_angel': { name: '타락 천사', health: 1100, speed: 0.7, color: '#9b59b6', reward: 120, rewardDC: 60, isBoss: true, isFallenAngel: true, isImmuneToFreeze: true }
    };

    // ==================== SYSTEM FUNCTIONS (LOBBY & SAVE) ====================

    function loadSystemData() {
        try {
            if (localStorage.getItem('gacha_td_dc') !== null) {
                dc = parseInt(localStorage.getItem('gacha_td_dc'));
                if (isNaN(dc)) dc = 1000;
            } else {
                dc = 1000;
            }

            if (localStorage.getItem('gacha_td_towers') !== null) {
                userTowers = JSON.parse(localStorage.getItem('gacha_td_towers'));
                // 데이터 정합성 보장 마이그레이션
                if (Array.isArray(userTowers)) {
                    userTowers = userTowers.map(t => {
                        if (!t.prefix) {
                            t.prefix = { name: '일반', dmg: 1.0, range: 1.0, rate: 1.0 };
                        }
                        if (t.level === undefined) {
                            t.level = 1;
                        }
                        if (t.isAwakened === undefined) {
                            t.isAwakened = false;
                        }
                        return t;
                    });
                } else {
                    throw new Error("Invalid towers format");
                }
            } else {
                userTowers = [
                    { id: 't_init_1', towerId: 'basic', level: 1, isAwakened: false, prefix: normalPrefix },
                    { id: 't_init_2', towerId: 'tesla', level: 1, isAwakened: false, prefix: normalPrefix },
                    { id: 't_init_3', towerId: 'bomb', level: 1, isAwakened: false, prefix: normalPrefix }
                ];
                saveSystemData();
            }

            if (localStorage.getItem('gacha_td_deck') !== null) {
                userDeck = JSON.parse(localStorage.getItem('gacha_td_deck'));
                // 덱 내에 유효하지 않은 타워 ID가 있으면 필터링
                if (Array.isArray(userDeck)) {
                    userDeck = userDeck.filter(deckId => userTowers.some(t => t.id === deckId));
                } else {
                    userDeck = ['t_init_1', 't_init_2', 't_init_3'];
                }
            } else {
                userDeck = [];
                // 초기 덱 구성 보장
                if (userTowers.length > 0) {
                    userDeck = userTowers.slice(0, 5).map(t => t.id);
                }
                saveSystemData();
            }

            if (localStorage.getItem('gacha_td_inv_limit') !== null) {
                maxInventoryLimit = parseInt(localStorage.getItem('gacha_td_inv_limit'));
                if (isNaN(maxInventoryLimit)) maxInventoryLimit = 4;
            } else {
                maxInventoryLimit = 4;
            }
        } catch (e) {
            console.warn("LocalStorage access is blocked or data is corrupted. Using in-memory state instead.", e);
            dc = 1000;
            userTowers = [
                { id: 't_init_1', towerId: 'basic', level: 1, isAwakened: false, prefix: normalPrefix },
                { id: 't_init_2', towerId: 'tesla', level: 1, isAwakened: false, prefix: normalPrefix },
                { id: 't_init_3', towerId: 'bomb', level: 1, isAwakened: false, prefix: normalPrefix }
            ];
            userDeck = ['t_init_1', 't_init_2', 't_init_3'];
            maxInventoryLimit = 4;
        }

        updateLobbyUI();
    }

    function saveSystemData() {
        try {
            localStorage.setItem('gacha_td_dc', dc);
            localStorage.setItem('gacha_td_towers', JSON.stringify(userTowers));
            localStorage.setItem('gacha_td_deck', JSON.stringify(userDeck));
            localStorage.setItem('gacha_td_inv_limit', maxInventoryLimit);
        } catch (e) {
            console.warn("LocalStorage save blocked in this environment.", e);
        }
    }

    function updateLobbyUI() {
        dcCurrencyEl.textContent = dc;
        
        lobbyLimitDisplayEl.textContent = maxInventoryLimit;
        
        if (maxInventoryLimit >= 8) {
            upgradeLimitButton.textContent = '최대 한도 도달 (8개)';
            upgradeLimitButton.disabled = true;
        } else {
            const cost = 300 + (maxInventoryLimit - 4) * 300;
            upgradeLimitButton.textContent = `확장하기 (비용: ${cost} DC)`;
            upgradeLimitButton.disabled = (dc < cost);
        }

        // 덱 슬롯 렌더링
        deckSlotsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.classList.add('deck-slot');
            
            if (i < userDeck.length) {
                const towerId = userDeck[i];
                const tower = userTowers.find(t => t.id === towerId);
                if (tower) {
                    slot.classList.add('filled');
                    const item = createTowerDOMElement(tower);
                    slot.appendChild(item);
                    
                    slot.addEventListener('click', () => {
                        userDeck.splice(i, 1);
                        saveSystemData();
                        updateLobbyUI();
                    });
                }
            } else {
                slot.textContent = '+';
            }
            deckSlotsContainer.appendChild(slot);
        }

        // 인벤토리 렌더링 (덱 편집용)
        menuInventoryGrid.innerHTML = '';
        userTowers.forEach(tower => {
            const el = createTowerDOMElement(tower);
            const inDeck = userDeck.includes(tower.id);
            if (inDeck) {
                el.classList.add('selected');
            }
            
            el.addEventListener('click', () => {
                const deckIndex = userDeck.indexOf(tower.id);
                if (deckIndex > -1) {
                    userDeck.splice(deckIndex, 1);
                } else {
                    if (userDeck.length >= 5) {
                        alert('덱은 최대 5개까지 설정할 수 있습니다.');
                        return;
                    }
                    userDeck.push(tower.id);
                }
                saveSystemData();
                updateLobbyUI();
            });
            menuInventoryGrid.appendChild(el);
        });

        renderManageInventory();
        drawLobbyMapPreview();
    }

    function drawLobbyMapPreview() {
        if (!previewCtx || !lobbyPreviewCanvas) return;
        previewCtx.clearRect(0, 0, lobbyPreviewCanvas.width, lobbyPreviewCanvas.height);

        const pRows = 13;
        const pCols = 20;
        const pTileSize = 10;

        // 선택된 맵의 타일맵을 먼저 빌드
        generateTileMap(selectedMap);

        for (let r = 0; r < pRows; r++) {
            for (let c = 0; c < pCols; c++) {
                const tType = currentTileMap[r][c];
                const colors = getTileColors(selectedMap, tType);

                previewCtx.fillStyle = colors.fill;
                previewCtx.fillRect(c * pTileSize, r * pTileSize, pTileSize, pTileSize);
                
                previewCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                previewCtx.lineWidth = 0.5;
                previewCtx.strokeRect(c * pTileSize, r * pTileSize, pTileSize, pTileSize);
            }
        }

        // 경로선 그리기
        const pathNodes = maps[selectedMap];
        if (pathNodes && pathNodes.length > 0) {
            previewCtx.save();
            previewCtx.strokeStyle = '#ef4444';
            previewCtx.lineWidth = 2.5;
            previewCtx.lineCap = 'round';
            previewCtx.lineJoin = 'round';
            previewCtx.beginPath();
            previewCtx.moveTo(pathNodes[0].x * (200 / 800), pathNodes[0].y * (130 / 520));
            for (let i = 1; i < pathNodes.length; i++) {
                previewCtx.lineTo(pathNodes[i].x * (200 / 800), pathNodes[i].y * (130 / 520));
            }
            previewCtx.stroke();
            previewCtx.restore();
        }
    }

    upgradeLimitButton.addEventListener('click', () => {
        if (maxInventoryLimit >= 8) return;
        const cost = 300 + (maxInventoryLimit - 4) * 300;
        if (dc < cost) return;

        dc -= cost;
        maxInventoryLimit++;
        saveSystemData();
        updateLobbyUI();
        alert(`인게임 대기 타워 보유 한도가 ${maxInventoryLimit}개로 영구 확장되었습니다!`);
    });

    function createTowerDOMElement(tower) {
        const template = towerData[tower.towerId];
        const el = document.createElement('div');
        el.classList.add('tower-item', template.rarity);
        el.style.borderColor = template.color;
        
        el.innerHTML = `
            <span style="font-size: 0.65rem; color: var(--text-muted);">[${tower.prefix.name}]</span>
            <div style="font-size: 0.85rem; font-weight: bold; margin: 4px 0; text-align: center; color: #fff;">${template.name}</div>
            <span style="font-size: 0.75rem; color: var(--accent-gold); font-weight: bold;">Lv.${tower.level}</span>
        `;
        return el;
    }

    // ==================== TILEMAP & GRID SYSTEM ====================

    function generateTileMap(mapName) {
        currentTileMap = [];
        for (let r = 0; r < rows; r++) {
            currentTileMap[r] = [];
            for (let c = 0; c < cols; c++) {
                currentTileMap[r][c] = 0; 
            }
        }

        const pathNodes = maps[mapName] || maps.grassland;
        markPathOnTileMap(pathNodes);

        // 맵 테마별 특수 타일 종류 및 타일 목표 개수 설정
        let specialType = 1; // 기본 웅덩이
        let highlandCount = 30;
        let specialCount = 20;

        if (mapName === 'grassland') {
            specialType = 1; highlandCount = 35; specialCount = 20;
        } else if (mapName === 'mountain') {
            specialType = 4; highlandCount = 40; specialCount = 25;
        } else if (mapName === 'ice') {
            specialType = 1; highlandCount = 32; specialCount = 22;
        } else if (mapName === 'desert') {
            specialType = 1; highlandCount = 30; specialCount = 22;
        } else if (mapName === 'heaven') {
            specialType = 4; highlandCount = 35; specialCount = 30;
        } else { // classic 등
            specialType = 1; highlandCount = 25; specialCount = 15;
        }

        // 지형 군집 무작위 생성 (Clustering Algorithm)
        // 1. 고지 타일 생성 (타일 값: 2)
        createOrganicClusters(2, highlandCount, 6);
        // 2. 특수 장애물 타일 생성 (타일 값: specialType)
        createOrganicClusters(specialType, specialCount, 5);

        // 내부 헬퍼 함수: 유기적 군집 생성 알고리즘
        function createOrganicClusters(tileType, targetTotalCount, maxClusterSize) {
            let placedCount = 0;
            let attempts = 0;

            while (placedCount < targetTotalCount && attempts < 250) {
                attempts++;
                // 1. 시드(Seed) 위치 무작위 설정
                const startR = Math.floor(Math.random() * rows);
                const startC = Math.floor(Math.random() * cols);

                if (currentTileMap[startR][startC] !== 0) continue;

                // 2. 시드부터 시작해서 인접한 셀로 전파 (BFS 형태)
                let queue = [{r: startR, c: startC}];
                let visited = new Set();
                visited.add(`${startR},${startC}`);
                let currentClusterSize = 0;

                while (queue.length > 0 && placedCount < targetTotalCount && currentClusterSize < maxClusterSize) {
                    // 무작위성을 부여하기 위해 큐에서 임의의 위치를 꺼냄 (Randomized BFS)
                    const randIdx = Math.floor(Math.random() * queue.length);
                    const curr = queue.splice(randIdx, 1)[0];

                    if (currentTileMap[curr.r][curr.c] === 0) {
                        currentTileMap[curr.r][curr.c] = tileType;
                        placedCount++;
                        currentClusterSize++;
                    }

                    // 4방향 이웃 탐색
                    const directions = [
                        {dr: -1, dc: 0}, {dr: 1, dc: 0},
                        {dr: 0, dc: -1}, {dr: 0, dc: 1}
                    ];

                    for (const dir of directions) {
                        const nr = curr.r + dir.dr;
                        const nc = curr.c + dir.dc;

                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                            if (currentTileMap[nr][nc] === 0 && !visited.has(`${nr},${nc}`)) {
                                visited.add(`${nr},${nc}`);
                                // 65% 확률로 큐에 추가하여 자연스러운 불규칙 형상을 만듦
                                if (Math.random() < 0.65) {
                                    queue.push({r: nr, c: nc});
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    function markPathOnTileMap(pathNodes) {
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const p1 = pathNodes[i];
            const p2 = pathNodes[i + 1];

            const startCol = Math.floor(Math.min(p1.x, p2.x) / tileSize);
            const endCol = Math.floor(Math.max(p1.x, p2.x) / tileSize);
            const startRow = Math.floor(Math.min(p1.y, p2.y) / tileSize);
            const endRow = Math.floor(Math.max(p1.y, p2.y) / tileSize);

            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        currentTileMap[r][c] = 3; 
                    }
                }
            }
        }
    }

    function placeTilePatch(startRow, startCol, height, width, type) {
        for (let r = startRow; r < startRow + height; r++) {
            for (let c = startCol; c < startCol + width; c++) {
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    if (currentTileMap[r][c] !== 3) { 
                        currentTileMap[r][c] = type;
                    }
                }
            }
        }
    }

    // ==================== KEYBOARD EVENTS (Q, W, E KEY) ====================
    window.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            showTileTypes = true;
        }
        if (e.key === 'w' || e.key === 'W') {
            showEnemyPath = true; 
        }
        if (e.key === 'e' || e.key === 'E') {
            showGrid = !showGrid; 
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            showTileTypes = false;
        }
        if (e.key === 'w' || e.key === 'W') {
            showEnemyPath = false;
        }
    });

    // ==================== TOWER GACHA & MANAGEMENT (MENU) ====================

    function performGachaByType(type) {
        let cost = 100;
        if (type === 'premium') cost = 250;
        else if (type === 'fire' || type === 'ice') cost = 150;

        if (dc < cost) {
            alert('DC가 부족합니다.');
            return;
        }

        dc -= cost;

        let drawnRarity = 'common';
        const rand = Math.random();

        if (type === 'premium') {
            if (rand < 0.4) drawnRarity = 'rare';
            else if (rand < 0.8) drawnRarity = 'epic';
            else drawnRarity = 'legendary';
        } else {
            let cumulativeRate = 0;
            for (const rateInfo of gachaRates) {
                cumulativeRate += rateInfo.rate;
                if (rand < cumulativeRate) {
                    drawnRarity = rateInfo.type;
                    break;
                }
            }
        }

        let drawnTowerId = 'basic';
        const unAwakenedTowers = Object.keys(towerData).filter(key => 
            !['lava_tower', 'gatling', 'freezer', 'lightning'].includes(key)
        );

        if (type === 'fire' && Math.random() < 0.5) {
            drawnTowerId = Math.random() < 0.5 ? 'flame' : 'tesla';
        } else if (type === 'ice' && Math.random() < 0.5) {
            drawnTowerId = Math.random() < 0.5 ? 'ice' : 'glue';
        } else {
            const matchedTowers = unAwakenedTowers.filter(id => towerData[id].rarity === drawnRarity);
            if (matchedTowers.length > 0) {
                drawnTowerId = matchedTowers[Math.floor(Math.random() * matchedTowers.length)];
            } else {
                drawnTowerId = unAwakenedTowers[Math.floor(Math.random() * unAwakenedTowers.length)];
            }
        }

        const prefixRand = Math.random();
        let drawnPrefix = normalPrefix;
        if (prefixRand < 0.45) {
            drawnPrefix = positivePrefixes[Math.floor(Math.random() * positivePrefixes.length)];
        } else if (prefixRand < 0.8) {
            drawnPrefix = negativePrefixes[Math.floor(Math.random() * negativePrefixes.length)];
        }

        const newTower = {
            id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            towerId: drawnTowerId,
            level: 1,
            isAwakened: false,
            prefix: drawnPrefix
        };

        userTowers.push(newTower);
        saveSystemData();
        updateLobbyUI();

        const rarityLabels = { common: '일반', rare: '희귀', epic: '에픽', legendary: '전설' };
        const displayRarity = towerData[drawnTowerId].rarity;
        gachaResultEl.innerHTML = `소환 성공! <span style="color:${towerData[drawnTowerId].color}">[${newTower.prefix.name}] ${towerData[drawnTowerId].name}</span> (${rarityLabels[displayRarity]} 등급)`;
    }

    let selectedManageTower = null;

    function renderManageInventory() {
        manageInventoryGrid.innerHTML = '';
        userTowers.forEach(tower => {
            const el = createTowerDOMElement(tower);
            if (selectedManageTower && selectedManageTower.id === tower.id) {
                el.style.borderColor = '#fff';
            }
            el.addEventListener('click', () => {
                selectedManageTower = tower;
                showTowerManageDetails(tower);
                renderManageInventory();
            });
            manageInventoryGrid.appendChild(el);
        });
    }

    function showTowerManageDetails(tower) {
        manageDetailPanel.classList.add('hidden');
        manageDetailContent.classList.remove('hidden');

        const template = towerData[tower.towerId];
        manageTowerName.textContent = template.name;
        manageTowerName.style.color = template.color;
        
        let prefixEffectStr = "스탯 변화 없음";
        const p = tower.prefix;
        if (p.name !== '일반') {
            const effects = [];
            if (p.dmg !== 1.0) effects.push(`공격력 ${(p.dmg > 1 ? '+' : '') + Math.round((p.dmg - 1) * 100)}%`);
            if (p.range !== 1.0) effects.push(`사거리 ${(p.range > 1 ? '+' : '') + Math.round((p.range - 1) * 100)}%`);
            if (p.rate !== 1.0) effects.push(`연사딜레이 ${(p.rate > 1 ? '+' : '') + Math.round((p.rate - 1) * 100)}%`);
            prefixEffectStr = effects.join(', ');
        }
        manageTowerPrefix.innerHTML = `접두사: <strong>${p.name}</strong> (${prefixEffectStr})`;

        const rarityLabels = { common: '일반', rare: '희귀', epic: '에픽', legendary: '전설' };
        manageTowerRarity.textContent = rarityLabels[template.rarity];
        manageTowerRarity.style.color = template.color;
        manageTowerLevel.textContent = tower.level;

        const currentDmg = (template.damage * (1 + (tower.level - 1) * 0.1)) * p.dmg;
        const currentRange = (template.range * (1 + (tower.level - 1) * 0.05)) * p.range;
        const currentRate = (template.fireRate * Math.pow(0.95, tower.level - 1)) * p.rate;

        manageTowerDamage.textContent = currentDmg.toFixed(1);
        manageTowerRange.textContent = currentRange.toFixed(1);
        manageTowerFireRate.textContent = currentRate.toFixed(1);

        manageTowerDesc.textContent = template.description;

        if (tower.level >= 10) {
            menuUpgradeButton.textContent = '최대 레벨 (Lv.10)';
            menuUpgradeButton.disabled = true;
        } else {
            const cost = tower.level * 100;
            menuUpgradeButton.textContent = `DC 레벨업 (비용: ${cost} DC)`;
            menuUpgradeButton.disabled = dc < cost;
        }

        const canAwaken = awakeningMap[tower.towerId] !== undefined;
        if (!canAwaken) {
            menuAwakenButton.textContent = '각성 불가능한 타워';
            menuAwakenButton.disabled = true;
        } else if (tower.isAwakened) {
            menuAwakenButton.textContent = '각성 완료됨';
            menuAwakenButton.disabled = true;
        } else {
            menuAwakenButton.textContent = `각성 해금 (Lv.10 필요 | 비용: 1000 DC)`;
            menuAwakenButton.disabled = (tower.level < 10 || dc < 1000);
        }
    }

    menuUpgradeButton.addEventListener('click', () => {
        if (!selectedManageTower) return;
        const cost = selectedManageTower.level * 100;
        if (dc < cost) return;

        dc -= cost;
        selectedManageTower.level++;
        saveSystemData();
        updateLobbyUI();
        showTowerManageDetails(selectedManageTower);
    });

    menuAwakenButton.addEventListener('click', () => {
        if (!selectedManageTower) return;
        if (selectedManageTower.level < 10 || dc < 1000) return;

        dc -= 1000;
        selectedManageTower.isAwakened = true;
        saveSystemData();
        updateLobbyUI();
        showTowerManageDetails(selectedManageTower);
        alert(`${towerData[selectedManageTower.towerId].name}의 각성이 성공적으로 해금되었습니다! 이제 전투 중 각성이 가능합니다.`);
    });

    menuSellButton.addEventListener('click', () => {
        if (!selectedManageTower) return;

        const deckIdx = userDeck.indexOf(selectedManageTower.id);
        if (deckIdx > -1) {
            userDeck.splice(deckIdx, 1);
        }

        const towerIdx = userTowers.findIndex(t => t.id === selectedManageTower.id);
        if (towerIdx > -1) {
            userTowers.splice(towerIdx, 1);
        }

        dc += 25; 
        saveSystemData();
        updateLobbyUI();

        selectedManageTower = null;
        manageDetailPanel.classList.remove('hidden');
        manageDetailContent.classList.add('hidden');

        alert('타워가 정상적으로 판매되어 25 DC를 획득했습니다.');
    });

    // ==================== IN-GAME CLASSES & ENTITIES ====================

    class Enemy {
        constructor(type, pathNodes) {
            const startNode = pathNodes[0];
            this.x = startNode.x;
            this.y = startNode.y;
            this.width = tileSize * 0.7;
            this.height = tileSize * 0.7;
            this.type = type;
            this.pathNodes = pathNodes;

            const waveHpScale = 1 + (wave * 0.06);
            const hpMult = (isHardMode ? 1.5 : 1.0) * waveHpScale;
            this.health = type.health * hpMult;
            this.maxHealth = type.health * hpMult;
            this.speed = isHardMode ? type.speed * 1.2 : type.speed;
            this.reward = isHardMode ? Math.floor(type.reward * 1.3) : type.reward;
            this.rewardDC = type.rewardDC || 2;

            this.pathIndex = 0;
            this.burnTimer = 0;
            this.burnDamagePerFrame = 0;
            this.isStuck = false;
            this.slowed = false;
            this.slowTimer = 0;
            this.appliedSlowFactor = 1.0;
            
            this.isMagnetized = false;
            this.magnetismTimer = 0;
            this.jumpCooldown = 0;
            this.regenRate = type.regenRate || 0;
            this.isHealer = type.isHealer || false;
            this.currentHealCooldown = 0;
            this.isSuperSpeed = type.isSuperSpeed || false;
            
            this.isHeavyTank = type.isHeavyTank || false;
            this.damageReduction = type.damageReduction || 0;
            
            this.isBoss = type.isBoss || false;
            if (this.isBoss) {
                this.abilityCooldown = 120;
            }

            this.isScorpion = type.isScorpion || false;
            this.isTransparent = type.isTransparent || false;
        }

        move() {
            if (this.pathIndex >= this.pathNodes.length - 1) return;
            if (this.isStuck) return;

            if (this.type.isJumper) {
                if (this.jumpCooldown > 0) {
                    this.jumpCooldown--;
                } else {
                    let jumped = false;
                    for (const otherEnemy of enemies) {
                        if (this === otherEnemy) continue;
                        const distToOther = Math.sqrt(Math.pow(this.x - otherEnemy.x, 2) + Math.pow(this.y - otherEnemy.y, 2));
                        if (distToOther < tileSize) {
                            const newPos = getPointAheadOnPath(this, this.type.jumpDistance, this.pathNodes);
                            this.x = newPos.x;
                            this.y = newPos.y;
                            this.pathIndex = newPos.pathIndex;
                            this.jumpCooldown = this.type.jumpCooldownTime * 60; 
                            jumped = true;
                            break;
                        }
                    }
                    if (jumped) return;
                }
            }

            const target = this.pathNodes[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let currentSpeed = this.speed;

            if (this.slowed && this.slowTimer > 0) {
                currentSpeed *= this.appliedSlowFactor;
                this.slowTimer--;
            } else {
                this.slowed = false;
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
                    this.isStuck = true;
                    setTimeout(() => { this.isStuck = false; }, 2000);
                    explosions.push(new Explosion(this.x, this.y, 40));
                    showNotification(`${this.type.name}에게 번개 폭발!`);
                }
            }

            if (this.regenRate > 0 && this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + this.regenRate / 60);
            }

            if (this.isHealer) {
                if (this.currentHealCooldown > 0) {
                    this.currentHealCooldown--;
                } else {
                    enemies.forEach(other => {
                        if (other !== this) {
                            const d = Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
                            if (d <= this.type.healRange && other.health < other.maxHealth) {
                                other.health = Math.min(other.maxHealth, other.health + this.type.healAmount);
                            }
                        }
                    });
                    this.currentHealCooldown = this.type.healCooldown;
                }
            }
        }

        draw() {
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            if (this.isTransparent) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            if (this.isBoss) {
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(this.x - 12, this.y - 18);
                ctx.lineTo(this.x - 6, this.y - 12);
                ctx.lineTo(this.x, this.y - 22);
                ctx.lineTo(this.x + 6, this.y - 12);
                ctx.lineTo(this.x + 12, this.y - 18);
                ctx.lineTo(this.x + 8, this.y - 8);
                ctx.lineTo(this.x - 8, this.y - 8);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = '#dc2626';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, 4);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, Math.max(0, this.width * (this.health / this.maxHealth)), 4);
        }

        updateAbilities() {
            if (!this.isBoss) return;
            if (this.abilityCooldown > 0) {
                this.abilityCooldown--;
                return;
            }

            switch (this.type.name) {
                case '헌터':
                    units.forEach((u, i) => { if(i < 2) u.stunTimer = 180; }); 
                    showNotification('헌터가 타워 2개를 얼려 기절시켰습니다!');
                    this.abilityCooldown = 400;
                    break;
                case '쉴더':
                    enemies.forEach(e => {
                        if (e !== this && Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2)) < 120) {
                            e.health = Math.min(e.maxHealth, e.health + 100);
                        }
                    });
                    showNotification('쉴더가 주변 몬스터의 장막 체력을 보강했습니다!');
                    this.abilityCooldown = 300;
                    break;
                case '더 킹':
                    showNotification('더 킹이 정예 군대를 강림시켰습니다!');
                    for (let i = 0; i < 3; i++) {
                        const newE = new Enemy(baseEnemyTypes.tank, this.pathNodes);
                        newE.x = this.x - (i - 1) * 20;
                        newE.y = this.y - 15;
                        newE.pathIndex = Math.max(0, this.pathIndex - 1);
                        enemies.push(newE);
                    }
                    this.abilityCooldown = 450;
                    break;
                case '빙하의 제왕':
                    units.forEach(u => {
                        if (Math.sqrt(Math.pow(this.x - u.x, 2) + Math.pow(this.y - u.y, 2)) < 200) {
                            u.stunTimer = 180;
                        }
                    });
                    showNotification('빙하의 제왕이 한파를 뿜어 주변 타워를 얼립니다!');
                    this.abilityCooldown = 360;
                    break;
                case '산사태 골렘':
                    units.forEach(u => {
                        if (Math.random() < 0.4) {
                            u.stunTimer = 240; 
                        }
                    });
                    showNotification('산사태 골렘이 낙석을 떨궈 타워들을 타격합니다!');
                    this.abilityCooldown = 420;
                    break;
                case '초원의 파수꾼':
                    enemies.forEach(e => {
                        if (e.health > 0) {
                            e.health = Math.min(e.maxHealth, e.health + 80);
                        }
                    });
                    showNotification('초원의 파수꾼이 대지의 기운으로 광역 치유를 시전합니다!');
                    this.abilityCooldown = 480; // 5초에서 8초로 늘림
                    break;
                case '모래 폭풍 군주':
                    units.forEach(u => {
                        u.sandstormDebuffTimer = 300; 
                    });
                    showNotification('모래 폭풍 군주가 모래바람으로 타워 사거리를 줄입니다!');
                    this.abilityCooldown = 500;
                    break;
                case '타락 천사':
                    let count = 0;
                    units.forEach(u => {
                        if (count < 2 && Math.random() < 0.6) {
                            u.floatTimer = 240; 
                            count++;
                        }
                    });
                    showNotification('타락 천사가 심판의 고리로 타워를 격리시킵니다!');
                    this.abilityCooldown = 450;
                    break;
            }
        }
    }

    class BaseTower {
        constructor(x, y, towerId, metaTower) {
            this.x = x;
            this.y = y;
            this.towerId = towerId;
            this.meta = metaTower; 

            const template = towerData[towerId];
            this.width = tileSize;
            this.height = tileSize;
            
            this.stats = JSON.parse(JSON.stringify(template));
            this.originalStats = JSON.parse(JSON.stringify(this.stats));

            const lvl = metaTower ? metaTower.level : 1;
            const p = metaTower ? metaTower.prefix : normalPrefix;

            this.stats.damage = (template.damage * (1 + (lvl - 1) * 0.1)) * p.dmg;
            this.stats.range = (template.range * (1 + (lvl - 1) * 0.05)) * p.range;
            this.stats.fireRate = (template.fireRate * Math.pow(0.95, lvl - 1)) * p.rate;

            this.originalStats.range = this.stats.range;
            this.stats.canSeeTransparent = this.stats.range >= 140;

            const gridR = Math.floor(y / tileSize);
            const gridC = Math.floor(x / tileSize);
            if (currentTileMap[gridR] && currentTileMap[gridR][gridC] === 2) {
                this.stats.range *= 1.2;
            }

            this.target = null;
            this.fireCooldown = 0;
            this.isSelected = false;
            this.rangeAnimationRadius = 0;
            this.level = 1; 
            this.statPoints = 0;
            this.stunTimer = 0;
            this.floatTimer = 0; 
            this.sandstormDebuffTimer = 0; 
            this.isMoving = false;
        }

        findTarget() {
            const potentialTargets = [];
            const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;

            for (let enemy of enemies) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= activeRange) {
                    if (enemy.isTransparent) {
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

        attack() {}

        update() {
            if (this.sandstormDebuffTimer > 0) this.sandstormDebuffTimer--;
            if (this.floatTimer > 0) {
                this.floatTimer--;
                this.target = null;
                return; 
            }

            if (this.stunTimer > 0 || this.isMoving) {
                if (this.isMoving) {
                    this.target = null;
                }
                this.stunTimer--;
                return;
            }

            let currentCooldownRate = 1.0;
            if (selectedMap === 'ice') {
                currentCooldownRate = 1.4;
            }

            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else {
                if (this.target) {
                    const dx = this.x - this.target.x;
                    const dy = this.y - this.target.y;
                    const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (this.target.health <= 0 || distance > activeRange) {
                        this.target = null;
                    }
                }
                if (!this.target) {
                    this.findTarget();
                }
                if (this.target) {
                    this.attack();
                    this.fireCooldown = this.stats.fireRate * currentCooldownRate;
                }
            }
        }

        draw() {
            ctx.save();
            
            if (this.floatTimer > 0) {
                ctx.translate(0, -15);
            }

            ctx.fillStyle = this.stats.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            if (this.isSelected) {
                ctx.strokeStyle = '#2ecc71'; // 선택 상태일 때 밝은 연두색 강조 테두리
                ctx.lineWidth = 3.5;
            } else {
                ctx.lineWidth = 2;
                switch (this.stats.rarity) {
                    case 'common': ctx.strokeStyle = '#a1a1aa'; break;
                    case 'rare': ctx.strokeStyle = '#3b82f6'; break;
                    case 'epic': ctx.strokeStyle = '#8b5cf6'; break;
                    case 'legendary': ctx.strokeStyle = '#f59e0b'; break;
                    default: ctx.strokeStyle = '#000';
                }
            }
            ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
            if (this.isSelected && this.rangeAnimationRadius < activeRange) {
                this.rangeAnimationRadius += 10;
                if (this.rangeAnimationRadius > activeRange) {
                    this.rangeAnimationRadius = activeRange;
                }
            } else if (!this.isSelected && this.rangeAnimationRadius > 0) {
                this.rangeAnimationRadius -= 10;
                if (this.rangeAnimationRadius < 0) {
                    this.rangeAnimationRadius = 0;
                }
            }
            if (this.rangeAnimationRadius > 0) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
                ctx.lineWidth = 1.0;
                ctx.arc(this.x, this.y, this.rangeAnimationRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (this.stunTimer > 0) {
                ctx.fillStyle = '#3b82f6';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('빙결', this.x, this.y - this.height / 2 - 4);
            }

            if (this.floatTimer > 0) {
                ctx.fillStyle = '#8b5cf6';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('격리', this.x, this.y - this.height / 2 - 4);
            }

            if (this.sandstormDebuffTimer > 0) {
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('실명', this.x, this.y + this.height / 2 + 10);
            }

            ctx.fillStyle = '#fff';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.meta.prefix.name.substring(0, 2), this.x, this.y + 3);

            ctx.restore();
        }
    }

    class BasicTower extends BaseTower {
        attack() {
            projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this));
            playSound('laser');
        }
    }

    class TeslaTower extends BaseTower {
        attack() {
            playSound('laser');
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
                if (distance <= activeRange) {
                    dealDamageToEnemy(enemy, this.stats.damage);
                }
            });
        }
    }

    class BombTower extends BaseTower {
        attack() {
            projectiles.push(new BombProjectile(this.x, this.y, this.target.x, this.target.y, this.stats, this));
            playSound('laser');
        }
    }

    class FlameTower extends BaseTower {
        attack() {
            projectiles.push(new FlameProjectile(this.x, this.y, this.target, this.stats.damage, 20, 180, this));
            playSound('laser');
        }
    }

    class GlueTower extends BaseTower {
        attack() {
            playSound('laser');
            const targetTileX = Math.floor(this.target.x / tileSize) * tileSize + tileSize / 2;
            const targetTileY = Math.floor(this.target.y / tileSize) * tileSize + tileSize / 2;
            let existingStickyTile = stickyTiles.find(tile => tile.x === targetTileX && tile.y === targetTileY);
            if (existingStickyTile) {
                existingStickyTile.duration = 120;
            } else {
                stickyTiles.push(new StickyTile(targetTileX, targetTileY, 120));
            }
        }
    }

    class IceTower extends BaseTower {
        attack() {
            playSound('laser');
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
                if (distance <= activeRange) {
                    if (!enemy.type.isIceSpirit && !enemy.type.isImmuneToFreeze) {
                        enemy.slowed = true;
                        enemy.slowTimer = this.stats.slowDuration || 120;
                        enemy.appliedSlowFactor = this.stats.slowDuration || 0.5;
                    }
                }
            });
        }
    }

    class LaserTower extends BaseTower {
        attack() {
            projectiles.push(new LaserProjectile(this.x, this.y, this.target, this.stats.damage, this));
            playSound('laser');
        }
    }

    class SwordTower extends BaseTower {
        constructor(x, y, towerId, meta) {
            super(x, y, towerId, meta);
            this.kills = 0;
        }
        attack() {
            playSound('laser');
            const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
            
            // 검기 범위 공격 시각 이펙트 생성
            explosions.push(new SlashEffect(this.x, this.y, activeRange, 'rgba(192, 57, 43, 0.45)'));

            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= activeRange) {
                    dealDamageToEnemy(enemy, this.stats.damage);
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
                    projectiles.push(new SwordWaveProjectile(this.x, this.y, nearestEnemy, 15, this));
                    this.kills -= 2;
                }
            }
        }
    }

    class MagnifyingGlassTower extends BaseTower {
        removeGhostPropertyFromEnemies() {
            const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
            enemies.forEach(enemy => {
                if (enemy.isTransparent) {
                    const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                    if (distance <= activeRange) {
                        enemy.isTransparent = false;
                    }
                }
            });
        }

        findTarget() {
            const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
            const potentialTargets = enemies.filter(e => e.isTransparent);
            let closestEnemy = null;
            let minDistance = Infinity;
            for (const enemy of potentialTargets) {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance < activeRange) {
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
            this.target = closestEnemy;
        }

        attack() {
            if (this.target) {
                projectiles.push(new MagnifyingBeam(this.x, this.y, this.target, this.stats.damage, this));
            }
        }

        update() {
            this.removeGhostPropertyFromEnemies();
            super.update();
        }
    }

    class GatlingTower extends BaseTower {
        attack() {
            projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this, { pierce: 1 }));
            playSound('laser');
        }
    }

    class FreezerTower extends BaseTower {
        attack() {
            playSound('laser');
            let frozenCount = 0;
            enemies.forEach(enemy => {
                if (frozenCount >= 3) return;
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                const activeRange = this.sandstormDebuffTimer > 0 ? this.stats.range * 0.5 : this.stats.range;
                if (distance <= activeRange && !enemy.isStuck && !enemy.type.isImmuneToFreeze) {
                    enemy.isStuck = true;
                    setTimeout(() => { enemy.isStuck = false; }, 3000);
                    frozenCount++;
                }
            });
        }
    }

    class LightningTower extends BaseTower {
        attack() {
            playSound('laser');
            this.target.isMagnetized = true;
            this.target.magnetismTimer = 90;
            this.target.magnetismDamage = this.stats.damage;
        }
    }

    class LavaRock {
        constructor(x, y, pathNodes) {
            this.x = x;
            this.y = y;
            this.speed = 2.0;
            this.width = tileSize * 0.5;
            this.height = tileSize * 0.5;
            this.damage = 15;
            this.burnDamage = 15;
            this.burnDuration = 210;
            this.pathNodes = pathNodes;
            this.pathIndex = pathNodes.length - 1;
            this.angle = 0;
        }

        move() {
            if (this.pathIndex <= 0) return true;

            const target = this.pathNodes[this.pathIndex - 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.pathIndex--;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }

            this.angle += 0.2;

            for (let enemy of enemies) {
                const distToEnemy = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distToEnemy < (this.width + enemy.width) / 2) {
                    dealDamageToEnemy(enemy, this.damage);
                    enemy.burnTimer = this.burnDuration;
                    enemy.burnDamagePerFrame = this.burnDamage / this.burnDuration;
                    return true;
                }
            }
            return false;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#e67e22';
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
        attack() {
            const endNode = this.meta.pathNodes ? this.meta.pathNodes[this.meta.pathNodes.length - 1] : maps[selectedMap][maps[selectedMap].length - 1];
            lavaRocks.push(new LavaRock(endNode.x, endNode.y, maps[selectedMap]));
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
        'lava_tower': LavaTower
    };

    function dealDamageToEnemy(enemy, amount, damageType = 'normal') {
        if (damageType === 'explosion' && enemy.type.name === '돌 갑옷 골렘') {
            amount *= 5;
        }
        if (enemy.isHeavyTank) {
            amount = Math.max(0, amount - enemy.damageReduction);
        }
        if (enemy.isScorpion && Math.random() < 0.4) {
            return;
        }
        enemy.health -= amount * globalDamageMultiplier;
    }

    function getPointAheadOnPath(enemy, jumpDist, pathNodes) {
        let currentIdx = enemy.pathIndex;
        let currentX = enemy.x;
        let currentY = enemy.y;
        let remainingDist = jumpDist;

        while (remainingDist > 0 && currentIdx < pathNodes.length - 1) {
            const nextNode = pathNodes[currentIdx + 1];
            const dx = nextNode.x - currentX;
            const dy = nextNode.y - currentY;
            const segmentDist = Math.sqrt(dx * dx + dy * dy);

            if (remainingDist < segmentDist) {
                const ratio = remainingDist / segmentDist;
                currentX += dx * ratio;
                currentY += dy * ratio;
                remainingDist = 0;
            } else {
                currentX = nextNode.x;
                currentY = nextNode.y;
                remainingDist -= segmentDist;
                currentIdx++;
            }
        }

        return {
            x: currentX,
            y: currentY,
            pathIndex: currentIdx
        };
    }

    // ==================== PROJECTILES ====================

    class Projectile {
        constructor(x, y, target, damage, source, options = {}) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.source = source;
            this.speed = 6.5;
            this.width = 5;
            this.height = 5;
            this.pierce = options.pierce || 0;
            this.hitEnemies = [];
            this.color = options.color || '#f1c40f';
        }

        move() {
            if (!this.target || this.target.health <= 0) return true;
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.target.x;
                this.y = this.target.y;
                this.hitTarget();
                return true;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
            return false;
        }

        hitTarget() {
            if (this.hitEnemies.includes(this.target)) return;
            dealDamageToEnemy(this.target, this.damage);
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

    class BombProjectile extends Projectile {
        constructor(x, y, targetX, targetY, stats, source) {
            super(x, y, { x: targetX, y: targetY, health: 1 }, stats.damage, source);
            this.blastRadius = stats.blastRadius || 25;
            this.speed = 4.5;
        }

        hitTarget() {
            explosions.push(new Explosion(this.x, this.y, this.blastRadius));
            enemies.forEach(enemy => {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.blastRadius) {
                    dealDamageToEnemy(enemy, this.damage, 'explosion');
                }
            });
        }

        draw() {
            ctx.save();
            // 폭탄 검정색 원형 바디
            ctx.fillStyle = '#2c3e50';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // 도화선 끝부분 불꽃 표시
            ctx.fillStyle = '#f1c40f';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#f39c12';
            ctx.beginPath();
            ctx.arc(this.x + 3, this.y - 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class LaserProjectile extends Projectile {
        constructor(x, y, target, damage, source) {
            super(x, y, target, damage, source);
            this.speed = 12;
        }
        draw() {
            ctx.strokeStyle = '#8e44ad';
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
            if (this.target && !this.target.type.isIceSpirit) {
                this.target.burnTimer = this.burnDuration;
                this.target.burnDamagePerFrame = this.burnDamage / this.burnDuration;
            }
        }
    }

    class SwordWaveProjectile {
        constructor(x, y, target, damage, source) {
            this.x = x;
            this.y = y;
            this.damage = damage;
            this.source = source;
            this.speed = 7.0; 
            this.pierce = 3;  
            this.hitEnemies = [];
            
            const dx = target.x - x;
            const dy = target.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;
            } else {
                this.vx = this.speed;
                this.vy = 0;
            }
            this.angle = Math.atan2(this.vy, this.vx);
        }

        move() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
                return true;
            }

            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                if (this.hitEnemies.includes(enemy)) continue;

                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 24) {
                    dealDamageToEnemy(enemy, this.damage);
                    playSound('hit');
                    this.hitEnemies.push(enemy);
                    this.pierce--;

                    if (this.pierce <= 0) {
                        return true;
                    }
                }
            }
            return false;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            const grad = ctx.createLinearGradient(-15, 0, 15, 0);
            grad.addColorStop(0, 'rgba(231, 76, 60, 0.9)'); 
            grad.addColorStop(0.5, 'rgba(241, 196, 15, 0.9)'); 
            grad.addColorStop(1, 'rgba(255, 255, 255, 1)'); 

            ctx.strokeStyle = grad;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#e74c3c';

            ctx.beginPath();
            ctx.arc(0, 0, 14, -Math.PI / 2.5, Math.PI / 2.5);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(192, 57, 43, 0.3)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(-6, 0, 12, -Math.PI / 2.5, Math.PI / 2.5);
            ctx.stroke();

            ctx.restore();
        }
    }

    class MagnifyingBeam extends Projectile {
        constructor(x, y, target, damage, source) {
            super(x, y, target, damage, source);
            this.duration = 6;
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
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.source.x, this.source.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }
    }

    class SlashEffect {
        constructor(x, y, radius, color = 'rgba(192, 57, 43, 0.4)') {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.life = 10; // 지속 시간을 10프레임으로 조금 단축해서 더 빠르고 날카로운 베기 연출
            this.maxLife = 10;
            this.color = color;
        }
        update() {
            this.life--;
        }
        draw() {
            const progress = (this.maxLife - this.life) / this.maxLife; // 0 -> 1
            const alpha = 1 - progress;
            ctx.save();
            
            // 타워 사거리 한계선(테두리 부근)에 고정된 크기에서 이펙트를 굵게 그리기
            // 퍼져나가는 방식이 아니라 사거리 경계선(radius의 85% ~ 100%)에서만 휘두르는 궤적 연출
            const currentRadius = this.radius * (0.85 + 0.15 * progress);
            
            // 1. 외곽을 휩쓰는 두꺼운 검기 테두리
            ctx.strokeStyle = `rgba(192, 57, 43, ${alpha * 0.55})`;
            ctx.lineWidth = 9 * alpha; // 두께를 9px로 대폭 강화
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();

            // 2. 날카롭고 두꺼운 칼날 회전 궤적 (주황/빨강의 선명하고 두꺼운 2개 아크 호)
            ctx.strokeStyle = `rgba(231, 76, 60, ${alpha * 0.95})`;
            ctx.lineWidth = 5 * alpha;
            ctx.lineCap = 'round';
            
            // 엇갈려서 회전하는 느낌을 주기 위해 progress 에 비례하여 각도를 회전시켜 줌
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, progress * Math.PI * 2, (progress * Math.PI * 2) + Math.PI * 0.7);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 0.95, (progress * Math.PI * 2) + Math.PI, (progress * Math.PI * 2) + Math.PI * 1.7);
            ctx.stroke();

            ctx.restore();
        }
    }

    class Explosion {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.maxRadius = radius * 1.2;
            this.radius = 5;
            this.life = 25;
            this.maxLife = 25;
            
            this.particles = [];
            const particleCount = 8 + Math.floor(radius / 8);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.5 + Math.random() * 3.5;
                this.particles.push({
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 5,
                    color: Math.random() < 0.6 ? '#f39c12' : '#e67e22'
                });
            }
        }

        update() {
            this.life--;
            const progress = (this.maxLife - this.life) / this.maxLife;
            this.radius = this.maxRadius * Math.sin(progress * Math.PI / 2);
            
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;
                p.size *= 0.92;
            });
        }

        draw() {
            const progress = (this.maxLife - this.life) / this.maxLife;
            const alpha = 1 - progress;

            ctx.save();
            ctx.translate(this.x, this.y);

            const grad = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.3, `rgba(241, 196, 15, ${alpha * 0.9})`);
            grad.addColorStop(0.7, `rgba(230, 126, 34, ${alpha * 0.7})`);
            grad.addColorStop(1, `rgba(192, 57, 43, 0)`);

            ctx.fillStyle = grad;
            ctx.shadowBlur = 15 * alpha;
            ctx.shadowColor = '#e67e22';

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            this.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }
    }

    class StickyTile {
        constructor(x, y, duration) {
            this.x = x;
            this.y = y;
            this.duration = duration;
            this.stuckEnemy = null;
        }
        update() {
            this.duration--;
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
        draw() {
            ctx.fillStyle = 'rgba(39, 174, 96, 0.4)';
            ctx.fillRect(this.x - tileSize / 2, this.y - tileSize / 2, tileSize, tileSize);
        }
    }

    function playSound(name) {
        console.log(`Playing sound: ${name}`);
    }

    // ==================== WAVE MANAGEMENT ====================

    function getWaveComposition(waveNum) {
        // 맵별 보스 이름 설정
        let bossType = 'boss_hunter';
        if (selectedMap === 'ice') bossType = 'boss_ice_king';
        else if (selectedMap === 'mountain') bossType = 'boss_mountain_titan';
        else if (selectedMap === 'grassland') bossType = 'boss_meadow_keeper';
        else if (selectedMap === 'desert') bossType = 'boss_sandstorm_lord';
        else if (selectedMap === 'heaven') bossType = 'boss_fallen_angel';

        // 맵별 특수 몬스터 이름 설정
        let specialType = 'basic';
        if (selectedMap === 'ice') specialType = 'ice_spirit';
        else if (selectedMap === 'mountain') specialType = 'rock_golem';
        else if (selectedMap === 'grassland') specialType = 'regen_spider';
        else if (selectedMap === 'desert') specialType = 'desert_scorpion';
        else if (selectedMap === 'heaven') specialType = 'heavenly_wisp';

        // waveNum에 해당하는 데이터 가져오기
        let rawComposition = null;
        if (window.WAVE_DATA && window.WAVE_DATA[waveNum]) {
            rawComposition = window.WAVE_DATA[waveNum];
        }

        // 만약 50웨이브를 초과하거나 데이터가 없으면, 공식에 의해 동적 생성 (무한모드 예비용)
        if (!rawComposition) {
            const comp = [];
            const size = 10 + Math.floor((waveNum - 50) * 1.2); // 웨이브가 늘어날수록 마리수 급증
            const pool = ['basic', 'speedy', 'tank', 'stunner', 'transparent', 'jumper', 'regenerator', 'splitter', 'healer', 'aggro', specialType];
            
            // 보스 웨이브일 경우 (5의 배수)
            if (waveNum % 5 === 0) {
                comp.push(bossType);
                if (waveNum % 10 === 0) comp.push(bossType); // 10의 배수면 듀얼 보스
            }
            
            for (let i = 0; i < size; i++) {
                comp.push(pool[Math.floor((i * 13 + waveNum * 7) % pool.length)]);
            }
            return comp;
        }

        // 'map_special'과 'boss' 키워드를 맵의 실제 몬스터와 보스로 치환
        const comp = rawComposition.map(key => {
            if (key === 'map_special') return specialType;
            if (key === 'boss') {
                // 클래식 맵의 보스는 5배수마다 다르게 구성
                if (selectedMap === 'classic') {
                    if (waveNum <= 5) return 'boss_hunter';
                    if (waveNum <= 10) return 'boss_shielder';
                    return 'boss_theking';
                }
                return bossType;
            }
            return key;
        });

        return comp;
    }

    function startNextWave() {
        if (waveSpawning || isGameOver) return;
        waveSpawning = true;
        wave++;

        if (wave > 50 && !isHardMode) {
            isHardMode = true;
            showNotification("하드 모드 돌입! 모든 유닛 능력 강화!");
        }

        if (wave % 5 === 0 && !waveBonusGiven.includes(wave)) {
            const bonus = wave * 8;
            currency += bonus;
            waveBonusGiven.push(wave);
            showNotification(`${wave} 웨이브 보스전 돌입! 보너스 +${bonus}G`);
        }

        updateUI();

        const waveEnemies = getWaveComposition(wave);
        let spawnCount = 0;
        const spawnInterval = setInterval(() => {
            if (spawnCount < waveEnemies.length) {
                const enemyKey = waveEnemies[spawnCount];
                const enemyType = baseEnemyTypes[enemyKey] || baseEnemyTypes.basic;
                enemies.push(new Enemy(enemyType, maps[selectedMap]));
                spawnCount++;
            } else {
                clearInterval(spawnInterval);
                waveSpawning = false;
            }
        }, 600);
    }

    // ==================== IN-GAME LOGIC LOOPS ====================

    function handleEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.move();
            enemy.draw();
            enemy.updateAbilities();

            if (enemy.health <= 0) {
                currency += enemy.reward;
                dc += enemy.rewardDC;
                saveSystemData();
                dcCurrencyEl.textContent = dc;

                if (selectedPlacedUnit && selectedPlacedUnit.towerId === 'sword') {
                    selectedPlacedUnit.kills++;
                }
                
                enemies.splice(i, 1);
                updateUI();
                continue;
            }

            if (enemy.pathIndex >= enemy.pathNodes.length - 1) {
                health--;
                enemies.splice(i, 1);
                updateUI();
                
                if (health <= 0) {
                    isGameOver = true;
                    showNotification("전투 패배! 게임 오버!");
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        // 50웨이브 최종 클리어 승리 조건 체크
        if (wave === 50 && enemies.length === 0 && !waveSpawning && !isGameOver) {
            isGameOver = true;
            showNotification("🎉 축하합니다! 50웨이브 최종 클리어 완료! 🎉");
            dc += 500; // 최종 승리 보너스 DC 코인 지급
            saveSystemData();
            dcCurrencyEl.textContent = dc;
            
            setTimeout(() => {
                gameState = 'MENU';
                cancelAnimationFrame(animationFrameId);
                gameScreen.classList.remove('active');
                bottomPanel.style.display = 'none';
                menuScreen.classList.add('active');
                updateLobbyUI();
            }, 5000);
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

    function handleExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const exp = explosions[i];
            exp.update();
            exp.draw();
            if (exp.life <= 0) {
                explosions.splice(i, 1);
            }
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

    // ==================== TILEMAP RENDERING ====================

    function getTileColors(mapName, tileType) {
        if (tileType === 3) return { fill: '#2d3436', stroke: '#2c3e50' }; 
        if (tileType === 1) return { fill: '#2980b9', stroke: '#3498db' }; 
        if (tileType === 4) return { fill: '#1e272e', stroke: '#2f3542' }; 

        if (mapName === 'grassland') {
            if (tileType === 2) return { fill: '#1b5e20', stroke: '#2e7d32' }; 
            return { fill: '#2ecc71', stroke: '#27ae60' }; 
        }
        if (mapName === 'mountain') {
            if (tileType === 2) return { fill: '#424242', stroke: '#616161' }; 
            return { fill: '#7f8c8d', stroke: '#95a5a6' }; 
        }
        if (mapName === 'ice') {
            if (tileType === 2) return { fill: '#74b9ff', stroke: '#81d4fa' }; 
            return { fill: '#dff9fb', stroke: '#c7ecee' }; 
        }
        if (mapName === 'desert') {
            if (tileType === 2) return { fill: '#d35400', stroke: '#e67e22' }; 
            return { fill: '#f1c40f', stroke: '#f39c12' }; 
        }
        if (mapName === 'heaven') {
            if (tileType === 2) return { fill: '#f5cd79', stroke: '#f7d794' }; 
            return { fill: '#f7f1e3', stroke: '#d1ccc0' }; 
        }
        
        if (tileType === 2) return { fill: '#f1c40f', stroke: '#f39c12' };
        return { fill: '#2c3e50', stroke: '#34495e' };
    }

    function drawTileMap() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tType = currentTileMap[r][c];
                const colors = getTileColors(selectedMap, tType);
                const x = c * tileSize;
                const y = r * tileSize;
                
                // 1. 기본 배경 채우기
                ctx.fillStyle = colors.fill;
                ctx.fillRect(x, y, tileSize, tileSize);
                
                // 2. 테두리 그리기
                ctx.strokeStyle = colors.stroke;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tileSize, tileSize);

                // 3. 맵 테마별 고유한 블록 비주얼 데코레이션 그리기
                ctx.save();
                
                // 물결 그리기 헬퍼
                const drawWave = (xOffset, yOffset, wSize) => {
                    ctx.beginPath();
                    ctx.moveTo(x + xOffset, y + yOffset);
                    ctx.quadraticCurveTo(x + xOffset + wSize/4, y + yOffset - 3, x + xOffset + wSize/2, y + yOffset);
                    ctx.quadraticCurveTo(x + xOffset + 3*wSize/4, y + yOffset + 3, x + xOffset + wSize, y + yOffset);
                    ctx.stroke();
                };

                if (selectedMap === 'grassland') {
                    if (tType === 0) { // 잔디 평지
                        ctx.strokeStyle = '#27ae60';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x + 15, y + 25); ctx.lineTo(x + 18, y + 15); ctx.lineTo(x + 22, y + 25);
                        ctx.moveTo(x + 25, y + 22); ctx.lineTo(x + 27, y + 12); ctx.lineTo(x + 30, y + 22);
                        ctx.stroke();
                    } else if (tType === 2) { // 흙(고지)
                        ctx.fillStyle = '#8d6e63';
                        ctx.beginPath();
                        ctx.moveTo(x + 8, y + 32); ctx.lineTo(x + 20, y + 12); ctx.lineTo(x + 32, y + 32);
                        ctx.moveTo(x + 20, y + 32); ctx.lineTo(x + 28, y + 18); ctx.lineTo(x + 35, y + 32);
                        ctx.closePath();
                        ctx.fill();
                    } else if (tType === 1) { // 시냇물
                        ctx.strokeStyle = '#64b5f6';
                        ctx.lineWidth = 1.5;
                        drawWave(6, 15, 28);
                        drawWave(6, 25, 28);
                    }
                } 
                else if (selectedMap === 'mountain') {
                    if (tType === 0) { // 돌 평지
                        ctx.strokeStyle = '#95a5a6';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 10, y + 10); ctx.lineTo(x + 22, y + 22); ctx.lineTo(x + 28, y + 20);
                        ctx.moveTo(x + 30, y + 28); ctx.lineTo(x + 15, y + 35);
                        ctx.stroke();
                    } else if (tType === 2) { // 돌산(고지)
                        ctx.fillStyle = '#5d4037';
                        ctx.strokeStyle = '#7d5648';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 6, y + 34); ctx.lineTo(x + 20, y + 8); ctx.lineTo(x + 34, y + 34);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    } else if (tType === 4) { // 구덩이
                        ctx.fillStyle = '#0f141c';
                        ctx.beginPath();
                        ctx.arc(x + 20, y + 20, 12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } 
                else if (selectedMap === 'ice') {
                    if (tType === 0) { // 눈 평지
                        ctx.strokeStyle = '#b2bec3';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 20, y + 12); ctx.lineTo(x + 20, y + 28);
                        ctx.moveTo(x + 12, y + 20); ctx.lineTo(x + 28, y + 20);
                        ctx.moveTo(x + 14, y + 14); ctx.lineTo(x + 26, y + 26);
                        ctx.stroke();
                    } else if (tType === 2) { // 빙산(고지)
                        ctx.fillStyle = '#e3f2fd';
                        ctx.strokeStyle = '#90caf9';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 8, y + 32); ctx.lineTo(x + 20, y + 6); ctx.lineTo(x + 32, y + 32);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    } else if (tType === 1) { // 빙판 (물/배치불가)
                        ctx.strokeStyle = '#e3f2fd';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + 32, y + 32);
                        ctx.moveTo(x + 25, y + 5); ctx.lineTo(x + 35, y + 15);
                        ctx.stroke();
                    }
                } 
                else if (selectedMap === 'desert') {
                    if (tType === 0) { // 모래 평지
                        ctx.strokeStyle = '#e67e22';
                        ctx.lineWidth = 1;
                        drawWave(5, 12, 30);
                        drawWave(5, 24, 30);
                    } else if (tType === 2) { // 사구(고지)
                        ctx.strokeStyle = '#d35400';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x + 20, y + 38, 22, Math.PI, Math.PI * 1.7);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(x + 12, y + 42, 22, Math.PI * 1.3, Math.PI * 2);
                        ctx.stroke();
                    } else if (tType === 1) { // 오아시스
                        ctx.fillStyle = '#00e5ff';
                        ctx.beginPath();
                        ctx.arc(x + 20, y + 22, 7, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } 
                else if (selectedMap === 'heaven') {
                    if (tType === 0) { // 구름 평지
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(x + 15, y + 25, 8, 0, Math.PI * 2);
                        ctx.arc(x + 25, y + 25, 8, 0, Math.PI * 2);
                        ctx.arc(x + 20, y + 17, 9, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (tType === 2) { // 황금구름(고지)
                        ctx.fillStyle = '#fff9c4';
                        ctx.strokeStyle = '#fbc02d';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(x + 15, y + 25, 8, 0, Math.PI * 2);
                        ctx.arc(x + 25, y + 25, 8, 0, Math.PI * 2);
                        ctx.arc(x + 20, y + 17, 9, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    } else if (tType === 4) { // 천공 공허
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(x + 10, y + 10, 1.5, 1.5);
                        ctx.fillRect(x + 28, y + 15, 1.5, 1.5);
                        ctx.fillRect(x + 18, y + 28, 1.5, 1.5);
                    }
                } 
                else { // 클래식
                    if (tType === 2) {
                        ctx.fillStyle = 'rgba(255,255,255,0.15)';
                        ctx.beginPath();
                        ctx.moveTo(x + tileSize / 2, y + 8);
                        ctx.lineTo(x + 8, y + 32);
                        ctx.lineTo(x + tileSize - 8, y + 32);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        }
    }

    function drawEnemyPathGuide() {
        if (!showEnemyPath) return;

        const pathNodes = maps[selectedMap];
        ctx.save();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(pathNodes[0].x, pathNodes[0].y);
        for (let i = 1; i < pathNodes.length; i++) {
            ctx.lineTo(pathNodes[i].x, pathNodes[i].y);
        }
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(pathNodes[0].x, pathNodes[0].y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(pathNodes[pathNodes.length - 1].x, pathNodes[pathNodes.length - 1].y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawGridOverlay() {
        if (!showTileTypes) return;

        ctx.save();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tType = currentTileMap[r][c];
                const x = c * tileSize;
                const y = r * tileSize;
                
                let tileName = '평지';
                let overlayColor = 'rgba(255, 255, 255, 0.05)';
                let textColor = '#aaa';

                if (tType === 3) {
                    tileName = '경로';
                    overlayColor = 'rgba(220, 38, 38, 0.2)';
                    textColor = '#fff';
                } else if (tType === 1) { // 물 / 시냇물 / 빙판 / 오아시스
                    overlayColor = 'rgba(59, 130, 246, 0.4)';
                    textColor = '#fff';
                    if (selectedMap === 'grassland') tileName = '시냇물(금지)';
                    else if (selectedMap === 'ice') tileName = '빙판(금지)';
                    else if (selectedMap === 'desert') tileName = '오아시스(금지)';
                    else tileName = '물(금지)';
                } else if (tType === 4) { // 구덩이 / 공허
                    overlayColor = 'rgba(0, 0, 0, 0.6)';
                    textColor = '#ef4444';
                    if (selectedMap === 'mountain') tileName = '구덩이(금지)';
                    else if (selectedMap === 'heaven') tileName = '공허(금지)';
                    else tileName = '배치불가';
                } else if (tType === 2) { // 고지 / 흙 / 돌산 / 빙산 / 사구 / 황금구름
                    overlayColor = 'rgba(245, 158, 11, 0.4)';
                    textColor = '#000';
                    if (selectedMap === 'grassland') tileName = '흙(고지)';
                    else if (selectedMap === 'mountain') tileName = '돌산(고지)';
                    else if (selectedMap === 'ice') tileName = '빙산(고지)';
                    else if (selectedMap === 'desert') tileName = '사구(고지)';
                    else if (selectedMap === 'heaven') tileName = '황금구름(고지)';
                    else tileName = '고지(+20%)';
                } else if (tType === 0) { // 평지 / 잔디 / 돌 / 눈 / 모래 / 구름
                    overlayColor = 'rgba(255, 255, 255, 0.05)';
                    textColor = '#aaa';
                    if (selectedMap === 'grassland') tileName = '잔디 블록';
                    else if (selectedMap === 'mountain') tileName = '돌 블록';
                    else if (selectedMap === 'ice') tileName = '눈 블록';
                    else if (selectedMap === 'desert') tileName = '모래 블록';
                    else if (selectedMap === 'heaven') tileName = '구름 블록';
                    else tileName = '평지';
                }

                ctx.fillStyle = overlayColor;
                ctx.fillRect(x, y, tileSize, tileSize);
                
                ctx.fillStyle = textColor;
                ctx.font = 'bold 8.5px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(tileName, x + tileSize / 2, y + tileSize / 2 + 3);
            }
        }
        ctx.restore();
    }

    function drawGridLines() {
        if (!showGrid) return;
        
        ctx.save();
        ctx.strokeStyle = '#2d2d30';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= mapWidth; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= mapHeight; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ==================== IN-GAME EVENT HANDLERS & GACHA ====================

    function getPlacedTowerLimit() {
        if (wave < 50) return 8;
        if (wave < 100) return 12;
        return 12 + slotPurchasedCount;
    }

    gachaButton.addEventListener('click', () => {
        if (currency < 50) {
            showNotification("재화가 부족합니다 (비용: 50G).");
            return;
        }

        if (userDeck.length === 0) {
            showNotification("메인 메뉴에서 덱을 먼저 설정하세요!");
            return;
        }

        const currentWaitingCount = unitInventoryEl.children.length;
        if (currentWaitingCount >= maxInventoryLimit) {
            showNotification(`대기 타워 제한 초과! 설치하거나 공간을 비우세요 (최대 ${maxInventoryLimit}개).`);
            return;
        }

        currency -= 50;
        updateUI();

        const deckTowerId = userDeck[Math.floor(Math.random() * userDeck.length)];
        const originalTower = userTowers.find(t => t.id === deckTowerId);

        addUnitToInGameInventory(originalTower);
        showNotification(`${towerData[originalTower.towerId].name} 획득!`);
        updateUI();
    });

    function addUnitToInGameInventory(metaTower) {
        const unitIcon = document.createElement('div');
        const template = towerData[metaTower.towerId];

        unitIcon.classList.add('unit-icon', template.rarity);
        unitIcon.style.backgroundColor = template.color;
        unitIcon.style.borderColor = template.color;
        unitIcon.innerHTML = `<span style="font-size:0.55rem;">[${metaTower.prefix.name.substring(0,2)}]</span>`;
        
        unitIcon.dataset.metaString = JSON.stringify(metaTower);

        unitIcon.addEventListener('click', () => {
            if (placingUnit && placingUnit === unitIcon) {
                unitIcon.classList.remove('selected');
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

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gridC = Math.floor(x / tileSize);
        const gridR = Math.floor(y / tileSize);
        const gridX = gridC * tileSize + tileSize / 2;
        const gridY = gridR * tileSize + tileSize / 2;

        const tileVal = currentTileMap[gridR] ? currentTileMap[gridR][gridC] : -1;

        if (isMovingUnit && selectedPlacedUnit) {
            if (tileVal === 0 || tileVal === 2) {
                const collides = units.some(u => u !== selectedPlacedUnit && Math.floor(u.x / tileSize) === gridC && Math.floor(u.y / tileSize) === gridR);
                if (!collides) {
                    selectedPlacedUnit.x = gridX;
                    selectedPlacedUnit.y = gridY;
                    
                    let baseRange = selectedPlacedUnit.originalStats.range;
                    if (tileVal === 2) {
                        selectedPlacedUnit.stats.range = baseRange * 1.2;
                    } else {
                        selectedPlacedUnit.stats.range = baseRange;
                    }

                    isMovingUnit = false;
                    selectedPlacedUnit.isMoving = false;
                    applyMagnifierAura();
                    showNotification("유닛 이동 완료.");
                } else {
                    showNotification("그곳에는 이미 타워가 있습니다.");
                }
            } else {
                showNotification("경로, 물, 혹은 공허 타일에는 배치할 수 없습니다.");
            }
            return;
        }

        if (placingUnit) {
            if (tileVal === 0 || tileVal === 2) {
                const limit = getPlacedTowerLimit();
                if (units.length >= limit) {
                    showNotification("배치 슬롯 제한을 초과했습니다!");
                    return;
                }

                const collides = units.some(u => Math.floor(u.x / tileSize) === gridC && Math.floor(u.y / tileSize) === gridR);
                if (!collides) {
                    const metaInfo = JSON.parse(placingUnit.dataset.metaString);
                    const TowerClass = towerClasses[metaInfo.towerId];

                    if (TowerClass) {
                        const newUnit = new TowerClass(gridX, gridY, metaInfo.towerId, metaInfo);
                        units.push(newUnit);
                        placingUnit.remove();
                        placingUnit = null;
                        
                        applyMagnifierAura();
                        updateUI();
                        showNotification("타워 배치 완료.");
                    }
                } else {
                    showNotification("그곳에는 이미 타워가 있습니다.");
                }
            } else {
                showNotification("경로, 물, 혹은 공허 타일에는 배치할 수 없습니다.");
            }
        } 
        else {
            let clickedOnUnit = units.find(unit => x >= unit.x - unit.width / 2 && x <= unit.x + unit.width / 2 && y >= unit.y - unit.height / 2 && y <= unit.y + unit.height / 2);
            if (clickedOnUnit) {
                if (selectedPlacedUnit) selectedPlacedUnit.isSelected = false;
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

    function updatePlacedTowersCount() {
        placedTowersCountEl.textContent = units.length;
    }

    function applyMagnifierAura() {
        units.forEach(unit => {
            const gridR = Math.floor(unit.y / tileSize);
            const gridC = Math.floor(unit.x / tileSize);
            const isHighland = currentTileMap[gridR] && currentTileMap[gridR][gridC] === 2;
            
            let baseRange = unit.originalStats.range;
            unit.stats.range = isHighland ? baseRange * 1.2 : baseRange;
        });

        const magnifiers = units.filter(u => u.towerId === 'magnifying_glass');
        magnifiers.forEach(m => {
            units.forEach(u => {
                if (u === m) return;
                const adjacent = (Math.abs(m.x - u.x) < tileSize * 1.5 && m.y === u.y) || 
                                 (Math.abs(m.y - u.y) < tileSize * 1.5 && m.x === u.x);
                if (adjacent) {
                    u.stats.range += 40;
                }
            });
        });
    }

    function updateSelectedUnitInfo(unit) {
        if (unit) {
            const template = towerData[unit.towerId];
            selectedUnitNameEl.textContent = `[${unit.meta.prefix.name}] ${template.name}`;
            selectedUnitLevelEl.textContent = `${unit.meta.level} (인게임 Lv.${unit.level})`;
            selectedUnitDamageEl.textContent = unit.stats.damage.toFixed(1);
            selectedUnitRangeEl.textContent = unit.stats.range.toFixed(1);
            selectedUnitFireRateEl.textContent = unit.stats.fireRate.toFixed(1);
            selectedUnitDescriptionEl.textContent = template.description;
            
            upgradePanel.classList.remove('hidden');
            const cost = 100 * unit.level;
            upgradeButton.textContent = `인게임 강화 (비용: ${cost}G)`;
            statPointsEl.textContent = unit.statPoints;

            const canAwaken = unit.meta.isAwakened && awakeningMap[unit.towerId] && unit.level >= 5;
            if (canAwaken) {
                awakenButton.classList.remove('hidden');
                awakenButton.textContent = `인게임 각성 (무료)`;
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

    upgradeButton.addEventListener('click', () => {
        if (!selectedPlacedUnit) return;
        const cost = 100 * selectedPlacedUnit.level;
        if (currency < cost) {
            showNotification("골드가 부족합니다.");
            return;
        }

        currency -= cost;
        selectedPlacedUnit.level++;
        selectedPlacedUnit.statPoints += 2;
        updateUI();
        updateSelectedUnitInfo(selectedPlacedUnit);
    });

    awakenButton.addEventListener('click', () => {
        if (!selectedPlacedUnit) return;
        const awakenedTowerId = awakeningMap[selectedPlacedUnit.towerId];
        if (!awakenedTowerId) return;

        const idx = units.indexOf(selectedPlacedUnit);
        if (idx !== -1) {
            const old = selectedPlacedUnit;
            const TowerClass = towerClasses[awakenedTowerId];
            
            const newUnit = new TowerClass(old.x, old.y, awakenedTowerId, old.meta);
            newUnit.level = old.level;
            newUnit.statPoints = old.statPoints;
            
            units[idx] = newUnit;
            selectedPlacedUnit = newUnit;
            newUnit.isSelected = true;

            applyMagnifierAura();
            updateSelectedUnitInfo(newUnit);
            showNotification(`${old.stats.name}이(가) ${newUnit.stats.name}(으)로 인게임 각성 완료!`);
        }
    });

    statButtons.addEventListener('click', (e) => {
        if (!selectedPlacedUnit || selectedPlacedUnit.statPoints <= 0) return;
        const stat = e.target.dataset.stat;
        if (!stat) return;

        selectedPlacedUnit.statPoints--;
        if (stat === 'damage') {
            selectedPlacedUnit.stats.damage += selectedPlacedUnit.originalStats.damage * 0.1;
        } else if (stat === 'range') {
            selectedPlacedUnit.stats.range += selectedPlacedUnit.originalStats.range * 0.05;
            selectedPlacedUnit.originalStats.range += selectedPlacedUnit.originalStats.range * 0.05;
        } else if (stat === 'fireRate') {
            selectedPlacedUnit.stats.fireRate = Math.max(2, selectedPlacedUnit.stats.fireRate * 0.95);
        }

        applyMagnifierAura();
        updateSelectedUnitInfo(selectedPlacedUnit);
    });

    sellUnitButton.addEventListener('click', () => {
        if (!selectedPlacedUnit) return;
        currency += 30;
        const idx = units.indexOf(selectedPlacedUnit);
        if (idx > -1) {
            units.splice(idx, 1);
        }
        selectedPlacedUnit = null;
        updateSelectedUnitInfo(null);
        applyMagnifierAura();
        updateUI();
        showNotification("유닛 판매 완료 (+30G).");
    });

    moveUnitButton.addEventListener('click', () => {
        if (selectedPlacedUnit && currency >= 100) {
            currency -= 100;
            isMovingUnit = true;
            selectedPlacedUnit.isMoving = true;
            updateUI();
            showNotification("이동시킬 격자를 캔버스에서 클릭하세요.");
        } else {
            showNotification("이동 비용(100G)이 부족합니다.");
        }
    });

    buySlotButton.addEventListener('click', () => {
        const cost = Math.floor(200 * Math.pow(1.5, slotPurchasedCount));
        if (currency < cost) {
            showNotification("골드가 부족합니다.");
            return;
        }

        if (slotPurchasedCount >= 6) {
            showNotification("더 이상 한도를 늘릴 수 없습니다 (최대 +6개).");
            return;
        }

        currency -= cost;
        slotPurchasedCount++;
        updateUI();
        showNotification(`배치 한도 확장 완료! 현재 한도: ${getPlacedTowerLimit()}개`);
    });

    // ==================== UI CORRELATION ====================

    function updateUI() {
        currencyEl.textContent = currency;
        waveEl.textContent = wave;
        healthEl.textContent = health;
        
        const limit = getPlacedTowerLimit();
        slotLimitDisplayEl.textContent = limit;
        updatePlacedTowersCount();

        const currentWaitingCount = unitInventoryEl.children.length;
        waitTowersCountEl.textContent = currentWaitingCount;
        waitLimitDisplayEl.textContent = maxInventoryLimit;

        if (wave >= 100) {
            buySlotContainer.classList.remove('hidden');
            const cost = Math.floor(200 * Math.pow(1.5, slotPurchasedCount));
            if (slotPurchasedCount >= 6) {
                buySlotButton.textContent = '한도 확장 최대';
                buySlotButton.disabled = true;
            } else {
                buySlotButton.textContent = `배치 한도 +1 (${cost}G)`;
                buySlotButton.disabled = currency < cost;
            }
        } else {
            buySlotContainer.classList.add('hidden');
        }
    }

    function updateBossUI() {
        if (currentBoss) {
            bossInfoContainer.classList.remove('hidden');
            bossNameEl.textContent = `${currentBoss.type.name} (보스)`;
            const pct = (currentBoss.health / currentBoss.maxHealth) * 100;
            bossHealthBar.style.width = `${pct}%`;
        } else {
            bossInfoContainer.classList.add('hidden');
        }
    }

    function getEnemySpecialEffectText(type) {
        const effects = [];
        
        if (type.isImmuneToFreeze) effects.push("빙결 면역");
        if (type.isHeavyTank) {
            effects.push(`중장갑 (기본 대미지 감소 ${type.damageReduction || 0}, 폭발 대미지 5배 피해)`);
        }
        if (type.isTransparent) effects.push("투명 (돋보기/레이저/테슬라 타워만 공격 가능)");
        if (type.isJumper) effects.push(`도약 (주기적으로 ${type.jumpDistance}px 점프)`);
        if (type.regenRate > 0) effects.push(`재생 (초당 체력 ${type.regenRate} 회복)`);
        if (type.splitsInto) {
            const splitName = baseEnemyTypes[type.splitsInto] ? baseEnemyTypes[type.splitsInto].name : '하위 적';
            effects.push(`분열 (사망 시 ${splitName} ${type.splitCount}마리 소환)`);
        }
        if (type.isHealer) effects.push(`광역 치료 (주변 아군 체력 ${type.healAmount} 회복)`);
        if (type.isScorpion) effects.push("모래 회피 (40% 확률로 공격 회피)");
        if (type.isIceSpirit) effects.push("얼음 정령 (화염 지속 피해 면역)");
        if (type.stunRadius) effects.push("기절 폭발 (사망 시 주변 타워 기절)");
        if (type.isAggro) effects.push("도발 (사거리 내 타워 타겟 고정)");
        
        if (type.isBoss) {
            effects.push("보스 (빙결 면역)");
            if (type.isIceKing) effects.push("주변 타워 빙결");
            if (type.isMountainTitan) effects.push("광역 낙석 공격");
            if (type.isMeadowKeeper) effects.push("광역 치유");
            if (type.isSandstormLord) effects.push("사거리 반감 모래바람");
            if (type.isFallenAngel) effects.push("심판의 고리 (타워 격리)");
        }
        
        return effects.length > 0 ? effects.join(", ") : "없음";
    }

    function updateEnemyInfoPanel(enemy) {
        if (enemy) {
            enemyInfoPanel.classList.remove('hidden');
            enemyTypeNameEl.textContent = enemy.type.name;
            enemyHealthEl.textContent = `${Math.ceil(enemy.health)} / ${enemy.maxHealth}`;
            enemySpeedEl.textContent = enemy.speed.toFixed(2);
            enemyDescriptionEl.textContent = getEnemySpecialEffectText(enemy.type);
        } else {
            enemyInfoPanel.classList.add('hidden');
        }
    }

    function showNotification(message) {
        notificationArea.textContent = message;
        notificationArea.classList.remove('hidden');
        notificationArea.classList.add('show');
        setTimeout(() => {
            notificationArea.classList.remove('show');
            setTimeout(() => notificationArea.classList.add('hidden'), 300);
        }, 2500);
    }

    // ==================== SCREEN SWITCHING ====================

    startGameButton.addEventListener('click', () => {
        if (userDeck.length === 0) {
            alert('인게임 소환을 위해 덱에 타워를 최소 1개 이상 추가해야 합니다!');
            return;
        }

        gameState = 'PLAYING';
        menuScreen.classList.remove('active');
        gameScreen.classList.add('active');
        bottomPanel.style.display = 'flex';

        currency = 250; 
        health = 20;
        wave = 0;
        slotPurchasedCount = 0;
        enemies = [];
        units = [];
        projectiles = [];
        explosions = [];
        stickyTiles = [];
        lavaRocks = [];
        placingUnit = null;
        selectedPlacedUnit = null;
        isGameOver = false;
        waveSpawning = false;
        isHardMode = false;
        waveBonusGiven = [];
        
        generateTileMap(selectedMap);
        updateUI();
        updateSelectedUnitInfo(null);
        updateEnemyInfoPanel(null);
        unitInventoryEl.innerHTML = '';
        
        gameLoop();
    });

    backToMenuButton.addEventListener('click', () => {
        if (confirm('메인 메뉴로 후퇴하시겠습니까? 현재 전투의 골드는 소멸하나 DC는 보존됩니다.')) {
            gameState = 'MENU';
            cancelAnimationFrame(animationFrameId);
            gameScreen.classList.remove('active');
            bottomPanel.style.display = 'none';
            menuScreen.classList.add('active');
            updateLobbyUI();
        }
    });

    startWaveButton.addEventListener('click', () => {
        startNextWave();
    });

    // ==================== MAIN GAME LOOP ====================

    function gameLoop() {
        if (gameState !== 'PLAYING') return;
        if (isGameOver) return;

        // 디버그 프레임 카운팅 표시
        const debugFrameEl = document.getElementById('debug-loop-frame');
        if (debugFrameEl) {
            debugFrameEl.textContent = frameCount;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frameCount++;

        try {
            drawTileMap();
        } catch (err) {
            console.error("drawTileMap Render Crash detected:", err);
            // 전역 에러로 방출하여 화면 하단 비주얼 디버거에 상세 스택 노출
            window.dispatchEvent(new ErrorEvent('error', {
                error: err,
                message: "drawTileMap Error: " + err.message,
                filename: "game.js",
                lineno: 1912
            }));
            isGameOver = true; // 루프를 중지하여 브라우저 무한 먹통 방지
            return;
        }

        drawEnemyPathGuide();
        drawGridLines();
        drawGridOverlay();
        
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

    // ==================== TABS CORRELATION ====================

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const content = document.getElementById(`${btn.dataset.tab}-tab`);
            if (content) content.classList.add('active');
            
            if (btn.dataset.tab === 'management') {
                selectedManageTower = null;
                manageDetailPanel.classList.remove('hidden');
                manageDetailContent.classList.add('hidden');
                renderManageInventory();
            }
        });
    });

    document.querySelectorAll('.btn-gacha-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gachaType = e.currentTarget.dataset.gacha;
            performGachaByType(gachaType);
        });
    });

    mapCards.forEach(card => {
        card.addEventListener('click', () => {
            mapCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedMap = card.dataset.map;
            drawLobbyMapPreview();
        });
    });

    // Canvas click
    canvas.addEventListener('click', handleCanvasClick);

    // Initial Load
    loadSystemData();
}

// 로컬 file:// 보안 환경에서 DOMContentLoaded 로드 순서 미스매치 예외 처리 보장
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}