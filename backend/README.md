# Focus API

AdonisJS 7 + TypeScript + Lucid 22 + PostgreSQL 16.

Requires **Node.js 24+**. With nvm: `nvm install 24 && nvm use 24`.

1. Create a PostgreSQL database and user, or run `docker compose up -d db` from the parent directory.
2. Run `npm ci`, copy `.env.example` to `.env`, and set your database credentials and frontend origin.
3. Run `node ace generate:key` then `node ace migration:run`.
4. Run `npm run dev`. The API is available at `http://localhost:3333/api`.

`npm test` runs integration tests against the running API. Override `API_URL` if needed. `npm run build` compiles the server. To run the compiled app, copy your `.env` into `build/` and run `npm start` from this directory. For a standalone build, run `npm ci --omit=dev` inside `build/` then `node bin/server.js`.

Endpoints: GET/POST `/api/workspaces`, GET/PATCH/DELETE `/api/workspaces/:id`, GET/POST `/api/todos`, GET/PATCH/DELETE `/api/todos/:id`. Use `GET /api/todos?workspaceId=1` to list tasks for one workspace. Workspace PATCH renames it; DELETE removes the workspace and cascades its tasks. Todo POST requires a nonblank title (up to 200 characters) and can include `workspaceId`. Todo PATCH accepts title and/or boolean completed. Unknown fields are rejected. No authentication: all clients share the same workspaces.

Upgraded from AdonisJS 5 to remove known vulnerable dependencies. `npm audit` and `npm audit --omit=dev` report zero findings on 2026-09-16. See the parent README for the upgrade details. Existing PostgreSQL tables and migration history are preserved; do not reset the database.

Only JSON is accepted for POST/PATCH/PUT (415 otherwise), with a 16 KB body limit (413 if exceeded). Form/multipart parsing is disabled. Tests cover malformed JSON, unsafe fields, and rejected body formats.
