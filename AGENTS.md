# Base44 dev environment

## Stack
- Frontend only: Vite + React 18 (SPA). No local backend or database.
- Backend is a **hosted Supabase** project (auth, db, storage, edge functions).
- Package manager: **pnpm** (corepack-enabled in compose). Node 20.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Web service: `node:20` base image, repo bind-mounted at `/app`, deps installed at startup (`pnpm install --no-frozen-lockfile`), runs `pnpm dev` (Vite, live reload).
- Vite dev server listens on container port **3002**, mapped to host port **3000**.
- `vite.config.js` sets `server.host: true` and `allowedHosts: true` so the preview's external hostname is accepted.

## Credentials (external, user-supplied)
The app needs Supabase credentials to function. Without them it boots and shows a `SupabaseConfigGuard` "config pending" page.
- `VITE_SUPABASE_URL` (or `VITE_SUPABASE_PROJECT_ID`) + `VITE_SUPABASE_PUBLISHABLE_KEY` — required to log in / load data.
- `VITE_BASE44_APP_ID` / `VITE_BASE44_APP_BASE_URL` — legacy, unused at runtime (the app is 100% Supabase).
Delivered via `/run/base44/app.env` (compose `env_file`, last entry overrides `./.env.base44-defaults` placeholders).
Vite exposes any `VITE_`-prefixed process env var to `import.meta.env`, so compose `env_file` works.

## Notes / quirks
- `pnpm-lock.yaml` is out of sync with `package.json` (two `@base44/*` deps added), so install uses `--no-frozen-lockfile`.
- `scripts/verify-vite-env.mjs` (run only by `npm run build`, not `dev`) aborts production builds without Supabase vars — not relevant to the dev preview.
- Login test account referenced in the repo: `prestador@prestador.com` (see `Senhas e acessos.md`).

## Verify
- `curl -sf http://localhost:3000/` returns the Vite-served HTML (title "Reparo Expresso").
- With credentials set, the login page renders instead of the config guard.
