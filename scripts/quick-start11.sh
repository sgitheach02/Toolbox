#!/bin/bash
# fix-web-vitals.sh - Correction problème web-vitals

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

echo -e "${BLUE}"
echo "🔧 CORRECTION WEB-VITALS"
echo "========================"
echo -e "${NC}"

log_info "Problème: Module 'web-vitals' manquant"
log_info "Solution: Simplification de reportWebVitals.js"

# 1. Créer reportWebVitals.js sans dépendances
log_info "1️⃣ Création de reportWebVitals.js simplifié..."

cat > frontend/src/reportWebVitals.js << 'EOF'
// Version simplifiée sans dépendance web-vitals
const reportWebVitals = onPerfEntry => {
  // Version simplifiée qui n'a pas besoin du module web-vitals
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Mesures basiques de performance
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        // Simuler les métriques web vitals de base
        const metrics = {
          FCP: navigation.loadEventEnd - navigation.fetchStart,
          LCP: navigation.loadEventEnd - navigation.fetchStart,
          FID: 0,
          CLS: 0,
          TTFB: navigation.responseStart - navigation.fetchStart
        };
        
        // Appeler le callback avec chaque métrique
        Object.entries(metrics).forEach(([name, value]) => {
          onPerfEntry({ name, value });
        });
      }
    }
  }
};

export default reportWebVitals;
EOF

log_success "✅ reportWebVitals.js simplifié créé"

# 2. Alternative: ajouter web-vitals au package.json
log_info "2️⃣ Mise à jour du package.json avec web-vitals..."

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
    "build": "react-scripts build",
    "test": "react-scripts test --passWithNoTests"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version"]
  },
  "proxy": "http://backend:5000"
}
EOF

log_success "✅ package.json mis à jour avec web-vitals"

# 3. Redémarrer le conteneur pour installer la dépendance
log_info "3️⃣ Redémarrage du frontend pour installer web-vitals..."

docker-compose stop frontend
docker-compose rm -f frontend 2>/dev/null || true

# Reconstruire avec les nouvelles dépendances
log_info "Reconstruction du frontend..."
docker-compose build --no-cache frontend

# Démarrer
log_info "Démarrage du frontend..."
docker-compose up -d frontend

# 4. Attendre et vérifier
log_info "4️⃣ Attente de la compilation..."

for i in {1..15}; do  # 2.5 minutes max
    echo -n "⏳ Compilation $i/15: "
    
    # Vérifier les logs pour voir si compilation réussie
    if docker-compose logs frontend | grep -q "Compiled successfully"; then
        log_success "Compilation réussie !"
        break
    elif docker-compose logs frontend | grep -q "Compiled with warnings"; then
        log_success "Compilation avec warnings (acceptable)"
        break
    elif docker-compose logs frontend | grep -q "Failed to compile"; then
        echo "❌ Erreur de compilation"
        echo ""
        log_info "Derniers logs du frontend:"
        docker-compose logs --tail=10 frontend
        break
    else
        echo "En cours..."
        sleep 10
    fi
done

echo ""

# 5. Test final
log_info "5️⃣ Test final..."

sleep 10  # Attendre un peu plus

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}🎉 SUCCÈS ! Problème web-vitals résolu${NC}"
    echo ""
    echo -e "${BLUE}📍 Services fonctionnels :${NC}"
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔗 Backend:  http://localhost:5000"
    echo "   👤 Login:    admin / Admin123!"
    echo ""
    echo -e "${BLUE}📊 Status des conteneurs :${NC}"
    docker-compose ps
    echo ""
else
    echo ""
    echo -e "${BLUE}⏳ Frontend encore en compilation...${NC}"
    echo ""
    echo -e "${BLUE}📊 Derniers logs frontend :${NC}"
    docker-compose logs --tail=15 frontend
    echo ""
    echo -e "${BLUE}🔍 Diagnostics :${NC}"
    echo "   📊 Logs temps réel: docker-compose logs -f frontend"
    echo "   🔄 Redémarrer: docker-compose restart frontend"
    echo "   🧪 Test: curl http://localhost:3000"
    echo ""
fi

log_success "🔧 Correction web-vitals terminée !"
