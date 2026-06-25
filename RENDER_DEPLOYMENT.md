# Deploy on Render — Free Web Services

Create **two separate Free Web Services** (no Blueprint): one for the API, one for the frontend.

## Before you start

- Code pushed to GitHub / GitLab / Bitbucket
- [Render](https://render.com) account
- [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster (Render free tier has no database)

```
Browser → your-frontend.onrender.com (Next.js)
              ↓ cookies + API calls
          your-api.onrender.com (NestJS)
              ↓
          MongoDB Atlas
```

---

## Step 1 — MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → add user + password.
3. **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`).
4. **Connect** → copy URI, replace `<password>`, use db name `pokedex`.

Example:
```
mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/pokedex?retryWrites=true&w=majority
```

---

## Step 2 — Backend Web Service (API)

1. Render Dashboard → **New +** → **Web Service**.
2. Connect your repo.
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `pokedex-api` (or any name) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | **Free** |

4. Expand **Advanced** → set **Health Check Path** to `/`

5. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | Click **Generate** (or paste a long random string) |
| `JWT_ACCESS_TOKEN_EXPIRATION` | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `7d` |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` |
| `CORS_ORIGIN` | Leave empty for now — set after frontend deploys |
| `KEEP_ALIVE_ENABLED` | `false` |

6. Click **Create Web Service** and wait for deploy to finish.
7. Copy your API URL, e.g. `https://pokedex-api.onrender.com`
8. Test: open `https://pokedex-api.onrender.com/` — should return `{"status":"ok",...}`

---

## Step 3 — Frontend Web Service

1. **New +** → **Web Service** (same repo).
2. Configure:

| Field | Value |
|-------|-------|
| **Name** | `pokedex-client` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

3. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://pokedex-api.onrender.com` ← your API URL from Step 2 |
| `NEXT_PUBLIC_API_TIMEOUT` | `60000` |

4. Click **Create Web Service** and wait for build (can take 5–10 min on free tier).
5. Copy frontend URL, e.g. `https://pokedex-client.onrender.com`

---

## Step 4 — Link frontend and API (CORS)

1. Go to your **API** service → **Environment**.
2. Set `CORS_ORIGIN` to your **exact** frontend URL:
   ```
   https://pokedex-client.onrender.com
   ```
   No trailing slash. Must be `https://`.
3. Save — API will auto-redeploy.

---

## Step 5 — Verify

- [ ] `https://your-api.onrender.com/` returns OK
- [ ] Frontend loads at `https://your-client.onrender.com`
- [ ] Login works (`demo@example.com` / `password123` if demo user seeded)
- [ ] Refresh page — still logged in (cookies working)

If you change `NEXT_PUBLIC_API_URL` later, **manually redeploy the frontend** (Build & Deploy → Deploy latest commit).

---

## Local development

```bash
npm run install:all
```

`server/.env`:
```
MONGO_URI=mongodb://localhost:27017/pokedex
JWT_SECRET=local-dev-secret
CORS_ORIGIN=http://localhost:3000
```

`client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=60000
```

```bash
npm run dev
```

---

## Troubleshooting

### First request very slow (30–60s)
Free web services sleep after ~15 min idle. First hit wakes the server. Timeout is 60s — wait and retry.

### CORS / login fails
- `CORS_ORIGIN` must **exactly** match frontend URL.
- Both services must use `https://` (Render provides this automatically).

### API calls hit localhost in production
`NEXT_PUBLIC_API_URL` was missing at build time. Set it on the frontend service and **redeploy**.

### Build failed
- Confirm **Root Directory** is `server` or `client` (not repo root).
- Check build logs for missing env vars.

---

## Free tier notes

- Each web service gets 750 free hours/month per workspace.
- Two free services = both can sleep when idle.
- MongoDB Atlas free: 512 MB storage.
