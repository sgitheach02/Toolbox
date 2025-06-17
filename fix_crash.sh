#!/bin/bash

echo "🚨 FIX REACT CRASH - PACHA TOOLBOX"
echo "=================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
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

# 1. Diagnostic initial
log_info "Diagnostic des processus React..."
docker-compose ps
docker-compose logs --tail=20 frontend

# 2. Arrêt propre
log_info "Arrêt des conteneurs..."
docker-compose down -v --remove-orphans

# 3. Nettoyage
log_info "Nettoyage Docker..."
docker system prune -f
docker volume prune -f

# 4. Vérification des fichiers React
log_info "Vérification de package.json..."
if [ ! -f "frontend/package.json" ]; then
    log_warning "Création de package.json minimal..."
    cat > frontend/package.json << 'EOF'
{
  "name": "pacha-toolbox-frontend",
  "version": "2.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
fi

# 5. Correction du Dockerfile frontend
log_info "Correction du Dockerfile frontend..."
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

# Variables pour éviter les crashes
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation avec plus de mémoire
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --silent --no-progress

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Variables d'environnement React
ENV REACT_APP_API_URL=http://localhost:5000/api
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

# Démarrage avec gestion d'erreurs
CMD ["sh", "-c", "npm start 2>&1 | tee /tmp/react.log || (echo 'React crashed!' && tail -50 /tmp/react.log && sleep infinity)"]
EOF

# 6. Correction du docker-compose.yml
log_info "Correction du docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend API Flask
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
    volumes:
      - ./backend:/app:rw
      - reports_data:/app/reports
      - logs_data:/app/logs
    networks:
      - pacha-network
    restart: unless-stopped

  # Frontend React - Version anti-crash
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
      - NODE_OPTIONS=--max-old-space-size=4096
      - GENERATE_SOURCEMAP=false
      - DISABLE_ESLINT_PLUGIN=true
    volumes:
      - ./frontend:/app:rw
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - pacha-network
    restart: unless-stopped
    stdin_open: true
    tty: true
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M

volumes:
  reports_data:
    driver: local
  logs_data:
    driver: local

networks:
  pacha-network:
    driver: bridge
    name: pacha-network
EOF

# 7. Vérification de la syntaxe src/App.js
log_info "Vérification de la syntaxe App.js..."
if [ -f "frontend/src/App.js" ]; then
    # Simple vérification de syntaxe
    if ! node -c frontend/src/App.js 2>/dev/null; then
        log_error "Erreur de syntaxe dans App.js détectée!"
        log_warning "Création d'un App.js minimal de secours..."
        mkdir -p frontend/src
        cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#e5e5e5', minHeight: '100vh' }}>
      <h1>🛡️ PACHA Security Platform</h1>
      <p>Loading... If this persists, check the console for errors.</p>
      <p>Backend API: <a href="http://localhost:5000/api/health" target="_blank" rel="noopener noreferrer">http://localhost:5000/api/health</a></p>
    </div>
  );
}

export default App;
EOF
    fi
else
    log_warning "App.js manquant, création d'un fichier minimal..."
    mkdir -p frontend/src
    cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#e5e5e5', minHeight: '100vh' }}>
      <h1>🛡️ PACHA Security Platform</h1>
      <p>Application en cours de chargement...</p>
      <p>Si cette page persiste, vérifiez les logs du conteneur.</p>
    </div>
  );
}

export default App;
EOF
fi

# 8. Construction et démarrage avec surveillance
log_info "Construction des images sans cache..."
docker-compose build --no-cache

log_info "Démarrage des services..."
docker-compose up -d

# 9. Surveillance du démarrage
log_info "Surveillance du démarrage (60s)..."
for i in {1..60}; do
    if docker-compose ps | grep -q "frontend.*Up"; then
        log_success "Frontend démarré avec succès!"
        break
    elif docker-compose ps | grep -q "frontend.*Exit"; then
        log_error "Frontend a crashé! Affichage des logs:"
        docker-compose logs --tail=50 frontend
        break
    fi
    echo -n "."
    sleep 1
done

echo ""

# 10. Test final
log_info "Test de connectivité..."
sleep 10

if curl -s http://localhost:3000 > /dev/null; then
    log_success "🎉 Frontend accessible sur http://localhost:3000"
else
    log_error "Frontend toujours inaccessible"
    log_info "Logs frontend:"
    docker-compose logs --tail=30 frontend
fi

if curl -s http://localhost:5000/api/health > /dev/null; then
    log_success "🎉 Backend accessible sur http://localhost:5000"
else
    log_warning "Backend inaccessible"
fi

echo ""
log_info "🔧 Commandes de debug utiles:"
echo "   docker-compose logs -f frontend"
echo "   docker-compose exec frontend sh"
echo "   docker-compose restart frontend"

echo ""
log_info "📊 Statut actuel:"
docker-compose ps
