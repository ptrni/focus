# Frontend and backend on Vercel

The repository root builds React/Vite at `/` and AdonisJS 7 as a Node.js 24 Vercel Function at `/api/*`. The frontend calls `/api` on the same domain. PostgreSQL must still be provisioned separately (for example, Neon through Vercel Storage/Marketplace).

## Vercel settings

For `ptrni/focus` and project `prj_XFIyatzwiJIb5wzlnTFiZkKokYDP`:

| Setting | Value |
| --- | --- |
| Root Directory | Repository root; clear `frontend` if currently set |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | Use root `vercel.json` |
| Build Command | `npm run build` |
| Output Directory | Disable old `dist` or `frontend/dist` override; use Build Output API detection |

The build generates `.vercel/output/static` and `.vercel/output/functions/api/index.func`. Production dependencies are installed inside the function. Source `.env` files are not copied. The combined build sets the frontend API to `/api`, so `VITE_API_URL` is not required.

## Database and environment variables

Connect a hosted PostgreSQL database, reviewing the provider's plan before provisioning. Set these variables in Vercel Production:

- `DATABASE_URL`: provider PostgreSQL connection string, including its TLS options; use a pooled connection URL for runtime if available.
- `APP_KEY`: a persistent secret generated with `node ace generate:key` in `backend` after dependency installation.
- `FRONTEND_ORIGIN`: `https://focus-sepia-beta.vercel.app` (no trailing slash).

The function sets `NODE_ENV=production` and does not open a listening port. Never put database credentials or APP_KEY in GitHub, chat, or frontend `VITE_*` variables. Use a separate database for previews.

## Run migrations before deployment

Migrations are explicit, not run during requests or frontend builds. With Node.js 24:

```sh
cd backend
npm ci --include=dev
cp .env.example .env
# Edit .env with DATABASE_URL, APP_KEY, and FRONTEND_ORIGIN.
# Use the provider's direct/unpooled database URL for migrations if supplied.
node ace migration:run --force
```

Keep `.env` local and ignored. Run migrations against the intended database before first deployment and whenever the schema changes. Then redeploy the latest commit after saving Vercel settings and environment variables.

## Verify

1. `/api/health` should return `{"status":"ok"}`. This verifies application startup, not database connectivity.
2. `/api/workspaces` should return JSON with a `data` array, confirming database connectivity and migrations.
3. Create/edit/complete a task in the frontend, reload, and verify persistence.
4. Import `postman/Focus-Todo.postman_collection.json`, set `baseUrl` to `https://focus-sepia-beta.vercel.app/api`, and run against a test database. The collection creates/deletes test records.

If API routes return HTML/404, check Root Directory and deployment output. For 500 errors inspect function logs, environment variables, and migrations.

## Local verification

```sh
# From repository root, Node.js 24
npm ci --prefix backend --include=dev
npm ci --prefix frontend --include=dev
npm run build
npm run test:vercel
```

Adapter tests exercise the packaged handler, concurrent startup, CORS, request validation, routing, and production frontend assets without PostgreSQL. Existing backend API tests require a running API with a migrated test database for CRUD/persistence checks.

## Optional separate Vercel projects

Backend: set Root Directory to `backend`; `backend/vercel.json` builds an API-only deployment. Configure the same environment variables and run migrations.

Frontend: set Root Directory to `frontend` and `VITE_API_URL` to `https://<backend-domain>/api`, then rebuild. The backend's `FRONTEND_ORIGIN` must match the frontend origin.

Railway remains an alternative via `backend/railway.json`, but is not needed for the combined Vercel deployment.

References: [Vercel Build Output API](https://vercel.com/docs/build-output-api/primitives), [AdonisJS production builds](https://docs.adonisjs.com/deployment), [Vercel storage](https://vercel.com/docs/storage).
