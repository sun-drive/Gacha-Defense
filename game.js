document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const currencyEl = document.getElementById('currency');
    const waveEl = document.getElementById('wave');
    const healthEl = document.getElementById('health');
    const gachaButton = document.getElementById('gacha-button');
    const startWaveButton = document.getElementById('start-wave-button');
    const unitInventoryEl = document.getElementById('unit-inventory');
    const selectedUnitNameEl = document.getElementById('selected-unit-name');
    const selectedUnitDamageEl = document.getElementById('selected-unit-damage');
    const selectedUnitRangeEl = document.getElementById('selected-unit-range');
    const selectedUnitFireRateEl = document.getElementById('selected-unit-firerate');
    const selectedUnitLevelEl = document.getElementById('selected-unit-level');
    const selectedUnitDescriptionEl = document.getElementById('selected-unit-description');

    // Upgrade Panel UI
    const upgradePanel = document.getElementById('upgrade-panel');
    const upgradeButton = document.getElementById('upgrade-button');
    const statPointsEl = document.getElementById('stat-points');
    const statButtons = document.getElementById('stat-buttons');
    let sellUnitButton; // Declare globally
    let moveUnitButton; // Declare globally

    

    // Enemy Info Panel UI
    const enemyInfoPanel = document.getElementById('enemy-info-panel');
    const enemyTypeNameEl = document.getElementById('enemy-type-name');
    const enemyHealthEl = document.getElementById('enemy-health');
    const enemySpeedEl = document.getElementById('enemy-speed');
    const notificationArea = document.getElementById('notification-area');

    // Game State
    let currency = 100;
    let health = 20;
    let wave = 0;
    let enemies = [];
    let units = [];
    let projectiles = [];
    let explosions = [];
    let stickyTiles = [];
    let placingUnit = null;
    let selectedPlacedUnit = null; // To distinguish from inventory selection
    let selectedEnemy = null;
    let isGameOver = false;
    let waveSpawning = false;
    let isHardMode = false; // New game state for hard mode

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
            { x: mapWidth - tileSize * 2 + 0.5, y: tileSize * 2 + tileSize / 2 }, // Adjusted x
            { x: mapWidth - tileSize * 2 + 0.5, y: tileSize * 6 + tileSize / 2 }, // Adjusted x
            { x: tileSize * 2 + 0.5, y: tileSize * 6 + tileSize / 2 }, // Adjusted x
            { x: tileSize * 2 + 0.5, y: tileSize * 10 + tileSize / 2 }, // Adjusted x
            { x: mapWidth, y: tileSize * 10 + tileSize / 2 },
        ],
        map3: [ // Loop shape
            { x: 0, y: tileSize * 3 + tileSize / 2 },
            { x: mapWidth - tileSize * 4 + 0.5, y: tileSize * 3 + tileSize / 2 }, // Adjusted x
            { x: mapWidth - tileSize * 4 + 0.5, y: mapHeight - tileSize * 4 + tileSize / 2 }, // Adjusted x
            { x: tileSize * 4 + 0.5, y: mapHeight - tileSize * 4 + tileSize / 2 }, // Adjusted x
            { x: tileSize * 4 + 0.5, y: tileSize * 7 + tileSize / 2 },
            { x: mapWidth, y: tileSize * 7 + tileSize / 2 },
        ]
    };

    let currentPath = maps.map1;

    // --- Tower Definitions ---
    const towerData = {
        // Common
        'basic': { name: '기본 타워', rarity: 'common', color: '#A9A9A9', damage: 25, range: 110, fireRate: 40, description: '단일 적에게 발사체를 발사하는 기본적인 타워입니다.' },
        'tesla': { name: '테슬라 타워', rarity: 'common', color: '#00CED1', damage: 20, range: 80, fireRate: 90, description: '범위 내 모든 적에게 전기 피해를 입힙니다.' },
        'bomb': { name: '폭탄 타워', rarity: 'common', color: '#696969', damage: 18, range: 120, fireRate: 60, blastRadius: 20, description: '착탄 시 폭발하여 범위 피해를 입히는 폭탄을 발사합니다.' },
        // Rare
        'flame': { name: '화염 타워', rarity: 'rare', color: '#FF4500', damage: 10, range: 100, fireRate: 30, description: '적에게 화염 발사체를 발사하여 지속적인 화상 피해를 입힙니다.' },
        'glue': { name: '접착 타워', rarity: 'rare', color: '#7CFC00', damage: 0, range: 80, fireRate: 60, description: '적의 경로에 끈끈한 타일을 생성하여 적을 멈추게 합니다.' },
        'ice': { name: '냉각 타워', rarity: 'rare', color: '#ADD8E6', range: 60, slowFactor: 0.5, slowDuration: 120, damage: 0, fireRate: 90, description: '범위 내 적들을 얼려 이동 속도를 감소시키고, 얼어붙은 적은 추가 피해를 입습니다.' },
        // Epic
        'laser': { name: '레이저 발사기', rarity: 'epic', color: '#FF1493', damage: 4, range: 150, fireRate: 20, description: '빠른 속도로 레이저를 발사하여 지속적인 피해를 입힙니다.' },
        'sword': { name: '검기 타워', rarity: 'epic', color: '#DB7093', damage: 35, range: 50, fireRate: 40, description: '근접 범위 내 모든 적에게 피해를 입히고, 일정 킬 수 달성 시 관통하는 검기를 발사합니다.' },
        'sniper': { name: '저격 타워', rarity: 'epic', color: '#8B4513', damage: 40, range: 9999, fireRate: 180, description: '맵 전체에서 가장 멀리 있는 적을 저격하여 강력한 단일 피해를 입힙니다.' },
        // Legendary
        'gatling': { name: '개틀링', rarity: 'legendary', color: '#FFD700', damage: 15, range: 120, fireRate: 10, description: '매우 빠른 속도로 발사체를 난사하여 다수의 적에게 지속적인 피해를 입힙니다.' },
        'freezer': { name: '급속냉동기', rarity: 'legendary', color: '#00FFFF', damage: 0, range: 100, fireRate: 90, description: '범위 내 최대 3명의 적을 완전히 얼려 움직임을 멈추게 합니다.' },
        'lightning': { name: '번개 생성기', rarity: 'legendary', color: '#9400D3', damage: 50, range: 130, fireRate: 70, description: '랜덤 적에게 자성을 부여하고, 3초 후 번개를 내리쳐 강력한 피해를 입힙니다.' },
    };

    const gachaRates = [
        { type: 'common', rate: 0.44 },
        { type: 'rare', rate: 0.29 },
        { type: 'epic', rate: 0.19 },
        { type: 'legendary', rate: 0.08 }
    ];

    const upgradeCosts = {
        common: [100, 150, 220, 350],
        rare:   [150, 250, 400, 700],
        epic:   [250, 450, 750, 1300],
        legendary: [500, 900, 1600, 3000]
    };

    const enemyTypes = {
        'basic': { name: '기본', health: 100, speed: 1, color: '#ff7675', reward: 10 },
        'tank': { name: '탱크', health: 300, speed: 0.6, color: '#d63031', reward: 20 },
        'speedy': { name: '스피디', health: 50, speed: 2.5, color: '#fdcb6e', reward: 15 },
        'stunner': { name: '기절', health: 80, speed: 0.9, color: '#0984e3', reward: 25, stunRadius: 120, stunDuration: 120 }, // 2 seconds at 60fps
        'transparent': { name: '투명', health: 90, speed: 1, color: 'rgba(200, 200, 200, 0.5)', reward: 30, isTransparent: true },
        'jumper': { name: '점퍼', health: 70, speed: 1.2, color: '#6c5ce7', reward: 35, isJumper: true, jumpCooldownTime: 15, jumpDistance: 80 }, // 0.25s at 60fps
        'regenerator': { name: '재생', health: 150, speed: 0.8, color: '#27ae60', reward: 20, regenRate: 1 }, // 1 health per frame
        'splitter': { name: '분열', health: 120, speed: 1, color: '#8B4513', reward: 15, splitsInto: 'basic', splitCount: 2 }, // Splits into 2 basic enemies
        'healer': { name: '힐러', health: 100, speed: 1, color: '#87CEEB', reward: 15, isHealer: true, healRange: 60, healAmount: 8, healCooldown: 90 }, // Heals nearby enemies
        'aggro': { name: '어그로', health: 200, speed: 0.5, color: '#8B0000', reward: 30, isAggro: true }, // Highest priority for towers
        'burning': { name: '불붙은 적', health: 150, speed: 1, color: '#FF4500', reward: 20, isImmuneToIce: true }, // Immune to ice effects
        'superspeed': { name: '슈퍼 스피드', health: 60, speed: 1.5, color: '#00FF00', reward: 20, isSuperSpeed: true, speedIncreaseRate: 0.005, maxSpeed: 5 }, // Speed increases over time
        'heavytank': { name: '헤비 탱크', health: 300, speed: 1, color: '#404040', reward: 25, isHeavyTank: true, damageReduction: 5 }, // Reduces incoming damage
    };

    // --- Classes ---
    class Enemy {
        constructor(type) {
            const startNode = currentPath[0];
            this.x = startNode.x;
            this.y = startNode.y;
            this.width = tileSize * 0.8;
            this.height = tileSize * 0.8;
            this.type = type;
            this.health = type.health;
            this.maxHealth = type.health;
            this.speed = type.speed;
            this.pathIndex = 0;
            if (this.type.isJumper) {
                this.jumpCooldown = 0;
            }
            this.burnTimer = 0;
            this.burnDamagePerFrame = 0;
            this.isStuck = false;
            this.slowed = false;
            this.slowResistanceTimer = 0;
            this.isSlowResistant = false;
            this.slowTimer = 0; // Initialize slow timer
            this.appliedSlowFactor = 1; // Default to no slow
            this.frozenHitCount = 0; // Initialize hit counter for frozen enemies
            this.regenRate = type.regenRate || 0; // Regeneration rate
            this.isHealer = type.isHealer || false;
            this.healRange = type.healRange || 0;
            this.healAmount = type.healAmount || 0;
            this.healCooldown = type.healCooldown || 0;
            this.currentHealCooldown = 0; // Initialize current cooldown
            this.isImmuneToIce = type.isImmuneToIce || false; // Ice immunity
            this.isSuperSpeed = type.isSuperSpeed || false;
            this.speedIncreaseRate = type.speedIncreaseRate || 0;
            this.maxSpeed = type.maxSpeed || this.speed; // Max speed for super speed enemies
            this.isHeavyTank = type.isHeavyTank || false;
            this.damageReduction = type.damageReduction || 0;
            this.isMagnetized = false; // New property for magnetism
            this.magnetismTimer = 0; // New property for magnetism timer
        }

        move() {
            if (this.pathIndex >= currentPath.length - 1) return;
            if (this.isStuck) return; // Prevent movement if stuck

            // Jumper logic
            if (this.type.isJumper) {
                if (this.jumpCooldown > 0) {
                    this.jumpCooldown--;
                } else {
                    let jumped = false;
                    for (const otherEnemy of enemies) {
                        if (this === otherEnemy) continue;
                        const distToOther = Math.sqrt(Math.pow(this.x - otherEnemy.x, 2) + Math.pow(this.y - otherEnemy.y, 2));
                        if (distToOther < tileSize) { // If it encounters another enemy
                            const newPos = getPointAheadOnPath(this, this.type.jumpDistance);
                            this.x = newPos.x;
                            this.y = newPos.y;
                            this.pathIndex = newPos.pathIndex;
                            this.jumpCooldown = this.type.jumpCooldownTime;
                            jumped = true;
                            break; // Jump only once per frame
                        }
                    }
                    if (jumped) return; // Skip normal movement for this frame
                }
            }

            // Normal movement
            const target = currentPath[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Apply slow effect
            let currentSpeed = this.speed;
                if (this.slowed && this.slowTimer > 0) { // Check if slowed and timer is active
                    currentSpeed *= this.appliedSlowFactor; // Use applied slow factor
                    this.slowTimer--; // Decrement slow timer
                } else {
                    this.slowed = false; // Reset slowed if timer runs out
                    this.frozenHitCount = 0; // Reset hit count when unfrozen
                }

                // Manage slow resistance (this part remains the same, but its interaction with slowTimer is now clearer)
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

            // Apply burn damage
            if (this.burnTimer > 0) {
                this.health -= this.burnDamagePerFrame;
                this.burnTimer--;
            }

            // Apply magnetism effect (new logic)
            if (this.isMagnetized) {
                this.magnetismTimer--;
                if (this.magnetismTimer <= 0) {
                    this.health -= 40; // Deal 40 damage
                    this.isMagnetized = false; // Reset magnetism
                    // Add a visual effect for lightning strike (e.g., a small explosion or flash)
                    explosions.push(new Explosion(this.x, this.y, 30)); // Small explosion at enemy location
                    showNotification(`${this.type.name}에게 번개 강타!`); // Notify about lightning strike
                }
            }

            // Apply regeneration
            if (this.regenRate > 0 && this.health < this.maxHealth) {
                this.health += this.regenRate;
                if (this.health > this.maxHealth) {
                    this.health = this.maxHealth;
                }
            }

            // Apply healing (if this enemy is a healer)
            if (this.isHealer) {
                if (this.currentHealCooldown > 0) {
                    this.currentHealCooldown--;
                } else {
                    enemies.forEach(otherEnemy => {
                        if (otherEnemy !== this) { // Don't heal self
                            const distance = Math.sqrt(Math.pow(this.x - otherEnemy.x, 2) + Math.pow(this.y - otherEnemy.y, 2));
                            if (distance <= this.healRange && otherEnemy.health < otherEnemy.maxHealth) {
                                otherEnemy.health += this.healAmount;
                                if (otherEnemy.health > otherEnemy.maxHealth) {
                                    otherEnemy.health = otherEnemy.maxHealth;
                                }
                            }
                        }
                    });
                    this.currentHealCooldown = this.healCooldown; // Reset cooldown
                }
            }

            // Apply Super Speed logic
            if (this.isSuperSpeed && this.speed < this.maxSpeed) {
                this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncreaseRate);
            }
        }

        draw() {
            // Body
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, 5);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, Math.max(0, this.width * (this.health / this.maxHealth)), 5);
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
            
            // Deep copy template to make a unique instance
            this.stats = JSON.parse(JSON.stringify(template));
            this.stats.canSeeTransparent = this.stats.range >= 140;

            this.target = null;
            this.fireCooldown = 0;
            this.isSelected = false;
            this.rangeAnimationRadius = 0;
            this.level = 1;
            this.statPoints = 0;
            this.stunTimer = 0;
            this.isMoving = false; // Initialize isMoving
        }

        findTarget() {
            const potentialTargets = [];
            for (let enemy of enemies) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= this.stats.range) {
                    if (enemy.type.isTransparent) {
                        if (this.stats.canSeeTransparent && distance <= 80) {
                            potentialTargets.push(enemy);
                        }
                    } else {
                        potentialTargets.push(enemy);
                    }
                }
            }

            if (potentialTargets.length > 0) {
                potentialTargets.sort((a, b) => {
                    // Prioritize aggro enemies
                    if (a.type.isAggro && !b.type.isAggro) return -1;
                    if (!a.type.isAggro && b.type.isAggro) return 1;
                    // Then prioritize by health (highest health first)
                    return b.health - a.health;
                });
                this.target = potentialTargets[0];
            } else {
                this.target = null;
            }
        }

        attack() {
            // Generic attack method, to be overridden
        }

        update() {
            if (this.stunTimer > 0 || this.isMoving) { // Added this.isMoving check
                if (this.isMoving) { // If moving, clear target
                    this.target = null;
                }
                this.stunTimer--; // Still decrement stun timer if stunned
                return;
            }

            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else {
                // Check if current target is still valid (exists and in range)
                if (this.target) {
                    const dx = this.x - this.target.x;
                    const dy = this.y - this.target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (this.target.health <= 0 || distance > this.stats.range) { // Target dead or out of range
                        this.target = null; // Clear target
                    }
                }

                if (!this.target) { // If no target or target was just cleared
                    this.findTarget(); // Find a new one
                }
                
                if (this.target) { // If a valid target exists
                    this.attack();
                }
            }
        }

        draw() {
            ctx.fillStyle = this.stats.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

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
                    // TODO: Add visual effect for tesla zap
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
                playSound('laser'); // Placeholder sound
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class FlameTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound
            this.fireCooldown = this.stats.fireRate;
            
            // Fire 3 projectiles
            for (let i = 0; i < 3; i++) {
                // Target the same enemy, or find a new one if the current target is gone
                if (!this.target || this.target.health <= 0) {
                    this.findTarget();
                }
                if (this.target) {
                    projectiles.push(new FlameProjectile(this.x, this.y, this.target, 3, 15, 180, this)); // 3 damage, 15 total burn over 3s (180 frames)
                }
            }
        }
    }

    class GlueTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound for glue
            this.fireCooldown = this.stats.fireRate;

            if (!this.target || this.target.health <= 0) {
                this.findTarget();
            }

            if (this.target) {
                const targetTileX = Math.floor(this.target.x / tileSize) * tileSize + tileSize / 2;
                const targetTileY = Math.floor(this.target.y / tileSize) * tileSize + tileSize / 2;

                let existingStickyTile = stickyTiles.find(tile => tile.x === targetTileX && tile.y === targetTileY);

                if (existingStickyTile) {
                    existingStickyTile.duration = 240; // Reset duration (4 seconds)
                    if (existingStickyTile.stuckEnemy && existingStickyTile.stuckEnemy !== this.target) {
                        existingStickyTile.stuckEnemy.isStuck = false; // Release old enemy
                        existingStickyTile.stuckEnemy = null;
                    }
                } else {
                    stickyTiles.push(new StickyTile(targetTileX, targetTileY, 240));
                }
            }
        }
    }

    class IceTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound for ice
            this.fireCooldown = this.stats.fireRate;

            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) {
                    if (!enemy.isImmuneToIce && !enemy.isSlowResistant) { // Check for ice immunity
                        // Remove burn effect if present
                        if (enemy.burnTimer > 0) {
                            enemy.burnTimer = 0;
                            enemy.burnDamagePerFrame = 0;
                            enemy.slowResistanceTimer = this.stats.slowDuration; // Apply resistance
                        }
                                                    enemy.slowed = true;
                            enemy.slowTimer = this.stats.slowDuration; // Set slow duration
                            enemy.appliedSlowFactor = this.stats.slowFactor; // Store the slow factor
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
            playSound('laser'); // Placeholder sound
            this.fireCooldown = this.stats.fireRate;

            // Melee AoE attack
            enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) { // Use its own range for melee
                    enemy.health -= this.stats.damage; // 5 damage
                }
            }); // Closing brace for forEach

            // Special piercing attack
            if (this.kills >= 2) {
                // Find nearest enemy regardless of range
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
                    projectiles.push(new SwordWaveProjectile(this.x, this.y, nearestEnemy, 10, this)); // 10 damage, piercing
                    playSound('laser'); // Placeholder sound
                    this.kills -= 2; // Consume kills
                }
            }
        } // This closes the 'if (this.kills >= 2)' block.
    } // This closes the 'attack()' method.

    class LaserTower extends BaseTower {
        attack() {
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                projectiles.push(new LaserProjectile(this.x, this.y, this.target, this.stats.damage, this));
                playSound('laser'); // Use existing laser sound
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class SniperTower extends BaseTower {
        findTarget() {
            let farthestEnemy = null;
            let maxDistance = -1;

            for (let enemy of enemies) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Sniper attacks the farthest enemy on the map, regardless of its own range
                // We still need to consider transparency if the sniper has the ability to see transparent enemies
                if (enemy.type.isTransparent) {
                    if (this.stats.canSeeTransparent && distance > maxDistance) { // Sniper can see transparent if range is high enough
                        maxDistance = distance;
                        farthestEnemy = enemy;
                    }
                } else {
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        farthestEnemy = enemy;
                    }
                }
            }
            this.target = farthestEnemy;
        }

        attack() {
            if (this.target) {
                projectiles.push(new SniperProjectile(this.x, this.y, this.target, this.stats.damage, this));
                playSound('laser'); // Placeholder sound for sniper shot
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }

    class GatlingTower extends BaseTower {
        attack() {
            const distance = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
            if (distance > this.stats.range) {
                this.target = null;
            } else {
                projectiles.push(new Projectile(this.x, this.y, this.target, this.stats.damage, this));
                playSound('laser'); // Placeholder sound for rapid fire
                this.fireCooldown = this.stats.fireRate;
            }
        }
    }
    class FreezerTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound for freezing
            this.fireCooldown = this.stats.fireRate;

            let frozenCount = 0;
            enemies.forEach(enemy => {
                if (frozenCount >= 3) return; // Limit to 3 enemies

                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance <= this.stats.range) {
                    // Apply a strong slow/freeze effect
                    enemy.slowed = true;
                    enemy.slowTimer = 180; // Freeze for 3 seconds (60fps * 3)
                    enemy.appliedSlowFactor = 0; // 100% stop
                    // Also apply slow resistance if it's not already resistant
                    if (!enemy.isSlowResistant) {
                        enemy.slowResistanceTimer = 180; // Resistance for 3 seconds
                        enemy.isSlowResistant = true;
                    }
                    frozenCount++;
                }
            });
        }
    }
    class LightningTower extends BaseTower {
        attack() {
            playSound('laser'); // Placeholder sound for lightning
            this.fireCooldown = this.stats.fireRate;

            // Find a random enemy within range
            const enemiesInRange = enemies.filter(enemy => {
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                return distance <= this.stats.range;
            });

            if (enemiesInRange.length > 0) {
                const randomIndex = Math.floor(Math.random() * enemiesInRange.length);
                const targetEnemy = enemiesInRange[randomIndex];

                // Apply "Magnetism" property
                targetEnemy.isMagnetized = true;
                targetEnemy.magnetismTimer = 180; // 3 seconds * 60 frames/second
                showNotification(`${targetEnemy.type.name}에게 자성 부여!`); // Notify about magnetism
            }
        }
    }

    const towerClasses = {
        'basic': BasicTower,
        'tesla': TeslaTower,
        'bomb': BombTower,
        'flame': FlameTower,
        'glue': GlueTower,
        'ice': IceTower,
        'sword': SwordTower,
        'laser': LaserTower,
        'sniper': SniperTower, // Add SniperTower here
        'gatling': GatlingTower,
        'freezer': FreezerTower,
        'lightning': LightningTower,
    };

    function getPointAheadOnPath(enemy, distanceToJump) {
        let remainingDist = distanceToJump;
        let currentPos = { x: enemy.x, y: enemy.y };
        let currentPathIndex = enemy.pathIndex;

        while (remainingDist > 0 && currentPathIndex < currentPath.length - 1) {
            const targetNode = currentPath[currentPathIndex + 1];
            const dx = targetNode.x - currentPos.x;
            const dy = targetNode.y - currentPos.y;
            const segmentDist = Math.sqrt(dx * dx + dy * dy);

            if (remainingDist >= segmentDist) {
                remainingDist -= segmentDist;
                currentPos = { x: targetNode.x, y: targetNode.y };
                currentPathIndex++;
            } else {
                const ratio = remainingDist / segmentDist;
                currentPos.x += dx * ratio;
                currentPos.y += dy * ratio;
                remainingDist = 0;
            }
        }
        return { x: currentPos.x, y: currentPos.y, pathIndex: currentPathIndex };
    }

    class Projectile {
        constructor(x, y, target, damage, sourceTower = null) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.speed = 5;
            this.sourceTower = sourceTower; // Reference to the tower that fired this projectile
        }

        move() {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.target.x;
                this.y = this.target.y;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }

        draw() {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class LaserProjectile extends Projectile {
        constructor(x, y, target, damage, sourceTower) {
            super(x, y, target, damage, sourceTower);
            this.speed = 15; // Very fast
            this.color = 'red'; // Visual for laser projectile
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); // Smaller dot for laser
            ctx.fill();
        }
    }


    class FlameProjectile extends Projectile {
        constructor(x, y, target, damage, burnDamage, burnDuration, sourceTower) {
            super(x, y, target, damage, sourceTower);
            this.burnDamage = burnDamage;
            this.burnDuration = burnDuration;
            this.color = 'orange'; // Visual for flame projectile
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    

    class BombProjectile extends Projectile {
        constructor(x, y, targetX, targetY, towerStats, sourceTower) {
            super(x, y, null, towerStats.damage, sourceTower); // No target tracking
            this.targetX = targetX;
            this.targetY = targetY;
            this.speed = 3;
            this.blastRadius = towerStats.blastRadius;
        }

        move() {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.targetX;
                this.y = this.targetY;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }

    class SwordWaveProjectile extends Projectile {
        constructor(x, y, target, damage) {
            super(x, y, target, damage);
            this.piercing = true;
            this.color = 'purple';
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
        }
    }

    class SniperProjectile extends Projectile {
        constructor(x, y, target, damage, sourceTower) {
            super(x, y, target, damage, sourceTower);
            this.speed = 20; // Very fast bullet
            this.color = 'brown'; // Bullet color
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); // Small bullet
            ctx.fill();
        }
    }

    class Explosion {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.maxRadius = radius;
            this.life = 30; // 0.5s lifetime
        }

        update() {
            this.life--;
        }

        draw() {
            const opacity = this.life / 30;
            ctx.fillStyle = `rgba(255, 165, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class StickyTile {
        constructor(x, y, duration) {
            this.x = x;
            this.y = y;
            this.duration = duration; // frames
            this.stuckEnemy = null;
        }

        update() {
            if (this.stuckEnemy && this.stuckEnemy.health <= 0) {
                this.stuckEnemy = null; // Release if enemy dies
            }
            if (!this.stuckEnemy) {
                this.duration--;
            }
        }

        draw() {
            ctx.fillStyle = 'rgba(124, 252, 0, 0.5)'; // Light green
            ctx.fillRect(this.x - tileSize / 2, this.y - tileSize / 2, tileSize, tileSize);
        }
    }

    function playSound(name) {
        const url = sounds[name];
        if (url.startsWith('URL_TO')) {
            // Don't play placeholder sounds
            return;
        }
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Error playing sound:", e));
    }

    const waves = [
        ['basic', 'basic', 'basic', 'basic', 'basic'], // 1
        ['basic', 'basic', 'speedy', 'speedy', 'basic', 'basic'], // 2
        ['tank', 'basic', 'basic', 'speedy', 'speedy'], // 3
        ['stunner', 'stunner', 'basic', 'basic', 'basic'], // 4
        ['tank', 'tank', 'speedy', 'speedy', 'speedy', 'speedy'], // 5
        ['transparent', 'transparent', 'basic', 'basic', 'basic'], // 6
        ['jumper', 'jumper', 'speedy', 'speedy', 'speedy'], // 7
        ['tank', 'tank', 'tank', 'stunner', 'stunner', 'stunner'], // 8
        ['transparent', 'transparent', 'jumper', 'jumper', 'speedy'], // 9
        ['tank', 'stunner', 'jumper', 'transparent', 'basic', 'speedy'], // 10

        // Waves 11-30 (New)
        ['regenerator', 'transparent', 'regenerator', 'regenerator', 'basic', 'basic'], // 11 (More enemies)
        ['splitter', 'basic', 'basic', 'splitter', 'speedy', 'speedy'], // 12 (More enemies)
        ['speedy', 'speedy', 'regenerator', 'regenerator', 'speedy', 'tank'], // 13 (More enemies)
        ['tank', 'splitter', 'splitter', 'tank', 'jumper', 'jumper'], // 14 (More enemies)
        ['healer', 'basic', 'basic', 'healer', 'regenerator', 'burning'], // 15 (Healer introduced, Burning introduced)
        ['jumper', 'jumper', 'splitter', 'splitter', 'jumper', 'burning'], // 16 (More enemies, Burning)
        ['tank', 'regenerator', 'tank', 'regenerator', 'tank', 'burning', 'burning'], // 17 (More enemies, Burning)
        ['stunner', 'stunner', 'splitter', 'splitter', 'stunner', 'aggro'], // 18 (More enemies, Aggro)
        ['healer', 'transparent', 'jumper', 'regenerator', 'splitter', 'burning', 'aggro'], // 19 (More healers, Burning, Aggro)
        ['aggro', 'basic', 'speedy', 'tank', 'stunner', 'transparent', 'jumper', 'regenerator', 'splitter', 'burning', 'aggro'], // 20 (Aggro introduced, Mixed, Burning)

        ['regenerator', 'regenerator', 'regenerator', 'tank', 'tank', 'burning', 'burning'], // 21 (More enemies, Burning)
        ['splitter', 'splitter', 'splitter', 'speedy', 'speedy', 'aggro', 'aggro'], // 22 (More enemies, Aggro)
        ['transparent', 'transparent', 'transparent', 'jumper', 'jumper', 'burning', 'burning'], // 23 (More enemies, Burning)
        ['tank', 'tank', 'tank', 'tank', 'regenerator', 'regenerator', 'aggro', 'aggro'], // 24 (More enemies, Aggro)
        ['speedy', 'speedy', 'speedy', 'splitter', 'splitter', 'splitter', 'burning', 'burning'], // 25 (More enemies, Burning)
        ['stunner', 'stunner', 'stunner', 'transparent', 'transparent', 'aggro', 'aggro'], // 26 (More enemies, Aggro)
        ['jumper', 'jumper', 'jumper', 'regenerator', 'regenerator', 'regenerator', 'burning', 'burning'], // 27 (More enemies, Burning)
        ['tank', 'splitter', 'tank', 'splitter', 'tank', 'splitter', 'aggro', 'aggro'], // 28 (More enemies, Aggro)
        ['transparent', 'regenerator', 'jumper', 'splitter', 'stunner', 'tank', 'speedy', 'burning', 'aggro'], // 29 (Heavy Mixed, Burning, Aggro)
        ['tank', 'tank', 'tank', 'regenerator', 'regenerator', 'regenerator', 'splitter', 'splitter', 'splitter', 'transparent', 'jumper', 'stunner', 'burning', 'burning', 'aggro', 'aggro'], // 30 (Boss Wave, More enemies, Burning, Aggro)

        // Waves 31-50 (New)
        ['superspeed', 'basic', 'speedy', 'superspeed'], // 31 (Super Speed introduced)
        ['heavytank', 'tank', 'heavytank', 'basic'], // 32 (Heavy Tank introduced)
        ['superspeed', 'superspeed', 'burning', 'burning', 'superspeed'], // 33
        ['heavytank', 'heavytank', 'regenerator', 'regenerator', 'heavytank'], // 34
        ['aggro', 'aggro', 'superspeed', 'superspeed', 'aggro'], // 35
        ['healer', 'healer', 'heavytank', 'heavytank', 'healer'], // 36
        ['superspeed', 'splitter', 'superspeed', 'splitter', 'superspeed'], // 37
        ['heavytank', 'jumper', 'heavytank', 'jumper', 'heavytank'], // 38
        ['burning', 'burning', 'superspeed', 'heavytank', 'burning'], // 39
        ['aggro', 'healer', 'superspeed', 'heavytank', 'regenerator', 'splitter', 'burning', 'aggro'], // 40 (Heavy Mixed)

        ['superspeed', 'superspeed', 'superspeed', 'heavytank', 'heavytank'], // 41
        ['heavytank', 'heavytank', 'heavytank', 'superspeed', 'superspeed'], // 42
        ['burning', 'burning', 'burning', 'aggro', 'aggro'], // 43
        ['regenerator', 'regenerator', 'regenerator', 'healer', 'healer'], // 44
        ['splitter', 'splitter', 'splitter', 'jumper', 'jumper'], // 45
        ['superspeed', 'heavytank', 'superspeed', 'heavytank', 'superspeed', 'heavytank'], // 46
        ['aggro', 'burning', 'aggro', 'burning', 'aggro', 'burning'], // 47
        ['healer', 'regenerator', 'healer', 'regenerator', 'healer', 'regenerator'], // 48
        ['superspeed', 'heavytank', 'aggro', 'healer', 'burning', 'regenerator', 'splitter', 'jumper', 'stunner', 'transparent'], // 49 (All types)
        ['heavytank', 'heavytank', 'heavytank', 'superspeed', 'superspeed', 'superspeed', 'aggro', 'aggro', 'aggro', 'burning', 'burning', 'burning', 'regenerator', 'regenerator', 'regenerator', 'splitter', 'splitter', 'splitter', 'healer', 'healer', 'healer'] // 50 (Final Boss Wave)
    ];

    // --- Game Functions ---
    function startNextWave() {
        if (waveSpawning || wave >= waves.length) return;
        
        wave++;
        waveSpawning = true;
        startWaveButton.disabled = true;

        // Hard Mode activation
        if (wave === 25) {
            isHardMode = true;
            showNotification('하드모드 진입!');
        }

        const waveEnemies = waves[wave - 1];
        let spawnIndex = 0;

        const spawnInterval = setInterval(() => {
            if (spawnIndex >= waveEnemies.length) {
                clearInterval(spawnInterval);
                waveSpawning = false;
                // Re-enable button only if there are more waves and all enemies are cleared
                return;
            }
            const enemyType = enemyTypes[waveEnemies[spawnIndex]];
            const newEnemy = new Enemy(enemyType);
            if (isHardMode) {
                newEnemy.health = Math.floor(newEnemy.health * 1.5); // Increase health by 1.5 in hard mode
                newEnemy.maxHealth = newEnemy.health; // Update max health as well
            }
            enemies.push(newEnemy);
            spawnIndex++;
        }, 700); // Spawn a new enemy every 0.7 seconds
    }

    function handleEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.move();
            enemy.draw();

            // Check if enemy reached the end of the path
            if (enemy.pathIndex >= currentPath.length - 1) {
                health -= 1;
                enemies.splice(i, 1);
            }
        }
    }

    function handleUnits() {
        units.forEach(unit => {
            unit.update();
            unit.draw();
        });
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
            p.move();
            p.draw();

            let hit = false;
            let killedEnemy = null;

            if (p instanceof BombProjectile) {
                const dx = p.x - p.targetX;
                const dy = p.y - p.targetY;
                if (Math.sqrt(dx * dx + dy * dy) < p.speed) {
                    hit = true;
                    // Create explosion and damage enemies in blast radius
                    explosions.push(new Explosion(p.x, p.y, p.blastRadius));
                    enemies.forEach(enemy => {
                        const distToEnemy = Math.sqrt(Math.pow(p.x - enemy.x, 2) + Math.pow(p.y - enemy.y, 2));
                        if (distToEnemy <= p.blastRadius) {
                            enemy.health -= p.damage;
                        }
                    });
                }
            } else if (p instanceof FlameProjectile) {
                if (!p.target) {
                    projectiles.splice(i, 1);
                    continue;
                }
                // Check if projectile is outside tower's range
                const distToTower = Math.sqrt(Math.pow(p.x - p.sourceTower.x, 2) + Math.pow(p.y - p.sourceTower.y, 2));
                if (distToTower > p.sourceTower.stats.range + 20) { // Add a small buffer
                    projectiles.splice(i, 1);
                    continue;
                }

                const dx = p.x - p.target.x;
                const dy = p.y - p.target.y;
                if (Math.sqrt(dx * dx + dy * dy) < 10) {
                    p.target.health -= p.damage;
                    p.target.burnTimer = p.burnDuration;
                    p.target.burnDamagePerFrame = p.burnDamage / p.burnDuration;
                    hit = true;
                }
            } else if (p instanceof SwordWaveProjectile) {
                // Piercing projectile, doesn't disappear on hit
                if (!p.target) {
                    // If target is gone, find a new one or remove if no more enemies
                    const potentialTargets = enemies.filter(enemy => {
                        const dist = Math.sqrt(Math.pow(p.x - enemy.x, 2) + Math.pow(p.y - enemy.y, 2));
                        return dist < p.stats.range; // Assuming it has a range for finding new targets
                    });
                    if (potentialTargets.length > 0) {
                        potentialTargets.sort((a, b) => b.health - a.health);
                        p.target = potentialTargets[0];
                    } else {
                        projectiles.splice(i, 1);
                        continue;
                    }
                }

                const dx = p.x - p.target.x;
                const dy = p.y - p.target.y;
                if (Math.sqrt(dx * dx + dy * dy) < 10) {
                    p.target.health -= p.damage;
                    // No 'hit = true' here, as it doesn't disappear
                }

                // Check if it went off screen
                if (p.x < 0 || p.x > mapWidth || p.y < 0 || p.y > mapHeight) {
                    projectiles.splice(i, 1);
                }
                continue; // Don't remove piercing projectile yet

            } else { // Normal projectile
                if (!p.target) {
                    projectiles.splice(i, 1);
                    continue;
                }
                const dx = p.x - p.target.x;
                const dy = p.target.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < 10) {
                    let damageToApply = p.damage;
                    if (p.target.isHeavyTank) {
                        damageToApply = Math.max(0, damageToApply - p.target.damageReduction); // Apply damage reduction
                    }
                    p.target.health -= damageToApply;
                    hit = true;
                }
            }

            if (hit) {
                playSound('hit');
                // Check for instant kill on frozen enemies
                if (p.target && p.target.slowed) { // Check if the hit target is frozen
                    p.target.frozenHitCount++;
                    if (p.target.frozenHitCount >= 4) {
                        p.target.health = 0; // Instantly kill
                    }
                }
                // Health check for all damaged enemies is now needed
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    if (enemy.health <= 0) {
                        killedEnemy = enemy; // Store killed enemy for tower kill count
                        currency += enemy.type.reward;
                        flashElement(currencyEl, 'green');
                        playSound('coin');

                        // Splitter logic
                        if (enemy.type.splitsInto) {
                            const splitEnemyType = enemyTypes[enemy.type.splitsInto];
                            for (let k = 0; k < enemy.type.splitCount; k++) {
                                const newEnemy = new Enemy(splitEnemyType);
                                newEnemy.x = enemy.x; // Spawn at the splitter's death location
                                newEnemy.y = enemy.y;
                                newEnemy.pathIndex = enemy.pathIndex; // Continue on the same path
                                enemies.push(newEnemy);
                            }
                        }

                        // Stunner check
                        if (enemy.type.stunRadius) {
                            units.forEach(unit => {
                                const distance = Math.sqrt(Math.pow(unit.x - enemy.x, 2) + Math.pow(unit.y - enemy.y, 2));
                                if (distance <= enemy.type.stunRadius) {
                                    unit.stunTimer = enemy.type.stunDuration;
                                }
                            });
                        }
                        enemies.splice(j, 1);
                    }
                }
                projectiles.splice(i, 1);
            }
        }
    }

    function updateUI() {
        currencyEl.textContent = currency;
        waveEl.textContent = wave;
        healthEl.textContent = health;
    }

    function drawMap() {
        // Draw path
        ctx.strokeStyle = '#aaa'; // Lighter grey
        ctx.lineWidth = tileSize; // Make it tile-sized
        ctx.lineCap = 'round'; // Nicer ends
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
        ctx.lineCap = 'butt'; // Reset
        ctx.lineWidth = 1;

        // Draw grid
        ctx.strokeStyle = '#ddd';
        for (let x = 0; x < mapWidth; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
            ctx.stroke();
        }
        for (let y = 0; y < mapHeight; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }
    }

    function flashElement(element, color) {
        const className = color === 'green' ? 'flash-green' : 'flash-red';
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, 500); // Animation duration is 0.5s
    }

    function showNotification(message) {
        notificationArea.textContent = message;
        notificationArea.classList.add('show');
        notificationArea.classList.remove('hidden');

        setTimeout(() => {
            notificationArea.classList.remove('show');
            // Use another timeout to truly hide it after the fade-out transition
            setTimeout(() => {
                 notificationArea.classList.add('hidden');
            }, 500); // Must match CSS transition duration
        }, 2000); // Show message for 2 seconds
    }

    function isPointOnPath(x, y) {
        for (let i = 0; i < currentPath.length - 1; i++) {
            const p1 = currentPath[i];
            const p2 = currentPath[i+1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx*dx + dy*dy;
            if (lenSq === 0) continue;
            let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            const distSq = Math.pow(x - projX, 2) + Math.pow(y - projY, 2);
            if (distSq < Math.pow(tileSize * 0.8, 2)) { // A bit more generous than half a tile
                return true;
            }
        }
        return false;
    }

    function performGacha() {
        if (currency < 50) {
            showNotification('재화가 부족합니다!');
            return;
        }
        currency -= 50;
        flashElement(currencyEl, 'red');
        playSound('gacha');

        const rand = Math.random();
        let cumulativeRate = 0;
        let pulledRarity = 'common';

        // Determine rarity
        for (const gacha of gachaRates) {
            cumulativeRate += gacha.rate;
            if (rand < cumulativeRate) {
                pulledRarity = gacha.type;
                break;
            }
        }

        // Get all towers of that rarity
        const possibleTowers = Object.keys(towerData).filter(
            key => towerData[key].rarity === pulledRarity
        );

        // Pick one tower randomly from that rarity
        const pulledTowerId = possibleTowers[Math.floor(Math.random() * possibleTowers.length)];
        
        addUnitToInventory(pulledTowerId);
    }

    function addUnitToInventory(towerId) {
        const unitData = towerData[towerId];
        const unitIcon = document.createElement('div');
        unitIcon.classList.add('unit-icon', unitData.rarity);
        unitIcon.dataset.towerId = towerId;
        unitIcon.style.backgroundColor = unitData.color;

        unitIcon.addEventListener('click', () => {
            if (placingUnit && placingUnit.id === towerId) {
                placingUnit = null; // Deselect
                unitIcon.classList.remove('selected');
                updateSelectedUnitInfo(null);
            } else {
                const currentlySelected = document.querySelector('.unit-icon.selected');
                if (currentlySelected) currentlySelected.classList.remove('selected');
                
                placingUnit = { id: towerId };
                unitIcon.classList.add('selected');
                updateSelectedUnitInfo(towerData[towerId]);
            }
        });
        unitInventoryEl.appendChild(unitIcon);
    }

    function updateSelectedUnitInfo(unit) {
        // Start by hiding the panel and clearing the info
        upgradePanel.classList.add('hidden');
        selectedUnitNameEl.textContent = '-';
        selectedUnitLevelEl.textContent = '-';
        selectedUnitDamageEl.textContent = '-';
        selectedUnitRangeEl.textContent = '-';
        selectedUnitFireRateEl.textContent = '-';
        selectedUnitDescriptionEl.textContent = '-'; // Clear description

        if (!unit) return; // Exit if no unit is selected

        // Check if it's a placed unit (has a level) or an inventory unit
        const isPlacedUnit = unit.level !== undefined;
        const infoSource = isPlacedUnit ? unit.stats : unit;

        selectedUnitNameEl.textContent = infoSource.name;
        selectedUnitDamageEl.textContent = infoSource.damage.toFixed(1);
        selectedUnitRangeEl.textContent = infoSource.range.toFixed(1);
        selectedUnitFireRateEl.textContent = infoSource.fireRate.toFixed(1);
        selectedUnitDescriptionEl.textContent = infoSource.description; // Set description

        if (isPlacedUnit) {
            selectedUnitLevelEl.textContent = unit.level;
            statPointsEl.textContent = unit.statPoints;
            upgradePanel.classList.remove('hidden');

            

            if (unit.level >= 5) {
                upgradeButton.disabled = true;
                upgradeButton.textContent = '최대 레벨';
            } else {
                const rarity = unit.stats.rarity;
                const cost = upgradeCosts[rarity][unit.level - 1];
                upgradeButton.disabled = false;
                upgradeButton.textContent = `업그레이드 (비용: ${cost})`;
            }

            statButtons.querySelectorAll('button').forEach(btn => {
                btn.disabled = unit.statPoints === 0;
            });
        }
    }

    function updateEnemyInfoPanel(enemy) {
        if (enemy) {
            enemyInfoPanel.classList.remove('hidden');
            // Find the key name for the enemy type object
            const typeName = Object.keys(enemyTypes).find(key => enemyTypes[key] === enemy.type);
            enemyTypeNameEl.textContent = typeName;
            enemyHealthEl.textContent = `${enemy.health.toFixed(0)} / ${enemy.maxHealth}`;
            enemySpeedEl.textContent = enemy.speed;
        } else {
            enemyInfoPanel.classList.add('hidden');
        }
    }

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const gridX = Math.floor(x / tileSize) * tileSize + tileSize / 2;
        const gridY = Math.floor(y / tileSize) * tileSize + tileSize / 2;

        // Priority 0: Moving an existing unit
        if (isMovingUnit) {
            // Prevent placing on path
            if (isPointOnPath(gridX, gridY)) {
                showNotification('경로 위에는 유닛을 이동할 수 없습니다.');
                return;
            }
            
            // Prevent placing on other units
            for(const unit of units) {
                if(unit !== selectedPlacedUnit && unit.x === gridX && unit.y === gridY) { // Check against other units
                    showNotification('다른 유닛 위에 이동할 수 없습니다.');
                    return;
                }
            }

            // Move the unit
            selectedPlacedUnit.x = gridX;
            selectedPlacedUnit.y = gridY;
            selectedPlacedUnit.isMoving = false; // Exit moving state
            selectedPlacedUnit.isSelected = true; // Re-select after move
            isMovingUnit = false; // Reset moving flag
            updateSelectedUnitInfo(selectedPlacedUnit); // Update info panel
            showNotification('유닛 이동 완료!');
            return; // Exit after moving
        }

        // Priority 1: Placing a unit from inventory
        if (placingUnit) {
            // Prevent placing on path
            if (isPointOnPath(gridX, gridY)) {
                showNotification('경로 위에는 유닛을 배치할 수 없습니다.');
                return;
            }
            
            // Prevent placing on other units
            for(const unit of units) {
                if(unit.x === gridX && unit.y === gridY) {
                    showNotification('다른 유닛 위에 배치할 수 없습니다.');
                    return;
                }
            }

            // Check tower limit
            const maxTowers = isHardMode ? 10 : 6;
            if (units.length >= maxTowers) {
                showNotification(`타워 최대 수 (${maxTowers}개)에 도달했습니다.`);
                return;
            }

            // Check legendary tower limit
            const towerInfo = towerData[placingUnit.id];
            if (towerInfo.rarity === 'legendary') {
                const legendaryTowersCount = units.filter(unit => towerData[unit.towerId].rarity === 'legendary').length;
                if (legendaryTowersCount >= 2) {
                    showNotification('전설 타워는 최대 2개까지만 설치할 수 있습니다.');
                    return;
                }
            }

            const TowerClass = towerClasses[placingUnit.id];
            units.push(new TowerClass(gridX, gridY, placingUnit.id));

            // Remove from inventory
            const unitIcon = document.querySelector(`.unit-icon[data-tower-id='${placingUnit.id}']`);
            if (unitIcon) {
                unitIcon.remove();
            }
            placingUnit = null;
            updateSelectedUnitInfo(null);
            const currentlySelectedIcon = document.querySelector('.unit-icon.selected');
            if (currentlySelectedIcon) currentlySelectedIcon.classList.remove('selected');
            return; // Exit after placing
        }

        // Priority 2: Clicking on an existing unit
        let clickedOnSomething = false;
        for (const unit of units) {
            const distance = Math.sqrt(Math.pow(unit.x - x, 2) + Math.pow(unit.y - y, 2));
            if (distance < unit.width / 2) {
                if (selectedPlacedUnit) selectedPlacedUnit.isSelected = false; // Deselect old
                if (selectedEnemy) selectedEnemy = null; // Deselect enemy
                
                unit.isSelected = true;
                selectedPlacedUnit = unit;
                
                updateSelectedUnitInfo(selectedPlacedUnit);
                updateEnemyInfoPanel(null);
                clickedOnSomething = true;
                break;
            }
        }

        if (clickedOnSomething) return;

        // Priority 3: Clicking on an enemy
        for (const enemy of enemies) {
            const distance = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
            if (distance < enemy.width / 2) {
                if (selectedPlacedUnit) selectedPlacedUnit.isSelected = false; // Deselect unit
                selectedEnemy = enemy;

                updateSelectedUnitInfo(null);
                updateEnemyInfoPanel(selectedEnemy);
                clickedOnSomething = true;
                break;
            }
        }

        if (clickedOnSomething) return;

        // Priority 4: Clicking on empty space
        if (selectedPlacedUnit) {
            selectedPlacedUnit.isSelected = false;
            selectedPlacedUnit = null;
        }
        if (selectedEnemy) {
            selectedEnemy = null;
        }
        updateSelectedUnitInfo(null);
        updateEnemyInfoPanel(null);
    }

    function loadMap(mapName) {
        currentPath = maps[mapName];
        // Reset game state
        enemies = [];
        units = [];
        projectiles = [];
        health = 20;
        currency = 100;
        wave = 0;
        frameCount = 0;
        selectedPlacedUnit = null;
        if (placingUnit) {
            const currentlySelectedIcon = document.querySelector('.unit-icon.selected');
            if (currentlySelectedIcon) currentlySelectedIcon.classList.remove('selected');
            placingUnit = null;
        }
        startWaveButton.disabled = false;
        waveSpawning = false;
        updateSelectedUnitInfo(null);
        updateUI();

        // Update active button style
        document.querySelectorAll('.map-button').forEach(btn => {
            if (btn.dataset.map === mapName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function handleSellUnit() {
        if (!selectedPlacedUnit) {
            showNotification('판매할 유닛을 선택하세요.');
            return;
        }

        const unitIndex = units.indexOf(selectedPlacedUnit);
        if (unitIndex > -1) {
            units.splice(unitIndex, 1); // Remove the unit
            currency += 30; // Add 30 currency
            flashElement(currencyEl, 'green');
            showNotification('유닛 판매! +30 재화');
        }

        // Deselect and update UI
        selectedPlacedUnit = null;
        updateSelectedUnitInfo(null);
        updateUI();
    }

    let isMovingUnit = false; // New state variable

    function handleMoveUnit() {
        if (!selectedPlacedUnit) {
            showNotification('이동할 유닛을 선택하세요.');
            return;
        }

        if (currency < 30) {
            showNotification('이동 비용이 부족합니다! (30 재화 필요)');
            return;
        }

        currency -= 30;
        flashElement(currencyEl, 'red');
        showNotification('이동할 위치를 선택하세요.');

        isMovingUnit = true;
        selectedPlacedUnit.isMoving = true; 
        selectedPlacedUnit.isSelected = false; 
        updateSelectedUnitInfo(null); 
        updateUI();
    }

    function handleStickyTiles() {
        for (let i = stickyTiles.length - 1; i >= 0; i--) {
            const tile = stickyTiles[i];
            tile.update();
            tile.draw();

            // Check for enemies on this sticky tile
            // If there's a stuck enemy, check if it's still on the tile. If not, release it.
            if (tile.stuckEnemy) {
                const stuckEnemyTileX = Math.floor(tile.stuckEnemy.x / tileSize) * tileSize + tileSize / 2;
                const stuckEnemyTileY = Math.floor(tile.stuckEnemy.y / tileSize) * tileSize + tileSize / 2;
                if (stuckEnemyTileX !== tile.x || stuckEnemyTileY !== tile.y) {
                    tile.stuckEnemy.isStuck = false; // Release old enemy
                    tile.stuckEnemy.slowed = false; // Release slow
                    tile.stuckEnemy = null;
                }
            }

            if (!tile.stuckEnemy) { // Only try to stick if no enemy is currently stuck or just released
                for (let enemy of enemies) {
                    const enemyTileX = Math.floor(enemy.x / tileSize) * tileSize + tileSize / 2;
                    const enemyTileY = Math.floor(enemy.y / tileSize) * tileSize + tileSize / 2;

                    if (enemyTileX === tile.x && enemyTileY === tile.y) {
                        enemy.isStuck = true;
                        enemy.slowed = true; // Sticky tiles also slow
                        enemy.slowTimer = tile.duration; // Slow for the tile's duration
                        enemy.appliedSlowFactor = 0.01; // Very strong slow (99% slow)
                        tile.stuckEnemy = enemy;
                        break; // Only stick one enemy per tile
                    }
                }
            }

            if (tile.duration <= 0) {
                if (tile.stuckEnemy) {
                    tile.stuckEnemy.isStuck = false; // Release enemy when tile expires
                    tile.stuckEnemy.slowed = false; // Release slow
                }
                stickyTiles.splice(i, 1);
            }
        }
    }

    function handleUpgrade() {
        if (!selectedPlacedUnit || selectedPlacedUnit.level >= 5) return;

        const rarity = selectedPlacedUnit.stats.rarity;
        const cost = upgradeCosts[rarity][selectedPlacedUnit.level - 1];

        if (currency < cost) {
            showNotification('업그레이드 비용이 부족합니다!');
            return;
        }

        currency -= cost;
        flashElement(currencyEl, 'red');
        selectedPlacedUnit.level++;
        selectedPlacedUnit.statPoints++;

        // Sword Tower damage at level 3
        if (selectedPlacedUnit.towerId === 'sword' && selectedPlacedUnit.level === 3) {
            selectedPlacedUnit.stats.damage = 55;
        }

        // Bomb Tower blast radius scaling
        if (selectedPlacedUnit.towerId === 'bomb') {
            const baseBlastRadius = towerData.bomb.blastRadius; // Get original blast radius
            if (selectedPlacedUnit.level === 5) {
                selectedPlacedUnit.stats.blastRadius = baseBlastRadius * 2;
            } else {
                // Calculate 1.2x per level up to level 4
                selectedPlacedUnit.stats.blastRadius = baseBlastRadius * Math.pow(1.2, selectedPlacedUnit.level - 1);
            }
        }

        playSound('upgrade');
        updateSelectedUnitInfo(selectedPlacedUnit);
        updateUI();
    }

    function handleStatAllocation(e) {
        if (!selectedPlacedUnit || selectedPlacedUnit.statPoints <= 0) return;

        const stat = e.target.dataset.stat;
        selectedPlacedUnit.statPoints--;

        switch (stat) {
            case 'damage':
                if (selectedPlacedUnit.towerId !== 'laser') { // Prevent damage upgrade for Laser Tower
                    selectedPlacedUnit.stats.damage += 5;
                } else {
                    showNotification('레이저 발사기는 공격력 업그레이드가 불가능합니다.');
                    selectedPlacedUnit.statPoints++; // Refund stat point
                }
                break;
            case 'range':
                selectedPlacedUnit.stats.range += 10;
                if (selectedPlacedUnit.stats.range >= 140) {
                    selectedPlacedUnit.stats.canSeeTransparent = true;
                }
                break;
            case 'fireRate':
                selectedPlacedUnit.stats.fireRate = Math.max(5, selectedPlacedUnit.stats.fireRate - 3); // Prevent it from being too fast
                break;
        }
        updateSelectedUnitInfo(selectedPlacedUnit);
    }

    // --- Game Loop ---
    let frameCount = 0;
    let animationFrameId;
    function gameLoop() {
        if (isGameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, mapWidth, mapHeight);
            ctx.fillStyle = "white";
            ctx.font = "60px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", mapWidth / 2, mapHeight / 2);
            cancelAnimationFrame(animationFrameId);
            return;
        }

        animationFrameId = requestAnimationFrame(gameLoop);

        ctx.clearRect(0, 0, mapWidth, mapHeight);

        drawMap();
        handleEnemies();
        handleUnits();
        handleProjectiles();
        handleExplosions();
        handleStickyTiles(); // Call the new function
        updateUI();
        if (selectedEnemy) {
            updateEnemyInfoPanel(selectedCTED_ENEMY);
        }

        // Check if the wave is over to re-enable the button
        if (!waveSpawning && enemies.length === 0 && wave < waves.length) {
            startWaveButton.disabled = false;
        }

        if (health <= 0) {
            isGameOver = true;
        }

        frameCount++;
    }

    // --- Event Listeners ---
    gachaButton.addEventListener('click', performGacha);
    startWaveButton.addEventListener('click', startNextWave);
    canvas.addEventListener('click', handleCanvasClick);
    upgradeButton.addEventListener('click', handleUpgrade);
    statButtons.addEventListener('click', handleStatAllocation);

    // New event listeners for sell and move buttons
    sellUnitButton = document.getElementById('sell-unit-button');
    moveUnitButton = document.getElementById('move-unit-button');
    if (sellUnitButton) { // Ensure button exists before attaching listener
        sellUnitButton.addEventListener('click', handleSellUnit);
    }
    if (moveUnitButton) { // Ensure button exists before attaching listener
        moveUnitButton.addEventListener('click', handleMoveUnit);
    }

    document.querySelectorAll('.map-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            loadMap(e.target.dataset.map);
        });
    });

    // Start the game
    loadMap('map1'); // Load default map
    gameLoop();
});