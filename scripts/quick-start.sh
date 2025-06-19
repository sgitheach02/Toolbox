#!/bin/bash
# quick-start.sh - Démarrage rapide sans health checks

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo -e "${BLUE}"
echo "🚀 PACHA TOOLBOX - DÉMARRAGE RAPIDE"
echo "==================================="
echo -e "${NC}"

log_warning "Mode de démarrage simplifié (sans health checks)"
echo ""

# 1. Arrêter tout ce qui pourrait tourner
log_info "Nettoyage..."
docker-compose down 2>/dev/null || true

# 2. Utiliser la configuration simple
log_info "Configuration du docker-compose simple..."
cp docker-compose.yml docker-compose.yml.backup 2>/dev/null || true

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: pacha-postgres
    environment:
      POSTGRES_DB: pacha_toolbox
      POSTGRES_USER: pacha_user
      POSTGRES_PASSWORD: pacha_secure_2024!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - pacha-network
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: pacha-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=1
      - PYTHONPATH=/app
      - PYTHONUNBUFFERED=1
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=pacha_toolbox
      - DB_USER=pacha_user
      - DB_PASSWORD=pacha_secure_2024!
      - JWT_SECRET_KEY=your-super-secret-jwt-key
      - ADMIN_PASSWORD=Admin123!
      - CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    volumes:
      - ./backend:/app:rw
      - reports_data:/app/reports
      - logs_data:/app/logs
    depends_on:
      - postgres
    networks:
      - pacha-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: pacha-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
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

volumes:
  postgres_data:
  reports_data:
  logs_data:

networks:
  pacha-network:
    driver: bridge
EOF

# 3. Dockerfile frontend ultra simple
log_info "Dockerfile frontend simplifié..."

cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

# 4. Dockerfile backend simplifié
log_info "Dockerfile backend simplifié..."

cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y \
    curl wget netcat-openbsd nmap gcc python3-dev libpq-dev tcpdump \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p /app/{data,reports,logs,temp}

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "main.py"]
EOF

# 5. Package.json minimal
log_info "Package.json minimal..."

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
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version"]
  }
}
EOF

# 6. Fichiers React essentiels
log_info "Fichiers React essentiels..."

cat > frontend/src/reportWebVitals.js << 'EOF'
const reportWebVitals = () => {};
export default reportWebVitals;
EOF

mkdir -p frontend/public
cat > frontend/public/manifest.json << 'EOF'
{"short_name":"Pacha","name":"Pacha Toolbox","start_url":".","display":"standalone"}
EOF

echo 'User-agent: *' > frontend/public/robots.txt

# 7. Construction et démarrage progressif
log_info "Construction des images..."

# Supprimer les anciennes images
docker rmi pacha-toolbox_backend pacha-toolbox_frontend 2>/dev/null || true

# Construire le backend d'abord
log_info "Construction backend..."
docker-compose build backend

# Construire le frontend
log_info "Construction frontend..."
docker-compose build frontend

# 8. Démarrage progressif
log_info "Démarrage des services..."

# PostgreSQL d'abord
log_info "Démarrage PostgreSQL..."
docker-compose up -d postgres
sleep 10

# Backend ensuite
log_info "Démarrage Backend..."
docker-compose up -d backend
sleep 15

# Frontend en dernier
log_info "Démarrage Frontend..."
docker-compose up -d frontend

# 9. Attendre et vérifier
log_info "Vérification des services..."

echo ""
log_warning "⏳ Patientez 2-3 minutes pour la compilation React..."
echo ""

# Afficher les logs en temps réel pour debug
echo "📊 Logs en cours:"
echo "=================="

# Boucle de vérification
for i in {1..18}; do  # 3 minutes max
    echo -n "⏳ Vérification $i/18: "
    
    # Vérifier backend
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -n "Backend ✅ "
    else
        echo -n "Backend ⏳ "
    fi
    
    # Vérifier frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Frontend ✅"
        break
    else
        echo "Frontend ⏳"
    fi
    
    sleep 10
done

echo ""
echo ""

# 10. Résultats finaux
log_info "📊 Status final:"
docker-compose ps

echo ""

# Tests finaux
if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
    log_success "✅ Backend opérationnel: http://localhost:5000"
else
    log_warning "⚠️ Backend: vérifiez les logs avec 'docker-compose logs backend'"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "✅ Frontend accessible: http://localhost:3000"
    echo ""
    echo -e "${GREEN}🎉 SUCCÈS ! Application démarrée${NC}"
    echo ""
    echo -e "${BLUE}📍 Accès:${NC}"
    echo "   🌐 Interface: http://localhost:3000"
    echo "   🔗 API:       http://localhost:5000"  
    echo "   👤 Login:     admin / Admin123!"
    echo ""
    echo -e "${BLUE}🔧 Commandes utiles:${NC}"
    echo "   📊 Logs: docker-compose logs -f"
    echo "   🔄 Restart: docker-compose restart"
    echo ""
else
    log_warning "⚠️ Frontend: compilation en cours..."
    echo ""
    echo -e "${YELLOW}⏳ Le frontend React peut prendre jusqu'à 5 minutes${NC}"
    echo ""
    echo -e "${BLUE}🔍 Pour diagnostiquer:${NC}"
    echo "   📊 Logs frontend: docker-compose logs -f frontend"
    echo "   🌐 Test direct: curl http://localhost:3000"
    echo ""
    echo -e "${BLUE}💡 Conseil: Attendez encore 2-3 minutes et testez http://localhost:3000${NC}"
fi

log_success "🚀 Démarrage rapide terminé !"
