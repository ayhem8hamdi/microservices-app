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

WORKDIR /app

# Copy only what's needed to run (no source code, no devDeps)
COPY package*.json ./
RUN npm install --omit=dev

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Re-declare ARG (doesn't carry over between stages)
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Start the app
CMD node dist/apps/${APP_NAME}/main