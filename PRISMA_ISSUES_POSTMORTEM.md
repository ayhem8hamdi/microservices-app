# Prisma Integration Postmortem (What went wrong, why, and how it was fixed)

## Scope

This document captures the real issues we hit while integrating Prisma per microservice in this monorepo, and the exact fixes that made it stable.

Services involved:
- `users`
- `orders`
- `notifications`

Each service has its own schema and migration history:
- `apps/users/prisma/schema.prisma`
- `apps/orders/prisma/schema.prisma`
- `apps/notifications/prisma/schema.prisma`

---

## Final Working State (at the end of troubleshooting)

- Prisma version aligned to **6.19.3** (`prisma` + `@prisma/client` in `package.json`)
- Service-specific generated clients exist:
  - `node_modules/.prisma/users-client`
  - `node_modules/.prisma/orders-client`
  - `node_modules/.prisma/notifications-client`
- TypeScript path aliases resolve correctly from root `tsconfig.json`
- `Dockerfile` copies `apps/*/prisma` into runtime image
- `docker-entrypoint.sh` generates Prisma client and runs `migrate deploy` per service
- Migration folders exist for all three services:
  - `apps/users/prisma/migrations/...`
  - `apps/orders/prisma/migrations/...`
  - `apps/notifications/prisma/migrations/...`

---

## Problems We Faced (Chronological)

## 1) Prisma import/type errors in service code

### Symptoms
- `Cannot find module '@prisma/orders-client'`
- `Cannot find module '@prisma/users-client'`
- `Property 'user' does not exist on type 'PrismaService'`
- `Property '$connect' does not exist on type 'PrismaService'`

### Root cause
- TypeScript path mapping was declared in the wrong place and not visible where needed.
- One Prisma import had an invalid module path (`.prisma/notifications-client`).
- `apps/orders/tsconfig.app.json` was missing (only test tsconfig existed).

### Fix
- Add Prisma aliases in root `tsconfig.json` under `compilerOptions.paths`:
  - `@prisma/users-client`
  - `@prisma/orders-client`
  - `@prisma/notifications-client`
- Add `baseUrl: "."` to root tsconfig.
- Fix notifications import to `@prisma/notifications-client`.
- Create `apps/orders/tsconfig.app.json`.

---

## 2) No Prisma schema found when running `npx prisma generate`

### Symptoms
- Prisma searched only default locations and failed.

### Root cause
- This repo uses per-service schema files, not a root `prisma/schema.prisma`.

### Fix
- Always pass explicit schema when running manually:
  - `--schema=apps/users/prisma/schema.prisma`
  - `--schema=apps/orders/prisma/schema.prisma`
  - `--schema=apps/notifications/prisma/schema.prisma`

---

## 3) Intermittent Prisma 7 errors (`datasource.url no longer supported`)

### Symptoms
- Error `P1012` referencing datasource URL in schema.
- Prisma CLI reported version `7.7.0` in some runs.

### Root cause
- Version drift: CLI invoked as Prisma 7 while project dependencies were Prisma 6.

### Fix
- Pin project dependencies to Prisma 6.19.3 (`prisma` and `@prisma/client`).
- Use local dependency-driven commands from project root.
- Regenerate clients after version alignment.

---

## 4) Why migration folders did not appear

### Symptoms
- `apps/*/prisma/migrations` missing.

### Root cause
- We ran commands that do **not** create migration files:
  - `prisma generate` (client only)
  - `prisma migrate deploy` (applies existing migrations only)

### Fix
- Run migration creation command:
  - `prisma migrate dev --name <migration_name> --create-only`

---

## 5) Docker runtime initially lacked Prisma schema/migrations

### Symptoms
- Container startup flow could not reliably perform Prisma operations for service schemas.

### Root cause
- Runtime image copied `dist` only; Prisma schema directories were not included.

### Fix
- Update `Dockerfile` runtime stage to copy:
  - `/app/apps/users/prisma`
  - `/app/apps/orders/prisma`
  - `/app/apps/notifications/prisma`

---

## 6) DB credential mismatch between compose DB password vars and URLs

### Symptoms
- `P1000 Authentication failed` during migration commands.

### Root cause
- Password values used by DB containers differed from passwords embedded in database URLs.

### Fix
- Align `.env` variable families so DB server password and connection URL password match for each service.

---

## 7) Password changes did not apply due to existing Postgres volumes

### Symptoms
- Auth still failed after updating `.env`.

### Root cause
- Existing named volumes preserve database state and original credentials.

### Fix
- Recreate DB volumes:
  - `docker compose down -v`
  - then recreate DB containers.

---

## 8) Host-to-container connectivity got in the way for local migration creation

### Symptoms
- Could not reach DB on internal container IPs from Windows host.

### Root cause
- Bridge-network container IPs are not a stable host access strategy on Windows Docker Desktop.

### Fix
- Publish DB ports in `docker-compose.yml`:
  - users-db `5433:5432`
  - orders-db `5434:5432`
  - notifications-db `5435:5432`
- Run local migration creation against `localhost:<published_port>`.

---

## Why the project is stable now

Because the system now has all four pieces aligned:
1. Correct TypeScript resolution for generated Prisma clients.
2. Correct service-specific schema + migration folders.
3. Correct runtime startup behavior (generate + deploy in entrypoint).
4. Correct DB credentials/network access for migration creation.

---

## Lessons Learned / Guardrails

- In a multi-schema monorepo, never run bare `prisma generate` without `--schema` unless you have a root schema.
- `generate` != `migrate dev` != `migrate deploy` (different responsibilities).
- Keep Prisma CLI/runtime versions aligned across the team.
- If Postgres credentials change, either update DB roles manually or recreate volumes.
- For local host-side migration creation with containerized DBs, publish ports intentionally.

---

## Quick diagnostic checklist

If Prisma breaks again, check in this order:
1. `npm ls prisma @prisma/client` (versions match?)
2. Does target service schema exist under `apps/<service>/prisma/schema.prisma`?
3. Does `node_modules/.prisma/<service>-client` exist after generate?
4. Are root `tsconfig.json` aliases for `@prisma/<service>-client` present?
5. Are DB URL credentials aligned with DB container credentials?
6. Are migrations present under `apps/<service>/prisma/migrations`?
7. Is runtime image copying `apps/*/prisma`?

That’s the exact story of what happened and why.
