#!/bin/bash
set -e

echo "🚀 Backend Pacha Toolbox"

# Attendre PostgreSQL
for i in {1..30}; do
    if nc -z $DB_HOST $DB_PORT; then
        echo "✅ PostgreSQL OK"
        break
    fi
    echo "⏳ Attente PostgreSQL ($i/30)..."
    sleep 2
done

# Créer répertoires
mkdir -p /app/{data,reports,logs,temp}

# Test connexion DB
python3 -c "
import psycopg2, os
conn = psycopg2.connect(
    host=os.environ['DB_HOST'],
    port=os.environ['DB_PORT'], 
    database=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD']
)
print('✅ DB connectée')
conn.close()
"

echo "✅ Backend prêt"
exec "$@"
