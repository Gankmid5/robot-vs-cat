// Robot vs Cat - Vercel Web Analytics & Event Tracking Engine
// Seamlessly routes gameplay telemetry to Vercel Analytics with offline-safe fallbacks

(function() {
    // 1. Ensure window.va queue exists so events never get dropped before the Vercel script loads
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

    class GameAnalytics {
        constructor() {
            this.sessionStartTime = Date.now();
            this.shotsFired = 0;
            this.hitsLanded = 0;
            this.matchStartTime = 0;
            this.isDebug = false;

            try {
                this.isDebug = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' || 
                               localStorage.getItem('debug_analytics') === 'true';
            } catch (_) {}

            if (this.isDebug) {
                console.log('[Analytics:Vercel] Ready. Telemetry initialized in debug mode.');
            }

            // Track initial game view
            this.track('page_ready', {
                screen_width: window.innerWidth,
                screen_height: window.innerHeight,
                device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            });
        }

        // Generic track dispatcher
        track(eventName, eventData = {}) {
            if (this.isDebug) {
                console.log(`%c[Analytics:Vercel] %c${eventName}`, 'color: #00e5ff; font-weight: bold;', 'color: #fff;', eventData);
            }

            try {
                if (typeof window.va === 'function') {
                    window.va('event', {
                        name: eventName,
                        data: eventData
                    });
                }
            } catch (err) {
                if (this.isDebug) {
                    console.warn('[Analytics:Vercel] Telemetry dispatch error:', err);
                }
            }
        }

        // Match Lifecycle Events
        trackMatchStart(mode, difficulty) {
            this.matchStartTime = Date.now();
            this.shotsFired = 0;
            this.hitsLanded = 0;
            this.track('match_start', {
                mode: mode || '1p_robot',
                difficulty: difficulty || 'medium'
            });
        }

        trackMatchEnd(winner, totalRounds) {
            const durationSeconds = this.matchStartTime ? Math.round((Date.now() - this.matchStartTime) / 1000) : 0;
            const accuracy = this.shotsFired > 0 ? Math.round((this.hitsLanded / this.shotsFired) * 100) : 0;
            this.track('match_end', {
                winner: winner || 'draw',
                duration_seconds: durationSeconds,
                total_rounds: totalRounds || 0,
                shots_fired: this.shotsFired,
                accuracy_percent: accuracy
            });
        }

        // Action Events
        trackThrow(player, angle, power, wind, powerUp) {
            this.shotsFired++;
            this.track('projectile_launch', {
                player: player || 'robot',
                angle: Math.round(angle || 0),
                power: Math.round(power || 0),
                wind: typeof wind === 'number' ? Number(wind.toFixed(1)) : 0,
                power_up: powerUp || 'none'
            });
        }

        trackHit(target, damage, isCrit = false) {
            this.hitsLanded++;
            this.track('hit_character', {
                target: target || 'cat',
                damage: Math.round(damage || 0),
                critical: Boolean(isCrit)
            });
        }

        trackFenceCollision(player) {
            this.track('hit_fence', {
                player: player || 'unknown'
            });
        }

        trackPowerUp(player, powerUpKey) {
            this.track('powerup_activated', {
                player: player || 'robot',
                powerup: powerUpKey || 'unknown'
            });
        }

        trackSettingToggle(setting, state) {
            this.track('setting_toggle', {
                setting: setting,
                state: String(state)
            });
        }

        trackModal(modalName, action = 'open') {
            this.track('modal_view', {
                modal: modalName,
                action: action
            });
        }
    }

    // Attach to global window scope
    window.gameAnalytics = new GameAnalytics();
})();
