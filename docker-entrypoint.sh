#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting $APP_NAME service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h $(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p') -U postgres >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ PostgreSQL not ready after $max_attempts attempts"
    exit 1
}

# Function to check if our specific database exists
database_exists() {
    local db_name=$1
    local exists=$(psql "$DATABASE_URL/postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")
    [ "$exists" = "1" ]
}

# Extract database name from DATABASE_URL
# Example: postgresql://postgres:pass@users-db:5432/users_db
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\)$/\1/p')
BASE_URL=$(echo "$DATABASE_URL" | sed 's/\/[^/]*$//')

echo "📊 Target database: $DB_NAME"
echo "🔗 Connection URL: $BASE_URL"

# Wait for PostgreSQL to be ready
wait_for_postgres

# ────────────────────────────────────────────────────────────
# SCENARIO 1: First run - Database doesn't exist
# SCENARIO 2: Rebuild/Restart - Database exists (from volume)
# ────────────────────────────────────────────────────────────

echo "🔍 Checking if database '$DB_NAME' exists..."

if database_exists "$DB_NAME"; then
    # SCENARIO 2: Database exists (container rebuilt, volume preserved)
    echo "✅ Database '$DB_NAME' already exists (using existing volume data)"
    echo "   This means: Container was rebuilt or restarted"
    echo "   Volume preserved all your data!"
else
    # SCENARIO 1: First run - No database yet
    echo "🆕 Database '$DB_NAME' does not exist (first run detected)"
    echo "   Creating database '$DB_NAME'..."
    
    psql "$BASE_URL/postgres" -c "CREATE DATABASE $DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database '$DB_NAME'"
        exit 1
    fi
fi

# Run migrations (works in both scenarios)
echo "🔄 Running database migrations..."

case "$APP_NAME" in
    users)
        echo "   Generating users Prisma client..."
        npx prisma generate --schema=apps/users/prisma/schema.prisma
        echo "   Running users migrations..."
        npx prisma migrate deploy --schema=apps/users/prisma/schema.prisma
        ;;
    orders)
        echo "   Generating orders Prisma client..."
        npx prisma generate --schema=apps/orders/prisma/schema.prisma
        echo "   Running orders migrations..."
        npx prisma migrate deploy --schema=apps/orders/prisma/schema.prisma
        ;;
    notifications)
        echo "   Generating notifications Prisma client..."
        npx prisma generate --schema=apps/notifications/prisma/schema.prisma
        echo "   Running notifications migrations..."
        npx prisma migrate deploy --schema=apps/notifications/prisma/schema.prisma
        ;;
    api-gateway)
        echo "   API Gateway has no database — skipping migrations"
        ;;
esac

echo "✅ Migrations completed"

# Verify data is accessible (only for databases)
if [ "$APP_NAME" != "api-gateway" ]; then
    echo "🔍 Verifying database access..."
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        echo "✅ Database is accessible and ready"
    else
        echo "⚠️  Warning: Cannot verify database access"
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting $APP_NAME application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start the NestJS app
exec node dist/apps/$APP_NAME/main.js