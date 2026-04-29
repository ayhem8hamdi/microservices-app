# Prisma Per-Service Integration Runbook (Detailed)

This is the operational guide for this monorepo’s Prisma setup.

Repository pattern:
- One database per service
- One Prisma schema per service
- One migration history per service
- One generated Prisma client per service

Services:
- `users`
- `orders`
- `notifications`

---

## Expected Tree

```text
microservices-app/
├── apps/
│   ├── users/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       └── prisma/
│   │           └── prisma.service.ts
│   ├── orders/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       └── prisma/
│   │           └── prisma.service.ts
│   └── notifications/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── src/
│           └── prisma/
│               └── prisma.service.ts
```

Generated artifacts (not committed):
- `node_modules/.prisma/users-client`
- `node_modules/.prisma/orders-client`
- `node_modules/.prisma/notifications-client`

---

## What runs automatically vs manually

## Automatic (when running service containers)

From `docker-entrypoint.sh`, for each app service (`users`, `orders`, `notifications`):
1. Wait for PostgreSQL readiness.
2. Check if target DB exists.
3. Create DB if missing.
4. Run `prisma generate --schema=apps/<service>/prisma/schema.prisma`.
5. Run `prisma migrate deploy --schema=apps/<service>/prisma/schema.prisma`.
6. Start NestJS app (`node dist/apps/$APP_NAME/main.js`).

Important:
- `migrate deploy` applies existing migrations only.
- It does **not** create new migration folders.

## Manual (developer actions)

You must run manually when you change a schema:
1. Create migration files (`migrate dev --create-only` or normal `migrate dev`).
2. Commit generated SQL migration files.
3. Rebuild/restart containers so deploy picks them up.

---

## Source of truth files

Configuration and runtime behavior are controlled by:
- `apps/*/prisma/schema.prisma`
- `apps/*/prisma/migrations/*`
- `docker-entrypoint.sh`
- `Dockerfile`
- `docker-compose.yml`
- `tsconfig.json` (Prisma client path aliases)

---

## Version policy (critical)

Use matching Prisma versions in `package.json`:
- `prisma`: `6.19.3`
- `@prisma/client`: `6.19.3`

If this drifts (e.g., Prisma 7 CLI appears), expect schema validation mismatch errors.

---

## Step-by-step: first-time setup (from scratch)

## 1) Install dependencies
- Run dependency installation from repo root.

## 2) Ensure environment variables are correct
You need both:
- DB server passwords (`*_DB_PASSWORD`)
- Service URLs (`*_DATABASE_URL`)

They must match per service.

Example pattern (replace values):
- `USERS_DB_PASSWORD=...`
- `USERS_DATABASE_URL=postgresql://postgres:...@users-db:5432/users_db`

Same for orders and notifications.

## 3) Create initial migration folders (manual, one-time or when schema changes)
Use DB ports exposed to host (`5433/5434/5435`) and run per service:

- Users schema migration creation (create-only)
- Orders schema migration creation (create-only)
- Notifications schema migration creation (create-only)

Notes:
- If you changed DB credentials and DB volumes already existed, run:
  - `docker compose down -v`
  - then recreate DB containers
- If authentication fails (`P1000`), verify `.env` passwords and URL passwords match.

## 4) Generate Prisma clients (manual verification)
Run generate for each schema explicitly (`--schema=...`).

Expected generated directories:
- `node_modules/.prisma/users-client`
- `node_modules/.prisma/orders-client`
- `node_modules/.prisma/notifications-client`

## 5) Start full stack
Run compose startup from repo root.

At runtime, each service auto-runs:
- generate
- migrate deploy
- app start

---

## Day-2 workflow (schema change in one service)

Example: you changed `apps/orders/prisma/schema.prisma`.

1. Create a new migration for orders manually.
2. Review generated SQL under `apps/orders/prisma/migrations/<timestamp>_<name>/migration.sql`.
3. Commit schema + migration files.
4. Rebuild/restart services.
5. Entry-point automatically runs `migrate deploy` in container.

---

## Commands matrix (manual ownership)

- `prisma generate`
  - Purpose: generate TS client
  - Creates migration files? **No**
  - Should run with explicit schema in this repo? **Yes**

- `prisma migrate dev`
  - Purpose: develop schema + create migrations (+ apply in dev)
  - Creates migration files? **Yes**
  - Use manually? **Yes**

- `prisma migrate dev --create-only`
  - Purpose: create migration files only
  - Creates migration files? **Yes**
  - Recommended for controlled workflow? **Yes**

- `prisma migrate deploy`
  - Purpose: apply committed migrations
  - Creates migration files? **No**
  - Runs automatically in container startup? **Yes**

---

## How Prisma is wired per service in code

Each service has a wrapper extending its own generated client alias:
- users service imports `@prisma/users-client`
- orders service imports `@prisma/orders-client`
- notifications service imports `@prisma/notifications-client`

This relies on root `tsconfig.json` path mappings.

If alias mapping breaks, you’ll see:
- module not found errors
- missing model delegate typings (`this.prisma.user`, `this.prisma.order`, etc.)

---

## Troubleshooting playbook

## Error: Cannot find module `@prisma/<service>-client`
Check:
1. Root `tsconfig.json` has alias.
2. Client generated under `node_modules/.prisma/<service>-client`.
3. IDE TypeScript server refreshed.

## Error: `Property 'user' does not exist on type PrismaService`
Usually alias resolve failed or wrong generated client.
Regenerate the target service client and verify import alias.

## Error: `Could not find Prisma Schema`
You ran Prisma without `--schema` in a multi-schema repo.
Use explicit `--schema=apps/<service>/prisma/schema.prisma`.

## Error: `P1000 Authentication failed`
- DB password mismatch between compose env and URL
- Old DB volume still has old credentials
- Fix by aligning env and recreating volumes if needed

## Error: migration folder missing
You likely used only `generate`/`migrate deploy`.
Run `migrate dev` (or `--create-only`) manually.

---

## Exactly what gets committed to git

Commit these:
- `apps/*/prisma/schema.prisma`
- `apps/*/prisma/migrations/**`
- Prisma-related runtime/config updates (`docker-entrypoint.sh`, `Dockerfile`, `tsconfig.json`, etc.)

Do not commit these:
- `node_modules/.prisma/**` (generated locally)

---

## Operational sequence summary (end-to-end)

1. Developer edits one service schema.
2. Developer creates migration manually for that service.
3. Developer commits migration SQL.
4. CI/CD or local Docker starts service.
5. Entry-point auto-generates client and auto-deploys migrations.
6. Service boots with schema + client in sync.

That is the exact intended lifecycle for this repo.
