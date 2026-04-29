# Prisma Seeding Guide (Microservices)

This guide explains how seeding works in this repo and how to create/run a seeder safely.

Applies to services:

- `users`
- `orders`
- `notifications`

---

## 1) What is seeding?

Seeding means inserting initial data into a database, such as:

- admin users
- demo users
- default categories
- test/reference records

Good seed scripts are **idempotent** (safe to run multiple times), usually by using `upsert`.

---

## 2) Where does the seed file live?

Each service should own its own seed file:

- `apps/users/prisma/seed.ts`
- `apps/orders/prisma/seed.ts`
- `apps/notifications/prisma/seed.ts`

Do not share one global seed file for all services.

---

## 3) Users service seed example

Create file: `apps/users/prisma/seed.ts`

```ts
import { PrismaClient } from '@prisma/users-client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@app.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@app.com' },
  });

  await prisma.user.upsert({
    where: { email: 'ali@test.com' },
    update: {},
    create: { name: 'Ali', email: 'ali@test.com' },
  });

  console.log('Users seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Why `@prisma/users-client`?

- This repo uses service-specific generated clients and TS path aliases.
- Avoid importing from plain `@prisma/client` for microservice-specific code.

---

## 4) When to run seed in the flow

Typical flow for `users`:

1. Change `apps/users/prisma/schema.prisma` (if needed).
2. Create migration (`migrate dev --create-only`) for `users`.
3. Apply migrations (startup uses `migrate deploy`).
4. Run seed script to populate initial/demo data.

Seeding is usually done:

- after first DB setup
- after reset/recreate of DB
- in local/dev/test initialization

---

## 5) Exact commands (users)

Run from repo root.

### Prerequisites

- Docker engine is running.
- `users-db` is up.

```powershell
docker compose up -d users-db
docker compose ps users-db
```

### Option A (recommended here): run seed inside users container context

This avoids host networking/env issues because service env is already configured in Compose.

```powershell
docker compose run --rm --entrypoint sh users -lc "npx ts-node -r tsconfig-paths/register apps/users/prisma/seed.ts"
```

### Option B: host-side run (only if your host can reach users DB)

```powershell
npx ts-node -r tsconfig-paths/register apps/users/prisma/seed.ts
```

If you use host-side run, ensure `DATABASE_URL` points to a reachable DB.

---

## 6) Does Prisma `db seed` work in multi-service repos?

Yes, but note:

- Prisma `"prisma.seed"` in `package.json` is a single command target.
- In a multi-service monorepo, many teams prefer direct scripts/commands per service.

If you wire Prisma seed command for users, it can look like:

```json
{
  "prisma": {
    "seed": "ts-node -r tsconfig-paths/register apps/users/prisma/seed.ts"
  }
}
```

Then run:

```powershell
npx prisma db seed --schema=apps/users/prisma/schema.prisma
```

For multiple services, explicit per-service commands are usually clearer.

---

## 7) Common mistakes to avoid

1. **Using wrong Prisma client import**
   - Use service client (`@prisma/users-client`, etc.), not generic wrong client.
2. **Running seed before DB is reachable**
   - Start DB and verify it is running.
3. **Expecting seed to auto-run on every container start**
   - In this repo, entrypoint runs generate + migrate deploy, not seeding.
4. **Writing non-idempotent seed logic**
   - Prefer `upsert` or existence checks.

---

## 8) Quick checkpoint

After running users seed:

- No errors in terminal
- Logs show `Users seed complete`
- `users` DB contains expected records
- Re-running seed does not create duplicates
