# ── Base image ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching — npm install only
# reruns if package.json changed, not on every code change)
COPY package*.json ./

RUN npm install

# Copy all source code
COPY . .

# Build argument — passed from docker-compose per service
ARG APP_NAME

# Build the specific app
RUN npm run build ${APP_NAME}


# ── Runtime image ───────────────────────────────────────────
FROM node:20-alpine

# Install PostgreSQL client tools for database checks
# This gives us: psql and pg_isready commands
RUN apk add --no-cache postgresql15-client

WORKDIR /app

# Copy only what's needed to run (no source code, no devDeps)
COPY package*.json ./
RUN npm install --omit=dev

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schemas and migrations used at runtime
COPY --from=builder /app/apps/users/prisma ./apps/users/prisma
COPY --from=builder /app/apps/orders/prisma ./apps/orders/prisma
COPY --from=builder /app/apps/notifications/prisma ./apps/notifications/prisma

# Re-declare ARG (doesn't carry over between stages)
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Copy the entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use entrypoint script for pre-startup logic
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command (can be overridden)
CMD node dist/apps/${APP_NAME}/main.js