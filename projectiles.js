// Projectile Physics, Comic Effects, Particles, Floating Text, and Park Wind Foliage

class Projectile {
    constructor({ x, y, vx, vy, type = 'ball', isHeavy = false, ignoreWind = false, damage = 25 }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'ball' or 'bone'
        this.isHeavy = isHeavy;
        this.ignoreWind = ignoreWind;
        this.damage = damage;
        this.radius = isHeavy ? 20 : 12;
        this.rotation = 0;
        this.spinSpeed = type === 'bone' ? (vx > 0 ? 10 : -10) : (vx > 0 ? 6 : -6);
        this.trail = [];
        this.alive = true;
        this.time = 0;
        this.sparkTimer = 0;
    }

    update(dt, wind, spawnParticle) {
        if (!this.alive) return;
        this.time += dt;

        // Save trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
        if (this.trail.length > 22) {
            this.trail.shift();
        }
        for (let pt of this.trail) {
            pt.alpha -= dt * 1.8;
        }

        // Apply wind
        if (!this.ignoreWind) {
            this.vx += wind * dt * 28;
        }

        // Apply gravity
        const gravity = 550; // pixels / sec^2
        this.vy += gravity * dt;

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.spinSpeed * dt;

        // Spawn cartoon droplet / electric trails
        this.sparkTimer += dt;
        if (spawnParticle && this.sparkTimer > 0.04) {
            this.sparkTimer = 0;
            if (this.type === 'bone') {
                // Tasty dripping sauce & barbecue aroma
                spawnParticle(new Particle({
                    x: this.x + (Math.random() - 0.5) * 8,
                    y: this.y + (Math.random() - 0.5) * 8,
                    vx: -this.vx * 0.15 + (Math.random() - 0.5) * 20,
                    vy: -this.vy * 0.15 + (Math.random() - 0.5) * 20,
                    color: Math.random() < 0.5 ? '#d35400' : '#f39c12',
                    size: 2.5 + Math.random() * 2,
                    life: 0.35,
                    type: 'sauce'
                }));
            } else {
                // High-tech plasma energy sparks
                spawnParticle(new Particle({
                    x: this.x + (Math.random() - 0.5) * 8,
                    y: this.y + (Math.random() - 0.5) * 8,
                    vx: -this.vx * 0.15 + (Math.random() - 0.5) * 25,
                    vy: -this.vy * 0.15 + (Math.random() - 0.5) * 25,
                    color: Math.random() < 0.5 ? '#00ffff' : '#5dade2',
                    size: 2.5 + Math.random() * 2.5,
                    life: 0.35,
                    type: 'spark'
                }));
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Draw comic motion speed trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i + 1];
            if (p1.alpha <= 0) continue;

            ctx.save();
            ctx.strokeStyle = this.type === 'ball'
                ? `rgba(0, 255, 255, ${Math.max(0, p1.alpha * 0.75)})`
                : `rgba(243, 156, 18, ${Math.max(0, p1.alpha * 0.75)})`;
            ctx.lineWidth = (i / this.trail.length) * (this.isHeavy ? 12 : 7);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'ball') {
            this.drawBall(ctx);
        } else {
            this.drawBone(ctx);
        }

        ctx.restore();
    }

    drawBall(ctx) {
        const r = this.radius;

        // Outer cartoon glow
        if (this.isHeavy) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 22;
            ctx.fillStyle = '#00d2ff';
            ctx.beginPath();
            ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Metal base
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#ebf5fb');
        grad.addColorStop(0.5, '#5dade2');
        grad.addColorStop(1, '#1b4f72');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#0b192c';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // High-tech rotating seams
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.75, 0); ctx.lineTo(r * 0.75, 0);
        ctx.moveTo(0, -r * 0.75); ctx.lineTo(0, r * 0.75);
        ctx.stroke();

        // Glowing center core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    drawBone(ctx) {
        const scale = this.isHeavy ? 1.85 : 1.15;
        ctx.scale(scale, scale);

        // Cartoon Chicken Drumstick Bone
        // White bone shaft
        ctx.fillStyle = '#fdfefe';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-16, -3.5, 16, 7, 2);
        ctx.fill();
        ctx.stroke();

        // Double bone knob on left end
        ctx.beginPath();
        ctx.arc(-16, -4.5, 5, 0, Math.PI * 2);
        ctx.arc(-16, 4.5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crispy golden roast meat
        const meatGrad = ctx.createRadialGradient(4, -2, 2, 6, 0, 15);
        meatGrad.addColorStop(0, '#f8c471');
        meatGrad.addColorStop(0.6, '#d35400');
        meatGrad.addColorStop(1, '#6e2c00');
        ctx.fillStyle = meatGrad;
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(6, 0, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crisp seasoning specks
        ctx.fillStyle = '#ba4a00';
        ctx.beginPath();
        ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
        ctx.arc(8, 2, 2, 0, Math.PI * 2);
        ctx.arc(3, 4, 1.4, 0, Math.PI * 2);
        ctx.fill();

        if (this.isHeavy) {
            // Comic fiery sizzle sparks
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1.8;
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2 + this.time * 8;
                const ox = Math.cos(angle) * 18;
                const oy = Math.sin(angle) * 16;
                ctx.beginPath();
                ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

// Comic Action Starburst Burst ("POW!", "WHAM!", "BONK!", "SPLAT!", "CLANG!")
class ComicBurst {
    constructor({ x, y, text = 'POW!', color = '#f1c40f', textColor = '#ffffff', size = 48 }) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.textColor = textColor;
        this.baseSize = size;
        this.life = 0.55;
        this.maxLife = 0.55;
        this.rotation = (Math.random() - 0.5) * 0.4;
    }

    update(dt) {
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = this.life / this.maxLife;

        // Cartoon spring pop: scales up to 1.25 then settles
        let scale = 1.0;
        if (progress > 0.7) {
            scale = 1.0 + (1 - (progress - 0.7) / 0.3) * 0.35;
        } else {
            scale = progress / 0.7;
        }

        const size = this.baseSize * scale;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw Jagged Comic Starburst Polygon
        const points = 12;
        const innerRadius = size * 0.58;
        const outerRadius = size;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Starburst fill & bold outline
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Comic Punch Text
        ctx.font = `900 ${Math.round(size * 0.48)}px 'Impact', 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText(this.text, 0, 1);

        ctx.fillStyle = this.textColor;
        ctx.fillText(this.text, 0, 1);

        ctx.restore();
    }
}

// Swirling Park Leaves & Flower Petals carried by the Wind
class ParkLeaf {
    constructor(canvasWidth, canvasHeight, startAnywhere = false) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset(startAnywhere);
    }

    reset(startAnywhere = false) {
        this.y = startAnywhere ? Math.random() * (this.canvasHeight - 80) : -20;
        this.x = Math.random() * this.canvasWidth;
        this.fallSpeed = 30 + Math.random() * 45; // downward drift
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 2 + Math.random() * 3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 4;
        this.size = 7 + Math.random() * 6;

        // Leaf types: green park leaf, golden autumn leaf, or cherry blossom pink petal
        const r = Math.random();
        if (r < 0.45) {
            this.color = '#27ae60'; // park green leaf
            this.strokeColor = '#1e8449';
            this.isPetal = false;
        } else if (r < 0.75) {
            this.color = '#f39c12'; // golden amber leaf
            this.strokeColor = '#d35400';
            this.isPetal = false;
        } else {
            this.color = '#f78fb3'; // pink flower petal
            this.strokeColor = '#e66767';
            this.isPetal = true;
        }
    }

    update(dt, wind) {
        this.wobble += this.wobbleSpeed * dt;
        this.rotation += this.rotSpeed * dt;

        // Drift influenced by wind!
        const lateralWindDrift = wind * 45;
        this.x += (Math.sin(this.wobble) * 20 + lateralWindDrift) * dt;
        this.y += this.fallSpeed * dt;

        // Wrap around screen
        if (this.y > this.canvasHeight - 55 || this.x < -40 || this.x > this.canvasWidth + 40) {
            this.reset(false);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 1.2;

        if (this.isPetal) {
            // Heart-shaped/round cherry blossom petal
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 0.7, this.size * 1.1, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Oval leaf with pointed ends and center vein
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.quadraticCurveTo(this.size * 0.8, 0, 0, this.size);
            ctx.quadraticCurveTo(-this.size * 0.8, 0, 0, -this.size);
            ctx.fill();
            ctx.stroke();

            // Center vein
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.8);
            ctx.lineTo(0, this.size * 0.8);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Particle {
    constructor({ x, y, vx, vy, color, size, life = 0.6, type = 'spark' }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.type = type; // 'spark', 'fur', 'smoke', 'dirt', 'sauce', 'sweat', 'steam'
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 8;
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.type === 'steam') {
            this.vy -= 40 * dt; // steam rises!
        } else {
            this.vy += 320 * dt; // gravity
        }

        this.rotation += this.rotSpeed * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = Math.max(0, progress);

        if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'fur') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'smoke' || this.type === 'steam') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * (1 + (1 - progress) * 1.5), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'sweat') {
            // Teardrop blue sweat bead
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 2, this.size, 0, Math.PI);
            ctx.lineTo(0, -this.size * 1.5);
            ctx.closePath();
            ctx.fill();
        } else {
            // Sauce / dirt droplet
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class FloatingText {
    constructor({ x, y, text, color = '#ffffff', fontSize = 20, isCritical = false }) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.isCritical = isCritical;
        this.life = 1.0;
        this.maxLife = 1.0;
    }

    update(dt) {
        this.life -= dt;
        this.y -= 48 * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = Math.min(1, this.life * 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${this.isCritical ? this.fontSize + 6 : this.fontSize}px 'Arial Black', Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark outline for punchy contrast
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4.5;
        ctx.strokeText(this.text, this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

window.Projectile = Projectile;
window.Particle = Particle;
window.ComicBurst = ComicBurst;
window.ParkLeaf = ParkLeaf;
window.FloatingText = FloatingText;
