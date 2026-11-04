# 🤖 Robot vs Cat: The Ultimate Ball & Bone Showdown 🐱

A faithful, cartoon-packed tribute to the classic **Cat vs Dog** artillery showdown, completely reimagined in a sunny park setting!

- **Robot (ROBO-X)** throws high-tech metallic / plasma energy balls.
- **Cat (Felix)** throws juicy, savory chicken drumstick bones.

---

## 🎨 New Cartoon Effects & Park Atmosphere

- **Cartoon Squash & Stretch**: Characters visibly squash down like an accordion while charging up tension, stretch and whip forward on release, and comically flatten like a pancake on impact!
- **Comic Action Starbursts**: Punchy comic book bursts pop up on impact — `"BONK!"`, `"WHAM!"`, `"POW!"`, `"SPLAT!"`, `"CLANG!"`, and `"MEOW!"`!
- **Dizzy Circling Stars & Sweat Drops**: Golden 5-pointed cartoon stars orbit the character's head after taking hits, and comical sweat droplets fly off during high-power charges!
- **Lush Storybook Park Background**:
  - Radiant smiling sun with animated translucent rotating sunbeams.
  - Multi-layered rolling green park hills with distant trees.
  - Cobblestone curved park footpath and Victorian iron lamp post.
  - Shady park oak tree with leafy cloud canopies on the left, and a blooming cherry blossom tree on the right.
  - **Robot's Side**: Park solar charging kiosk with an angled solar panel, digital battery bars, and a curly yellow charging cable.
  - **Cat's Side**: Wooden slatted park bench, red-and-white checkered picnic blanket, tuna tin with fish bones, and a fluttering yellow butterfly.
  - **Middle Park Picket Fence**: Natural wooden pickets entwined with climbing ivy tendrils and morning glory / daisy flowers.
  - **Wind-blown Foliage**: Swirling green leaves and cherry blossom petals drifting across the screen in real-time according to the wind direction and speed!
- **Playful Cartoon Background Music (BGM)**:
  - Whimsical ragtime / park stroll melody generated procedurally in real-time via the Web Audio API (marimba melody, walking tuba bassline, and rhythmic woodblock taps).
  - Dedicated `🎵 MUSIC ON/OFF` toggle button and volume management.
  - Starts automatically on first click/tap or spacebar press!

---

## 🎮 How to Play

### 1. Launching
- Double-click [`start_game.bat`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/start_game.bat) or open [`index.html`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/index.html) in any browser!
- Zero dependencies, completely self-contained.

### 2. Controls
- **Charge & Throw**:
  - **Click & hold** the green `HOLD TO CHARGE & THROW` button, or
  - **Press & hold** `[Spacebar]`, or
  - **Click & hold directly on your character**.
  - Release to fling your projectile over the middle park fence!
- **Adjust Angle**:
  - Drag the **LAUNCH ANGLE** slider (30° to 80°), or
  - Use `[Up]` / `[Down]` or `[W]` / `[S]` keys.
- **Wind**:
  - Watch the **Wind Gauge** at the top center and the drifting park leaves!
  - `➔` pushes projectiles towards the Cat (right).
  - `⬅` pushes projectiles towards the Robot (left).

---

## ⚡ Special Power-Ups (Per Player)

| Power-Up | Robot Version | Cat Version | Effect |
| :--- | :--- | :--- | :--- |
| **Double Shot** | ⚡ Double Shot | 🍗 Double Bone | Fires 2 projectiles back-to-back in rapid succession. |
| **Mega Blast** | 💣 Mega Bomb | 🍖 Dino Bone | Giant, heavy projectile dealing massive damage (**45 HP**). |
| **Heal** | 🔋 Recharge | 🐟 Tuna Feast | Restores **+30 HP** instantly (consumes the turn). |
| **Aero Boost** | 🚀 Laser Core | ✨ Aero Bone | Aerodynamic projectile that **completely ignores wind**! |

---

## 🕹️ Game Modes
- **1P: Player (Robot) vs Cat AI**
- **1P: Player (Cat) vs Robot AI**
- **2P: Pass & Play (Local)** on the same computer!
- **AI Difficulty**: Easy, Medium, and Hard with wind trajectory calculation.

---

## 📱 Google Play Store & PWA Ready
- **PWA Manifest (`manifest.json`)**: Configured for fullscreen landscape standalone display.
- **Offline Service Worker (`sw.js`)**: 100% cache-first offline support.
- **Mobile Hardware Back Button**: Traps and toggles in-game pause and modals.
- **Store Graphics Assets**:
  - `icon-512.png`: 512x512 32-bit PNG App Icon.
  - `feature-graphic.png`: 1024x500 Feature Graphic Promotional Banner.
  - `screenshot-1-aiming.png`, `screenshot-2-impact.png`, `screenshot-3-powerups.png`: 1280x720 store screenshots.
- **Compliant Privacy Policy**: Included as [`privacy-policy.html`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/privacy-policy.html).
- **Publishing Guide**: Full step-by-step instructions in [`GOOGLE_PLAY_GUIDE.md`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/GOOGLE_PLAY_GUIDE.md).

---

## ⚡ Vercel & Web Analytics Ready
- **Vercel Web Analytics & Speed Insights**: Pre-configured in `index.html` via official Vercel tags.
- **Custom Game Telemetry (`analytics.js`)**: Real-time event tracking for match starts, throws, fence blocks, hits, power-ups, and match winners.
- **Vercel Routing & Headers (`vercel.json`)**: Security headers, static asset caching, and offline SW bypass.
- **Vercel Guide**: Step-by-step deployment instructions in [`VERCEL.md`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/VERCEL.md).
