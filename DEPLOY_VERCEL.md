# Vercel Deployment Guide

## Frontend (Deploy to Vercel)

### 1. Push to GitHub
```bash
cd focus
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/focus.git
git push -u origin main
```

### 2. Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and import the repository
2. Set **Root Directory** to `frontend`. Deploying from the repository root is also supported: the root `vercel.json` installs and builds `frontend` and serves `frontend/dist`.
3. Build settings are auto-detected from `vercel.json`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-domain.railway.app/api` (or wherever you deploy backend)
5. Deploy

### 3. After Deploy
- Copy your Vercel URL (e.g., `https://focus-todo.vercel.app`)
- Update backend `FRONTEND_ORIGIN` to this URL

### Fix "Cannot reach the server"

The frontend needs a running backend and PostgreSQL database. Deploying this repository's frontend on Vercel does not start the backend.

1. Confirm your deployed backend's `/api/health` endpoint returns JSON with `status: "ok"`, and `/api/workspaces` responds successfully after database migrations.
2. In Vercel project environment variables, set `VITE_API_URL` to that backend's HTTPS URL ending in `/api`. Apply it to Production (and Preview if needed).
3. Set the backend's `FRONTEND_ORIGIN` to `https://focus-sepia-beta.vercel.app` without a trailing slash, then restart/redeploy the backend so CORS allows the frontend.
4. Redeploy the frontend. Vite embeds `VITE_API_URL` at build time; changing the environment variable alone does not update existing deployments.

Do not use `localhost`, a placeholder domain, or the frontend domain as the backend URL. Vercel builds now reject missing, non-HTTPS, or loopback API URLs; local development still supports `http://localhost:3333/api`.

---

## Backend (Deploy Separately - Not on Vercel)

AdonisJS cannot run on Vercel. Deploy to **Railway**, **Render**, **Fly.io**, or **Neon + Railway**.

### Option A: Railway (Easiest)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `focus` repo, set **Root Directory** to `backend`
3. Add PostgreSQL database (Railway provides one-click)
4. Set Environment Variables:
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3333
   APP_KEY=<run: node ace generate:key>
   FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
   PG_HOST=<railway-postgres-host>
   PG_PORT=5432
   PG_USER=<railway-postgres-user>
   PG_PASSWORD=<railway-postgres-password>
   PG_DB_NAME=<railway-postgres-db>
   ```
5. Deploy → Copy the generated domain (e.g., `https://focus-backend.railway.app`)
6. Update Vercel frontend `VITE_API_URL` to `https://focus-backend.railway.app/api`

### Option B: Render
Similar to Railway but uses `render.yaml` for config.

### Database Options
- **Railway/Render/Neon/Supabase** - Managed PostgreSQL
- Update `PG_*` env vars accordingly

---

## Local Development with Production Backend
```bash
cd frontend
echo "VITE_API_URL=https://your-backend.railway.app/api" > .env.local
npm run dev
```

---

## Commands Reference

| Task | Command |
|------|---------|
| Build frontend | `cd frontend && npm run build` |
| Preview build | `cd frontend && npm run preview` |
| Build backend | `cd backend && npm run build` |
| Generate APP_KEY | `cd backend && node ace generate:key` |
| Run migrations | `cd backend && node ace migration:run` |
