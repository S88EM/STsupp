#!/usr/bin/env bash
set -e

echo "[STsup] =========================================="
echo "[STsup] Starting STsup Server for Home Assistant"
echo "[STsup] =========================================="

# Apply options if running under Home Assistant Supervisor
if [ -f /data/options.json ]; then
    TZ_VAL=$(grep -o '"timezone"[^,}]*' /data/options.json | cut -d'"' -f4)
    if [ -n "$TZ_VAL" ]; then
        export TZ="$TZ_VAL"
        echo "[STsup] Timezone set to: $TZ"
    fi
fi

# Ensure persistent directories exist in /data
mkdir -p /data/postgres /data/uploads /run/postgresql
chown -R postgres:postgres /data/postgres /run/postgresql
chmod 777 /data/uploads

# Initialize PostgreSQL cluster if not already present
if [ ! -s /data/postgres/PG_VERSION ]; then
    echo "[STsup] Initializing new PostgreSQL cluster in /data/postgres..."
    su-exec postgres initdb -D /data/postgres --auth-local=trust --auth-host=trust
    echo "host all all all trust" >> /data/postgres/pg_hba.conf
    echo "listen_addresses = '127.0.0.1'" >> /data/postgres/postgresql.conf
fi

# Start PostgreSQL daemon (log inside /data/postgres where user postgres has permissions)
echo "[STsup] Starting internal PostgreSQL service..."
su-exec postgres pg_ctl -D /data/postgres -l /data/postgres/postgres.log -w start

# Ensure user and database exist
echo "[STsup] Checking database existence..."
su-exec postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'stsup_db'" | grep -q 1 || \
    su-exec postgres psql -c "CREATE USER stuser WITH SUPERUSER PASSWORD 'stpassword'; CREATE DATABASE stsup_db OWNER stuser;"

# Database connection URL for internal Postgres
export DATABASE_URL="postgresql://stuser:stpassword@127.0.0.1:5432/stsup_db?schema=public"

# Run migrations & initial seed
echo "[STsup] Applying database schema..."
cd /app
if [ -f "./node_modules/prisma/build/index.js" ]; then
    node ./node_modules/prisma/build/index.js db push --skip-generate || true
fi

if [ ! -f /data/.seeded ]; then
    echo "[STsup] Seeding initial demo project..."
    node prisma/seed.js || true
    touch /data/.seeded
fi

# Link uploads to persistent /data/uploads
mkdir -p /app/public
rm -rf /app/public/uploads
ln -sfn /data/uploads /app/public/uploads

echo "[STsup] STsup is ready! Listening on port 3000..."
exec node server.js
