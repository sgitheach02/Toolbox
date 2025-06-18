#!/bin/bash
# backend/scripts/entrypoint.sh
# Script d'entrée pour le conteneur backend Pacha Toolbox

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Banner de démarrage
echo -e "${BLUE}"
echo "=================================================="
echo "🛡️  PACHA TOOLBOX BACKEND STARTING"
echo "   Professional Security Platform v2.0"
echo "=================================================="
echo -e "${NC}"

# Variables d'environnement avec valeurs par défaut
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-pacha_toolbox}
DB_USER=${DB_USER:-pacha_user}
DB_PASSWORD=${DB_PASSWORD:-pacha_secure_2024!}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-Admin123!}

log_info "Configuration:"
echo "  🐘 PostgreSQL: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "  👤 DB User: ${DB_USER}"
echo "  🔐 Admin Password: ${ADMIN_PASSWORD}"
echo ""

# Fonction pour attendre PostgreSQL
wait_for_postgres() {
    log_info "⏳ Attente de PostgreSQL..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
            log_success "✅ PostgreSQL accessible sur ${DB_HOST}:${DB_PORT}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Tentative ${attempt}/${max_attempts} - PostgreSQL non accessible, attente..."
        sleep 2
    done
    
    log_error "❌ Impossible de se connecter à PostgreSQL après ${max_attempts} tentatives"
    return 1
}

# Fonction pour tester la connexion PostgreSQL
test_postgres_connection() {
    log_info "🔌 Test de connexion PostgreSQL avec psycopg2..."
    
    python3 -c "
import sys
import psycopg2
import os

try:
    conn = psycopg2.connect(
        host='${DB_HOST}',
        port='${DB_PORT}',
        database='${DB_NAME}',
        user='${DB_USER}',
        password='${DB_PASSWORD}'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()
    print(f'✅ Connexion PostgreSQL réussie: {version[0]}')
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'❌ Erreur connexion PostgreSQL: {e}')
    sys.exit(1)
"
    
    if [ $? -eq 0 ]; then
        log_success "✅ Connexion PostgreSQL validée avec psycopg2"
        return 0
    else
        log_error "❌ Échec du test de connexion PostgreSQL"
        return 1
    fi
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log_info "📁 Création des répertoires nécessaires..."
    
    directories=(
        "/app/data"
        "/app/reports"
        "/app/reports/pdf"
        "/app/logs"
        "/app/temp"
        "/app/static"
        "/app/templates"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            chmod 755 "$dir"
            log_success "Répertoire créé: $dir"
        else
            log_info "Répertoire existe: $dir"
        fi
    done
}

# Fonction pour vérifier les outils de sécurité
check_security_tools() {
    log_info "🔧 Vérification des outils de sécurité..."
    
    tools_available=""
    
    # Nmap
    if command -v nmap &> /dev/null; then
        version=$(nmap --version 2>/dev/null | head -1 | cut -d' ' -f3)
        log_success "✅ Nmap ${version} disponible"
        tools_available="${tools_available}nmap:${version} "
    else
        log_warning "⚠️ Nmap non disponible"
        tools_available="${tools_available}nmap:missing "
    fi
    
    # Nikto
    if command -v nikto &> /dev/null; then
        log_success "✅ Nikto disponible"
        tools_available="${tools_available}nikto:ok "
    else
        log_warning "⚠️ Nikto non disponible"
        tools_available="${tools_available}nikto:missing "
    fi
    
    # TCPDump
    if command -v tcpdump &> /dev/null; then
        log_success "✅ TCPDump disponible"
        tools_available="${tools_available}tcpdump:ok "
    else
        log_warning "⚠️ TCPDump non disponible"
        tools_available="${tools_available}tcpdump:missing "
    fi
    
    # TShark
    if command -v tshark &> /dev/null; then
        log_success "✅ TShark disponible"
        tools_available="${tools_available}tshark:ok "
    else
        log_warning "⚠️ TShark non disponible"
        tools_available="${tools_available}tshark:missing "
    fi
    
    # Curl (pour health checks)
    if command -v curl &> /dev/null; then
        log_success "✅ Curl disponible"
        tools_available="${tools_available}curl:ok "
    else
        log_warning "⚠️ Curl non disponible"
        tools_available="${tools_available}curl:missing "
    fi
    
    echo "  🛠️ Outils: ${tools_available}"
    echo ""
}

# Fonction pour initialiser la base de données
init_database() {
    log_info "🗄️ Initialisation de la base de données..."
    
    python3 -c "
import sys
sys.path.append('/app')

try:
    # Importer et initialiser le gestionnaire de base de données
    from auth.database import db_manager
    
    # Créer l'utilisateur admin par défaut
    db_manager.create_admin_user()
    
    print('✅ Base de données initialisée avec succès')
    print('👤 Utilisateur admin créé/vérifié')
    
except Exception as e:
    print(f'❌ Erreur initialisation base de données: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"
    
    if [ $? -eq 0 ]; then
        log_success "✅ Base de données initialisée"
    else
        log_error "❌ Erreur lors de l'initialisation de la base de données"
        return 1
    fi
}

# Fonction pour tester l'application Flask
test_flask_app() {
    log_info "🧪 Test de l'application Flask..."
    
    python3 -c "
import sys
sys.path.append('/app')

try:
    # Test d'import de l'application
    from main import create_app
    
    # Créer l'application
    app = create_app()
    
    print('✅ Application Flask créée avec succès')
    print(f'🔧 Mode debug: {app.debug}')
    print(f'📡 CORS configuré: {app.config.get(\"ENABLE_CORS\", True)}')
    
except Exception as e:
    print(f'❌ Erreur initialisation Flask: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"
    
    if [ $? -eq 0 ]; then
        log_success "✅ Application Flask validée"
    else
        log_error "❌ Erreur lors du test Flask"
        return 1
    fi
}

# Fonction pour configurer les logs
setup_logging() {
    log_info "📝 Configuration des logs..."
    
    # Créer le fichier de log principal
    touch /app/logs/pacha-toolbox.log
    chmod 644 /app/logs/pacha-toolbox.log
    
    # Créer le fichier de log d'erreurs
    touch /app/logs/pacha-errors.log
    chmod 644 /app/logs/pacha-errors.log
    
    # Créer le fichier de log des scans
    touch /app/logs/pacha-scans.log
    chmod 644 /app/logs/pacha-scans.log
    
    log_success "✅ Logs configurés"
    echo "  📋 Principal: /app/logs/pacha-toolbox.log"
    echo "  ❌ Erreurs: /app/logs/pacha-errors.log"
    echo "  🔍 Scans: /app/logs/pacha-scans.log"
    echo ""
}

# Fonction pour afficher les informations de démarrage
show_startup_info() {
    echo ""
    log_info "🎯 Informations de démarrage:"
    echo "  🌐 Port Flask: 5000"
    echo "  🐘 PostgreSQL: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "  👤 Admin: admin / ${ADMIN_PASSWORD}"
    echo "  📁 Répertoires:"
    echo "    - Rapports: /app/reports"
    echo "    - Logs: /app/logs"
    echo "    - Temp: /app/temp"
    echo "    - Data: /app/data"
    echo ""
    echo "  🔗 Endpoints principaux:"
    echo "    - GET  /api/health          - Health check"
    echo "    - POST /api/auth/login      - Connexion"
    echo "    - POST /api/auth/register   - Inscription"
    echo "    - POST /api/scan/nmap       - Scan Nmap"
    echo "    - POST /api/scan/nikto      - Scan Nikto"
    echo "    - GET  /api/scan/history    - Historique"
    echo ""
}

# Fonction principale de démarrage
main() {
    log_info "🚀 Démarrage du backend Pacha Toolbox..."
    
    # Étapes d'initialisation
    if ! wait_for_postgres; then
        log_error "💥 Échec de la connexion à PostgreSQL"
        exit 1
    fi
    
    if ! test_postgres_connection; then
        log_error "💥 Échec du test de connexion PostgreSQL"
        exit 1
    fi
    
    create_directories
    check_security_tools
    setup_logging
    
    if ! init_database; then
        log_error "💥 Échec de l'initialisation de la base de données"
        exit 1
    fi
    
    if ! test_flask_app; then
        log_error "💥 Échec du test de l'application Flask"
        exit 1
    fi
    
    show_startup_info
    
    log_success "🎉 Backend Pacha Toolbox prêt à démarrer !"
    log_info "⚡ Lancement de l'application Flask..."
    echo ""
}

# Gestion des signaux pour un arrêt propre
cleanup() {
    log_info "🛑 Arrêt du backend Pacha Toolbox..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Exécution du script principal
main

# Exécution de la commande passée en paramètre (par défaut "python main.py")
exec "$@"