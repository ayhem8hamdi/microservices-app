# Prisma Migration Script vs Docker Entrypoint Guide

This document explains the role of:

- `scripts/prisma-create-migration.ps1`
- `docker-entrypoint.sh`

and whether they can (or should) be combined.

---

## 1) What the PowerShell script does

File: `scripts/prisma-create-migration.ps1`

### Purpose

It is a **small helper for developers**.

In plain words:

> You choose a service + migration name, and the script creates the migration in the right place.

It exists to avoid mistakes like using the wrong schema or wrong database URL.

### Inputs

- `-Service` (`users | orders | notifications`)
- `-Name` (migration name)

Example:

- `-Service users -Name add_phone_column`

### What it does step-by-step

1. Picks the correct schema file based on `-Service`:
   - `apps/users/prisma/schema.prisma`
   - `apps/orders/prisma/schema.prisma`
   - `apps/notifications/prisma/schema.prisma`
2. Picks the matching database URL variable:
   - `USERS_DATABASE_URL`
   - `ORDERS_DATABASE_URL`
   - `NOTIFICATIONS_DATABASE_URL`
3. Runs inside Docker (`docker compose run`) so service-to-DB hostnames work.
4. Runs Prisma migration creation command:
   - `prisma migrate dev --create-only --skip-generate`

What this means:

- `migrate dev` = create migration from schema changes
- `--create-only` = create files, do not do a full apply cycle
- `--skip-generate` = skip Prisma client generation in this step

### Outcome

- Creates migration files in `apps/<service>/prisma/migrations/...`
- Does **not** replace startup flow in container
- Used when you edit schema during development

### Super simple mental model

- Script = **"Write a new migration file"** tool
- Entrypoint = **"On app start, prepare DB and run existing migrations"** tool

---

## 2) What the Docker entrypoint does

File: `docker-entrypoint.sh`

### Purpose

It is a **container startup/runtime initializer**.

### What it does step-by-step

1. Reads `APP_NAME` and `DATABASE_URL`.
2. Waits for PostgreSQL readiness.
3. Detects whether the target DB exists; creates it if missing.
4. For DB-backed apps (`users`, `orders`, `notifications`):
   - runs `prisma generate`
   - runs `prisma migrate deploy`
5. Starts the NestJS app (`node dist/apps/$APP_NAME/main.js`).

### Outcome

- Ensures container is bootable with the current image and DB state.
- Applies already-created migrations safely (`migrate deploy`).
- Does **not** create new migration files from schema changes.

---

## 3) Why both exist (and why both are valid)

They operate at different lifecycle stages:

- **Script (`migrate dev`)**: authoring migrations during development
- **Entrypoint (`migrate deploy`)**: applying committed migrations at runtime

Think of them as:

- **Build-time/dev-time tool** vs **startup-time runtime tool**

---

## 4) Can we combine them into one thing?

Short answer: **possible, but usually not recommended**.

### Option A — Keep separate (recommended)

Pros:

- Clear separation of concerns
- Lower risk of accidental migration creation in runtime containers
- Safer CI/CD behavior
- Easier troubleshooting

Cons:

- Two places to understand

### Option B — One “unified script” with modes

You can create a single orchestrator script with explicit modes, for example:

- `mode=dev-create` → run `migrate dev --create-only`
- `mode=startup-deploy` → run `generate + migrate deploy + start app`

This is workable only if mode boundaries are strict and explicit.

Risks:

- Easier to run wrong mode in wrong environment
- Higher blast radius when editing one script

### Option C — Put `migrate dev` in entrypoint

This is **not recommended** for shared/dev/prod-like environments because:

- `migrate dev` is interactive/dev-oriented
- It can generate new migrations unexpectedly
- Runtime containers should be deterministic

---

## 5) Recommended flow for this repo

1. Change Prisma schema for one service.
2. Create migration file via helper script (or equivalent manual command).
3. Commit schema + migration files.
4. Start/restart containers.
5. Entrypoint runs `generate` and `migrate deploy` automatically.

This keeps migration authorship controlled while startup remains reliable.

---

## 6) Practical rule of thumb

- Use **`migrate dev`** when you are **developing schema**.
- Use **`migrate deploy`** when containers/app are **starting and should only apply existing migrations**.

If you remember just one sentence:

> Create migrations in dev tooling; apply migrations in runtime startup.

---

## 7) After schema changes: how to run the script (and what triggers it)

When you change a Prisma schema file (for example `apps/users/prisma/schema.prisma`), run the helper script manually to create a migration file.

### Important: What triggers this script?

The script is **not automatic**.

- It runs only when you explicitly start it.
- Typical trigger: you run an npm script from `package.json`.

### Available npm triggers in this repo

- `prisma:migrate:create:users`
- `prisma:migrate:create:orders`
- `prisma:migrate:create:notifications`

Each one calls `scripts/prisma-create-migration.ps1` with the matching `-Service`.

### Practical flow after a schema change

1. Edit one service schema.
2. Run the matching migration-create npm script for that service.
3. A new folder appears under `apps/<service>/prisma/migrations/...`.
4. Commit both:
   - updated schema file
   - new migration folder/files
5. Start/restart containers.
6. On container startup, `docker-entrypoint.sh` runs `migrate deploy` and applies the migration.

### Example (users service)

If you changed `apps/users/prisma/schema.prisma`, trigger the users migration-create npm script.

Result:

- Migration files are created under `apps/users/prisma/migrations/...`
- Later, entrypoint applies them on startup

---

## 8) Detailed users example (exact commands)

This is the full flow after you change the `users` schema.

### Prerequisite

- Docker engine (Docker Desktop) must be running.
- You do **not** need the full stack up.
- Recommended minimum: bring up `users-db` first.

### Exact terminal flow

Run these from repo root (`microservices-app`):

```powershell
docker compose up -d users-db
docker compose ps users-db
powershell -ExecutionPolicy Bypass -File .\scripts\prisma-create-migration.ps1 -Service users -Name add_phone_to_user
```

### What each command does

1. `docker compose up -d users-db`
   - Starts only the users database container in background.
2. `docker compose ps users-db`
   - Lets you confirm the DB container is running (and ideally healthy).
3. `powershell -ExecutionPolicy Bypass -File .\scripts\prisma-create-migration.ps1 -Service users -Name add_phone_to_user`
   - Calls the helper script.
   - Script selects `apps/users/prisma/schema.prisma`.
   - Script creates a new migration folder under `apps/users/prisma/migrations/...`.

### After that

1. Commit:
   - `apps/users/prisma/schema.prisma`
   - new migration folder under `apps/users/prisma/migrations/...`
2. Start/restart your app containers.
3. `docker-entrypoint.sh` runs `prisma generate` and `prisma migrate deploy` on startup.

### Optional npm shortcut

You can also use:

```powershell
npm run prisma:migrate:create:users
```

Note: this shortcut currently uses a fixed migration name from `package.json`. The direct PowerShell command is better when you want a custom migration name each time.
