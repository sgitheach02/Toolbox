# backend/scripts/healthcheck.sh
#!/bin/bash

# Script de vérification de santé pour le container backend

# Test de base : port Flask
if ! nc -z localhost 5000; then
    echo "CRITICAL: Flask server not responding on port 5000"
    exit 1
fi

# Test Redis (non critique)
if ! python3 -c "
import redis
try:
    r = redis.Redis(host='redis', port=6379, db=0, socket_timeout=2)
    r.ping()
except:
    pass
" 2>/dev/null; then
    echo "WARNING: Redis not available"
fi

# Test des outils critiques
if ! command -v nmap >/dev/null 2>&1; then
    echo "CRITICAL: nmap not found"
    exit 1
fi

# Test de l'espace disque
DISK_USAGE=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "WARNING: Disk usage high: ${DISK_USAGE}%"
fi

# Test mémoire
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "WARNING: Memory usage high: ${MEM_USAGE}%"
fi

echo "OK: Backend healthy"
exit 0