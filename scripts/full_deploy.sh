#!/bin/bash

# deploy_pacha_toolbox.sh - Script de déploiement complet Pacha Toolbox
# Usage: ./deploy_pacha_toolbox.sh

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonctions de logging
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

log_header() {
    echo -e "${PURPLE}"
    echo "================================"
    echo "$1"
    echo "================================"
    echo -e "${NC}"
}

# Variables
PROJECT_NAME="pacha-toolbox"
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Vérification de l'environnement
check_requirements() {
    log_header "VÉRIFICATION DES PRÉREQUIS"
    
    # Vérifier Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 n'est pas installé"
        exit 1
    fi
    log_success "Python 3 trouvé: $(python3 --version)"
    
    # Vérifier pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 n'est pas installé"
        exit 1
    fi
    log_success "pip3 trouvé: $(pip3 --version)"
    
    # Vérifier Node.js (optionnel pour le frontend)
    if command -v node &> /dev/null; then
        log_success "Node.js trouvé: $(node --version)"
        NODE_AVAILABLE=true
    else
        log_warning "Node.js non trouvé - le frontend ne pourra pas être démarré"
        NODE_AVAILABLE=false
    fi
    
    # Vérifier les outils de sécurité
    log_info "Vérification des outils de sécurité..."
    
    TOOLS_STATUS=""
    
    if command -v nmap &> /dev/null; then
        TOOLS_STATUS="${TOOLS_STATUS}✅ nmap "
    else
        TOOLS_STATUS="${TOOLS_STATUS}❌ nmap "
    fi
    
    if command -v nikto &> /dev/null; then
        TOOLS_STATUS="${TOOLS_STATUS}✅ nikto "
    else
        TOOLS_STATUS="${TOOLS_STATUS}❌ nikto "
    fi
    
    if command -v tcpdump &> /dev/null; then
        TOOLS_STATUS="${TOOLS_STATUS}✅ tcpdump "
    else
        TOOLS_STATUS="${TOOLS_STATUS}❌ tcpdump "
    fi
    
    if command -v hydra &> /dev/null; then
        TOOLS_STATUS="${TOOLS_STATUS}✅ hydra "
    else
        TOOLS_STATUS="${TOOLS_STATUS}❌ hydra "
    fi
    
    if command -v msfconsole &> /dev/null; then
        TOOLS_STATUS="${TOOLS_STATUS}✅ metasploit "
    else
        TOOLS_STATUS="${TOOLS_STATUS}❌ metasploit "
    fi
    
    echo -e "Outils de sécurité: $TOOLS_STATUS"
    
    log_info "Pour installer les outils manquants sur Ubuntu/Debian:"
    log_info "sudo apt update && sudo apt install -y nmap nikto tcpdump hydra"
    log_info "Pour Metasploit: curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall && ./msfinstall"
    
    echo ""
}

# Création de la structure de projet
create_project_structure() {
    log_header "CRÉATION DE LA STRUCTURE DU PROJET"
    
    log_info "Création du répertoire principal..."
    mkdir -p $PROJECT_NAME
    cd $PROJECT_NAME
    
    # Structure backend
    log_info "Création de la structure backend..."
    mkdir -p backend/{app/{services,utils,routes},data/{reports,logs,temp}}
    mkdir -p backend/app/services
    mkdir -p backend/app/utils
    mkdir -p backend/app/routes
    
    # Structure frontend
    if [ "$NODE_AVAILABLE" = true ]; then
        log_info "Création de la structure frontend..."
        mkdir -p frontend/{src,public}
        mkdir -p frontend/src/{components,services}
    fi
    
    # Répertoires de données
    log_info "Création des répertoires de données..."
    mkdir -p data/{reports,logs,temp,captures}
    chmod 755 data
    chmod 755 data/reports
    chmod 755 data/logs
    chmod 755 data/temp
    chmod 755 data/captures
    
    log_success "Structure de projet créée dans $(pwd)"
}

# Installation du backend
setup_backend() {
    log_header "CONFIGURATION DU BACKEND"
    
    cd backend
    
    # Créer requirements.txt
    log_info "Création du fichier requirements.txt..."
    cat > requirements.txt << 'EOF'
Flask==2.3.3
Flask-CORS==4.0.0
PyJWT==2.8.0
Werkzeug==2.3.7
python-multipart==0.0.6
gunicorn==21.2.0
EOF
    
    # Installer les dépendances Python
    log_info "Installation des dépendances Python..."
    
    # Créer un environnement virtuel
    python3 -m venv pacha-env
    source pacha-env/bin/activate
    
    pip install --upgrade pip
    pip install -r requirements.txt
    
    log_success "Dépendances Python installées"
    
    # Créer le fichier principal (vous devrez coller le contenu de l'artifact)
    log_info "Créez maintenant le fichier main.py avec le contenu de l'artifact 'Backend principal avec tous les services'"
    echo "Fichier à créer: $(pwd)/main.py"
    
    # Créer un service de base pour vérifier
    cat > test_server.py << 'EOF'
#!/usr/bin/env python3
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Pacha Toolbox API Test Server',
        'version': '2.0.0'
    })

if __name__ == '__main__':
    print("🚀 Démarrage du serveur de test...")
    print("Accédez à http://localhost:5000/api/health")
    app.run(host='0.0.0.0', port=5000, debug=True)
EOF
    
    chmod +x test_server.py
    
    cd ..
    log_success "Backend configuré"
}

# Configuration du frontend
setup_frontend() {
    if [ "$NODE_AVAILABLE" = false ]; then
        log_warning "Node.js non disponible - configuration frontend ignorée"
        return
    fi
    
    log_header "CONFIGURATION DU FRONTEND"
    
    cd frontend
    
    # Initialiser le projet React si ce n'est pas déjà fait
    if [ ! -f "package.json" ]; then
        log_info "Initialisation du projet React..."
        npx create-react-app . --template typescript
    fi
    
    # Installer les dépendances supplémentaires
    log_info "Installation des dépendances supplémentaires..."
    npm install
    
    # Créer la configuration API
    cat > src/config.js << 'EOF'
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000
};
EOF
    
    # Créer un .env pour le développement
    cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
EOF
    
    log_info "Vous devrez maintenant remplacer le contenu de src/App.js avec l'artifact 'Frontend React connecté au backend'"
    echo "Fichier à modifier: $(pwd)/src/App.js"
    
    cd ..
    log_success "Frontend configuré"
}

# Création des scripts de démarrage
create_startup_scripts() {
    log_header "CRÉATION DES SCRIPTS DE DÉMARRAGE"
    
    # Script de démarrage backend
    cat > start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Démarrage du backend Pacha Toolbox..."

cd backend
source pacha-env/bin/activate

# Vérifier si main.py existe
if [ ! -f "main.py" ]; then
    echo "❌ main.py non trouvé. Démarrage du serveur de test..."
    python test_server.py
else
    echo "✅ Démarrage du serveur principal..."
    python main.py
fi
EOF
    
    chmod +x start_backend.sh
    
    # Script de démarrage frontend
    if [ "$NODE_AVAILABLE" = true ]; then
        cat > start_frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Démarrage du frontend Pacha Toolbox..."

cd frontend
npm start
EOF
        chmod +x start_frontend.sh
    fi
    
    # Script de démarrage complet
    cat > start_pacha.sh << 'EOF'
#!/bin/bash
echo "🚀 Démarrage complet de Pacha Toolbox..."

# Fonction pour tuer les processus à la sortie
cleanup() {
    echo "🛑 Arrêt de Pacha Toolbox..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Démarrer le backend
echo "📡 Démarrage du backend..."
./start_backend.sh &
BACKEND_PID=$!
sleep 3

# Démarrer le frontend si disponible
if [ -f "start_frontend.sh" ]; then
    echo "🖥️  Démarrage du frontend..."
    ./start_frontend.sh &
    FRONTEND_PID=$!
    
    echo "✅ Pacha Toolbox démarré!"
    echo "🔗 Backend: http://localhost:5000"
    echo "🔗 Frontend: http://localhost:3000"
else
    echo "✅ Backend Pacha Toolbox démarré!"
    echo "🔗 API: http://localhost:5000"
fi

echo "👤 Comptes par défaut:"
echo "   • admin:admin123 (administrateur)"
echo "   • user:user123 (utilisateur)"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter..."

# Attendre que les processus se terminent
wait
EOF
    
    chmod +x start_pacha.sh
    
    # Script d'arrêt
    cat > stop_pacha.sh << 'EOF'
#!/bin/bash
echo "🛑 Arrêt de Pacha Toolbox..."

# Tuer les processus Python (backend)
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "python.*test_server.py" 2>/dev/null || true

# Tuer les processus Node (frontend)
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "node.*react-scripts" 2>/dev/null || true

# Tuer les processus sur les ports spécifiques
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ Pacha Toolbox arrêté"
EOF
    
    chmod +x stop_pacha.sh
    
    log_success "Scripts de démarrage créés"
}

# Configuration Docker (optionnel)
create_docker_config() {
    log_header "CRÉATION DE LA CONFIGURATION DOCKER"
    
    # Dockerfile pour le backend
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

# Installation des outils système
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nmap \
    nikto \
    tcpdump \
    hydra \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Créer l'utilisateur pacha
RUN useradd -m -s /bin/bash pacha && \
    mkdir -p /app /app/reports /app/logs /app/temp && \
    chown -R pacha:pacha /app

WORKDIR /app

# Copier les requirements et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .
RUN chown -R pacha:pacha /app

# Changer d'utilisateur
USER pacha

# Port d'exposition
EXPOSE 5000

# Variables d'environnement
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0
ENV HOST=0.0.0.0
ENV PORT=5000

# Commande de démarrage
CMD ["python", "main.py"]
EOF

    # Dockerfile pour le frontend
    if [ "$NODE_AVAILABLE" = true ]; then
        cat > frontend/Dockerfile << 'EOF'
FROM node:18-slim

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Serveur simple pour servir les fichiers statiques
RUN npm install -g serve

# Port d'exposition
EXPOSE 3000

# Variables d'environnement
ENV REACT_APP_API_URL=http://localhost:5000/api

# Commande de démarrage
CMD ["serve", "-s", "build", "-l", "3000"]
EOF
    fi

    # Docker Compose
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
      - ./data/reports:/app/reports
      - ./data/logs:/app/logs
      - ./data/temp:/app/temp
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=0
      - HOST=0.0.0.0
      - PORT=5000
      - CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    restart: unless-stopped
    networks:
      - pacha-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - pacha-network

networks:
  pacha-network:
    driver: bridge

volumes:
  pacha-data:
EOF

    # .dockerignore pour le backend
    cat > backend/.dockerignore << 'EOF'
pacha-env/
__pycache__/
*.pyc
*.pyo
*.pyd
.env
.git
.gitignore
README.md
Dockerfile
.dockerignore
EOF

    # .dockerignore pour le frontend
    if [ "$NODE_AVAILABLE" = true ]; then
        cat > frontend/.dockerignore << 'EOF'
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.git
.gitignore
README.md
Dockerfile
.dockerignore
build/
EOF
    fi

    log_success "Configuration Docker créée"
}

# Tests de validation
run_tests() {
    log_header "TESTS DE VALIDATION"
    
    # Test du backend
    log_info "Test du backend..."
    cd backend
    source pacha-env/bin/activate
    
    # Tester l'importation des modules
    python3 -c "
import flask
import flask_cors
import jwt
print('✅ Modules Python importés avec succès')
" || log_error "Erreur d'importation des modules Python"
    
    cd ..
    
    # Test du frontend
    if [ "$NODE_AVAILABLE" = true ] && [ -d "frontend" ]; then
        log_info "Test du frontend..."
        cd frontend
        if [ -f "package.json" ]; then
            npm test -- --watchAll=false --passWithNoTests || log_warning "Tests frontend échoués"
        fi
        cd ..
    fi
    
    log_success "Tests terminés"
}

# Création de la documentation
create_documentation() {
    log_header "CRÉATION DE LA DOCUMENTATION"
    
    cat > README.md << 'EOF'
# 🛡️ Pacha Security Toolbox

Suite complète d'outils de test de pénétration avec interface web moderne.

## 🚀 Démarrage rapide

### Prérequis
- Python 3.8+
- pip3
- Outils de sécurité (nmap, nikto, tcpdump, hydra, metasploit)

### Installation
```bash
./deploy_pacha_toolbox.sh
```

### Démarrage
```bash
./start_pacha.sh
```

### Arrêt
```bash
./stop_pacha.sh
```

## 🔗 Accès

- **API Backend**: http://localhost:5000
- **Interface Web**: http://localhost:3000 (si frontend disponible)
- **Health Check**: http://localhost:5000/api/health

## 👤 Comptes par défaut

- **Administrateur**: `admin` / `admin123`
- **Utilisateur**: `user` / `user123`

## 🛠️ Outils intégrés

- **Nmap**: Découverte réseau et scan de ports
- **Nikto**: Scan de vulnérabilités web
- **tcpdump**: Capture de paquets réseau
- **Hydra**: Attaques par force brute
- **Metasploit**: Framework d'exploitation

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Scans
- `POST /api/scan/nmap` - Démarrer scan Nmap
- `POST /api/scan/nikto` - Démarrer scan Nikto
- `POST /api/scan/tcpdump` - Démarrer capture tcpdump
- `POST /api/scan/hydra` - Démarrer attaque Hydra
- `POST /api/scan/metasploit` - Démarrer exploit Metasploit

### Statut et Historique
- `GET /api/scan/status/<task_id>` - Statut d'une tâche
- `GET /api/scan/history` - Historique des scans
- `GET /api/health` - Santé de l'API

## 🐳 Déploiement Docker

```bash
# Construction et démarrage
docker-compose up --build

# Arrêt
docker-compose down
```

## 📁 Structure du projet

```
pacha-toolbox/
├── backend/
│   ├── main.py              # API Flask principale
│   ├── requirements.txt     # Dépendances Python
│   └── pacha-env/          # Environnement virtuel
├── frontend/
│   ├── src/
│   │   └── App.js          # Interface React
│   └── package.json        # Dépendances Node
├── data/
│   ├── reports/            # Rapports de scan
│   ├── logs/              # Logs système
│   └── temp/              # Fichiers temporaires
└── docker-compose.yml     # Configuration Docker
```

## ⚠️ Avertissements de sécurité

- **Usage légal uniquement**: N'utilisez ces outils que sur vos propres systèmes ou avec permission explicite
- **Environnement contrôlé**: Utilisez dans un lab isolé pour les tests
- **Mots de passe par défaut**: Changez les comptes par défaut en production
- **Privilèges**: Certains outils nécessitent des privilèges root

## 🔧 Dépannage

### Backend ne démarre pas
```bash
cd backend
source pacha-env/bin/activate
python test_server.py
```

### Frontend ne se connecte pas
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez la configuration CORS
- Consultez la console du navigateur

### Outils de sécurité manquants
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nmap nikto tcpdump hydra

# Metasploit
curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall
chmod 755 msfinstall
./msfinstall
```

## 📚 Développement

### Ajouter un nouvel outil
1. Créer le service dans `backend/app/services/`
2. Ajouter la route dans `backend/main.py`
3. Créer l'onglet dans `frontend/src/App.js`

### Tests
```bash
# Backend
cd backend && source pacha-env/bin/activate && python -m pytest

# Frontend
cd frontend && npm test
```

## 📄 License

Usage éducatif et professionnel uniquement. Respectez les lois locales.
EOF

    # Créer un fichier de configuration d'exemple
    cat > config.example.env << 'EOF'
# Configuration Pacha Toolbox

# Backend
FLASK_ENV=development
FLASK_DEBUG=1
HOST=0.0.0.0
PORT=5000
JWT_SECRET_KEY=your-secret-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend
REACT_APP_API_URL=http://localhost:5000/api

# Outils (chemins personnalisés si nécessaire)
NMAP_PATH=/usr/bin/nmap
NIKTO_PATH=/usr/bin/nikto
TCPDUMP_PATH=/usr/bin/tcpdump
HYDRA_PATH=/usr/bin/hydra
MSFCONSOLE_PATH=/usr/bin/msfconsole

# Limites de sécurité
MAX_SCAN_DURATION=300
MAX_CONCURRENT_SCANS=3
ALLOWED_TARGETS=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12
EOF

    log_success "Documentation créée"
}

# Fonction principale
main() {
    log_header "DÉPLOIEMENT PACHA SECURITY TOOLBOX"
    
    echo "Ce script va créer une installation complète de Pacha Toolbox"
    echo "avec backend Flask et frontend React connectés."
    echo ""
    
    read -p "Continuer ? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installation annulée"
        exit 0
    fi
    
    check_requirements
    create_project_structure
    setup_backend
    setup_frontend
    create_startup_scripts
    create_docker_config
    run_tests
    create_documentation
    
    log_header "🎉 INSTALLATION TERMINÉE"
    
    echo ""
    log_success "Pacha Toolbox installé avec succès dans : $(pwd)"
    echo ""
    
    echo "📋 PROCHAINES ÉTAPES:"
    echo ""
    echo "1️⃣  Copiez le contenu de l'artifact 'Backend principal avec tous les services'"
    echo "     dans le fichier: $(pwd)/backend/main.py"
    echo ""
    
    if [ "$NODE_AVAILABLE" = true ]; then
        echo "2️⃣  Copiez le contenu de l'artifact 'Frontend React connecté au backend'"
        echo "     dans le fichier: $(pwd)/frontend/src/App.js"
        echo ""
    fi
    
    echo "3️⃣  Démarrez Pacha Toolbox:"
    echo "     ./start_pacha.sh"
    echo ""
    
    echo "🔗 Une fois démarré, accédez à:"
    echo "   • API: http://localhost:5000/api/health"
    if [ "$NODE_AVAILABLE" = true ]; then
        echo "   • Interface: http://localhost:3000"
    fi
    echo ""
    
    echo "👤 Comptes par défaut:"
    echo "   • admin:admin123 (administrateur)"
    echo "   • user:user123 (utilisateur)"
    echo ""
    
    log_warning "IMPORTANT: N'utilisez ces outils que sur vos propres systèmes ou avec permission explicite !"
    
    echo ""
    echo "📚 Consultez README.md pour plus d'informations"
}

# Exécution du script principal
main "$@"
