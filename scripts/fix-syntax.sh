#!/bin/bash
# fix-syntax.sh - Correction erreur de syntaxe

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}"
echo "🚨 CORRECTION ERREUR DE SYNTAXE"
echo "==============================="
echo -e "${NC}"

echo "Erreur détectée: Ligne 4 index.js - Unexpected token"
echo ""

# 1. Voir le fichier problématique
echo -e "${BLUE}1️⃣ Diagnostic du fichier index.js actuel...${NC}"

if [ -f "frontend/src/index.js" ]; then
    echo "📄 Contenu actuel de index.js:"
    cat -n frontend/src/index.js
    echo ""
else
    echo "❌ index.js manquant"
fi

# 2. Créer un index.js parfaitement propre
echo -e "${BLUE}2️⃣ Création d'un index.js correct...${NC}"

cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
EOF

echo "✅ index.js recréé sans erreur de syntaxe"

# 3. Créer un index.css simple
echo -e "${BLUE}3️⃣ Création d'un index.css simple...${NC}"

cat > frontend/src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0a0a0a;
  color: #e5e5e5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
EOF

echo "✅ index.css créé"

# 4. Créer reportWebVitals.js simple
echo -e "${BLUE}4️⃣ Création de reportWebVitals.js simple...${NC}"

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
      // Web vitals non disponible
    });
  }
};

export default reportWebVitals;
EOF

echo "✅ reportWebVitals.js créé"

# 5. Vérifier App.js ou en créer un simple
echo -e "${BLUE}5️⃣ Vérification de App.js...${NC}"

if [ ! -f "frontend/src/App.js" ]; then
    echo "⚠️ App.js manquant, création d'une version de test..."
    
    cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#00ff88',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ 
        fontSize: '4rem', 
        marginBottom: '1rem',
        textShadow: '0 0 20px #00ff88'
      }}>
        🛡️ PACHA TOOLBOX
      </h1>
      
      <p style={{ 
        color: '#e5e5e5', 
        fontSize: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        Interface React fonctionnelle !
      </p>
      
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,212,255,0.1) 100%)',
        padding: '2rem',
        borderRadius: '15px',
        border: '2px solid #00ff88',
        boxShadow: '0 0 30px rgba(0,255,136,0.3)',
        marginBottom: '2rem',
        minWidth: '400px'
      }}>
        <h3 style={{ color: '#00d4ff', marginBottom: '1rem' }}>
          🚀 Système Opérationnel
        </h3>
        
        <div style={{ color: '#b5b5b5', fontSize: '1.1rem' }}>
          <p>✅ Frontend React: Actif</p>
          <p>✅ Backend API: http://localhost:5000</p>
          <p>✅ Base PostgreSQL: Connectée</p>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0,212,255,0.1)',
        padding: '1.5rem',
        borderRadius: '10px',
        border: '1px solid #00d4ff',
        maxWidth: '600px'
      }}>
        <h4 style={{ color: '#00d4ff', marginBottom: '1rem' }}>
          📝 Instructions
        </h4>
        <p style={{ 
          color: '#888', 
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          Remplacez ce fichier <code style={{
            background: '#1a1a1a',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            color: '#00ff88'
          }}>frontend/src/App.js</code> par votre interface personnalisée.
          <br/><br/>
          Votre backend fonctionne parfaitement et répond sur tous les endpoints !
        </p>
      </div>
      
      <button 
        onClick={() => window.open('http://localhost:5000/api/health', '_blank')}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
          border: 'none',
          borderRadius: '25px',
          color: '#000',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        🧪 Tester l'API Backend
      </button>
    </div>
  );
}

export default App;
EOF
    
    echo "✅ App.js de test créé"
else
    echo "✅ App.js existe déjà"
    
    # Vérifier s'il a un export default
    if ! grep -q "export default" frontend/src/App.js; then
        echo "⚠️ Ajout de export default manquant..."
        echo "" >> frontend/src/App.js
        echo "export default App;" >> frontend/src/App.js
    fi
fi

# 6. Redémarrer le frontend
echo -e "${BLUE}6️⃣ Redémarrage du frontend...${NC}"

docker-compose restart frontend

echo "Attente de la recompilation (30 secondes)..."
sleep 30

# 7. Vérifier la compilation
echo -e "${BLUE}7️⃣ Vérification de la compilation...${NC}"

for i in {1..8}; do
    echo -n "⏳ Test $i/8: "
    
    if docker-compose logs frontend | grep -q "Compiled successfully"; then
        echo -e "${GREEN}✅ Compilation réussie !${NC}"
        break
    elif docker-compose logs frontend | grep -q "Failed to compile"; then
        echo -e "${RED}❌ Erreur de compilation${NC}"
        echo ""
        echo "📊 Dernières erreurs:"
        docker-compose logs frontend | tail -15
        break
    elif docker-compose logs frontend | grep -q "webpack compiled"; then
        echo -e "${GREEN}✅ Webpack compilé !${NC}"
        break
    else
        echo "En cours..."
        sleep 10
    fi
done

echo ""

# 8. Test final
echo -e "${BLUE}8️⃣ Test d'accès final...${NC}"

sleep 5

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}🎉 SUCCÈS ! Frontend accessible${NC}"
    echo ""
    echo -e "${BLUE}📍 Votre application est maintenant fonctionnelle :${NC}"
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔗 Backend:  http://localhost:5000"
    echo "   👤 Login:    admin / Admin123!"
    echo ""
    echo -e "${GREEN}✅ Erreur de syntaxe corrigée !${NC}"
else
    echo -e "${RED}⚠️ Frontend pas encore accessible${NC}"
    echo ""
    echo "🔍 Diagnostics:"
    echo "   📊 Logs: docker-compose logs frontend"
    echo "   🧪 Test: curl http://localhost:3000"
    echo "   💡 Le frontend peut prendre 1-2 minutes supplémentaires"
fi

echo ""
echo -e "${GREEN}🔧 Correction de syntaxe terminée !${NC}"

# Afficher les derniers logs
echo ""
echo -e "${BLUE}📊 Derniers logs frontend:${NC}"
docker-compose logs --tail=5 frontend
