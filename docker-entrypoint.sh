#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting $APP_NAME service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# API Gateway has no database — skip straight to app
if [ "$APP_NAME" = "api-gateway" ]; then
    echo "ℹ️  API Gateway has no database — skipping all DB steps"
    exec node dist/apps/$APP_NAME/main.js
fi

# Extract DB host from DATABASE_URL for pg_isready
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')

echo "📊 Database URL : $DATABASE_URL"
echo "🖥️  DB Host      : $DB_HOST"

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if pg_isready -h "$DB_HOST" -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
    sleep 2
    attempt=$((attempt + 1))
    if [ $attempt -gt $max_attempts ]; then
        echo "❌ PostgreSQL not ready after $max_attempts attempts"
        exit 1
    fi
done

# Run migrations
echo "🔄 Running database migrations..."
case "$APP_NAME" in
    users)
        export USERS_DATABASE_URL="$DATABASE_URL"
        npx prisma migrate deploy --schema=apps/users/prisma/schema.prisma
        ;;
    orders)
        export ORDERS_DATABASE_URL="$DATABASE_URL"
        npx prisma migrate deploy --schema=apps/orders/prisma/schema.prisma
        ;;
    notifications)
        export NOTIFICATIONS_DATABASE_URL="$DATABASE_URL"
        npx prisma migrate deploy --schema=apps/notifications/prisma/schema.prisma
        ;;
    analytics)
        export ANALYTICS_DATABASE_URL="$DATABASE_URL"
        npx prisma migrate deploy --schema=apps/analytics/prisma/schema.prisma
        ;;
esac
echo "✅ Migrations completed"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting $APP_NAME application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exec node dist/apps/$APP_NAME/main.js