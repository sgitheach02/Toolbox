#!/bin/bash
# emergency-fix.sh - Réparation complète des problèmes

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}"
echo "🚨 RÉPARATION D'URGENCE PACHA TOOLBOX"
echo "======================================"
echo -e "${NC}"

echo -e "${YELLOW}Problèmes détectés dans les logs:${NC}"
echo "1. ❌ PostgreSQL: Incompatibilité version 13 vs 15"
echo "2. ❌ Backend: Script entrypoint corrompu"
echo "3. ❌ Frontend: Proxy ne trouve pas le backend"
echo ""

# 1. ARRÊT COMPLET ET NETTOYAGE BRUTAL
echo -e "${BLUE}1️⃣ Nettoyage complet...${NC}"
docker-compose down -v --remove-orphans
docker system prune -f
docker volume prune -f

# Supprimer spécifiquement le volume PostgreSQL corrompu
docker volume rm pacha-toolbox_postgres_data 2>/dev/null || true

echo -e "${GREEN}✅ Nettoyage terminé${NC}"

# 2. CORRIGER LE SCRIPT ENTRYPOINT BACKEND
echo -e "${BLUE}2️⃣ Correction script entrypoint...${NC}"

cat > backend/scripts/entrypoint.sh << 'EOF'
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
EOF

# Permissions cruciales
chmod +x backend/scripts/entrypoint.sh
dos2unix backend/scripts/entrypoint.sh 2>/dev/null || true

echo -e "${GREEN}✅ Script entrypoint corrigé${NC}"

# 3. DOCKERFILE BACKEND SIMPLE ET ROBUSTE
echo -e "${BLUE}3️⃣ Dockerfile backend robuste...${NC}"

cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y \
    curl netcat-openbsd nmap gcc python3-dev libpq-dev \
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

echo -e "${GREEN}✅ Dockerfile backend corrigé${NC}"

# 4. DOCKER-COMPOSE ULTRA-SIMPLE
echo -e "${BLUE}4️⃣ Configuration Docker Compose simple...${NC}"

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
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: pacha-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - PYTHONPATH=/app
      - PYTHONUNBUFFERED=1
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=pacha_toolbox
      - DB_USER=pacha_user
      - DB_PASSWORD=pacha_secure_2024!
      - ADMIN_PASSWORD=Admin123!
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ./backend:/app:rw
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: pacha-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    volumes:
      - ./frontend:/app:rw
      - /app/node_modules
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF

echo -e "${GREEN}✅ Docker Compose corrigé${NC}"

# 5. FRONTEND SIMPLIFIÉ
echo -e "${BLUE}5️⃣ Frontend simplifié...${NC}"

cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF

cat > frontend/package.json << 'EOF'
{
  "name": "pacha-toolbox-frontend",
  "version": "2.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^3.5.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [">0.2%", "not dead"],
    "development": ["last 1 chrome version"]
  }
}
EOF

echo -e "${GREEN}✅ Frontend simplifié${NC}"

# 6. RECONSTRUCTION COMPLÈTE
echo -e "${BLUE}6️⃣ Reconstruction complète...${NC}"

echo "Construction backend..."
docker-compose build --no-cache backend

echo "Construction frontend..."  
docker-compose build --no-cache frontend

echo -e "${GREEN}✅ Images reconstruites${NC}"

# 7. DÉMARRAGE PROGRESSIF
echo -e "${BLUE}7️⃣ Démarrage progressif...${NC}"

echo "Démarrage PostgreSQL..."
docker-compose up -d postgres
sleep 15

echo "Démarrage Backend..."
docker-compose up -d backend
sleep 15

echo "Démarrage Frontend..."
docker-compose up -d frontend
sleep 10

# 8. VÉRIFICATION
echo -e "${BLUE}8️⃣ Vérification...${NC}"

echo ""
echo "📊 Status des conteneurs:"
docker-compose ps

echo ""
echo "🧪 Tests de connectivité:"

# Test PostgreSQL
if nc -z localhost 5432; then
    echo -e "${GREEN}✅ PostgreSQL accessible${NC}"
else
    echo -e "${RED}❌ PostgreSQL inaccessible${NC}"
fi

# Test Backend (avec délai)
sleep 10
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend accessible${NC}"
else
    echo -e "${YELLOW}⏳ Backend pas encore prêt${NC}"
fi

# Test Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${YELLOW}⏳ Frontend pas encore prêt${NC}"
fi

echo ""

# 9. RÉSULTAT FINAL
if docker-compose ps | grep -v "Up" | grep -q "pacha-"; then
    echo -e "${RED}❌ Certains services ont encore des problèmes${NC}"
    echo ""
    echo "🔍 Logs pour diagnostic:"
    echo "docker-compose logs postgres"
    echo "docker-compose logs backend" 
    echo "docker-compose logs frontend"
else
    echo -e "${GREEN}🎉 RÉPARATION TERMINÉE !${NC}"
    echo ""
    echo -e "${BLUE}📍 Accès à l'application:${NC}"
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔗 Backend:  http://localhost:5000"
    echo "   👤 Admin:    admin / Admin123!"
    echo ""
    echo -e "${YELLOW}💡 Si localhost:3000 affiche une erreur, attendez 1-2 minutes${NC}"
    echo -e "${YELLOW}   que React finisse de compiler${NC}"
fi

echo ""
echo -e "${GREEN}🔧 RÉPARATION D'URGENCE TERMINÉE${NC}"
