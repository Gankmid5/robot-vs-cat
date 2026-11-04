# ⚡ Vercel Deployment & Web Analytics Guide: Robot vs Cat

This project is fully configured for zero-configuration deployment to **Vercel**, complete with **Vercel Web Analytics**, **Speed Insights**, and **Custom Game Telemetry**.

---

## 🚀 1. One-Click Deploy to Vercel

### Option A: Via GitHub (Recommended)
1. Push your repo to GitHub (`https://github.com/Gankmid5/robot-vs-cat`).
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Import `robot-vs-cat`.
4. Framework Preset: **Other** (Root directory: `./`).
5. Click **Deploy**. Vercel will automatically apply headers, caching, and clean routing from `vercel.json`.

### Option B: Via Vercel CLI
```bash
# In the project directory:
npm i -g vercel
vercel
# When prompted to deploy to production:
vercel --prod
```

---

## 📊 2. Enabling Vercel Web Analytics & Speed Insights

Once your project is deployed on Vercel:
1. Open your project in the **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Navigate to the **Analytics** tab.
3. Click **Enable Web Analytics** (select the free tier).
4. Navigate to the **Speed Insights** tab and click **Enable Speed Insights**.

> 💡 **No code changes needed!** The scripts are already loaded via `index.html`:
> - `/_vercel/insights/script.js` (Web Analytics)
> - `/_vercel/speed-insights/script.js` (Real User Core Web Vitals)

---

## 🎯 3. Custom Game Events Captured

The included [`analytics.js`](file:///C:/Users/Scratch/.gemini/antigravity/scratch/robot-vs-cat/analytics.js) automatically sends structured custom events to Vercel Analytics (`va('event', ...)`):

| Event Name | Trigger Condition | Data Payload |
| :--- | :--- | :--- |
| `page_ready` | Game loaded in browser | `{ screen_width, screen_height, device: 'mobile'/'desktop' }` |
| `match_start` | Player starts a match from title menu | `{ mode: '1p_robot'/'1p_cat'/'2p', difficulty: 'easy'/'medium'/'hard' }` |
| `projectile_launch` | Any projectile thrown | `{ player: 'robot'/'cat', angle: 55, power: 78, wind: 2.4, power_up: 'mega'/'none' }` |
| `hit_character` | Direct hit on character | `{ target: 'robot'/'cat', damage: 25/45, critical: true/false }` |
| `hit_fence` | Shot blocked by middle fence | `{ player: 'robot'/'cat' }` |
| `powerup_activated` | Booster card used | `{ player: 'robot'/'cat', powerup: 'double'/'mega'/'heal'/'windNegator' }` |
| `match_end` | Health reaches 0 | `{ winner: 'robot'/'cat', duration_seconds, total_rounds, shots_fired, accuracy_percent }` |

---

## 🛠️ 4. Local Testing & Debugging

When testing locally on `localhost` or `127.0.0.1`, `analytics.js` runs in **Debug Mode** and logs formatted telemetry directly to the browser console:

```javascript
// To manually enable debug logs in production:
localStorage.setItem('debug_analytics', 'true');
```

The Service Worker (`sw.js`) is configured to bypass all `/_vercel/*` telemetry endpoints, ensuring real-time metrics are never blocked by offline caching.
