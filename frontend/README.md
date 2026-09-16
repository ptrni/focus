# Focus Web

React 19 + TypeScript + Vite. Requires Node.js 20.19+.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and set `VITE_API_URL` to your running API.
3. Run `npm run dev` and open `http://localhost:5173`.

Run `npm run build` for a production build, and `npm run preview` to preview it. Configure the API's `FRONTEND_ORIGIN` to match the browser origin.

Run `npm run test:e2e` with the API and frontend running. Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. Tests cover desktop/mobile workspace CRUD, todo CRUD, persistence after reload, filters, search, deletion confirmation, and connection failure/retry.
