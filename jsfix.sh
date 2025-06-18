#!/bin/bash
# fix-react-display.sh - Correction affichage React

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🔧 CORRECTION AFFICHAGE REACT"
echo "============================="
echo -e "${NC}"

echo -e "${YELLOW}Problème: Backend fonctionne mais interface React invisible${NC}"
echo "Solution: Vérification et correction des fichiers React"
echo ""

# 1. Vérifier la structure des fichiers
echo -e "${BLUE}1️⃣ Diagnostic de la structure React...${NC}"

echo "📁 Structure actuelle:"
ls -la frontend/src/ 2>/dev/null || echo "❌ Dossier frontend/src manquant"

echo ""
echo "🔍 Contenu de App.js:"
if [ -f "frontend/src/App.js" ]; then
    echo "✅ App.js existe"
    head -10 frontend/src/App.js
    echo "..."
else
    echo "❌ App.js manquant"
fi

echo ""

# 2. Vérifier les logs frontend
echo -e "${BLUE}2️⃣ Logs frontend React...${NC}"
echo "Dernières erreurs de compilation:"
docker-compose logs frontend | tail -20

echo ""

# 3. Corriger index.js pour être sûr
echo -e "${BLUE}3️⃣ Correction de index.js...${NC}"

cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';  // Import par défaut
import reportWebVitals from './reportWebVitals';

// Configuration API globale
window.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
EOF

echo "✅ index.js corrigé"

# 4. Vérifier le nom d'export dans App.js
echo -e "${BLUE}4️⃣ Vérification App.js...${NC}"

if [ -f "frontend/src/App.js" ]; then
    # Vérifier s'il y a un export default
    if grep -q "export default" frontend/src/App.js; then
        echo "✅ App.js a un export default"
        
        # Extraire le nom du composant exporté
        COMPONENT_NAME=$(grep "export default" frontend/src/App.js | sed 's/.*export default //' | sed 's/;//' | tr -d ' ')
        echo "📤 Composant exporté: $COMPONENT_NAME"
        
        # Si ce n'est pas "App", on corrige
        if [ "$COMPONENT_NAME" != "App" ]; then
            echo "⚠️ Le composant s'appelle '$COMPONENT_NAME', pas 'App'"
            echo "Correction de index.js pour importer le bon nom..."
            
            # Corriger l'import dans index.js
            sed -i "s/import App from/import $COMPONENT_NAME as App from/" frontend/src/index.js
        fi
    else
        echo "❌ App.js n'a pas d'export default"
        echo "Ajout d'un export default..."
        
        # Chercher le nom du composant principal
        MAIN_COMPONENT=$(grep -o "function [A-Za-z][A-Za-z0-9]*\|const [A-Za-z][A-Za-z0-9]* =" frontend/src/App.js | head -1 | awk '{print $2}' | sed 's/=//')
        
        if [ -n "$MAIN_COMPONENT" ]; then
            echo "export default $MAIN_COMPONENT;" >> frontend/src/App.js
            echo "✅ Export default ajouté pour $MAIN_COMPONENT"
        fi
    fi
else
    echo "❌ App.js manquant, création d'un fichier de test..."
    
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
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🛡️ PACHA TOOLBOX
      </h1>
      <p style={{ color: '#e5e5e5', fontSize: '1.2rem', marginBottom: '2rem' }}>
        Interface React chargée avec succès !
      </p>
      <div style={{ 
        background: 'rgba(0, 255, 136, 0.1)', 
        padding: '1rem', 
        borderRadius: '10px',
        border: '1px solid #00ff88'
      }}>
        <p style={{ color: '#b5b5b5', margin: 0 }}>
          Backend API: {window.API_BASE_URL || 'http://localhost:5000/api'}
        </p>
      </div>
      <p style={{ 
        color: '#888', 
        fontSize: '0.9rem', 
        marginTop: '2rem',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        Remplacez ce fichier frontend/src/App.js par votre interface personnalisée.<br/>
        Votre backend fonctionne parfaitement !
      </p>
    </div>
  );
}

export default App;
EOF
    echo "✅ App.js de test créé"
fi

# 5. Redémarrer le frontend
echo -e "${BLUE}5️⃣ Redémarrage du frontend...${NC}"

docker-compose restart frontend

echo "Attente de la recompilation React..."
sleep 15

# 6. Vérifier la compilation
echo -e "${BLUE}6️⃣ Vérification compilation...${NC}"

for i in {1..10}; do
    echo -n "⏳ Test $i/10: "
    
    # Vérifier si React a compilé avec succès
    if docker-compose logs frontend | grep -q "Compiled successfully"; then
        echo "✅ Compilation réussie"
        break
    elif docker-compose logs frontend | grep -q "Failed to compile"; then
        echo "❌ Erreur de compilation"
        echo ""
        echo "📊 Erreurs React:"
        docker-compose logs frontend | grep -A 5 -B 5 "Failed to compile"
        break
    else
        echo "En cours..."
        sleep 10
    fi
done

echo ""

# 7. Test d'accès
echo -e "${BLUE}7️⃣ Test d'accès...${NC}"

# Test HTTP
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Port 3000 accessible"
    
    # Vérifier le contenu
    CONTENT=$(curl -s http://localhost:3000)
    if echo "$CONTENT" | grep -q "PACHA"; then
        echo "✅ Contenu React détecté"
    else
        echo "⚠️ Contenu inattendu sur port 3000"
    fi
else
    echo "❌ Port 3000 inaccessible"
fi

# 8. Instructions finales
echo ""
echo -e "${BLUE}📋 Résultats:${NC}"

echo ""
echo "🌐 URLs de test:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000/api/health"

echo ""
echo "🔍 Si le problème persiste:"
echo "   1. Vérifiez: docker-compose logs frontend"
echo "   2. Testez: curl http://localhost:3000"
echo "   3. Ouvrez: http://localhost:3000 dans votre navigateur"

echo ""
echo "💡 Votre App.js personnalisé:"
echo "   - Assurez-vous qu'il a 'export default NomDuComposant'"
echo "   - Vérifiez qu'il n'y a pas d'erreurs de syntaxe"
echo "   - Le composant doit être une fonction React valide"

echo ""
echo -e "${GREEN}🔧 Correction terminée !${NC}"

# Afficher les derniers logs pour diagnostic
echo ""
echo -e "${BLUE}📊 Derniers logs frontend:${NC}"
docker-compose logs --tail=10 frontend
