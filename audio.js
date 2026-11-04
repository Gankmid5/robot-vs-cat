// Web Audio API Procedural Sound Synthesizer & Cartoon Background Music
// Completely standalone - zero external audio files required!

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicEnabled = true;
        this.chargeOsc = null;
        this.chargeGain = null;

        // Music Scheduler
        this.isPlayingMusic = false;
        this.musicTimer = null;
        this.currentStep = 0;
        this.nextNoteTime = 0;
        this.bpm = 126;
        this.musicGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Master Music Gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.muted || !this.musicEnabled ? 0 : 0.08, this.ctx.currentTime);
            this.musicGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted && this.chargeOsc) {
            this.stopCharge();
        }
        if (this.musicGain && this.ctx) {
            const targetGain = this.muted || !this.musicEnabled ? 0 : 0.08;
            this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
        }
        return this.muted;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicGain && this.ctx) {
            const targetGain = this.muted || !this.musicEnabled ? 0 : 0.08;
            this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
        }
        if (this.musicEnabled && !this.isPlayingMusic) {
            this.startMusic();
        }
        return this.musicEnabled;
    }

    // --- CARTOON BACKGROUND MUSIC (Ragtime / Park Walk Groove) ---
    startMusic() {
        this.init();
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduleMusicLoop();
    }

    scheduleMusicLoop() {
        if (!this.isPlayingMusic) return;

        const scheduleAheadTime = 0.2; // seconds
        const stepTime = 60 / this.bpm / 2; // 8th note duration (~0.238s)

        while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
            this.playMusicStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += stepTime;
            this.currentStep = (this.currentStep + 1) % 32; // 32 steps = 4 bars of 8th notes
        }

        this.musicTimer = setTimeout(() => this.scheduleMusicLoop(), 50);
    }

    playMusicStep(step, time) {
        if (this.muted || !this.musicEnabled) return;

        // Note frequency helpers
        const N = {
            C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00,
            C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
            C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
        };

        // 4-Bar Chord Progression: C - Am - Dm - G7 (Classic playful cartoon park stroll)
        // Bassline pattern: "Oom-pah" walking bass
        const bassPattern = [
            // Bar 1: C
            N.C3, null, N.G3, null, N.E3, null, N.G3, null,
            // Bar 2: Am
            N.A3, null, N.E3, null, N.C3, null, N.E3, null,
            // Bar 3: Dm
            N.D4, null, N.A3, null, N.F3, null, N.A3, null,
            // Bar 4: G7
            N.G3, null, N.D4, null, N.B3, null, N.G3, null
        ];

        // Cheerful Marimba / Bell Melody
        const melodyPattern = [
            // Bar 1
            N.E4, N.G4, N.C5, null, N.G4, N.E4, N.D4, N.E4,
            // Bar 2
            N.C4, null, N.E4, N.A4, N.C5, null, N.B4, N.A4,
            // Bar 3
            N.F4, N.A4, N.D5, null, N.A4, N.F4, N.E4, N.F4,
            // Bar 4
            N.G4, N.A4, N.B4, N.D5, N.C5, null, null, null
        ];

        // 1. Play Bass Note (Warm tuba / upright bass)
        const bassNote = bassPattern[step];
        if (bassNote) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(bassNote, time);

            gain.gain.setValueAtTime(0.35, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.24);
        }

        // 2. Play Melody Note (Bouncy Marimba)
        const melNote = melodyPattern[step];
        if (melNote) {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc2.type = 'triangle';

            osc.frequency.setValueAtTime(melNote, time);
            osc2.frequency.setValueAtTime(melNote * 2, time); // 1 octave overtone

            gain.gain.setValueAtTime(0.28, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc2.start(time);
            osc.stop(time + 0.2);
            osc2.stop(time + 0.2);
        }

        // 3. Woodblock / Tap Rhythm on offbeats
        if (step % 2 === 1) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + (step % 4 === 1 ? 200 : 0), time);
            gain.gain.setValueAtTime(0.06, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.04);
        }
    }

    // --- CARTOON SOUND EFFECTS ---

    startCharge() {
        if (this.muted) return;
        this.init();
        if (this.chargeOsc) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 1.8);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 1.8);

            gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            this.chargeOsc = osc;
            this.chargeGain = gain;
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    stopCharge() {
        if (this.chargeOsc) {
            try {
                this.chargeGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                this.chargeOsc.stop(this.ctx.currentTime + 0.06);
            } catch (e) {}
            this.chargeOsc = null;
            this.chargeGain = null;
        }
    }

    playBoing() {
        // Comic spring boing
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(540, t + 0.15);
        osc.frequency.linearRampToValueAtTime(360, t + 0.28);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playThrow(isRobot = true) {
        if (this.muted) return;
        this.init();
        this.stopCharge();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (isRobot) {
            // High-tech cartoon laser whip
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(750, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.28);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        } else {
            // Comical slide whip whoosh
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, t);
            osc.frequency.exponentialRampToValueAtTime(95, t + 0.25);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
    }

    playHit(isRobotTarget = true, isHeavy = false) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        if (isRobotTarget) {
            // Cartoon CLANG & electric comic buzzer
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(isHeavy ? 160 : 280, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

            // Metal crash noise
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            noise.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.35);
            noise.start(t);
        } else {
            // Exaggerated comic cat screech: Mee-YOOOWWW!
            const osc = this.ctx.createOscillator();
            const oscMod = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            // Start high, drop sharply, wobble
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(320, t + 0.25);
            osc.frequency.exponentialRampToValueAtTime(520, t + 0.45);

            // Vibrato for comedic distressed effect
            oscMod.frequency.setValueAtTime(14, t);
            modGain.gain.setValueAtTime(35, t);
            oscMod.connect(osc.frequency);

            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            oscMod.start(t);
            osc.start(t);
            osc.stop(t + 0.48);
            oscMod.stop(t + 0.48);
        }
    }

    playFenceHit() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Comical "BONK" hollow wood thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    playGroundHit() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Comical "SPLAT" / dirt flop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    playPowerUp() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 (sparkling arpeggio)

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.05;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteStart);
            osc.stop(noteStart + 0.14);
        });
    }

    playHeal() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const notes = [329.63, 392.00, 523.25, 659.25]; // E G C E

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.07;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0.2, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteStart);
            osc.stop(noteStart + 0.22);
        });
    }

    playVictory() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const fanfare = [
            { f: 392, d: 0.14, w: 0 },
            { f: 523.25, d: 0.14, w: 0.14 },
            { f: 659.25, d: 0.14, w: 0.28 },
            { f: 783.99, d: 0.35, w: 0.42 },
            { f: 659.25, d: 0.12, w: 0.8 },
            { f: 783.99, d: 0.55, w: 0.95 }
        ];

        fanfare.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + note.w;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, noteStart);
            gain.gain.setValueAtTime(0.24, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteStart);
            osc.stop(noteStart + note.d);
        });
    }
}

window.soundEngine = new SoundEngine();
