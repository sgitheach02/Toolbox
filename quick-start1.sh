#!/bin/bash
# fix-frontend-files.sh - Correction des fichiers frontend

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

echo -e "${BLUE}"
echo "🔧 CORRECTION FICHIERS FRONTEND"
echo "==============================="
echo -e "${NC}"

log_info "Problème détecté: CSS mélangé dans index.js"
log_info "Création des fichiers corrects..."

# 1. Créer index.js correct (SEULEMENT JavaScript)
log_info "1️⃣ Création de index.js (JavaScript uniquement)..."

cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PachaPentestSuite from './App.js';
import reportWebVitals from './reportWebVitals';

// Configuration API
window.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PachaPentestSuite />
  </React.StrictMode>
);

reportWebVitals();
EOF

log_success "✅ index.js créé (JavaScript pur)"

# 2. Créer index.css correct (SEULEMENT CSS)
log_info "2️⃣ Création de index.css (CSS uniquement)..."

cat > frontend/src/index.css << 'EOF'
/* Reset et styles de base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0a0a0a;
  color: #e5e5e5;
  overflow-x: hidden;
}

code {
  font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
}

/* Variables CSS pour la cohérence */
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --bg-accent: #3a3a3a;
  
  --text-primary: #e5e5e5;
  --text-secondary: #b5b5b5;
  --text-muted: #888888;
  
  --accent-primary: #00ff88;
  --accent-secondary: #00d4ff;
  
  --status-success: #22c55e;
  --status-warning: #eab308;
  --status-error: #dc2626;
  --status-info: #3b82f6;
  
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

/* Styles globaux */
.pacha-app {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-accent);
  border-radius: var(--border-radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

/* Focus styles pour l'accessibilité */
*:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Animations communes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

/* Utilitaires */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-mono { font-family: 'Fira Code', monospace; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

.w-full { width: 100%; }
.h-full { height: 100%; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }

.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }

.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }

/* Styles responsifs */
@media (max-width: 768px) {
  body {
    font-size: 13px;
  }
  
  .pacha-app {
    padding: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  body {
    font-size: 12px;
  }
}

/* Print styles */
@media print {
  * {
    background: white !important;
    color: black !important;
  }
  
  .no-print {
    display: none !important;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
EOF

log_success "✅ index.css créé (CSS pur)"

# 3. Créer reportWebVitals.js correct
log_info "3️⃣ Création de reportWebVitals.js..."

cat > frontend/src/reportWebVitals.js << 'EOF'
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // Web vitals non disponible, pas grave
      console.log('Web Vitals non disponible');
    });
  }
};

export default reportWebVitals;
EOF

log_success "✅ reportWebVitals.js créé"

# 4. Vérifier que App.js existe
log_info "4️⃣ Vérification de App.js..."

if [ -f "frontend/src/App.js" ]; then
    log_success "✅ App.js existe (votre interface)"
else
    log_info "⚠️ App.js manquant, création d'un fichier de base..."
    cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      color: '#e5e5e5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ color: '#00ff88', fontSize: '2rem', marginBottom: '1rem' }}>
        🛡️ Pacha Security Toolbox
      </h1>
      <p style={{ color: '#b5b5b5' }}>
        Frontend démarré avec succès !
      </p>
      <p style={{ color: '#888888', fontSize: '0.9rem', marginTop: '1rem' }}>
        Remplacez ce fichier App.js par votre interface personnalisée
      </p>
    </div>
  );
}

export default App;
EOF
    log_success "✅ App.js de base créé"
fi

# 5. Redémarrer le frontend
log_info "5️⃣ Redémarrage du frontend..."

docker-compose restart frontend

log_info "Attente de la recompilation React..."

# Attendre que React recompile
sleep 20

# 6. Vérification
log_info "6️⃣ Vérification..."

for i in {1..12}; do  # 2 minutes max
    echo -n "⏳ Test $i/12: "
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend accessible !"
        break
    else
        echo "Pas encore prêt..."
        sleep 10
    fi
done

echo ""
echo ""

# Test final
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 CORRECTION RÉUSSIE !${NC}"
    echo ""
    echo -e "${BLUE}📍 Services fonctionnels :${NC}"
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔗 Backend:  http://localhost:5000"
    echo "   👤 Login:    admin / Admin123!"
    echo ""
    echo -e "${BLUE}💡 Prochaine étape :${NC}"
    echo "   Remplacez frontend/src/App.js par votre interface React"
    echo ""
else
    echo -e "${BLUE}⏳ Frontend en cours de compilation...${NC}"
    echo ""
    echo -e "${BLUE}📊 Pour diagnostiquer :${NC}"
    echo "   Logs: docker-compose logs -f frontend"
    echo "   Test: curl http://localhost:3000"
    echo ""
    echo -e "${BLUE}💡 Le frontend peut prendre 2-3 minutes à compiler${NC}"
fi

log_success "🔧 Correction des fichiers terminée !"
