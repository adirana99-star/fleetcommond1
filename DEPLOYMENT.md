# FleetCommand — Production Deployment Guide

Take the app live on **your own domain** with three pieces:

| Piece | What it is | Suggested host | Your domain |
|-------|------------|----------------|-------------|
| Backend API | Node/Express + MongoDB | Render / Railway / VPS | `api.fleetmind.org` |
| Web app | Static Expo web export (`dist/`) | Netlify / Vercel / Nginx | `app.fleetmind.org` |
| Mobile app | Android APK/AAB via EAS | Expo EAS | n/a |

> Domain: **fleetmind.org** (API on `api.fleetmind.org`, web app on `app.fleetmind.org`).

---

## 0. One-time prep

```powershell
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Generate the platform super-admin password hash (use YOUR real password)
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PLATFORM_PASSWORD').digest('hex'))"
```

Push the repo to GitHub (Render/Netlify deploy from Git):

```powershell
git add .
git commit -m "Production deployment config"
git branch -M main
git remote add origin https://github.com/<you>/fleetcommand.git
git push -u origin main
```

> Rotate any passwords that were ever shared in chat/email before pushing publicly.

---

## 1. Backend API → live on `api.fleetmind.org`

### Option A — Render (uses `render.yaml`)
1. Render → **New → Blueprint** → select your repo.
2. Set these env vars when prompted:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `CORS_ORIGIN` — `https://app.fleetmind.org,https://fleetmind.org`
   - `PLATFORM_PASSWORD_HASH` — the sha256 hash from step 0
   - (`JWT_SECRET` auto-generates; `TRUST_PROXY=true`, `REQUIRE_AUTH_FOR_SYNC=true` come from `render.yaml`)
3. Deploy. Then **Settings → Custom Domains** → add `api.fleetmind.org`.
4. At your DNS registrar add the CNAME Render shows (e.g. `api → <service>.onrender.com`).
5. Verify: open `https://api.fleetmind.org/health` → expect `{ "ok": true, "mongoState": 1 }`.

### Option B — Docker / VPS (uses `backend/Dockerfile`)
```bash
cd backend
docker build -t fleetcommand-api .
docker run -d -p 4000:4000 --env-file .env --name fleetcommand-api fleetcommand-api
```
Put Nginx/Caddy in front for HTTPS on `api.fleetmind.org` (keep `TRUST_PROXY=true`).

---

## 2. Web app → live on `app.fleetmind.org`

### Option A — Netlify (uses `netlify.toml`)
1. Netlify → **Add new site → Import from Git** → your repo.
2. Site → **Environment variables** → add:
   - `EXPO_PUBLIC_ENVIRONMENT = production`
   - `EXPO_PUBLIC_API_BASE_URL = https://api.fleetmind.org`
3. Deploy. Then **Domain management** → add `app.fleetmind.org` and follow the DNS instructions.

### Option B — Build locally and host anywhere
```powershell
$env:EXPO_PUBLIC_ENVIRONMENT="production"
$env:EXPO_PUBLIC_API_BASE_URL="https://api.fleetmind.org"
npm run web:export   # outputs static site to dist/
```
Upload `dist/` to any static host / Nginx root. Add an SPA fallback so unknown routes serve `index.html`.

> After the web domain is final, make sure the backend `CORS_ORIGIN` includes it, then redeploy the backend.

---

## 3. Mobile app (Android) → EAS build

1. In `eas.json`, set `EXPO_PUBLIC_API_BASE_URL` for the `production` profile to `https://api.fleetmind.org`.
2. Build:
   ```powershell
   npx eas login
   npm run build:android:production
   ```
3. EAS returns a download link for the AAB/APK. Upload the AAB to Google Play, or share the APK directly.

---

## Go-live checklist
- [ ] `api.fleetmind.org/health` returns `mongoState: 1`
- [ ] `CORS_ORIGIN` lists the exact web domain(s)
- [ ] `JWT_SECRET` is strong and **not** committed to Git
- [ ] `PLATFORM_PASSWORD_HASH` set; demo passwords rotated
- [ ] `REQUIRE_AUTH_FOR_SYNC=true` (writes require login)
- [ ] MongoDB Atlas → Network Access allows your host (or `0.0.0.0/0` if the host has dynamic IPs)
- [ ] Web app loads on `app.fleetmind.org` and can log in + sync
