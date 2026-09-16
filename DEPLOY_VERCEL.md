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
2. Set **Root Directory** to `frontend`
3. Build settings are auto-detected from `vercel.json`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-domain.railway.app/api` (or wherever you deploy backend)
5. Deploy

### 3. After Deploy
- Copy your Vercel URL (e.g., `https://focus-todo.vercel.app`)
- Update backend `FRONTEND_ORIGIN` to this URL

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