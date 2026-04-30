FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG APP_NAME

RUN npx prisma generate --schema=apps/users/prisma/schema.prisma
RUN npx prisma generate --schema=apps/orders/prisma/schema.prisma
RUN npx prisma generate --schema=apps/notifications/prisma/schema.prisma
RUN npx prisma generate --schema=apps/analytics/prisma/schema.prisma

# ✅ Create @prisma/* aliases BEFORE webpack runs
RUN mkdir -p node_modules/@prisma && \
    cp -r node_modules/.prisma/users-client         node_modules/@prisma/users-client && \
    cp -r node_modules/.prisma/orders-client        node_modules/@prisma/orders-client && \
    cp -r node_modules/.prisma/notifications-client node_modules/@prisma/notifications-client && \
    cp -r node_modules/.prisma/analytics-client     node_modules/@prisma/analytics-client

RUN npm run build ${APP_NAME}


# ── Runtime image ───────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Copy generated Prisma clients from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Recreate @prisma/* aliases as real directories (symlinks don't survive COPY)
RUN mkdir -p node_modules/@prisma && \
    cp -r node_modules/.prisma/users-client         node_modules/@prisma/users-client && \
    cp -r node_modules/.prisma/orders-client        node_modules/@prisma/orders-client && \
    cp -r node_modules/.prisma/notifications-client node_modules/@prisma/notifications-client && \
    cp -r node_modules/.prisma/analytics-client     node_modules/@prisma/analytics-client

# Copy Prisma schemas and migrations used at runtime by the entrypoint
COPY --from=builder /app/apps/users/prisma        ./apps/users/prisma
COPY --from=builder /app/apps/orders/prisma       ./apps/orders/prisma
COPY --from=builder /app/apps/notifications/prisma ./apps/notifications/prisma
COPY --from=builder /app/apps/analytics/prisma    ./apps/analytics/prisma

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]