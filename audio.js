// Web Audio API Procedural Sound Synthesizer & Cartoon Background Music
// Completely standalone - zero external audio files required!

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicEnabled = true;
        this.chargeNodes = null;

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
        if (this.muted && this.chargeNodes) {
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

            gain.gain.setValueAtTime(0.32, time);
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

            gain.gain.setValueAtTime(0.26, time);
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
            gain.gain.setValueAtTime(0.05, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.04);
        }
    }

    // =========================================================================
    // --- AUTHENTIC CHARACTER PROCEDURAL AUDIO ---
    // =========================================================================

    // --- CHARGING SOUNDS ---
    startCharge(isRobot = true) {
        if (this.muted) return;
        this.init();
        if (this.chargeNodes) return;

        const t = this.ctx.currentTime;

        if (isRobot) {
            // ROBOT CHARGE: High-tech servo motor whine with FM synthesis + digital telemetry chirps!
            const carrier = this.ctx.createOscillator();
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            const mainGain = this.ctx.createGain();

            carrier.type = 'sawtooth';
            // Carrier pitch rises from 160Hz up to 780Hz as power builds
            carrier.frequency.setValueAtTime(160, t);
            carrier.frequency.exponentialRampToValueAtTime(780, t + 2.0);

            // Modulator creates fast mechanical servo motor pulse (75Hz)
            modulator.type = 'square';
            modulator.frequency.setValueAtTime(75, t);
            modulator.frequency.linearRampToValueAtTime(130, t + 2.0);
            modGain.gain.setValueAtTime(45, t);
            modGain.gain.linearRampToValueAtTime(120, t + 2.0);

            modulator.connect(modGain);
            modGain.connect(carrier.frequency);

            // Resonant lowpass filter to mimic charging metal capacitor
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, t);
            filter.frequency.exponentialRampToValueAtTime(3200, t + 2.0);
            filter.Q.value = 6;

            mainGain.gain.setValueAtTime(0.01, t);
            mainGain.gain.linearRampToValueAtTime(0.18, t + 0.25);

            carrier.connect(filter);
            filter.connect(mainGain);
            mainGain.connect(this.ctx.destination);

            carrier.start(t);
            modulator.start(t);

            this.chargeNodes = {
                stop: (stopTime) => {
                    mainGain.gain.linearRampToValueAtTime(0.001, stopTime + 0.06);
                    carrier.stop(stopTime + 0.07);
                    modulator.stop(stopTime + 0.07);
                }
            };
        } else {
            // CAT CHARGE: Deep guttural feline growl & throat rumble ("Grrrr-mrrrooooow")
            const osc = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            const formant = this.ctx.createBiquadFilter();
            const mainGain = this.ctx.createGain();

            osc.type = 'sawtooth';
            // Feline throat growl rises from 180Hz up to 340Hz
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.linearRampToValueAtTime(340, t + 2.0);

            // Feline throat rumble LFO (28Hz purr-growl tremolo)
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(26, t);
            lfoGain.gain.setValueAtTime(35, t);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            // Cat vocal tract formant filter (F1 resonance around 650Hz)
            formant.type = 'bandpass';
            formant.frequency.setValueAtTime(450, t);
            formant.frequency.linearRampToValueAtTime(850, t + 2.0);
            formant.Q.value = 3.5;

            mainGain.gain.setValueAtTime(0.01, t);
            mainGain.gain.linearRampToValueAtTime(0.22, t + 0.25);

            osc.connect(formant);
            formant.connect(mainGain);
            mainGain.connect(this.ctx.destination);

            osc.start(t);
            lfo.start(t);

            this.chargeNodes = {
                stop: (stopTime) => {
                    mainGain.gain.linearRampToValueAtTime(0.001, stopTime + 0.06);
                    osc.stop(stopTime + 0.07);
                    lfo.stop(stopTime + 0.07);
                }
            };
        }
    }

    stopCharge() {
        if (this.chargeNodes) {
            try {
                this.chargeNodes.stop(this.ctx.currentTime);
            } catch (e) {}
            this.chargeNodes = null;
        }
    }

    // --- THROW SOUNDS ---
    playThrow(isRobot = true) {
        if (this.muted) return;
        this.init();
        this.stopCharge();

        const t = this.ctx.currentTime;

        if (isRobot) {
            // ROBOT THROW: Pneumatic hydraulic piston release + high-voltage laser railgun discharge ("PSH-ZAAAAP!")
            // 1. High frequency laser chirp
            const laser = this.ctx.createOscillator();
            const laserGain = this.ctx.createGain();
            laser.type = 'sawtooth';
            laser.frequency.setValueAtTime(1600, t);
            laser.frequency.exponentialRampToValueAtTime(180, t + 0.22);

            laserGain.gain.setValueAtTime(0.28, t);
            laserGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            laser.connect(laserGain);
            laserGain.connect(this.ctx.destination);

            laser.start(t);
            laser.stop(t + 0.22);

            // 2. Pneumatic hydraulic air blast noise
            const bufferSize = this.ctx.sampleRate * 0.16;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, t);
            filter.frequency.exponentialRampToValueAtTime(400, t + 0.16);
            filter.Q.value = 2.0;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.24, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(t);
        } else {
            // CAT THROW: Playful feline pounce chirp & sharp vocal whip ("MRR-OW-PH!")
            const osc = this.ctx.createOscillator();
            const formant = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            // Vocal inflection: starts at 480Hz, chirps up to 720Hz, drops sharply to 260Hz
            osc.frequency.setValueAtTime(480, t);
            osc.frequency.exponentialRampToValueAtTime(760, t + 0.08);
            osc.frequency.exponentialRampToValueAtTime(260, t + 0.24);

            // Formant filter creates feline vocal resonance
            formant.type = 'bandpass';
            formant.frequency.setValueAtTime(1200, t);
            formant.frequency.exponentialRampToValueAtTime(800, t + 0.24);
            formant.Q.value = 4.0;

            gain.gain.setValueAtTime(0.32, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

            osc.connect(formant);
            formant.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.24);
        }
    }

    // --- HIT & IMPACT SOUNDS ---
    playHit(isRobotTarget = true, isHeavy = false) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        if (isRobotTarget) {
            // ROBOT HIT: Metallic Ring Modulation (Chassis Clang) + Electrical Short-Circuit Crackle ("CLANG-ZAP-BZZT!")
            // 1. Inharmonic metallic ring modulation (Bell/Iron chassis clang)
            const carrier = this.ctx.createOscillator();
            const mod = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const clangGain = this.ctx.createGain();

            carrier.type = 'sine';
            carrier.frequency.setValueAtTime(isHeavy ? 180 : 310, t);
            carrier.frequency.exponentialRampToValueAtTime(90, t + 0.35);

            mod.type = 'triangle';
            mod.frequency.setValueAtTime(isHeavy ? 265 : 437, t); // inharmonic ratio for metallic clank!

            modGain.gain.setValueAtTime(140, t);
            modGain.gain.exponentialRampToValueAtTime(1, t + 0.35);

            mod.connect(modGain);
            modGain.connect(carrier.frequency);

            clangGain.gain.setValueAtTime(0.38, t);
            clangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            carrier.connect(clangGain);
            clangGain.connect(this.ctx.destination);

            carrier.start(t);
            mod.start(t);
            carrier.stop(t + 0.35);
            mod.stop(t + 0.35);

            // 2. Electrical Short-Circuit Buzz / Malfunction Zap
            const zap = this.ctx.createOscillator();
            const zapGain = this.ctx.createGain();
            zap.type = 'sawtooth';
            zap.frequency.setValueAtTime(750, t + 0.05);
            zap.frequency.exponentialRampToValueAtTime(120, t + 0.28);

            zapGain.gain.setValueAtTime(0.25, t + 0.05);
            zapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            zap.connect(zapGain);
            zapGain.connect(this.ctx.destination);

            zap.start(t + 0.05);
            zap.stop(t + 0.28);
        } else {
            // CAT HIT: Authentic Distressed Cat Yowl & Screech ("MEEE-EE-OWWW-KHSSSH!")
            // 1. Vocal tract formant meow-screech with feline vibrato
            const voice = this.ctx.createOscillator();
            const vibrato = this.ctx.createOscillator();
            const vibGain = this.ctx.createGain();
            const formantF1 = this.ctx.createBiquadFilter();
            const formantF2 = this.ctx.createBiquadFilter();
            const catGain = this.ctx.createGain();

            voice.type = 'sawtooth';
            // Classic cat vocal screech curve: starts high at 920Hz, drops to 540Hz, then distressed yowl up to 720Hz
            voice.frequency.setValueAtTime(920, t);
            voice.frequency.exponentialRampToValueAtTime(520, t + 0.22);
            voice.frequency.linearRampToValueAtTime(680, t + 0.42);
            voice.frequency.exponentialRampToValueAtTime(320, t + 0.55);

            // 7.5 Hz vocal cord vibrato
            vibrato.frequency.setValueAtTime(7.5, t);
            vibGain.gain.setValueAtTime(35, t);
            vibrato.connect(vibGain);
            vibGain.connect(voice.frequency);

            // Formant filters shaping the voice into "MEEE-OW" vowel
            formantF1.type = 'bandpass';
            formantF1.frequency.setValueAtTime(800, t);
            formantF1.Q.value = 4.0;

            formantF2.type = 'bandpass';
            formantF2.frequency.setValueAtTime(1850, t);
            formantF2.Q.value = 5.0;

            catGain.gain.setValueAtTime(0.35, t);
            catGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

            voice.connect(formantF1);
            voice.connect(formantF2);
            formantF1.connect(catGain);
            formantF2.connect(catGain);
            catGain.connect(this.ctx.destination);

            vibrato.start(t);
            voice.start(t);
            vibrato.stop(t + 0.55);
            voice.stop(t + 0.55);

            // 2. Startled Feline Hiss & Spit ("KHSSSH!")
            const bufferSize = this.ctx.sampleRate * 0.25;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const hissNoise = this.ctx.createBufferSource();
            hissNoise.buffer = buffer;

            const hissFilter = this.ctx.createBiquadFilter();
            hissFilter.type = 'highpass';
            hissFilter.frequency.setValueAtTime(3800, t + 0.08); // sharp feline hiss

            const hissGain = this.ctx.createGain();
            hissGain.gain.setValueAtTime(0.24, t + 0.08);
            hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

            hissNoise.connect(hissFilter);
            hissFilter.connect(hissGain);
            hissGain.connect(this.ctx.destination);

            hissNoise.start(t + 0.08);
        }
    }

    // --- REPAIR & HEAL SOUNDS ---
    playHeal(isRobot = true) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        if (isRobot) {
            // ROBOT RECHARGE: High-tech digital telemetry chime & power cell bootup ("Bip-bip-beep-BOOP!")
            const notes = [440, 660, 880, 1320]; // ascending harmonic digital notes
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteStart = t + idx * 0.07;

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, noteStart);

                gain.gain.setValueAtTime(0.18, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.12);
            });
        } else {
            // CAT TUNA FEAST: Warm, happy feline purring (26Hz flutter) + content "Mrrr-meow!"
            // 1. Deep purr
            const purr = this.ctx.createOscillator();
            const purrLfo = this.ctx.createOscillator();
            const purrGain = this.ctx.createGain();
            const purrMainGain = this.ctx.createGain();

            purr.type = 'triangle';
            purr.frequency.setValueAtTime(95, t);

            purrLfo.type = 'sine';
            purrLfo.frequency.setValueAtTime(25, t); // 25Hz purr flutter
            purrGain.gain.setValueAtTime(30, t);
            purrLfo.connect(purrGain);
            purrGain.connect(purr.frequency);

            purrMainGain.gain.setValueAtTime(0.25, t);
            purrMainGain.gain.linearRampToValueAtTime(0.001, t + 0.45);

            purr.connect(purrMainGain);
            purrMainGain.connect(this.ctx.destination);

            purr.start(t);
            purrLfo.start(t);
            purr.stop(t + 0.45);
            purrLfo.stop(t + 0.45);

            // 2. Sweet happy meow ("Mrr-meow!")
            const meow = this.ctx.createOscillator();
            const meowFormant = this.ctx.createBiquadFilter();
            const meowGain = this.ctx.createGain();

            meow.type = 'sawtooth';
            meow.frequency.setValueAtTime(420, t + 0.18);
            meow.frequency.linearRampToValueAtTime(680, t + 0.32);
            meow.frequency.exponentialRampToValueAtTime(400, t + 0.52);

            meowFormant.type = 'bandpass';
            meowFormant.frequency.setValueAtTime(1100, t + 0.18);
            meowFormant.Q.value = 4.0;

            meowGain.gain.setValueAtTime(0.22, t + 0.18);
            meowGain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

            meow.connect(meowFormant);
            meowFormant.connect(meowGain);
            meowGain.connect(this.ctx.destination);

            meow.start(t + 0.18);
            meow.stop(t + 0.52);
        }
    }

    // --- FENCE & GROUND THUDS ---
    playFenceHit() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Comical "BONK" hollow wood picket clatter
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.2);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playGroundHit() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Soft comic "SPLAT" / turf thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);

        gain.gain.setValueAtTime(0.26, t);
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
        const notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 (sparkling arcade arpeggio)

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

    playBoing() {
        // Comic spring button boing
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.linearRampToValueAtTime(580, t + 0.14);
        osc.frequency.linearRampToValueAtTime(380, t + 0.28);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // --- VICTORY FANFARES ---
    playVictory(isRobotWon = true) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        if (isRobotWon) {
            // ROBOT VICTORY: 8-Bit chiptune robotic victory fanfare with cheerful square-wave chirps!
            const melody = [
                { f: 523.25, d: 0.12, w: 0 },
                { f: 659.25, d: 0.12, w: 0.12 },
                { f: 783.99, d: 0.12, w: 0.24 },
                { f: 1046.50, d: 0.35, w: 0.36 },
                { f: 783.99, d: 0.12, w: 0.72 },
                { f: 1046.50, d: 0.55, w: 0.86 }
            ];

            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteStart = t + note.w;

                osc.type = 'square';
                osc.frequency.setValueAtTime(note.f, noteStart);
                gain.gain.setValueAtTime(0.22, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteStart);
                osc.stop(noteStart + note.d);
            });
        } else {
            // CAT VICTORY: Cheerful cartoon ragtime fanfare ending with a smug, happy feline "Meooww!"
            const melody = [
                { f: 392, d: 0.14, w: 0 },
                { f: 523.25, d: 0.14, w: 0.14 },
                { f: 659.25, d: 0.14, w: 0.28 },
                { f: 783.99, d: 0.45, w: 0.42 }
            ];

            melody.forEach(note => {
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

            // Triumphant finishing meow!
            setTimeout(() => {
                if (!this.muted && this.ctx) {
                    const mt = this.ctx.currentTime;
                    const meow = this.ctx.createOscillator();
                    const meowFormant = this.ctx.createBiquadFilter();
                    const meowGain = this.ctx.createGain();

                    meow.type = 'sawtooth';
                    meow.frequency.setValueAtTime(450, mt);
                    meow.frequency.linearRampToValueAtTime(750, mt + 0.18);
                    meow.frequency.exponentialRampToValueAtTime(420, mt + 0.45);

                    meowFormant.type = 'bandpass';
                    meowFormant.frequency.setValueAtTime(1150, mt);
                    meowFormant.Q.value = 4.0;

                    meowGain.gain.setValueAtTime(0.28, mt);
                    meowGain.gain.exponentialRampToValueAtTime(0.001, mt + 0.45);

                    meow.connect(meowFormant);
                    meowFormant.connect(meowGain);
                    meowGain.connect(this.ctx.destination);

                    meow.start(mt);
                    meow.stop(mt + 0.45);
                }
            }, 900);
        }
    }
}

window.soundEngine = new SoundEngine();
