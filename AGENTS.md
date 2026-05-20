<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# azeriqo-store — account credentials manager

## First-time setup (local)
```bash
npm install
npx prisma generate
npx prisma migrate dev   # creates dev.db SQLite file
```

## Production database (Turso — SQLite cloud for Vercel)
```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | sh

# 2. Login & create database
turso auth login
turso db create azeriqo-store

# 3. Get credentials
turso db show azeriqo-store --url         # → TURSO_DATABASE_URL
turso db tokens create azeriqo-store      # → TURSO_AUTH_TOKEN

# 4. Push schema
npx prisma db push
```

## Dev commands
- `npm run dev` — dev server (port 3000, HMR)
- `npm run build` — production build (also typechecks via Next.js)
- `npm run start` — production server
- `npm run lint` — ESLint (flat config at `eslint.config.mjs`)
- `npx prisma studio` — browse DB in browser
- `npx prisma db seed` — reports DB state (no pre-seeded users; first registration gets ADMIN)

No test runner, no formatter, no pre-commit hooks are configured.

## Framework quirks
- **Next.js 16 route params are Promises** — `params: Promise<{ id }>` requires `await params`.
- **Next.js 16 proxy** — `middleware.ts` is deprecated; use `proxy.ts` with `export function proxy(...)`.
- **Tailwind v4** uses `@import "tailwindcss"` + `@theme` block (NOT `@tailwind` directives).
- **PostCSS config** is ESM (`postcss.config.mjs`).
- **Prisma 7** uses `prisma.config.ts` with `defineConfig` + `@prisma/adapter-libsql` driver adapter for production (Turso). For local dev, falls back to SQLite `dev.db`. `DATABASE_URL` comes from `process.env["DATABASE_URL"]` in the config file, not the schema. Seed command goes in `prisma.config.ts` under `migrations.seed`.
- **ESLint** uses flat config at `eslint.config.mjs` with presets `core-web-vitals` + `typescript`.

## Architecture
- Single-page CRUD app (no routing beyond `/`). Page is a client component (`"use client"` in `app/page.tsx`).
- API routes at `app/api/accounts/route.ts` (GET/POST) and `app/api/accounts/[id]/route.ts` (PUT/DELETE).
- No schema validation on API routes (raw JSON accepted).
- Auth: 3 roles (ADMIN / WORKER / USER). First registration gets ADMIN. Session-based auth with httpOnly cookies. `lib/auth.ts` handles hashing (`crypto.scryptSync`) and session management. `proxy.ts` redirects unauthenticated requests to `/login`.
- Email verification via SMTP (Gmail/Outlook). Configure in `.env`. Falls back to dev code in console if SMTP not set.
- No auth, no middleware, no data fetching library — raw `fetch()` with React local state.
- `lib/prisma.ts` caches a single PrismaClient instance on `globalThis`.
- `dev.db` is committed to git (not in `.gitignore`).
