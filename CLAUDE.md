# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Two separate npm projects, **not** a monorepo with workspaces — each has its own `package.json` and `node_modules`. Always `cd` into the right one before running scripts.

- `backend/` — Node.js + Express + PostgreSQL (NeonDB). ES modules (`"type": "module"`).
- `frontend/` — Next.js 14 (App Router) + TypeScript + Tailwind + Zustand.

## Commands

### Backend (`cd backend`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with nodemon on port 5000. Auto-initializes schema in development by executing `backend/database/schema.sql` on boot (see `src/config/database.js` → `initSchema`). |
| `npm start` | Production start, no auto-init. |
| `npm run migrate` | Run the inline migration list in `src/config/migrate.js` (idempotent — uses `CREATE … IF NOT EXISTS`). Use this against any database you don't want auto-initialized. |

Required env vars (validated at startup in `src/config/env.js`, process exits if missing): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. Optional: `PORT` (default 5000), `FRONTEND_URL` (CORS origin, default `http://localhost:3000`), Cloudinary keys.

There is **no test framework configured** on either side. Don't claim tests pass — there are none to run.

### Frontend (`cd frontend`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server on port 3000. |
| `npm run build` | Production build. |
| `npm run lint` | `next lint` (eslint-config-next). |

`NEXT_PUBLIC_API_URL` controls the backend base URL. The api client in `src/lib/api.ts` normalizes it: if it doesn't end in `/api`, `/api` is appended, so callers use paths like `/sales`, not `/api/sales`.

## Architecture: backend

Layered Express app — `routes → controllers → models → pg pool`. The composition that matters:

- **`server.js` → `src/app.js`**: `server.js` is just the boot script (init DB, listen, signal handlers). `src/app.js` wires CORS, JSON body parsing, request logging, then mounts route modules under `/api/*`.
- **Tenant isolation is the load-bearing invariant.** Every protected route chains `authenticate, tenantIsolation` (see e.g. `src/routes/sale.routes.js:10`). `authenticate` (in `src/middleware/auth.js`) decodes the JWT and attaches `req.user = { id, email, role, store_id }`. `tenantIsolation` (in `src/middleware/tenantIsolation.js`) then injects `req.storeId` and rejects any request whose `params.storeId` / `body.store_id` / `query.store_id` doesn't match. **Every model query must filter by `store_id`** — there is no row-level security at the DB level, isolation is enforced entirely in app code.
- **Role gating** is a separate middleware: `requireOwner` from `src/middleware/roleCheck.js`. Applied per-route after `tenantIsolation` (e.g. void-sale, product mutations).
- **Sales are written transactionally.** `src/models/Sale.js` `create()` uses `transaction()` from `src/config/database.js` to insert the `sales` row, insert `sale_items`, and decrement `inventory.quantity` in one BEGIN/COMMIT. The inventory `UPDATE` uses `WHERE quantity >= $1` so out-of-stock conditions roll back the whole sale.
- **Route ordering pitfall**: in `sale.routes.js`, specific routes (`/summary`, `/my-today`, `/:id/void`) must come before `/:id` or Express matches the dynamic route first. Existing comments call this out — preserve the order.
- **Errors**: throw the custom classes from `src/utils/errors.js` (`NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`) and let `errorHandler` (in `src/middleware/errorHandler.js`, registered last) shape the response.

Core tables (see `src/config/migrate.js` for the authoritative definitions): `users`, `stores`, `products`, `inventory` (unique on `store_id, product_id`), `sales`, `sale_items`. All child rows reference `store_id` directly — joining through the parent isn't relied on for isolation.

## Architecture: frontend

Next.js App Router with role-segmented areas:

- `src/app/auth/login`, `src/app/auth/register` — public.
- `src/app/(owner)/...` — route group for owner-only pages (`dashboard`, `inventory`, `products`, `reports`, `sales`, `store`, `users`). Layout in `src/app/(owner)/layout.tsx` should enforce role.
- `src/app/cashier/pos`, `src/app/cashier/select-store` — cashier POS UI.

State (Zustand): `authStore` (token + user), `cartStore` (current POS cart). `offlineStore.ts`, `lib/sync.ts`, and `hooks/useOfflineSync.ts` exist as **empty stubs** — offline sync is planned but not implemented; don't reference it as a working feature.

The api client (`src/lib/api.ts`) is the single place all requests go through:

- **Auth**: reads `accessToken` cookie via `js-cookie` and sets `Authorization: Bearer …` on every request.
- **401 refresh**: on a 401, posts to `/auth/refresh` with the `refreshToken` cookie, stores the new token, retries once. Refresh failure clears cookies and hard-redirects to `/auth/login`.
- **Network errors**: retries up to 3× with exponential backoff (2s → 4s → 8s) on `ERR_NETWORK`/`ECONNREFUSED`. After that, surfaces a "backend not running on port 5000" message.

When you add a new endpoint, prefer extending this instance — don't `import axios` directly elsewhere or you'll bypass auth and retry behavior.

## Agent skills

### Issue tracker

Issues live on GitHub at github.com/emciiowhy/VendPOS — use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical strings: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and one `docs/adr/` at the repo root. See `docs/agents/domain.md`.
