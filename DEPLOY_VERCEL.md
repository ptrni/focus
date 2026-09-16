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

This repository's Vercel configuration deploys only the frontend. Deploy the existing AdonisJS server and PostgreSQL separately; the configuration below uses Railway.

### Option A: Railway (Easiest)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `ptrni/focus`, set **Root Directory** to `/backend`, and set the Railway config file path to `/backend/railway.json`. This file defines build, migrations, startup, and health checks. Use Node.js 24 (also specified in `.nvmrc`).
3. Add a PostgreSQL service named `Postgres` in the same project/environment.
4. Set Environment Variables:
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3333
   APP_KEY=<run: node ace generate:key>
   FRONTEND_ORIGIN=https://focus-sepia-beta.vercel.app
   PG_HOST=${{Postgres.PGHOST}}
   PG_PORT=${{Postgres.PGPORT}}
   PG_USER=${{Postgres.PGUSER}}
   PG_PASSWORD=${{Postgres.PGPASSWORD}}
   PG_DB_NAME=${{Postgres.PGDATABASE}}
   ```
   Generate `APP_KEY` once and keep it stable in Railway's environment variables. Do not commit it. If your database service has a different name, update the `Postgres` references accordingly.
5. Deploy, then generate a public domain under Networking with target port `3333`. The pre-deploy step runs migrations; if it fails, inspect its logs before proceeding.
6. Verify `https://<generated-domain>/api/health` returns `{"status":"ok"}` and `/api/workspaces` returns JSON successfully.
7. Set Vercel frontend `VITE_API_URL` to `https://<generated-domain>/api` and redeploy the frontend. Test creating a workspace and task, then reload to verify persistence.

References: [Railway config](https://docs.railway.com/config-as-code/reference), [monorepo configuration](https://docs.railway.com/deployments/monorepo), [AdonisJS deployment](https://docs.adonisjs.com/deployment).

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
