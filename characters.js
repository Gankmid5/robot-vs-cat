// Vector Character Rendering and Animation for Robot & Cat

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        const rad = r || [0, 0, 0, 0];
        this.beginPath();
        this.moveTo(x + rad[0], y);
        this.lineTo(x + w - rad[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
        this.lineTo(x + w, y + h - rad[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
        this.lineTo(x + rad[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
        this.lineTo(x, y + rad[0]);
        this.quadraticCurveTo(x, y, x + rad[0], y);
        this.closePath();
        return this;
    };
}

class Character {
    constructor(isRobot, x, y) {
        this.isRobot = isRobot;
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 95;
        this.hp = 100;
        this.maxHp = 100;
        this.state = 'idle'; // 'idle', 'charging', 'throwing', 'hit', 'victory', 'defeat'
        this.stateTimer = 0;
        this.chargeLevel = 0; // 0 to 1
        this.animTime = 0;
        this.hitShake = 0;

        // Customization
        this.color = isRobot ? '#4a90e2' : '#f5a623';
        this.name = isRobot ? 'ROBO-X' : 'FELIX';
    }

    setHp(val) {
        this.hp = Math.max(0, Math.min(this.maxHp, val));
        if (this.hp === 0) {
            this.setState('defeat');
        }
    }

    setState(state, duration = 0) {
        this.state = state;
        this.stateTimer = duration;
        if (state === 'hit') {
            this.hitShake = 15;
        }
    }

    update(dt) {
        this.animTime += dt;
        if (this.stateTimer > 0) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                if (this.hp > 0) {
                    this.state = 'idle';
                } else {
                    this.state = 'defeat';
                }
            }
        }
        if (this.hitShake > 0) {
            this.hitShake = Math.max(0, this.hitShake - dt * 40);
        }
    }

    getThrowOrigin() {
        if (this.isRobot) {
            return { x: this.x + 35, y: this.y - 45 };
        } else {
            return { x: this.x - 35, y: this.y - 40 };
        }
    }

    draw(ctx) {
        ctx.save();
        // Shake effect on hit
        let shakeX = 0;
        let shakeY = 0;
        if (this.hitShake > 0) {
            shakeX = (Math.random() - 0.5) * this.hitShake;
            shakeY = (Math.random() - 0.5) * this.hitShake;
        }

        ctx.translate(this.x + shakeX, this.y + shakeY);

        // Cartoon Squash and Stretch
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (this.state === 'charging') {
            // Squashes down like an accordion building tension!
            scaleY = 1.0 - this.chargeLevel * 0.22;
            scaleX = 1.0 + this.chargeLevel * 0.18;
        } else if (this.state === 'throwing') {
            // Elastic snap catapult whip!
            scaleY = 1.22;
            scaleX = 0.86;
        } else if (this.state === 'hit') {
            // Comic pancake flatten!
            scaleY = 0.82;
            scaleX = 1.22;
        } else if (this.state === 'victory') {
            // Joyous cartoon bounce!
            const bounce = Math.abs(Math.sin(this.animTime * 7)) * 0.16;
            scaleY = 1.0 + bounce;
            scaleX = 1.0 - bounce * 0.4;
        }

        // Ground shadow (scales dynamically with squash)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 38 * scaleX, 12 * scaleX, 0, 0, Math.PI * 2);
        ctx.fill();

        // Apply squash & stretch transform
        ctx.scale(scaleX, scaleY);

        if (this.isRobot) {
            this.drawRobot(ctx);
        } else {
            this.drawCat(ctx);
        }

        // Comic Dizzy Stars & Sweat Drops
        const headY = this.isRobot ? -94 : -86;
        if (this.state === 'hit' || this.state === 'defeat') {
            this.drawDizzyStars(ctx, headY);
        }
        if (this.state === 'charging' && this.chargeLevel > 0.45) {
            this.drawSweatDrops(ctx, headY);
        }
        if (this.state === 'victory') {
            this.drawVictorySparkles(ctx, headY);
        }

        ctx.restore();
    }

    drawDizzyStars(ctx, headY) {
        const t = this.animTime * 5;
        const rx = 34;
        const ry = 11;
        for (let i = 0; i < 3; i++) {
            const angle = t + (i * Math.PI * 2) / 3;
            const sx = Math.cos(angle) * rx;
            const sy = headY + Math.sin(angle) * ry;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle * 2.5);

            // 5-pointed golden cartoon star
            ctx.fillStyle = '#f1c40f';
            ctx.strokeStyle = '#b7950b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let s = 0; s < 10; s++) {
                const r = s % 2 === 0 ? 8 : 3.8;
                const a = (s * Math.PI) / 5;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    drawSweatDrops(ctx, headY) {
        const t = this.animTime * 9;
        const dropY = headY + 12 + (t % 1) * 16;
        const dropX = this.isRobot ? 22 : -22;

        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.2;

        // Comical teardrop sweat bead
        ctx.beginPath();
        ctx.arc(dropX, dropY, 3.5, 0, Math.PI);
        ctx.lineTo(dropX, dropY - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawVictorySparkles(ctx, headY) {
        const t = this.animTime * 3;
        ctx.save();
        ctx.translate(0, headY - 14 + Math.sin(t * 3) * 4);

        if (this.isRobot) {
            // Glowing neon victory exclamation / music note
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♫ 🤖 ♫', 0, 0);
        } else {
            // Joyful heart & music note
            ctx.fillStyle = '#ff4757';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♥ 🐱 ♪', 0, 0);
        }
        ctx.restore();
    }

    drawRobot(ctx) {
        const t = this.animTime;
        const idleBob = Math.sin(t * 3) * 2;
        const antennaWobble = Math.sin(t * 6) * 4;

        let armAngle = 0;
        if (this.state === 'charging') {
            armAngle = -0.8 - this.chargeLevel * 0.8; // Wind back
        } else if (this.state === 'throwing') {
            armAngle = 0.9; // Follow through
        } else if (this.state === 'hit') {
            armAngle = -1.2;
        } else if (this.state === 'victory') {
            armAngle = -2.2 + Math.sin(t * 8) * 0.3; // Wave arm
        }

        ctx.save();
        ctx.translate(0, idleBob);

        // --- Tracks / Legs ---
        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-30, -14, 60, 16, 8);
        ctx.fill();
        ctx.stroke();

        // Track wheels
        ctx.fillStyle = '#7f8c8d';
        for (let i = -20; i <= 20; i += 13) {
            ctx.beginPath();
            ctx.arc(i, -6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.arc(i, -6, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7f8c8d';
        }

        // --- Torso / Chassis ---
        const bodyGrad = ctx.createLinearGradient(-26, -55, 26, -14);
        bodyGrad.addColorStop(0, '#5dade2');
        bodyGrad.addColorStop(1, '#2874a6');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#1b4f72';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(-24, -58, 48, 44, 10);
        ctx.fill();
        ctx.stroke();

        // Chest plate / battery indicator
        ctx.fillStyle = '#1c2833';
        ctx.beginPath();
        ctx.roundRect(-14, -48, 28, 16, 4);
        ctx.fill();

        // Battery level bars
        const bars = Math.ceil((this.hp / this.maxHp) * 4);
        for (let b = 0; b < 4; b++) {
            ctx.fillStyle = b < bars ? (bars <= 1 ? '#e74c3c' : '#2ecc71') : '#555';
            ctx.fillRect(-11 + b * 6, -45, 4, 10);
        }

        // Rivets on corners
        ctx.fillStyle = '#d4e6f1';
        [[-20, -54], [20, -54], [-20, -18], [20, -18]].forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
            ctx.fill();
        });

        // --- Head ---
        const headY = -62;
        const headGrad = ctx.createLinearGradient(-20, headY - 32, 20, headY);
        headGrad.addColorStop(0, '#7fb3d5');
        headGrad.addColorStop(1, '#2980b9');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.roundRect(-22, headY - 30, 44, 30, 8);
        ctx.fill();
        ctx.stroke();

        // Antenna
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, headY - 30);
        ctx.quadraticCurveTo(antennaWobble, headY - 45, antennaWobble * 1.5, headY - 50);
        ctx.stroke();

        // Blinking antenna beacon bulb
        const isBlink = Math.floor(t * 4) % 2 === 0;
        ctx.fillStyle = isBlink ? '#e74c3c' : '#f39c12';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = isBlink ? 8 : 2;
        ctx.beginPath();
        ctx.arc(antennaWobble * 1.5, headY - 51, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow

        // Eye Visor Screen
        ctx.fillStyle = '#0b192c';
        ctx.beginPath();
        ctx.roundRect(-16, headY - 24, 32, 16, 4);
        ctx.fill();

        // Eyes depending on state
        ctx.fillStyle = this.state === 'charging' ? '#f39c12' : '#00ffff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;

        if (this.state === 'hit') {
            // Dizzy X eyes
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2.5;
            // Left eye X
            ctx.beginPath();
            ctx.moveTo(-11, headY - 20); ctx.lineTo(-5, headY - 12);
            ctx.moveTo(-5, headY - 20); ctx.lineTo(-11, headY - 12);
            // Right eye X
            ctx.moveTo(5, headY - 20); ctx.lineTo(11, headY - 12);
            ctx.moveTo(11, headY - 20); ctx.lineTo(5, headY - 12);
            ctx.stroke();
        } else if (this.state === 'defeat') {
            // Sad dashes
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-11, headY - 16); ctx.lineTo(-5, headY - 16);
            ctx.moveTo(5, headY - 16); ctx.lineTo(11, headY - 16);
            ctx.stroke();
        } else if (this.state === 'charging') {
            // Angled intense eyes
            ctx.fillRect(-12, headY - 18, 8, 5);
            ctx.fillRect(4, headY - 18, 8, 5);
        } else if (this.state === 'victory') {
            // Happy arches ^ ^
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(-8, headY - 14, 4, Math.PI, 0);
            ctx.arc(8, headY - 14, 4, Math.PI, 0);
            ctx.stroke();
        } else {
            // Normal rounded glowing visor dots
            ctx.beginPath();
            ctx.arc(-8, headY - 16, 4, 0, Math.PI * 2);
            ctx.arc(8, headY - 16, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // --- Mechanical Arm & Ball ---
        ctx.save();
        ctx.translate(14, -38); // Shoulder pivot
        ctx.rotate(armAngle);

        // Upper arm
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, -5, 22, 10);
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.arc(22, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Forearm / Claw
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(22, -4, 16, 8);
        ctx.beginPath();
        ctx.arc(38, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // If charging or idle with ball
        if (this.state === 'charging' || (this.state === 'idle' && this.isRobot)) {
            // Render ball in claw
            ctx.save();
            ctx.translate(46, 0);
            const ballGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
            ballGrad.addColorStop(0, '#5dade2');
            ballGrad.addColorStop(0.6, '#1f618d');
            ballGrad.addColorStop(1, '#0e3a5a');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Energy core / glow
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 6 + this.chargeLevel * 8;
            ctx.beginPath();
            ctx.arc(0, 0, 3 + this.chargeLevel * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        ctx.restore(); // restore arm

        ctx.restore(); // restore body
    }

    drawCat(ctx) {
        const t = this.animTime;
        const tailWag = Math.sin(t * 4) * 0.35;
        const earTwitch = Math.sin(t * 2.5) > 0.8 ? 0.15 : 0;
        const idleBob = Math.sin(t * 3.2) * 2;

        let pawAngle = 0;
        if (this.state === 'charging') {
            pawAngle = 0.8 + this.chargeLevel * 0.7; // Wind back paw to the right
        } else if (this.state === 'throwing') {
            pawAngle = -0.9; // Fling paw to the left
        } else if (this.state === 'hit') {
            pawAngle = 1.1;
        } else if (this.state === 'victory') {
            pawAngle = 1.8 + Math.sin(t * 7) * 0.25;
        }

        ctx.save();
        ctx.translate(0, idleBob);

        // --- Tail (Wagging behind) ---
        ctx.save();
        ctx.translate(22, -26);
        ctx.rotate(tailWag);
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(24, -15, 30, -36);
        ctx.stroke();

        // White tip on tail
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(25, -26);
        ctx.quadraticCurveTo(28, -32, 30, -36);
        ctx.stroke();
        ctx.restore();

        // --- Back Paws / Sitting base ---
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.ellipse(14, -5, 14, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(-14, -5, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // White toe beans/paws
        ctx.fillStyle = '#fdfefe';
        ctx.beginPath();
        ctx.ellipse(-16, -2, 8, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(12, -2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Cat Body (Chubby Tabby) ---
        const bodyGrad = ctx.createLinearGradient(0, -60, 0, -10);
        bodyGrad.addColorStop(0, '#f39c12');
        bodyGrad.addColorStop(1, '#d35400');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#b94a00';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.ellipse(0, -34, 25, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tabby Stripes on Back
        ctx.strokeStyle = '#a04000';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        [[-8, -48, 8, -48], [-12, -36, 12, -36], [-10, -24, 10, -24]].forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1 + 10, y1);
            ctx.lineTo(x2 + 10, y2);
            ctx.stroke();
        });

        // Fluffy White Bib / Chest
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-8, -32, 12, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // --- Cat Head ---
        const headY = -66;
        ctx.save();
        ctx.translate(-4, headY);

        // Cat Ears
        // Left Ear (facing player)
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(-20, -12);
        ctx.lineTo(-28, -34 + earTwitch * 20);
        ctx.lineTo(-10, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Left Ear Pink Interior
        ctx.fillStyle = '#f1948a';
        ctx.beginPath();
        ctx.moveTo(-18, -14);
        ctx.lineTo(-25, -30 + earTwitch * 20);
        ctx.lineTo(-11, -21);
        ctx.closePath();
        ctx.fill();

        // Right Ear
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(6, -20);
        ctx.lineTo(16, -34);
        ctx.lineTo(20, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Ear Pink Interior
        ctx.fillStyle = '#f1948a';
        ctx.beginPath();
        ctx.moveTo(8, -19);
        ctx.lineTo(15, -30);
        ctx.lineTo(17, -13);
        ctx.closePath();
        ctx.fill();

        // Head Circle
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = '#b94a00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tabby head stripes
        ctx.strokeStyle = '#a04000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(0, -10);
        ctx.moveTo(-6, -16); ctx.lineTo(-4, -9);
        ctx.moveTo(6, -16); ctx.lineTo(4, -9);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        // Left Whiskers (extending towards enemy)
        ctx.beginPath();
        ctx.moveTo(-16, 4); ctx.lineTo(-34, 1);
        ctx.moveTo(-16, 7); ctx.lineTo(-35, 9);
        // Right Whiskers
        ctx.moveTo(14, 4); ctx.lineTo(28, 2);
        ctx.moveTo(14, 7); ctx.lineTo(27, 8);
        ctx.stroke();

        // Muzzle & Pink Nose
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-4, 5, 5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(4, 5, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(3, 3);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();

        // Eyes depending on state
        if (this.state === 'hit') {
            // Shocked wide eyes with spiral
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-11, -3, 8, 0, Math.PI * 2);
            ctx.arc(8, -3, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-11, -3, 3, 0, Math.PI * 2);
            ctx.arc(8, -3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.state === 'defeat') {
            // Sad curved eyes
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(-10, 0, 5, 0, Math.PI);
            ctx.arc(8, 0, 5, 0, Math.PI);
            ctx.stroke();
        } else if (this.state === 'charging') {
            // Fierce narrowed feline eyes
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(-10, -3, 7, 5, -0.3, 0, Math.PI * 2);
            ctx.ellipse(8, -3, 7, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Slit pupils
            ctx.fillStyle = '#1e8449';
            ctx.fillRect(-11, -7, 2.5, 8);
            ctx.fillRect(7, -7, 2.5, 8);
        } else if (this.state === 'victory') {
            // Happy closed eyes ^ ^
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(-10, -2, 5, Math.PI, 0);
            ctx.arc(8, -2, 5, Math.PI, 0);
            ctx.stroke();
        } else {
            // Big cute cat eyes
            ctx.fillStyle = '#2ecc71'; // emerald green
            ctx.beginPath();
            ctx.arc(-10, -3, 6, 0, Math.PI * 2);
            ctx.arc(8, -3, 6, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#17202a';
            ctx.beginPath();
            ctx.ellipse(-10, -3, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(8, -3, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Catchlight sparkle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-12, -5, 1.8, 0, Math.PI * 2);
            ctx.arc(6, -5, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // restore head

        // --- Pitching Paw holding Chicken Bone ---
        ctx.save();
        ctx.translate(-14, -36); // Shoulder pivot
        ctx.rotate(pawAngle);

        // Paw arm
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.roundRect(-22, -5, 24, 10, 5);
        ctx.fill();

        // White paw
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-22, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // If charging or idle (holding bone)
        if (this.state === 'charging' || (this.state === 'idle' && !this.isRobot)) {
            ctx.save();
            ctx.translate(-26, 0);
            this.drawHeldBone(ctx);
            ctx.restore();
        }

        ctx.restore(); // restore arm

        ctx.restore(); // restore body
    }

    drawHeldBone(ctx) {
        // Chicken drumstick bone
        ctx.save();
        ctx.rotate(0.4);

        // White bone shaft
        ctx.fillStyle = '#f4f6f7';
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-12, -3, 14, 6);
        ctx.strokeRect(-12, -3, 14, 6);

        // Knobs on left end
        ctx.beginPath();
        ctx.arc(-12, -4, 4, 0, Math.PI * 2);
        ctx.arc(-12, 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tasty drumstick meat on the right end
        ctx.fillStyle = '#b9770e';
        ctx.strokeStyle = '#7e5109';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(7, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Meat highlight
        ctx.fillStyle = '#e59866';
        ctx.beginPath();
        ctx.ellipse(5, -3, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

window.Character = Character;
