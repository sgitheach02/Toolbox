#!/bin/bash

# Installation nikto réel dans le container existant
# Solution rapide sans rebuild

set -e

echo "🕷️ INSTALLATION NIKTO RÉEL"
echo "=========================="

# Vérifier que le container tourne
if ! docker ps | grep -q pacha-backend; then
    echo "❌ Container pacha-backend non démarré"
    echo "Démarrez d'abord: docker-compose up -d"
    exit 1
fi

echo "📦 Installation de nikto dans le container..."

# Installer nikto directement
docker exec -u root pacha-backend bash -c "
    echo '🔄 Mise à jour des paquets...'
    apt-get update -q

    echo '🕷️ Installation de nikto...'
    apt-get install -y nikto

    echo '🧹 Nettoyage...'
    apt-get clean
    rm -rf /var/lib/apt/lists/*

    echo '✅ Installation terminée'
"

# Vérifier l'installation
echo "🔍 Vérification de nikto..."
if docker exec pacha-backend nikto -Version > /dev/null 2>&1; then
    echo "✅ Nikto installé avec succès!"
    
    # Afficher la version
    version=$(docker exec pacha-backend nikto -Version 2>&1 | head -1)
    echo "📋 Version: $version"
else
    echo "❌ Problème avec l'installation de nikto"
    exit 1
fi

# Redémarrer le backend pour s'assurer que tout fonctionne
echo "🔄 Redémarrage du backend..."
docker-compose restart backend

echo "⏳ Attente du redémarrage (10 secondes)..."
sleep 10

# Test de l'API
echo "🏥 Test de l'API..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ API opérationnelle"
else
    echo "❌ Problème avec l'API"
    docker-compose logs backend --tail=5
    exit 1
fi

echo ""
echo "🎉 NIKTO INSTALLÉ ET PRÊT"
echo "========================="
echo ""
echo "✅ Nikto est maintenant installé dans le container"
echo "✅ Les scans Nikto utiliseront le vrai outil"
echo "✅ Plus de simulation - résultats authentiques"
echo ""
echo "🔗 Testez maintenant:"
echo "   1. Allez sur http://localhost:3000"
echo "   2. Onglet Nikto"
echo "   3. Target: https://testphp.vulnweb.com/"
echo "   4. Lancez un scan RÉEL !"
echo ""
echo "⚠️ Note: Cette installation persiste jusqu'au rebuild du container"
