# 🚀 Google Play Store Publishing Guide: Robot vs Cat

This guide contains everything required to publish **Robot vs Cat: Backyard Showdown** to the **Google Play Store**.

---

## 📦 1. Play Store Assets Checklist (Included in Repository)

All graphic assets have been generated to exact Google Play Developer Console specifications:

| Asset | File Name | Required Specs | Status |
| :--- | :--- | :--- | :--- |
| **App Icon** | `icon-512.png` | 512 x 512 px, 32-bit PNG, max 1024KB | ✅ Ready |
| **Feature Graphic** | `feature-graphic.png` | 1024 x 500 px, PNG or JPEG, max 15MB | ✅ Ready |
| **Screenshot 1** | `screenshot-1-aiming.png` | 1280 x 720 px, 16:9 Landscape | ✅ Ready |
| **Screenshot 2** | `screenshot-2-impact.png` | 1280 x 720 px, 16:9 Landscape | ✅ Ready |
| **Screenshot 3** | `screenshot-3-powerups.png` | 1280 x 720 px, 16:9 Landscape | ✅ Ready |
| **PWA Web Manifest** | `manifest.json` | Valid web app manifest with landscape lock & icons | ✅ Ready |
| **Offline Service Worker** | `sw.js` | Cache-first offline playability | ✅ Ready |
| **Privacy Policy** | `privacy-policy.html` | Compliant with COPPA & Google Play Families policy | ✅ Ready |

---

## 📝 2. Google Play Console Listing Metadata

Copy and paste these directly into your **Google Play Console** store listing:

### App Details
- **App Name** *(Max 30 chars)*: `Robot vs Cat: Backyard Brawl`  
  *(Alternative: `Robot vs Cat: Showdown`)*
- **Short Description** *(Max 80 chars)*:  
  `Classic retro arcade artillery game! Throw plasma balls & juicy chicken bones!`
- **App Category**: `Games` > `Arcade` / `Casual`
- **Tags**: `Arcade`, `Physics`, `Retro`, `Turn-based`, `Offline`, `Casual`

### Full Description *(Formatted for Play Store)*
```text
🤖 ROBO-X VS FELIX THE CAT: THE ULTIMATE BACKYARD SHOWDOWN! 🐱

Remember the golden era of classic turn-based artillery games where two rivals hurled items over a fence? Robot vs Cat brings back that pure retro arcade magic with modern cartoon squash-and-stretch animations, procedural audio, and deep tactical physics!

Take command of Robo-X, a futuristic high-tech bot armed with bouncing metallic energy balls, or play as Felix the Cat, the scrappy backyard feline launching juicy roasted chicken drumsticks!

🎯 CALCULATE YOUR TRAJECTORY & BEAT THE WIND
The central wooden fence stands tall between the yard, and shifting wind gusts blow across the park.
• Adjust your launch angle with high-precision drag aiming or tactical step buttons.
• Charge your launch meter with perfect timing.
• Watch the cartoon Weather Vane to compensate for head-winds and tail-winds!

⚡ DEPLOY GAME-CHANGING POWER-UPS
Turn the tide of battle with tactical booster cards:
• ⚡ DOUBLE SHOT / DOUBLE BONE: Fire two projectiles in rapid succession!
• 💣 MEGA BOMB / DINO DRUMSTICK: Cause massive crater explosions and extra damage!
• 🔋 RECHARGE / TUNA FEAST: Heal up and repair your health bar on the fly!
• 🚀 LASER CORE / AERO BOOST: Fire a super-velocity shot that completely pierces through heavy wind!

🎮 GAME FEATURES:
• 100% Offline Play: No Wi-Fi or internet connection required!
• Three Game Modes: Play Solo vs Smart AI (Easy, Medium, Hard) or 2-Player Pass-and-Play on a single device!
• Handcrafted Cartoon Audio: Synthesized mechanical servo whines, metallic clangs, authentic feline meows, purrs, and ragtime park music!
• Zero Ads & Zero Tracking: Safe, privacy-first gaming experience with no annoying microtransactions.

Step up to the yard, gauge the wind, and launch your shot! Who will reign supreme? Download Robot vs Cat today!
```

### Privacy Policy URL
Host your policy on GitHub Pages with 1 click:
```text
https://gankmid5.github.io/robot-vs-cat/privacy-policy.html
```
*(Or use the raw GitHub link: `https://raw.githubusercontent.com/Gankmid5/robot-vs-cat/main/privacy-policy.html`)*

### Content Rating Questionnaire Answers
- **Violence**: Mild Cartoon / Slapstick violence only (no blood, no gore).
- **Sex / Nudity**: None.
- **Profanity**: None.
- **User Generated Content**: None.
- **Data Collection**: None.
- **Result**: Rated **Everyone (PEGI 3)**.

---

## 🛠️ 3. Packaging into an Android App Bundle (`.aab`)

Google Play Console requires an **Android App Bundle (.aab)**. You can build it using either method:

### Method A: PWABuilder (Fastest, No Coding Required)
1. Ensure your repository has **GitHub Pages** enabled:
   - Go to `https://github.com/Gankmid5/robot-vs-cat/settings/pages`
   - Under **Build and deployment**, select Source: **Deploy from a branch** (`main` / root) and click **Save**.
   - Your live URL will be: `https://gankmid5.github.io/robot-vs-cat/`
2. Open **[PWABuilder.com](https://www.pwabuilder.com/)** in your browser.
3. Paste `https://gankmid5.github.io/robot-vs-cat/` and click **Start**.
4. PWABuilder will automatically read your `manifest.json`, verify 100% PWA score and offline support.
5. Click **Package for Stores** -> **Google Play**.
6. Enter package ID: `com.gankmid5.robotvscat` (or your preferred ID) and click **Generate Package**.
7. Download the `.zip` archive: it contains your signed/alignable ready-to-upload `.aab` file!

---

### Method B: Google Bubblewrap CLI (Official Google TWA Tool)
Bubblewrap is Google's official command-line tool that compiles a Trusted Web Activity into an `.aab`:

```bash
# 1. Install Bubblewrap globally
npm install -g @bubblewrap/cli

# 2. Initialize from your live manifest
bubblewrap init --manifest=https://gankmid5.github.io/robot-vs-cat/manifest.json

# 3. Build the Android App Bundle
bubblewrap build
```
This generates `app-release-bundle.aab` ready for upload.

---

### Method C: Capacitor (Direct Native Android Studio Project)
If you prefer an offline native Android Studio project:
```bash
# In the robot-vs-cat folder:
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Robot vs Cat" com.gankmid5.robotvscat --web-dir .
npx cap add android
npx cap open android
```
In Android Studio: Click **Build** > **Generate Signed Bundle / APK** > **Android App Bundle**.

---

## 🚀 4. Submitting to Google Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - App name: `Robot vs Cat: Backyard Brawl`
   - Default language: `English (United States)`
   - App or Game: `Game`
   - Free or Paid: `Free`
3. In **Dashboard**, complete the Set up your app tasks:
   - **Privacy Policy**: Paste your GitHub Pages privacy policy URL.
   - **App access**: All functionality available without restrictions.
   - **Ads**: Check *No, my app does not contain ads*.
   - **Content rating**: Complete questionnaire (Everyone / PEGI 3).
   - **Target audience**: Check appropriate age brackets.
   - **Financial features**: None.
4. In **Store presence** > **Main store listing**:
   - Upload `icon-512.png` as App icon.
   - Upload `feature-graphic.png` as Feature graphic.
   - Upload `screenshot-1-aiming.png`, `screenshot-2-impact.png`, and `screenshot-3-powerups.png` under Phone & Tablet screenshots.
   - Paste the Title, Short Description, and Full Description from Section 2 above.
5. In **Release** > **Production** (or **Closed testing**):
   - Upload your `.aab` bundle.
   - Click **Review and release** to submit for Google Play review!
