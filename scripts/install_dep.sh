#!/bin/bash
# install_dependencies.sh - Installation des dépendances Pacha Toolbox

echo "🚀 Installation des dépendances Pacha Toolbox"
echo "==============================================="

# Couleurs pour les messages
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

# Vérifier Python
log_info "Vérification de Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    log_success "Python $PYTHON_VERSION trouvé"
else
    log_error "Python 3 non trouvé. Installez Python 3.8+ avant de continuer."
    exit 1
fi

# Vérifier pip
log_info "Vérification de pip..."
if command -v pip3 &> /dev/null; then
    log_success "pip3 trouvé"
elif command -v pip &> /dev/null; then
    log_success "pip trouvé"
    alias pip3=pip
else
    log_error "pip non trouvé. Installez pip avant de continuer."
    exit 1
fi

# Créer un environnement virtuel (optionnel mais recommandé)
log_info "Voulez-vous créer un environnement virtuel ? (recommandé) [y/N]"
read -r create_venv

if [[ $create_venv =~ ^[Yy]$ ]]; then
    log_info "Création de l'environnement virtuel..."
    
    if python3 -m venv pacha-venv; then
        log_success "Environnement virtuel créé"
        log_info "Activation de l'environnement virtuel..."
        source pacha-venv/bin/activate
        log_success "Environnement virtuel activé"
        
        # Mettre à jour pip dans le venv
        pip install --upgrade pip
    else
        log_error "Échec de création de l'environnement virtuel"
        log_warning "Continuons sans environnement virtuel..."
    fi
fi

# Installation des dépendances Python
log_info "Installation des dépendances Python..."

# Dépendances essentielles
DEPENDENCIES=(
    "flask>=2.0.0"
    "flask-cors>=3.0.0"
    "requests>=2.25.0"
)

# Dépendances optionnelles (pour de meilleures fonctionnalités)
OPTIONAL_DEPENDENCIES=(
    "psutil>=5.8.0"
    "python-nmap>=0.6.0"
    "colorama>=0.4.0"
)

# Installation des dépendances essentielles
log_info "Installation des dépendances essentielles..."
for dep in "${DEPENDENCIES[@]}"; do
    log_info "Installation de $dep..."
    if pip3 install "$dep"; then
        log_success "$dep installé"
    else
        log_error "Échec installation de $dep"
        exit 1
    fi
done

# Installation des dépendances optionnelles
log_info "Installation des dépendances optionnelles..."
for dep in "${OPTIONAL_DEPENDENCIES[@]}"; do
    log_info "Installation de $dep..."
    if pip3 install "$dep"; then
        log_success "$dep installé"
    else
        log_warning "Échec installation de $dep (optionnel)"
    fi
done

# Créer la structure de répertoires
log_info "Création de la structure de répertoires..."
mkdir -p data/{reports,reports/pdf,logs,temp}
mkdir -p data/captures

log_success "Structure de répertoires créée"

# Vérifier les outils de sécurité (optionnel)
log_info "Vérification des outils de sécurité..."

check_tool() {
    local tool=$1
    if command -v "$tool" &> /dev/null; then
        log_success "$tool trouvé"
        return 0
    else
        log_warning "$tool non trouvé (optionnel pour la simulation)"
        return 1
    fi
}

check_tool "nmap"
check_tool "nikto"
check_tool "hydra"

# Test de l'installation
log_info "Test de l'installation..."

cat > test_install.py << 'EOF'
#!/usr/bin/env python3
"""Test de l'installation des dépendances"""

def test_imports():
    try:
        import flask
        print("✅ Flask OK")
    except ImportError as e:
        print(f"❌ Flask: {e}")
        return False
    
    try:
        import flask_cors
        print("✅ Flask-CORS OK")
    except ImportError as e:
        print(f"❌ Flask-CORS: {e}")
        return False
    
    try:
        import requests
        print("✅ Requests OK")
    except ImportError as e:
        print(f"❌ Requests: {e}")
        return False
    
    # Tests optionnels
    try:
        import psutil
        print("✅ psutil OK (optionnel)")
    except ImportError:
        print("⚠️ psutil non disponible (optionnel)")
    
    try:
        import nmap
        print("✅ python-nmap OK (optionnel)")
    except ImportError:
        print("⚠️ python-nmap non disponible (optionnel)")
    
    return True

if __name__ == "__main__":
    print("🧪 Test des imports Python...")
    if test_imports():
        print("✅ Tous les imports essentiels fonctionnent!")
        exit(0)
    else:
        print("❌ Certains imports essentiels ont échoué")
        exit(1)
EOF

if python3 test_install.py; then
    log_success "Test d'installation réussi"
    rm test_install.py
else
    log_error "Test d'installation échoué"
    rm test_install.py
    exit 1
fi

# Instructions finales
echo ""
echo "🎉 Installation terminée avec succès!"
echo "==============================================="
echo ""
log_success "Dépendances Python installées"
log_success "Structure de répertoires créée"
log_success "Tests passés"
echo ""
echo "📋 Pour démarrer Pacha Toolbox:"
echo ""

if [[ $create_venv =~ ^[Yy]$ ]]; then
    echo "1. Activez l'environnement virtuel:"
    echo "   source pacha-venv/bin/activate"
    echo ""
fi

echo "2. Démarrez le backend:"
echo "   cd backend"
echo "   python3 main.py"
echo ""
echo "3. Testez l'API:"
echo "   curl http://localhost:5000/api/health"
echo ""

if [[ $create_venv =~ ^[Yy]$ ]]; then
    echo "💡 Pour désactiver l'environnement virtuel plus tard:"
    echo "   deactivate"
    echo ""
fi

echo "📚 Endpoints disponibles:"
echo "   http://localhost:5000/api/health"
echo "   http://localhost:5000/api/threading/info"
echo "   http://localhost:5000/api/threading/dashboard"
echo ""

log_success "Installation complète! Vous pouvez maintenant utiliser Pacha Toolbox."

# Afficher des infos supplémentaires si demandé
log_info "Voulez-vous voir les informations détaillées ? [y/N]"
read -r show_details

if [[ $show_details =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔧 Informations détaillées:"
    echo "=================================="
    echo "Python: $(python3 --version)"
    echo "pip: $(pip3 --version)"
    echo "Flask: $(python3 -c 'import flask; print(flask.__version__)' 2>/dev/null || echo 'Non installé')"
    echo "Répertoire actuel: $(pwd)"
    echo "Répertoires créés:"
    find data -type d 2>/dev/null | sort || echo "Aucun répertoire data trouvé"
    echo ""
fi
