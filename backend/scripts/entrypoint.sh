# backend/scripts/entrypoint.sh
#!/bin/bash
set -e

echo "🚀 Démarrage Pacha Toolbox Backend v2..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification de l'environnement
log_info "Vérification de l'environnement..."

# Test des outils de sécurité
log_info "Test des outils de sécurité..."
if command -v nmap >/dev/null 2>&1; then
    NMAP_VERSION=$(nmap --version | head -n1)
    log_success "Nmap: $NMAP_VERSION"
else
    log_error "Nmap non trouvé"
    exit 1
fi

if command -v tcpdump >/dev/null 2>&1; then
    TCPDUMP_VERSION=$(tcpdump --version 2>&1 | head -n1)
    log_success "tcpdump: $TCPDUMP_VERSION"
else
    log_warning "tcpdump non trouvé"
fi

if command -v hydra >/dev/null 2>&1; then
    log_success "Hydra: $(hydra -h 2>&1 | head -n1)"
else
    log_warning "Hydra non trouvé"
fi

if command -v searchsploit >/dev/null 2>&1; then
    log_success "SearchSploit: Disponible"
    # Mise à jour silencieuse d'ExploitDB
    log_info "Mise à jour ExploitDB..."
    cd /opt/exploitdb && git pull --quiet >/dev/null 2>&1 || log_warning "Mise à jour ExploitDB échouée"
else
    log_warning "SearchSploit non trouvé"
fi

# Vérification des wordlists
log_info "Vérification des wordlists..."
if [ -f "/usr/share/wordlists/rockyou.txt" ]; then
    ROCKYOU_SIZE=$(wc -l < /usr/share/wordlists/rockyou.txt)
    log_success "RockYou: $ROCKYOU_SIZE lignes"
else
    log_warning "RockYou wordlist manquante"
fi

# Vérification de Redis
log_info "Test de connectivité Redis..."
MAX_REDIS_ATTEMPTS=30
REDIS_ATTEMPT=1

while [ $REDIS_ATTEMPT -le $MAX_REDIS_ATTEMPTS ]; do
    if python3 -c "
import redis
import sys
try:
    r = redis.Redis(host='redis', port=6379, db=0, socket_timeout=5)
    r.ping()
    print('Redis connecté')
    sys.exit(0)
except Exception as e:
    print(f'Redis non disponible: {e}')
    sys.exit(1)
" 2>/dev/null; then
        log_success "Redis connecté (tentative $REDIS_ATTEMPT)"
        break
    else
        if [ $REDIS_ATTEMPT -eq $MAX_REDIS_ATTEMPTS ]; then
            log_warning "Redis non disponible après $MAX_REDIS_ATTEMPTS tentatives"
            log_warning "Fonctionnement en mode dégradé (stockage mémoire)"
        else
            log_info "Attente Redis... (tentative $REDIS_ATTEMPT/$MAX_REDIS_ATTEMPTS)"
            sleep 2
        fi
    fi
    REDIS_ATTEMPT=$((REDIS_ATTEMPT + 1))
done

# Test de connectivité OpenVAS (optionnel)
log_info "Test de connectivité OpenVAS..."
if curl -s --connect-timeout 5 http://openvas:9392 >/dev/null 2>&1; then
    log_success "OpenVAS accessible"
else
    log_warning "OpenVAS non accessible (sera testé à la demande)"
fi

# Création des répertoires si nécessaire
log_info "Création des répertoires..."
mkdir -p /app/data /app/reports /app/logs /app/temp
chmod 755 /app/data /app/reports /app/logs /app/temp

# Configuration des logs
log_info "Configuration des logs..."
touch /app/logs/pacha-toolbox.log
chmod 644 /app/logs/pacha-toolbox.log

# Test de l'application Python
log_info "Test de l'application Python..."
if python3 -c "
import sys
sys.path.append('/app')
try:
    from app import create_app
    app = create_app()
    print('Application Flask initialisée avec succès')
except Exception as e:
    print(f'Erreur initialisation Flask: {e}')
    sys.exit(1)
"; then
    log_success "Application Python validée"
else
    log_error "Erreur initialisation application Python"
    exit 1
fi

# Affichage des informations de configuration
log_info "Configuration Print Nightmare Lab:"
echo "  🎯 Cible par défaut: ${TARGET_HOST:-printnightmare.thm}"
echo "  🔗 Redis: ${REDIS_URL:-redis://redis:6379/0}"
echo "  🔒 OpenVAS: ${OPENVAS_URL:-http://openvas:9392}"
echo "  📚 ExploitDB: ${EXPLOITDB_PATH:-/opt/exploitdb}"
echo "  📝 Wordlists: ${WORDLISTS_PATH:-/usr/share/wordlists}"

log_success "Pacha Toolbox Backend prêt !"
log_info "Démarrage de l'application Flask..."

# Exécution de la commande passée en paramètre
exec "$@"