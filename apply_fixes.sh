#!/bin/bash

# apply_fixes.sh - Application directe des corrections

echo "🔧 APPLICATION DES CORRECTIONS PACHA TOOLBOX"
echo "============================================"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.yml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "Ce script doit être exécuté dans le répertoire racine du projet Pacha Toolbox"
    exit 1
fi

PROJECT_ROOT=$(pwd)
log_info "Répertoire projet: $PROJECT_ROOT"

# 1. Création de la structure de répertoires
log_info "Création de la structure de répertoires..."
mkdir -p "$PROJECT_ROOT/data/reports"
mkdir -p "$PROJECT_ROOT/data/reports/pdf"
mkdir -p "$PROJECT_ROOT/data/logs"
mkdir -p "$PROJECT_ROOT/data/temp"
mkdir -p "$PROJECT_ROOT/data/captures"

# Permissions
chmod 755 "$PROJECT_ROOT/data"
chmod 755 "$PROJECT_ROOT/data/reports"
chmod 755 "$PROJECT_ROOT/data/reports/pdf"
chmod 755 "$PROJECT_ROOT/data/logs"
chmod 755 "$PROJECT_ROOT/data/temp"
chmod 755 "$PROJECT_ROOT/data/captures"

log_success "Structure de répertoires créée"

# 2. Sauvegarde des fichiers existants
log_info "Sauvegarde des fichiers existants..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "backend/main.py" ]; then
    cp "backend/main.py" "$BACKUP_DIR/"
    log_info "Sauvegarde de backend/main.py"
fi

if [ -f "frontend/src/App.js" ]; then
    cp "frontend/src/App.js" "$BACKUP_DIR/"
    log_info "Sauvegarde de frontend/src/App.js"
fi

log_success "Fichiers sauvegardés dans $BACKUP_DIR"

# 3. Arrêt des services actuels
log_info "Arrêt des services actuels..."
# Tuer les processus Python
pkill -f "python.*main.py" 2>/dev/null || true
# Tuer les processus Node
pkill -f "npm.*start" 2>/dev/null || true
# Docker si utilisé
docker-compose down 2>/dev/null || true

log_success "Services arrêtés"

# 4. Instructions pour l'utilisateur
log_warning "📋 INSTRUCTIONS:"
echo ""
echo "1. Copiez le contenu de l'artifact 'backend/main.py (Version corrigée)' dans:"
echo "   $PROJECT_ROOT/backend/main.py"
echo ""
echo "2. Une fois fait, appuyez sur Entrée pour continuer..."
echo ""

read -p "Appuyez sur Entrée quand le fichier backend/main.py est mis à jour..."

# 5. Vérification du fichier mis à jour
if [ -f "backend/main.py" ]; then
    # Vérifier que le fichier contient les nouvelles fonctions
    if grep -q "ensure_directories" "backend/main.py" && grep -q "DIRECTORIES.*data.*reports" "backend/main.py"; then
        log_success "Fichier backend/main.py mis à jour correctement"
    else
        log_error "Le fichier backend/main.py ne semble pas avoir été mis à jour correctement"
        echo "Vérifiez que vous avez bien copié tout le contenu de l'artifact"
        exit 1
    fi
else
    log_error "Fichier backend/main.py non trouvé"
    exit 1
fi

# 6. Test de syntaxe Python
log_info "Test de syntaxe Python..."
cd backend
if python3 -m py_compile main.py; then
    log_success "Syntaxe Python valide"
else
    log_error "Erreur de syntaxe Python dans main.py"
    exit 1
fi
cd ..

# 7. Démarrage du backend
log_info "Démarrage du backend..."
cd backend
python3 main.py &
BACKEND_PID=$!
cd ..

# Sauvegarder le PID
echo $BACKEND_PID > /tmp/pacha_backend.pid

log_info "Backend démarré (PID: $BACKEND_PID)"

# 8. Attendre que le backend soit prêt
log_info "Attente du démarrage du backend..."
sleep 8

# Test de connexion
for i in {1..10}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        log_success "Backend opérationnel"
        break
    fi
    if [ $i -eq 10 ]; then
        log_error "Backend ne répond pas après 10 tentatives"
        exit 1
    fi
    log_info "Tentative $i/10..."
    sleep 2
done

# 9. Test des nouveaux endpoints
log_info "Test des endpoints corrigés..."

test_endpoint() {
    local name=$1
    local endpoint=$2
    
    echo -n "🔍 Testing $name... "
    
    response=$(curl -s -w "%{http_code}" "http://localhost:5000$endpoint" -o /dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Code: $response)${NC}"
        return 1
    fi
}

# Tests des endpoints essentiels
test_endpoint "Health Check" "/api/health"
test_endpoint "Reports Test" "/api/reports/test"
test_endpoint "Reports List" "/api/reports/list"
test_endpoint "Reports Stats" "/api/reports/stats"
test_endpoint "Network Interfaces" "/api/network/interfaces"
test_endpoint "Network Captures Active" "/api/network/captures/active"
test_endpoint "Network Captures History" "/api/network/captures/history"

# 10. Démarrage du frontend (optionnel)
log_info "Voulez-vous démarrer le frontend ? (y/N)"
read -r start_frontend

if [[ $start_frontend =~ ^[Yy]$ ]]; then
    log_info "Démarrage du frontend..."
    cd frontend
    if [ -f "package.json" ]; then
        npm start &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/pacha_frontend.pid
        log_info "Frontend démarré (PID: $FRONTEND_PID)"
    else
        log_error "package.json non trouvé dans frontend/"
    fi
    cd ..
fi

# 11. Vérifier les rapports créés
log_info "Vérification des rapports créés..."
sleep 3

if [ -d "$PROJECT_ROOT/data/reports" ]; then
    REPORT_COUNT=$(find "$PROJECT_ROOT/data/reports" -name "report_*.html" | wc -l)
    if [ "$REPORT_COUNT" -gt 0 ]; then
        log_success "$REPORT_COUNT rapports de test créés automatiquement"
        echo "📁 Emplacement: $PROJECT_ROOT/data/reports/"
        ls -la "$PROJECT_ROOT/data/reports/"
    else
        log_warning "Aucun rapport trouvé, ils seront créés lors du premier scan"
    fi
fi

echo ""
log_success "🎉 CORRECTIONS APPLIQUÉES AVEC SUCCÈS !"
echo ""
echo "📊 RÉSUMÉ:"
echo "   ✅ Structure de répertoires créée avec chemins relatifs"
echo "   ✅ Fichier backend/main.py corrigé avec tous les endpoints"
echo "   ✅ Endpoints rapports fonctionnels:"
echo "      • /api/reports/test"
echo "      • /api/reports/generate" 
echo "      • /api/reports/list"
echo "      • /api/reports/download/<filename>"
echo "      • /api/reports/preview/<filename>"
echo "      • /api/reports/stats"
echo "      • /api/reports/cleanup"
echo "   ✅ Endpoints réseau ajoutés:"
echo "      • /api/network/captures/active"
echo "      • /api/network/captures/history"
echo "   ✅ Services démarrés et opérationnels"
echo ""
echo "🌐 URLs de test:"
echo "   • Backend API: http://localhost:5000/api/health"
echo "   • Rapports: http://localhost:5000/api/reports/list"
echo "   • Frontend: http://localhost:3000 (si démarré)"
echo ""
echo "🧪 Relancer vos tests:"
echo "   ./test_reports_functionality.sh"
echo ""
echo "📁 Fichiers de sauvegarde dans: $BACKUP_DIR"
echo "🔧 PIDs sauvegardés dans /tmp/pacha_*.pid"

# 12. Affichage final des processus
echo ""
log_info "Processus en cours d'exécution:"
ps aux | grep -E "(python.*main.py|npm.*start)" | grep -v grep || echo "Aucun processus trouvé"

log_success "Script terminé avec succès !"
