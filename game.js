// Game Engine, Physics, AI, Controls, and Scene Rendering

class RobotVsCatGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 960;
        this.height = 540;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.groundY = 470;
        this.fence = {
            x: 455,
            y: 260,
            width: 50,
            height: 210
        };

        // Players
        this.robot = new Character(true, 140, this.groundY);
        this.cat = new Character(false, 820, this.groundY);

        // Turn Management
        this.gameMode = '1p_robot'; // '1p_robot' (Player=Robot), '1p_cat' (Player=Cat), '2p' (Local 2-Player)
        this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.currentTurn = 'robot'; // 'robot' or 'cat'
        this.turnState = 'aiming'; // 'aiming', 'charging', 'projectile_in_flight', 'resolving', 'game_over'
        this.turnBannerTimer = 1.5;
        this.turnBannerText = 'ROBO-X TURN';

        // Wind: range from -6 (blowing left) to +6 (blowing right)
        this.wind = 0;
        this.randomizeWind();

        // Throwing controls
        this.robotAngle = 55; // degrees from horizontal (aiming right)
        this.catAngle = 55;   // degrees from horizontal (aiming left)
        this.charge = 0;
        this.chargeDir = 1; // 1 for charging up, -1 for charging down
        this.isCharging = false;

        // Projectiles and effects
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.comicBursts = [];
        this.queuedProjectiles = [];
        this.queueTimer = 0;

        // Swirling Park Foliage (Wind-blown leaves & petals)
        this.leaves = Array.from({ length: 24 }, () => new ParkLeaf(this.width, this.height, true));

        // Power-ups per player (inventory)
        this.powerUps = {
            robot: {
                double: { name: 'Double Shot', count: 1, icon: '⚡x2' },
                mega: { name: 'Mega Bomb', count: 1, icon: '💣' },
                heal: { name: 'Recharge', count: 1, icon: '🔋' },
                windNegator: { name: 'Laser Core', count: 1, icon: '🚀' }
            },
            cat: {
                double: { name: 'Double Bone', count: 1, icon: '🍗x2' },
                mega: { name: 'Dino Bone', count: 1, icon: '🍖' },
                heal: { name: 'Tuna Feast', count: 1, icon: '🐟' },
                windNegator: { name: 'Aero Bone', count: 1, icon: '✨' }
            }
        };
        this.activePowerUp = {
            robot: null,
            cat: null
        };

        // Scenery: clouds
        this.clouds = [
            { x: 80, y: 70, s: 0.9, v: 12 },
            { x: 380, y: 110, s: 1.2, v: 8 },
            { x: 720, y: 60, s: 0.7, v: 15 }
        ];

        // AI timing
        this.aiTimer = 0;
        this.aiTargetCharge = 0;

        // Loop timing
        this.lastTime = performance.now();

        // Setup input listeners
        this.initInput();
        this.updateHUD();

        // Start animation loop
        requestAnimationFrame(this.loop.bind(this));
    }

    randomizeWind() {
        // Wind between -5.5 and +5.5
        this.wind = Math.round((Math.random() * 11 - 5.5) * 10) / 10;
        if (Math.abs(this.wind) < 0.4) this.wind = 0.5; // avoid dead zero
    }

    getCurrentAngle() {
        return this.currentTurn === 'robot' ? this.robotAngle : this.catAngle;
    }

    setCurrentAngle(angle) {
        if (this.currentTurn === 'robot') {
            this.robotAngle = Math.max(25, Math.min(85, angle));
        } else {
            this.catAngle = Math.max(25, Math.min(85, angle));
        }
        const valEl = document.getElementById('angleValue');
        if (valEl) valEl.innerText = this.getCurrentAngle() + '°';
        const rangeEl = document.getElementById('angleInput');
        if (rangeEl) rangeEl.value = this.getCurrentAngle();
    }

    isCurrentPlayerAI() {
        if (this.gameMode === '2p') return false;
        if (this.gameMode === '1p_robot') return this.currentTurn === 'cat';
        if (this.gameMode === '1p_cat') return this.currentTurn === 'robot';
        return false;
    }

    initInput() {
        const throwBtn = document.getElementById('throwBtn');
        const angleUpBtn = document.getElementById('angleUpBtn');
        const angleDownBtn = document.getElementById('angleDownBtn');

        // Tactile Stepper buttons (No sterile sliders!)
        if (angleUpBtn) {
            angleUpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setCurrentAngle(this.getCurrentAngle() + 2);
                window.soundEngine.playBoing();
            });
        }
        if (angleDownBtn) {
            angleDownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setCurrentAngle(this.getCurrentAngle() - 2);
                window.soundEngine.playBoing();
            });
        }

        // Direct Drag-to-Aim on Canvas (intuitive like modern games)
        let isDraggingAim = false;
        const updateAimFromPointer = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (clientX - rect.left) * (this.width / rect.width);
            const mouseY = (clientY - rect.top) * (this.height / rect.height);
            const activeChar = this.currentTurn === 'robot' ? this.robot : this.cat;
            const origin = activeChar.getThrowOrigin();

            const isRobot = this.currentTurn === 'robot';
            const dx = isRobot ? (mouseX - origin.x) : (origin.x - mouseX);
            const dy = origin.y - mouseY;

            if (dx > 8 && dy > 8) {
                const rad = Math.atan2(dy, dx);
                const deg = Math.round((rad * 180) / Math.PI);
                this.setCurrentAngle(deg);
            }
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isCurrentPlayerAI() || this.turnState !== 'aiming') return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (this.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (this.height / rect.height);
            const activeChar = this.currentTurn === 'robot' ? this.robot : this.cat;

            // If clicked near character, begin charging throw!
            if (Math.abs(mouseX - activeChar.x) < 70 && Math.abs(mouseY - activeChar.y) < 95) {
                this.beginCharging();
            } else {
                // Otherwise, drag to aim
                isDraggingAim = true;
                updateAimFromPointer(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingAim && !this.isCharging) {
                updateAimFromPointer(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', (e) => {
            isDraggingAim = false;
            if (this.isCharging) {
                this.releaseCharge();
            }
        });

        // Touch on Canvas (Mobile & Tablet)
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isCurrentPlayerAI() || this.turnState !== 'aiming') return;
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchX = (touch.clientX - rect.left) * (this.width / rect.width);
                const touchY = (touch.clientY - rect.top) * (this.height / rect.height);
                const activeChar = this.currentTurn === 'robot' ? this.robot : this.cat;

                if (Math.abs(touchX - activeChar.x) < 70 && Math.abs(touchY - activeChar.y) < 95) {
                    this.beginCharging();
                } else {
                    isDraggingAim = true;
                    updateAimFromPointer(touch.clientX, touch.clientY);
                }
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isDraggingAim && !this.isCharging && e.touches.length > 0) {
                updateAimFromPointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            isDraggingAim = false;
            if (this.isCharging) {
                this.releaseCharge();
            }
        }, { passive: true });

        // Throw button press handlers
        if (throwBtn) {
            const startCharge = (e) => {
                if (e) e.preventDefault();
                if (this.isCurrentPlayerAI() || this.turnState !== 'aiming') return;
                this.beginCharging();
            };

            const stopCharge = (e) => {
                if (e) e.preventDefault();
                if (this.isCharging) {
                    this.releaseCharge();
                }
            };

            throwBtn.addEventListener('mousedown', startCharge);
            window.addEventListener('mouseup', stopCharge);
            throwBtn.addEventListener('touchstart', startCharge, { passive: false });
            window.addEventListener('touchend', stopCharge, { passive: false });
        }

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                if (!this.isCurrentPlayerAI() && this.turnState === 'aiming') {
                    e.preventDefault();
                    this.beginCharging();
                }
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.setCurrentAngle(this.getCurrentAngle() + 2);
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                this.setCurrentAngle(this.getCurrentAngle() - 2);
            } else if (e.code === 'Digit1') {
                this.usePowerUp('double');
            } else if (e.code === 'Digit2') {
                this.usePowerUp('mega');
            } else if (e.code === 'Digit3') {
                this.usePowerUp('heal');
            } else if (e.code === 'Digit4') {
                this.usePowerUp('windNegator');
            } else if (e.code === 'Escape') {
                const pauseModal = document.getElementById('pauseMenuModal');
                if (pauseModal) pauseModal.classList.toggle('active');
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isCharging) {
                e.preventDefault();
                this.releaseCharge();
            }
        });

        // Power-up buttons setup
        this.setupPowerUpButtons();
    }

    setupPowerUpButtons() {
        ['double', 'mega', 'heal', 'windNegator'].forEach(type => {
            const btn = document.getElementById(`pwr_${type}`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.usePowerUp(type);
                });
            }
        });
    }

    usePowerUp(type) {
        if (this.isCurrentPlayerAI() || this.turnState !== 'aiming') return;
        const side = this.currentTurn;
        const item = this.powerUps[side][type];

        if (!item || item.count <= 0) return;

        if (window.gameAnalytics) {
            window.gameAnalytics.trackPowerUp(side, type);
        }

        if (type === 'heal') {
            item.count--;
            const char = side === 'robot' ? this.robot : this.cat;
            char.setHp(char.hp + 30);
            window.soundEngine.playHeal(side === 'robot');
            this.floatingTexts.push(new FloatingText({
                x: char.x,
                y: char.y - 70,
                text: '+30 HP!',
                color: '#2ecc71',
                fontSize: 22
            }));
            this.createHealParticles(char.x, char.y - 30);
            this.updateHUD();
            // Using heal consumes the turn
            this.turnState = 'resolving';
            setTimeout(() => this.switchTurn(), 1200);
            return;
        }

        // Projectile modifiers
        if (this.activePowerUp[side] === type) {
            // Deselect
            this.activePowerUp[side] = null;
        } else {
            this.activePowerUp[side] = type;
            window.soundEngine.playPowerUp();
        }
        this.updateHUD();
    }

    beginCharging() {
        this.isCharging = true;
        this.charge = 0;
        this.chargeDir = 1;
        this.turnState = 'charging';
        const isRobot = this.currentTurn === 'robot';
        const char = isRobot ? this.robot : this.cat;
        char.setState('charging');
        window.soundEngine.startMusic();
        window.soundEngine.playBoing();
        window.soundEngine.startCharge(isRobot);
    }

    releaseCharge() {
        if (!this.isCharging) return;
        this.isCharging = false;
        window.soundEngine.stopCharge();

        const power = this.charge;
        this.executeThrow(power);
    }

    executeThrow(power) {
        this.turnState = 'projectile_in_flight';
        const isRobot = this.currentTurn === 'robot';
        const char = isRobot ? this.robot : this.cat;
        char.setState('throwing', 0.4);

        const side = this.currentTurn;
        const activeMod = this.activePowerUp[side];

        // Consume powerup if applied
        let isDouble = false;
        let isHeavy = false;
        let ignoreWind = false;

        if (activeMod) {
            if (activeMod === 'double') isDouble = true;
            if (activeMod === 'mega') isHeavy = true;
            if (activeMod === 'windNegator') ignoreWind = true;
            this.powerUps[side][activeMod].count--;
            this.activePowerUp[side] = null;
            this.updateHUD();
        }

        // Calculate velocity vector
        // Speed range: from 320 px/s to 920 px/s
        const speed = 300 + power * 650;
        const angleDeg = isRobot ? this.robotAngle : this.catAngle;
        const angleRad = (angleDeg * Math.PI) / 180;

        const vx = Math.cos(angleRad) * speed * (isRobot ? 1 : -1);
        const vy = -Math.sin(angleRad) * speed;

        const origin = char.getThrowOrigin();

        window.soundEngine.playThrow(isRobot);

        if (window.gameAnalytics) {
            window.gameAnalytics.trackThrow(side, angleDeg, power * 100, this.wind, activeMod);
        }

        const proj = new Projectile({
            x: origin.x,
            y: origin.y,
            vx: vx,
            vy: vy,
            type: isRobot ? 'ball' : 'bone',
            isHeavy: isHeavy,
            ignoreWind: ignoreWind,
            damage: isHeavy ? 45 : 25
        });

        this.projectiles.push(proj);

        // If double shot, queue second projectile
        if (isDouble) {
            this.queuedProjectiles.push({
                x: origin.x,
                y: origin.y,
                vx: vx * 1.05,
                vy: vy * 0.96,
                type: isRobot ? 'ball' : 'bone',
                isHeavy: false,
                ignoreWind: ignoreWind,
                damage: 20,
                delay: 0.22
            });
        }
    }

    updateAI(dt) {
        if (!this.isCurrentPlayerAI()) return;

        if (this.turnState === 'aiming') {
            this.aiTimer += dt;
            if (this.aiTimer > 0.8) {
                // Strategic AI: Calculate needed launch power!
                const isRobot = this.currentTurn === 'robot';
                const source = isRobot ? this.robot : this.cat;
                const target = isRobot ? this.cat : this.robot;

                // AI considers power-ups
                const side = this.currentTurn;
                const myHp = source.hp;
                const targetHp = target.hp;

                if (myHp <= 40 && this.powerUps[side].heal.count > 0 && Math.random() < 0.65) {
                    this.usePowerUp('heal');
                    this.aiTimer = 0;
                    return;
                }

                if (targetHp <= 45 && this.powerUps[side].mega.count > 0 && Math.random() < 0.7) {
                    this.activePowerUp[side] = 'mega';
                } else if (Math.abs(this.wind) > 3.0 && this.powerUps[side].windNegator.count > 0 && Math.random() < 0.5) {
                    this.activePowerUp[side] = 'windNegator';
                } else if (this.powerUps[side].double.count > 0 && Math.random() < 0.4) {
                    this.activePowerUp[side] = 'double';
                }

                // Physics simulation solver for ideal charge
                const dist = Math.abs(target.x - source.x);
                const angleDeg = isRobot ? this.robotAngle : this.catAngle;
                const angleRad = (angleDeg * Math.PI) / 180;

                // Standard projectile range formula estimation + wind adjustment:
                // R ~ (v^2 * sin(2*theta)) / g + wind_adjustment
                const g = 550;
                const sin2Theta = Math.sin(2 * angleRad);
                const windAssist = isRobot ? this.wind : -this.wind;

                let idealSpeed = Math.sqrt((dist * g) / sin2Theta);
                // Adjust for wind
                idealSpeed -= windAssist * 32;

                // Invert speed to charge (speed = 300 + charge * 650)
                let idealCharge = (idealSpeed - 300) / 650;
                idealCharge = Math.max(0.15, Math.min(0.98, idealCharge));

                // Add variance based on AI difficulty
                let variance = 0;
                if (this.aiDifficulty === 'easy') {
                    variance = (Math.random() - 0.5) * 0.22;
                } else if (this.aiDifficulty === 'medium') {
                    variance = (Math.random() - 0.5) * 0.10;
                } else { // hard
                    variance = (Math.random() - 0.5) * 0.035;
                }

                this.aiTargetCharge = Math.max(0.1, Math.min(1.0, idealCharge + variance));
                this.beginCharging();
                this.aiTimer = 0;
            }
        } else if (this.turnState === 'charging' && this.isCharging) {
            if (this.charge >= this.aiTargetCharge) {
                this.releaseCharge();
            }
        }
    }

    update(dt) {
        // Cap dt to prevent frame skips
        dt = Math.min(0.05, dt);

        // Update clouds
        for (let c of this.clouds) {
            c.x += c.v * dt;
            if (c.x > this.width + 120) c.x = -120;
        }

        // Update characters
        this.robot.update(dt);
        this.cat.update(dt);

        // Update banner
        if (this.turnBannerTimer > 0) {
            this.turnBannerTimer -= dt;
        }

        // Handle charging progression
        if (this.isCharging) {
            const chargeSpeed = 1.15; // 0 to 1 in ~0.87s
            this.charge += this.chargeDir * chargeSpeed * dt;
            if (this.charge >= 1.0) {
                this.charge = 1.0;
                this.chargeDir = -1; // bounce
            } else if (this.charge <= 0.0) {
                this.charge = 0.0;
                this.chargeDir = 1;
            }

            const char = this.currentTurn === 'robot' ? this.robot : this.cat;
            char.chargeLevel = this.charge;

            // Update UI power bar
            document.getElementById('powerBarFill').style.width = `${Math.round(this.charge * 100)}%`;
            document.getElementById('powerText').innerText = `${Math.round(this.charge * 100)}%`;
        }

        // Handle AI
        this.updateAI(dt);

        // Handle queued double projectiles
        if (this.queuedProjectiles.length > 0) {
            const queued = this.queuedProjectiles[0];
            queued.delay -= dt;
            if (queued.delay <= 0) {
                this.queuedProjectiles.shift();
                window.soundEngine.playThrow(this.currentTurn === 'robot');
                this.projectiles.push(new Projectile(queued));
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, this.wind, (pt) => this.particles.push(pt));

            // Collision with Middle Fence
            if (p.x >= this.fence.x && p.x <= this.fence.x + this.fence.width &&
                p.y >= this.fence.y && p.y <= this.fence.y + this.fence.height) {
                this.onFenceHit(p);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Collision with Ground
            if (p.y >= this.groundY - 5) {
                this.onGroundHit(p);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Out of horizontal bounds
            if (p.x < -60 || p.x > this.width + 60) {
                p.alive = false;
                this.projectiles.splice(i, 1);
                continue;
            }

            // Collision with Robot
            if (p.vx < 0 && Math.abs(p.x - this.robot.x) < 38 && p.y >= this.robot.y - 75 && p.y <= this.robot.y) {
                this.onCharacterHit(this.robot, p);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Collision with Cat
            if (p.vx > 0 && Math.abs(p.x - this.cat.x) < 38 && p.y >= this.cat.y - 70 && p.y <= this.cat.y) {
                this.onCharacterHit(this.cat, p);
                this.projectiles.splice(i, 1);
                continue;
            }
        }

        // Update wind foliage leaves
        for (let leaf of this.leaves) {
            leaf.update(dt, this.wind);
        }

        // Update comic bursts
        for (let i = this.comicBursts.length - 1; i >= 0; i--) {
            this.comicBursts[i].update(dt);
            if (this.comicBursts[i].life <= 0) {
                this.comicBursts.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.update(dt);
            if (pt.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update(dt);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Check if turn should switch
        if (this.turnState === 'projectile_in_flight' &&
            this.projectiles.length === 0 &&
            this.queuedProjectiles.length === 0) {
            this.turnState = 'resolving';
            setTimeout(() => {
                if (this.robot.hp > 0 && this.cat.hp > 0) {
                    this.switchTurn();
                } else {
                    this.endGame();
                }
            }, 800);
        }
    }

    onFenceHit(proj) {
        window.soundEngine.playFenceHit();
        if (window.gameAnalytics) {
            window.gameAnalytics.trackFenceCollision(this.currentTurn);
        }
        this.createFenceSparks(proj.x, proj.y);
        this.comicBursts.push(new ComicBurst({
            x: proj.x,
            y: proj.y,
            text: 'BONK!',
            color: '#f39c12',
            size: 46
        }));
        this.floatingTexts.push(new FloatingText({
            x: proj.x,
            y: proj.y - 28,
            text: 'BLOCKED!',
            color: '#f39c12',
            fontSize: 18
        }));
    }

    onGroundHit(proj) {
        window.soundEngine.playGroundHit();
        this.createGroundParticles(proj.x, this.groundY);
        this.comicBursts.push(new ComicBurst({
            x: proj.x,
            y: this.groundY - 14,
            text: 'SPLAT!',
            color: '#27ae60',
            size: 42
        }));
        this.floatingTexts.push(new FloatingText({
            x: proj.x,
            y: this.groundY - 32,
            text: 'MISS!',
            color: '#95a5a6',
            fontSize: 16
        }));
    }

    onCharacterHit(target, proj) {
        const isRobot = target.isRobot;
        const damage = proj.damage;
        target.setHp(target.hp - damage);
        target.setState('hit', 0.65);

        window.soundEngine.playHit(isRobot, proj.isHeavy);

        if (window.gameAnalytics) {
            window.gameAnalytics.trackHit(isRobot ? 'robot' : 'cat', damage, proj.isHeavy);
        }

        if (isRobot) {
            this.createRobotSparks(target.x, target.y - 40);
            const words = proj.isHeavy ? ['KAPOW!', 'CRUNCH!'] : ['CLANG!', 'WHAM!'];
            const burstText = words[Math.floor(Math.random() * words.length)];
            this.comicBursts.push(new ComicBurst({
                x: target.x,
                y: target.y - 45,
                text: burstText,
                color: '#00ffff',
                textColor: '#0b192c',
                size: 54
            }));
        } else {
            this.createCatFur(target.x, target.y - 40);
            const words = proj.isHeavy ? ['WHACK!', 'OOF!'] : ['MEOW!', 'POW!'];
            const burstText = words[Math.floor(Math.random() * words.length)];
            this.comicBursts.push(new ComicBurst({
                x: target.x,
                y: target.y - 45,
                text: burstText,
                color: '#e74c3c',
                textColor: '#ffffff',
                size: 54
            }));
        }

        this.floatingTexts.push(new FloatingText({
            x: target.x,
            y: target.y - 85,
            text: `-${damage} HP!`,
            color: proj.isHeavy ? '#e74c3c' : '#f1c40f',
            fontSize: proj.isHeavy ? 28 : 22,
            isCritical: proj.isHeavy
        }));

        this.updateHUD();
    }

    createRobotSparks(x, y) {
        const colors = ['#00ffff', '#f39c12', '#ffffff', '#e74c3c'];
        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 200;
            this.particles.push(new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 3,
                life: 0.5 + Math.random() * 0.4,
                type: 'spark'
            }));
        }
    }

    createCatFur(x, y) {
        const colors = ['#f39c12', '#ffffff', '#e67e22', '#d35400'];
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 160;
            this.particles.push(new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3.5 + Math.random() * 3,
                life: 0.6 + Math.random() * 0.4,
                type: 'fur'
            }));
        }
    }

    createFenceSparks(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            this.particles.push(new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#8d6e63',
                size: 2.5 + Math.random() * 2.5,
                life: 0.4,
                type: 'dirt'
            }));
        }
    }

    createGroundParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = -Math.PI + Math.random() * Math.PI;
            const speed = 30 + Math.random() * 90;
            this.particles.push(new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#5d6d7e',
                size: 2 + Math.random() * 3,
                life: 0.35,
                type: 'dirt'
            }));
        }
    }

    createHealParticles(x, y) {
        for (let i = 0; i < 16; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 40,
                vy: -80 - Math.random() * 80,
                color: '#2ecc71',
                size: 3 + Math.random() * 3,
                life: 0.7,
                type: 'spark'
            }));
        }
    }

    switchTurn() {
        this.currentTurn = this.currentTurn === 'robot' ? 'cat' : 'robot';
        this.turnState = 'aiming';
        this.isCharging = false;
        this.charge = 0;
        this.aiTimer = 0;
        document.getElementById('powerBarFill').style.width = '0%';
        document.getElementById('powerText').innerText = '0%';

        this.randomizeWind();

        const name = this.currentTurn === 'robot' ? 'ROBO-X' : 'FELIX';
        this.turnBannerText = `${name}'S TURN`;
        this.turnBannerTimer = 1.3;

        document.getElementById('angleInput').value = this.getCurrentAngle();
        document.getElementById('angleValue').innerText = this.getCurrentAngle() + '°';

        this.updateHUD();
    }

    endGame() {
        this.turnState = 'game_over';
        const robotWon = this.robot.hp > 0;
        if (robotWon) {
            this.robot.setState('victory');
            this.cat.setState('defeat');
        } else {
            this.cat.setState('victory');
            this.robot.setState('defeat');
        }

        window.soundEngine.playVictory(robotWon);

        if (window.gameAnalytics) {
            window.gameAnalytics.trackMatchEnd(robotWon ? 'robot' : 'cat');
        }

        const modal = document.getElementById('gameOverModal');
        const winnerTitle = document.getElementById('winnerTitle');
        const winnerMsg = document.getElementById('winnerMsg');

        if (winnerTitle) {
            winnerTitle.innerText = robotWon ? '🤖 ROBO-X WINS!' : '🐱 FELIX CAT WINS!';
            winnerTitle.style.color = robotWon ? '#00d2ff' : '#ff9f43';
        }
        if (winnerMsg) {
            winnerMsg.innerText = robotWon
                ? 'Mechanical supremacy achieved! The metal ball reigns supreme.'
                : 'Feline dexterity prevailed! The chicken bone struck true.';
        }

        if (modal) {
            modal.classList.add('active');
            modal.classList.add('visible');
        }
    }

    restart() {
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.remove('active');
            gameOverModal.classList.remove('visible');
        }
        const pauseModal = document.getElementById('pauseMenuModal');
        if (pauseModal) pauseModal.classList.remove('active');

        this.robot.setHp(100);
        this.cat.setHp(100);
        this.robot.setState('idle');
        this.cat.setState('idle');

        // Reset inventories
        this.powerUps.robot.double.count = 1;
        this.powerUps.robot.mega.count = 1;
        this.powerUps.robot.heal.count = 1;
        this.powerUps.robot.windNegator.count = 1;

        this.powerUps.cat.double.count = 1;
        this.powerUps.cat.mega.count = 1;
        this.powerUps.cat.heal.count = 1;
        this.powerUps.cat.windNegator.count = 1;

        this.activePowerUp.robot = null;
        this.activePowerUp.cat = null;

        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.comicBursts = [];
        this.queuedProjectiles = [];

        this.currentTurn = 'robot';
        this.turnState = 'aiming';
        this.isCharging = false;
        this.charge = 0;
        this.turnBannerTimer = 1.5;
        this.turnBannerText = 'ROBO-X TURN';

        this.randomizeWind();
        this.updateHUD();
    }

    updateHUD() {
        // Update HP Bars
        const robotHpPct = (this.robot.hp / this.robot.maxHp) * 100;
        const catHpPct = (this.cat.hp / this.cat.maxHp) * 100;

        const rBar = document.getElementById('robotHpBar');
        if (rBar) rBar.style.width = `${robotHpPct}%`;
        const rText = document.getElementById('robotHpText');
        if (rText) rText.innerText = `${Math.ceil(this.robot.hp)} HP`;

        const cBar = document.getElementById('catHpBar');
        if (cBar) cBar.style.width = `${catHpPct}%`;
        const cText = document.getElementById('catHpText');
        if (cText) cText.innerText = `${Math.ceil(this.cat.hp)} HP`;

        // Update Turn Indicator Pill
        const turnBadge = document.getElementById('turnBadge');
        if (turnBadge) {
            if (this.currentTurn === 'robot') {
                turnBadge.innerText = "🤖 ROBO-X'S TURN";
                turnBadge.className = 'turn-pill robot-turn';
            } else {
                turnBadge.innerText = "🐱 FELIX'S TURN";
                turnBadge.className = 'turn-pill cat-turn';
            }
        }

        // Cartoon Weather Vane & Wind Display (NO scientific m/s readout!)
        const windArrowIcon = document.getElementById('windArrowIcon');
        const windTextLabel = document.getElementById('windTextLabel');
        const windMag = Math.abs(this.wind);

        if (windArrowIcon && windTextLabel) {
            let label = "CALM ☁";
            if (windMag >= 4.0) label = "STORM GALE! 💨";
            else if (windMag >= 2.0) label = "STRONG GUST 🍃";
            else if (windMag >= 0.5) label = "GENTLE BREEZE 🌸";

            if (this.wind > 0.4) {
                windArrowIcon.innerHTML = '➔';
                windArrowIcon.style.color = '#38bdf8';
                windTextLabel.innerText = `${label} ➔`;
            } else if (this.wind < -0.4) {
                windArrowIcon.innerHTML = '⬅';
                windArrowIcon.style.color = '#ff9f43';
                windTextLabel.innerText = `⬅ ${label}`;
            } else {
                windArrowIcon.innerHTML = '●';
                windArrowIcon.style.color = '#a5b4fc';
                windTextLabel.innerText = "CALM ☁";
            }
        }

        // Angle Display
        const angleValue = document.getElementById('angleValue');
        if (angleValue) {
            angleValue.innerText = `${this.getCurrentAngle()}°`;
        }

        // Power-ups for current player
        const side = this.currentTurn;
        const isAI = this.isCurrentPlayerAI();

        const cardNames = {
            robot: { double: 'DOUBLE', mega: 'MEGA', heal: 'REPAIR', windNegator: 'LASER' },
            cat: { double: 'DOUBLE', mega: 'DINO', heal: 'FEAST', windNegator: 'AERO' }
        };

        ['double', 'mega', 'heal', 'windNegator'].forEach(type => {
            const btn = document.getElementById(`pwr_${type}`);
            const countEl = document.getElementById(`count_${type}`);
            const item = this.powerUps[side][type];

            if (btn && item) {
                const nameEl = btn.querySelector('.card-name');
                if (nameEl) {
                    nameEl.innerText = cardNames[side][type] || item.name;
                }
                if (countEl) countEl.innerText = `x${item.count}`;
                const isSelected = this.activePowerUp[side] === type;
                btn.classList.toggle('active-selected', isSelected);
                btn.disabled = item.count <= 0 || isAI;
            }
        });

        // Throw button state
        const throwBtn = document.getElementById('throwBtn');
        if (throwBtn) {
            const btnLabel = throwBtn.querySelector('.btn-label') || throwBtn;
            throwBtn.disabled = isAI || (this.turnState !== 'aiming' && !this.isCharging);
            btnLabel.innerText = isAI ? '🤖 AI THINKING...' : 'HOLD TO THROW';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Park Environment (Sky, Sunbeams, Hills, Trees, Props)
        this.drawEnvironment();

        // 2. Middle Park Picket Fence with Climbing Ivy & Flowers
        this.drawMiddleFence();

        // 3. Characters
        this.robot.draw(this.ctx);
        this.cat.draw(this.ctx);

        // 4. Aiming Guides (dotted angle indicator for active player)
        this.drawAimGuide();

        // 5. Projectiles
        for (let p of this.projectiles) {
            p.draw(this.ctx);
        }

        // 6. Particles (sparks, fur, sauce, smoke, sweat)
        for (let pt of this.particles) {
            pt.draw(this.ctx);
        }

        // 7. Swirling Wind-blown Leaves & Petals
        for (let leaf of this.leaves) {
            leaf.draw(this.ctx);
        }

        // 8. Comic Action Starburst Bursts ("POW!", "WHAM!", "BONK!")
        for (let b of this.comicBursts) {
            b.draw(this.ctx);
        }

        // 9. Floating Damage and Notification Texts
        for (let ft of this.floatingTexts) {
            ft.draw(this.ctx);
        }

        // 10. Big Turn Announcement Banner
        if (this.turnBannerTimer > 0) {
            this.drawTurnBanner();
        }
    }

    drawEnvironment() {
        const ctx = this.ctx;
        const t = this.animTime || 0;

        // --- 1. Sunny Park Sky ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.5, '#7dd3fc');
        skyGrad.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.groundY);

        // --- 2. Smiling Warm Sun & Translucent Sunbeams ---
        const sunX = this.width / 2;
        const sunY = 65;

        // Rotating soft sunbeams
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate((performance.now() / 1000) * 0.08);
        ctx.fillStyle = 'rgba(255, 250, 101, 0.08)';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const a1 = (i * Math.PI) / 6;
            const a2 = a1 + 0.22;
            ctx.lineTo(Math.cos(a1) * 700, Math.sin(a1) * 700);
            ctx.lineTo(Math.cos(a2) * 700, Math.sin(a2) * 700);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Golden Sun Disk
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cute smiling cartoon sun face
        ctx.fillStyle = '#854d0e';
        // Eyes
        ctx.beginPath();
        ctx.arc(sunX - 10, sunY - 4, 3, 0, Math.PI * 2);
        ctx.arc(sunX + 10, sunY - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        // Rosy cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(sunX - 14, sunY + 4, 4.5, 0, Math.PI * 2);
        ctx.arc(sunX + 14, sunY + 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Happy smile arc
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(sunX, sunY + 3, 9, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // --- 3. Fluffy Cartoon Clouds ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        for (let c of this.clouds) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(c.s, c.s);
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.arc(22, -8, 20, 0, Math.PI * 2);
            ctx.arc(44, 0, 24, 0, Math.PI * 2);
            ctx.arc(22, 12, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- 4. Distant Rolling Park Hills & Distant Silhouettes ---
        // Back Hills (Dusty Sage Green)
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.quadraticCurveTo(240, this.groundY - 110, 480, this.groundY - 55);
        ctx.quadraticCurveTo(720, this.groundY - 120, this.width, this.groundY);
        ctx.fill();

        // Distant Little Park Trees along the ridges
        ctx.fillStyle = '#4ade80';
        [80, 160, 260, 680, 780, 890].forEach(tx => {
            ctx.beginPath();
            ctx.arc(tx, this.groundY - 60, 12, 0, Math.PI * 2);
            ctx.fill();
        });

        // Mid Hills (Lush Green)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.quadraticCurveTo(300, this.groundY - 60, 600, this.groundY - 35);
        ctx.quadraticCurveTo(800, this.groundY - 55, this.width, this.groundY);
        ctx.fill();

        // --- 5. Main Park Lawn & Curved Cobblestone Path ---
        const grassGrad = ctx.createLinearGradient(0, this.groundY - 10, 0, this.height);
        grassGrad.addColorStop(0, '#16a34a');
        grassGrad.addColorStop(0.3, '#15803d');
        grassGrad.addColorStop(1, '#14532d');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

        // Cobblestone Walking Path winding through the center
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(430, this.groundY);
        ctx.quadraticCurveTo(460, this.groundY + 30, 420, this.height);
        ctx.lineTo(540, this.height);
        ctx.quadraticCurveTo(510, this.groundY + 30, 530, this.groundY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cobblestone Paver lines
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        for (let py = this.groundY + 12; py < this.height; py += 16) {
            ctx.beginPath();
            ctx.moveTo(435, py);
            ctx.lineTo(525, py);
            ctx.stroke();
        }

        // --- 6. Big Shady Park Oak Tree (Left / Behind Robot) ---
        // Trunk & Roots
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(60, this.groundY);
        ctx.lineTo(70, this.groundY - 130);
        ctx.lineTo(88, this.groundY - 130);
        ctx.lineTo(100, this.groundY);
        ctx.fill();

        // Foliage Crown (Puffy Cloud-like Layers)
        const oakBoughs = [
            { x: 50, y: this.groundY - 150, r: 42, c: '#16a34a' },
            { x: 100, y: this.groundY - 160, r: 46, c: '#15803d' },
            { x: 75, y: this.groundY - 190, r: 52, c: '#22c55e' },
            { x: 55, y: this.groundY - 200, r: 38, c: '#4ade80' }
        ];
        for (let b of oakBoughs) {
            ctx.fillStyle = b.c;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- 7. Flowering Cherry Blossom Park Tree (Right / Behind Cat) ---
        // Slender curved trunk
        ctx.strokeStyle = '#5c2c16';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(880, this.groundY);
        ctx.quadraticCurveTo(895, this.groundY - 70, 870, this.groundY - 140);
        ctx.stroke();

        // Pink Blossom Clusters
        const cherryBoughs = [
            { x: 840, y: this.groundY - 150, r: 38, c: '#f472b6' },
            { x: 890, y: this.groundY - 160, r: 44, c: '#f9a8d4' },
            { x: 865, y: this.groundY - 190, r: 48, c: '#fbcfe8' }
        ];
        for (let b of cherryBoughs) {
            ctx.fillStyle = b.c;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- 8. Park Lamp Post (Near Cobblestones) ---
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(395, this.groundY - 90, 5, 90);
        ctx.fillRect(390, this.groundY - 96, 15, 6);
        // Lantern
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.fillRect(391, this.groundY - 112, 13, 16);
        ctx.shadowBlur = 0;
        // Lantern cap
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(388, this.groundY - 112);
        ctx.lineTo(407, this.groundY - 112);
        ctx.lineTo(397, this.groundY - 124);
        ctx.closePath();
        ctx.fill();

        // --- 9. Robot Park Solar Charging Station (Left Side) ---
        // Station pedestal
        ctx.fillStyle = '#334155';
        ctx.fillRect(28, this.groundY - 58, 38, 58);
        ctx.fillStyle = '#0284c7';
        // Green Solar Panel Angled on Top
        ctx.save();
        ctx.translate(47, this.groundY - 62);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillRect(-24, -6, 48, 12);
        ctx.strokeRect(-24, -6, 48, 12);
        ctx.restore();

        // Battery Status display
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(34, this.groundY - 48, 26, 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(37, this.groundY - 44, 20, 8);
        // Curly charging wire leading to ground
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(66, this.groundY - 24);
        ctx.quadraticCurveTo(80, this.groundY - 10, 94, this.groundY - 2);
        ctx.stroke();

        // --- 10. Cat Park Bench & Picnic Props (Right Side) ---
        // Wooden Slatted Park Bench
        ctx.fillStyle = '#854d0e';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        // Backrest slats
        ctx.fillRect(905, this.groundY - 58, 48, 8);
        ctx.fillRect(905, this.groundY - 46, 48, 8);
        // Seat
        ctx.fillRect(900, this.groundY - 32, 54, 8);
        // Cast-iron bench legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(906, this.groundY - 32, 5, 32);
        ctx.fillRect(944, this.groundY - 32, 5, 32);

        // Red & White Checkered Picnic Blanket
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(860, this.groundY - 14, 38, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(860, this.groundY - 14, 19, 7);
        ctx.fillRect(879, this.groundY - 7, 19, 7);

        // Tuna Can & Fish Bone Treat
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(878, this.groundY - 12, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(878, this.groundY - 14, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little fluttering park butterfly near the cat bench
        const bfY = this.groundY - 60 + Math.sin(performance.now() / 250) * 8;
        const bfX = 845 + Math.cos(performance.now() / 500) * 12;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(bfX - 3, bfY, 5, 3, 0.4, 0, Math.PI * 2);
        ctx.ellipse(bfX + 3, bfY, 5, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // --- 11. Lawn Flower Patches (Poppies, Daisies, Buttercups) ---
        const flowers = [
            { x: 125, y: this.groundY + 12, c: '#ef4444' }, // red poppy
            { x: 230, y: this.groundY + 24, c: '#eab308' }, // buttercup
            { x: 340, y: this.groundY + 16, c: '#f8fafc' }, // daisy
            { x: 620, y: this.groundY + 20, c: '#f8fafc' }, // daisy
            { x: 740, y: this.groundY + 14, c: '#eab308' }, // buttercup
            { x: 800, y: this.groundY + 28, c: '#ec4899' }  // pink blossom
        ];
        for (let fl of flowers) {
            ctx.fillStyle = fl.c;
            ctx.beginPath();
            ctx.arc(fl.x - 3, fl.y, 3, 0, Math.PI * 2);
            ctx.arc(fl.x + 3, fl.y, 3, 0, Math.PI * 2);
            ctx.arc(fl.x, fl.y - 3, 3, 0, Math.PI * 2);
            ctx.arc(fl.x, fl.y + 3, 3, 0, Math.PI * 2);
            ctx.fill();
            // Center yellow dot
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMiddleFence() {
        const ctx = this.ctx;
        const fx = this.fence.x;
        const fy = this.fence.y;
        const fw = this.fence.width;
        const fh = this.fence.height;

        // Wooden park picket fence planks
        const plankWidth = 12.5;
        const numPlanks = Math.ceil(fw / plankWidth);

        for (let i = 0; i < numPlanks; i++) {
            const px = fx + i * plankWidth;
            const isAlt = i % 2 === 0;

            // Wood gradient
            const plankGrad = ctx.createLinearGradient(px, fy, px + plankWidth, fy + fh);
            plankGrad.addColorStop(0, isAlt ? '#b45309' : '#92400e');
            plankGrad.addColorStop(1, isAlt ? '#78350f' : '#642f0b');
            ctx.fillStyle = plankGrad;
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1.6;

            // Pointed picket top
            ctx.beginPath();
            ctx.moveTo(px, fy + 12);
            ctx.lineTo(px + plankWidth / 2, fy);
            ctx.lineTo(px + plankWidth, fy + 12);
            ctx.lineTo(px + plankWidth, fy + fh);
            ctx.lineTo(px, fy + fh);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Nails
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(px + plankWidth / 2, fy + 36, 1.8, 0, Math.PI * 2);
            ctx.arc(px + plankWidth / 2, fy + fh - 36, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Horizontal cross beams
        ctx.fillStyle = '#5c2707';
        ctx.fillRect(fx - 3, fy + 32, fw + 6, 11);
        ctx.fillRect(fx - 3, fy + fh - 42, fw + 6, 11);

        // --- Climbing Green Ivy Vines & Morning Glory Flowers ---
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Winding vine tendril
        ctx.moveTo(fx + 6, fy + fh);
        ctx.quadraticCurveTo(fx + 22, fy + fh - 60, fx + 12, fy + fh - 110);
        ctx.quadraticCurveTo(fx + 35, fy + fh - 150, fx + 26, fy + 20);
        ctx.stroke();

        // Ivy leaves
        const ivyLeaves = [
            { x: fx + 12, y: fy + fh - 30 },
            { x: fx + 24, y: fy + fh - 75 },
            { x: fx + 14, y: fy + fh - 120 },
            { x: fx + 32, y: fy + fh - 165 },
            { x: fx + 22, y: fy + 35 }
        ];
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1.2;
        for (let leaf of ivyLeaves) {
            ctx.beginPath();
            ctx.arc(leaf.x, leaf.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Pink & White Morning Glory Flowers on the fence
        const fenceFlowers = [
            { x: fx + 28, y: fy + fh - 50, c: '#f472b6' },
            { x: fx + 8, y: fy + fh - 95, c: '#ffffff' },
            { x: fx + 36, y: fy + fh - 140, c: '#f472b6' }
        ];
        for (let fl of fenceFlowers) {
            ctx.fillStyle = fl.c;
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawAimGuide() {
        if (this.turnState !== 'aiming' && this.turnState !== 'charging') return;
        if (this.isCurrentPlayerAI()) return;

        const ctx = this.ctx;
        const isRobot = this.currentTurn === 'robot';
        const char = isRobot ? this.robot : this.cat;
        const origin = char.getThrowOrigin();
        const angleDeg = isRobot ? this.robotAngle : this.catAngle;
        const angleRad = (angleDeg * Math.PI) / 180;

        const dir = isRobot ? 1 : -1;
        const length = 55;

        const targetX = origin.x + Math.cos(angleRad) * length * dir;
        const targetY = origin.y - Math.sin(angleRad) * length;

        // Dotted direction line
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isRobot ? '#00ffff' : '#ff9f43';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Aim arrow head
        ctx.fillStyle = isRobot ? '#00ffff' : '#ff9f43';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawTurnBanner() {
        const ctx = this.ctx;
        const alpha = Math.min(1, this.turnBannerTimer * 2);
        ctx.save();
        ctx.globalAlpha = alpha;

        const bannerY = 160;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, bannerY - 30, this.width, 60);

        ctx.font = '900 28px "Arial Black", Gadget, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.currentTurn === 'robot' ? '#00ffff' : '#ff9f43';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fillText(this.turnBannerText, this.width / 2, bannerY);

        ctx.restore();
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.game = new RobotVsCatGame();

    // --- TITLE SCREEN & MODE SELECTORS ---
    const titleOverlay = document.getElementById('titleScreenOverlay');
    const startMatch = (mode) => {
        window.game.gameMode = mode;
        if (titleOverlay) titleOverlay.classList.remove('active');
        window.soundEngine.startMusic();
        window.soundEngine.playBoing();
        if (window.gameAnalytics) {
            window.gameAnalytics.trackMatchStart(mode, window.game.aiDifficulty);
        }
        window.game.restart();
    };

    const btn1PRobot = document.getElementById('btnMode1PRobot');
    if (btn1PRobot) btn1PRobot.addEventListener('click', () => startMatch('1p_robot'));

    const btn1PCat = document.getElementById('btnMode1PCat');
    if (btn1PCat) btn1PCat.addEventListener('click', () => startMatch('1p_cat'));

    const btn2P = document.getElementById('btnMode2P');
    if (btn2P) btn2P.addEventListener('click', () => startMatch('2p'));

    // Difficulty Selector Cycle
    const diffBtn = document.getElementById('difficultyToggleBtn');
    if (diffBtn) {
        const diffs = ['easy', 'medium', 'hard'];
        const diffLabels = { easy: '⭐ EASY', medium: '⭐⭐ MEDIUM', hard: '⭐⭐⭐ HARD' };
        diffBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const curIdx = diffs.indexOf(window.game.aiDifficulty);
            const nextIdx = (curIdx + 1) % diffs.length;
            window.game.aiDifficulty = diffs[nextIdx];
            diffBtn.innerText = diffLabels[window.game.aiDifficulty];
            window.soundEngine.playBoing();
        });
    }

    // --- HOW TO PLAY MODAL ---
    const howToPlayModal = document.getElementById('howToPlayModal');
    const openGuide = (e) => {
        if (e) e.preventDefault();
        if (howToPlayModal) howToPlayModal.classList.add('active');
    };
    const closeGuide = (e) => {
        if (e) e.preventDefault();
        if (howToPlayModal) howToPlayModal.classList.remove('active');
    };

    const howToPlayBtn = document.getElementById('howToPlayBtn');
    if (howToPlayBtn) howToPlayBtn.addEventListener('click', openGuide);

    const pauseHowToPlayBtn = document.getElementById('pauseHowToPlayBtn');
    if (pauseHowToPlayBtn) pauseHowToPlayBtn.addEventListener('click', openGuide);

    const closeHowToPlayBtn = document.getElementById('closeHowToPlayBtn');
    if (closeHowToPlayBtn) closeHowToPlayBtn.addEventListener('click', closeGuide);

    // --- PAUSE / MENU MODAL ---
    const pauseModal = document.getElementById('pauseMenuModal');
    const quickPauseBtn = document.getElementById('quickPauseBtn');
    if (quickPauseBtn) {
        quickPauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (pauseModal) pauseModal.classList.add('active');
        });
    }

    const resumeGameBtn = document.getElementById('resumeGameBtn');
    if (resumeGameBtn) {
        resumeGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (pauseModal) pauseModal.classList.remove('active');
        });
    }

    const restartMatchBtn = document.getElementById('restartMatchBtn');
    if (restartMatchBtn) {
        restartMatchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (pauseModal) pauseModal.classList.remove('active');
            window.game.restart();
        });
    }

    const returnToTitleBtn = document.getElementById('returnToTitleBtn');
    if (returnToTitleBtn) {
        returnToTitleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (pauseModal) pauseModal.classList.remove('active');
            if (titleOverlay) titleOverlay.classList.add('active');
        });
    }

    // --- GAME OVER MODAL ACTIONS ---
    const gameOverModal = document.getElementById('gameOverModal');
    const modalRestartBtn = document.getElementById('modalRestartBtn');
    if (modalRestartBtn) {
        modalRestartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (gameOverModal) {
                gameOverModal.classList.remove('active');
                gameOverModal.classList.remove('visible');
            }
            window.game.restart();
        });
    }

    const modalMainMenuBtn = document.getElementById('modalMainMenuBtn');
    if (modalMainMenuBtn) {
        modalMainMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (gameOverModal) {
                gameOverModal.classList.remove('active');
                gameOverModal.classList.remove('visible');
            }
            if (titleOverlay) titleOverlay.classList.add('active');
        });
    }

    // --- QUICK AUDIO & FULLSCREEN CONTROLS ---
    const quickMusicBtn = document.getElementById('quickMusicBtn');
    if (quickMusicBtn) {
        quickMusicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const enabled = window.soundEngine.toggleMusic();
            quickMusicBtn.classList.toggle('active-off', !enabled);
        });
    }

    const quickMuteBtn = document.getElementById('quickMuteBtn');
    if (quickMuteBtn) {
        quickMuteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const muted = window.soundEngine.toggleMute();
            quickMuteBtn.classList.toggle('active-off', muted);
        });
    }

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const vp = document.getElementById('gameViewport') || document.documentElement;
            if (!document.fullscreenElement) {
                if (vp.requestFullscreen) vp.requestFullscreen().catch(() => {});
                else if (vp.webkitRequestFullscreen) vp.webkitRequestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
            }
        });
    }

    // Auto-start music on first user gesture
    const startMusicOnFirstInteraction = () => {
        window.soundEngine.startMusic();
        window.removeEventListener('click', startMusicOnFirstInteraction);
        window.removeEventListener('keydown', startMusicOnFirstInteraction);
        window.removeEventListener('touchstart', startMusicOnFirstInteraction);
    };
    window.addEventListener('click', startMusicOnFirstInteraction);
    window.addEventListener('keydown', startMusicOnFirstInteraction);
    window.addEventListener('touchstart', startMusicOnFirstInteraction);

    // Android Hardware Back Button Handling for Google Play / PWA
    history.pushState({ page: 'game' }, '');
    window.addEventListener('popstate', () => {
        const howToPlayModal = document.getElementById('howToPlayModal');
        const pauseModal = document.getElementById('pauseMenuModal');
        const gameOverModal = document.getElementById('gameOverModal');
        const titleOverlay = document.getElementById('titleOverlay');

        if (howToPlayModal && howToPlayModal.classList.contains('active')) {
            howToPlayModal.classList.remove('active');
            history.pushState({ page: 'game' }, '');
            return;
        }
        if (gameOverModal && gameOverModal.classList.contains('active')) {
            gameOverModal.classList.remove('active');
            gameOverModal.classList.remove('visible');
            if (titleOverlay) titleOverlay.classList.add('active');
            history.pushState({ page: 'game' }, '');
            return;
        }
        if (pauseModal && pauseModal.classList.contains('active')) {
            pauseModal.classList.remove('active');
            history.pushState({ page: 'game' }, '');
            return;
        }
        if (titleOverlay && !titleOverlay.classList.contains('active')) {
            if (pauseModal) pauseModal.classList.add('active');
            history.pushState({ page: 'game' }, '');
            return;
        }
    });
});
