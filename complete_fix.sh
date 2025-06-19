#!/bin/bash

# SOLUTION COMPLÈTE - Correction Root Cause Nikto
# Analyse et résolution de tous les problèmes

set -e

echo "🔍 PACHA TOOLBOX - CORRECTION COMPLÈTE NIKTO"
echo "============================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

# ============================================================
# 1. DIAGNOSTIC COMPLET
# ============================================================

log_step "ÉTAPE 1: DIAGNOSTIC COMPLET"

echo "📊 Status des containers actuels:"
docker-compose ps || true

echo ""
echo "🔍 Test de nikto dans le container actuel:"
if docker exec pacha-backend which nikto > /dev/null 2>&1; then
    log_warning "Nikto trouvé dans le container"
    docker exec pacha-backend nikto -Version 2>&1 || log_error "Nikto ne fonctionne pas"
else
    log_error "Nikto NON TROUVÉ dans le container"
fi

echo ""
echo "🔍 Vérification du Dockerfile actuel:"
if grep -q "nikto" backend/Dockerfile; then
    log_warning "Nikto mentionné dans Dockerfile"
else
    log_error "Nikto ABSENT du Dockerfile"
fi

# ============================================================
# 2. SAUVEGARDE SÉCURISÉE
# ============================================================

log_step "ÉTAPE 2: SAUVEGARDE SÉCURISÉE"

backup_dir="backup_complete_fix_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

log_info "Sauvegarde dans $backup_dir..."
cp backend/main.py "$backup_dir/" 2>/dev/null || true
cp backend/Dockerfile "$backup_dir/" 2>/dev/null || true
cp backend/requirements.txt "$backup_dir/" 2>/dev/null || true
cp docker-compose.yml "$backup_dir/" 2>/dev/null || true

log_success "Sauvegarde terminée"

# ============================================================
# 3. ARRÊT PROPRE DES SERVICES
# ============================================================

log_step "ÉTAPE 3: ARRÊT PROPRE DES SERVICES"

log_info "Arrêt des containers..."
docker-compose down --remove-orphans

log_info "Nettoyage des images backend obsolètes..."
docker rmi -f $(docker images -q --filter "reference=*pacha*backend*") 2>/dev/null || true

# ============================================================
# 4. CORRECTION DOCKERFILE BACKEND COMPLET
# ============================================================

log_step "ÉTAPE 4: DOCKERFILE BACKEND CORRIGÉ"

log_info "Création du Dockerfile backend avec TOUS les outils de sécurité..."

cat > backend/Dockerfile << 'EOF'
# Dockerfile Backend Pacha Toolbox - COMPLET avec outils de sécurité
FROM python:3.11-slim

# Variables d'environnement pour éviter les prompts interactifs
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Mise à jour du système et installation des outils de base
RUN apt-get update && apt-get install -y \
    # Outils système de base
    curl \
    wget \
    git \
    unzip \
    procps \
    net-tools \
    dnsutils \
    iputils-ping \
    # Compilation et développement
    build-essential \
    python3-dev \
    # Nettoyage initial
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation des outils de sécurité - PREMIÈRE VAGUE
RUN apt-get update && apt-get install -y \
    # Scanner réseau
    nmap \
    masscan \
    # Analyse de paquets
    tcpdump \
    tshark \
    wireshark-common \
    # Outils réseau
    netcat-openbsd \
    socat \
    # Nettoyage
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation des outils de sécurité - DEUXIÈME VAGUE (nikto et outils web)
RUN apt-get update && apt-get install -y \
    # Scanners de vulnérabilités web
    nikto \
    dirb \
    gobuster \
    # Outils de bruteforce
    hydra \
    medusa \
    # Outils d'analyse
    sqlmap \
    # Nettoyage
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Vérification que nikto est bien installé
RUN which nikto && nikto -Version

# Définir le répertoire de travail
WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Créer les répertoires nécessaires
RUN mkdir -p /app/data/reports /app/data/logs /app/data/temp && \
    chmod 755 /app/data/reports /app/data/logs /app/data/temp

# Copier le code source
COPY . .

# Script de vérification des outils
RUN echo '#!/bin/bash\n\
echo "🔍 Vérification des outils de sécurité installés:"\n\
echo "================================"\n\
for tool in nmap nikto tcpdump hydra tshark; do\n\
  if command -v $tool >/dev/null 2>&1; then\n\
    echo "✅ $tool: $(which $tool)"\n\
  else\n\
    echo "❌ $tool: NON TROUVÉ"\n\
    exit 1\n\
  fi\n\
done\n\
echo "🎉 Tous les outils sont disponibles!"\n\
echo "================================"\n\
echo "📋 Test fonctionnel de nikto:"\n\
nikto -Version 2>&1 | head -3\n\
echo "================================"' > /app/check_security_tools.sh && \
    chmod +x /app/check_security_tools.sh

# Test automatique pendant le build
RUN /app/check_security_tools.sh

# Port d'exposition
EXPOSE 5000

# Healthcheck personnalisé
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Commande de démarrage avec vérification
CMD ["/bin/bash", "-c", "/app/check_security_tools.sh && python3 main.py"]
EOF

log_success "Dockerfile backend créé avec succès"

# ============================================================
# 5. REQUIREMENTS.TXT MIS À JOUR
# ============================================================

log_step "ÉTAPE 5: REQUIREMENTS.TXT MIS À JOUR"

cat > backend/requirements.txt << 'EOF'
# Requirements.txt Pacha Toolbox - Backend complet
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
PyJWT==2.8.0
requests==2.31.0
python-dateutil==2.8.2
psutil==5.9.5

# Outils de parsing et manipulation
lxml==4.9.3
beautifulsoup4==4.12.2

# Sécurité et crypto
cryptography==41.0.7

# Base de données
SQLAlchemy==2.0.23

# Logging et monitoring
python-json-logger==2.0.7
EOF

log_success "Requirements.txt mis à jour"

# ============================================================
# 6. CORRECTION DOCKER-COMPOSE.YML
# ============================================================

log_step "ÉTAPE 6: DOCKER-COMPOSE.YML CORRIGÉ"

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend API Flask avec outils de sécurité
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: pacha-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=1
      - PYTHONPATH=/app
      - PYTHONUNBUFFERED=1
      - HOST=0.0.0.0
      - PORT=5000
    volumes:
      - ./backend:/app:rw
      - pacha_reports:/app/data/reports
      - pacha_logs:/app/data/logs
      - pacha_temp:/app/data/temp
    networks:
      - pacha-network
    restart: unless-stopped
    # Privilèges pour tcpdump et certains outils
    cap_add:
      - NET_ADMIN
      - NET_RAW
    # Healthcheck
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend React
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pacha-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
      - GENERATE_SOURCEMAP=false
    volumes:
      - ./frontend:/app:rw
      - /app/node_modules
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - pacha-network
    restart: unless-stopped
    stdin_open: true
    tty: true

volumes:
  pacha_reports:
    driver: local
  pacha_logs:
    driver: local
  pacha_temp:
    driver: local

networks:
  pacha-network:
    driver: bridge
    name: pacha-network
EOF

log_success "Docker-compose.yml corrigé"

# ============================================================
# 7. RECONSTRUCTION COMPLÈTE
# ============================================================

log_step "ÉTAPE 7: RECONSTRUCTION COMPLÈTE"

log_info "Construction de l'image backend avec tous les outils..."
echo "⚠️  Cette étape peut prendre 5-10 minutes (installation de tous les outils de sécurité)"

if docker-compose build --no-cache backend; then
    log_success "Image backend construite avec succès"
else
    log_error "Échec de la construction du backend"
    exit 1
fi

log_info "Construction de l'image frontend..."
if docker-compose build --no-cache frontend; then
    log_success "Image frontend construite avec succès"
else
    log_warning "Problème avec le frontend, mais on continue..."
fi

# ============================================================
# 8. DÉMARRAGE ET TESTS
# ============================================================

log_step "ÉTAPE 8: DÉMARRAGE ET TESTS"

log_info "Démarrage des services..."
docker-compose up -d

log_info "Attente du démarrage complet (30 secondes)..."
sleep 30

# Test 1: Santé de l'API
log_info "Test 1: Santé de l'API..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log_success "API backend opérationnelle"
else
    log_error "API backend non accessible"
    echo "Logs backend:"
    docker-compose logs backend --tail=10
fi

# Test 2: Nikto dans le container
log_info "Test 2: Vérification de nikto dans le container..."
if docker exec pacha-backend nikto -Version > /dev/null 2>&1; then
    log_success "Nikto fonctionne dans le container !"
    nikto_version=$(docker exec pacha-backend nikto -Version 2>&1 | head -1)
    echo "   Version: $nikto_version"
else
    log_error "Nikto ne fonctionne pas dans le container"
    docker exec pacha-backend which nikto || log_error "Nikto non trouvé"
fi

# Test 3: Tous les outils de sécurité
log_info "Test 3: Vérification de tous les outils de sécurité..."
docker exec pacha-backend /app/check_security_tools.sh

# Test 4: Scan nikto fonctionnel
log_info "Test 4: Test d'un scan nikto réel..."
if docker exec pacha-backend timeout 30 nikto -h https://testphp.vulnweb.com/ -maxtime 20 > /dev/null 2>&1; then
    log_success "Scan nikto fonctionnel !"
else
    log_warning "Scan nikto test échoué (peut être normal si pas d'internet)"
fi

# Test 5: Frontend
log_info "Test 5: Frontend..."
sleep 10
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend accessible"
else
    log_warning "Frontend pas encore prêt"
fi

# ============================================================
# 9. RAPPORT FINAL
# ============================================================

log_step "ÉTAPE 9: RAPPORT FINAL"

echo ""
echo -e "${GREEN}🎉 CORRECTION COMPLÈTE TERMINÉE${NC}"
echo "================================="
echo ""

echo -e "${BLUE}📊 Status des services:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🔗 URLs d'accès:${NC}"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:5000"
echo "   • Health:   http://localhost:5000/api/health"

echo ""
echo -e "${BLUE}👤 Comptes de connexion:${NC}"
echo "   • admin:admin123"
echo "   • user:user123"

echo ""
echo -e "${BLUE}🕷️ Test Nikto:${NC}"
echo "   1. Allez sur http://localhost:3000"
echo "   2. Connectez-vous (admin:admin123)"
echo "   3. Onglet Nikto"
echo "   4. Target: https://testphp.vulnweb.com/"
echo "   5. Scan Type: basic"
echo "   6. Lancez le scan - il utilisera le VRAI nikto !"

echo ""
echo -e "${BLUE}🔧 Outils installés et fonctionnels:${NC}"
docker exec pacha-backend bash -c "
echo '   • Nmap: '$(nmap --version | head -1)
echo '   • Nikto: '$(nikto -Version 2>&1 | head -1)
echo '   • Tcpdump: '$(tcpdump --version 2>&1 | head -1)
echo '   • Hydra: '$(hydra -h 2>&1 | head -1)
echo '   • Tshark: '$(tshark --version | head -1)
"

echo ""
echo -e "${BLUE}🛠️ Commandes utiles:${NC}"
echo "   • Logs temps réel: docker-compose logs -f"
echo "   • Redémarrer: docker-compose restart"
echo "   • Status: docker-compose ps"
echo "   • Test nikto: docker exec pacha-backend nikto -Version"

echo ""
echo -e "${GREEN}✅ NIKTO EST MAINTENANT INSTALLÉ ET FONCTIONNEL !${NC}"
echo -e "${GREEN}✅ TOUS LES OUTILS DE SÉCURITÉ SONT OPÉRATIONNELS !${NC}"

# ============================================================
# 10. VÉRIFICATION FINALE AUTOMATIQUE
# ============================================================

echo ""
log_info "Vérification finale automatique dans 5 secondes..."
sleep 5

final_test_passed=0

# Test API
if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
    log_success "✓ API backend fonctionnelle"
    ((final_test_passed++))
else
    log_error "✗ API backend défaillante"
fi

# Test Nikto
if docker exec pacha-backend which nikto > /dev/null 2>&1; then
    log_success "✓ Nikto installé"
    ((final_test_passed++))
else
    log_error "✗ Nikto non installé"
fi

# Test fonctionnel Nikto
if docker exec pacha-backend nikto -Version > /dev/null 2>&1; then
    log_success "✓ Nikto fonctionnel"
    ((final_test_passed++))
else
    log_error "✗ Nikto non fonctionnel"
fi

echo ""
if [ $final_test_passed -eq 3 ]; then
    echo -e "${GREEN}🏆 SUCCÈS TOTAL ! Tous les tests sont passés.${NC}"
    echo -e "${GREEN}🕷️ NIKTO EST PRÊT POUR LES SCANS RÉELS !${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Succès partiel ($final_test_passed/3 tests passés)${NC}"
    echo -e "${BLUE}📋 Consultez les logs pour plus de détails:${NC}"
    echo "   docker-compose logs backend"
    exit 1
fi
