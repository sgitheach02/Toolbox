#!/bin/bash

echo "🔍 DIAGNOSTIC PACHA TOOLBOX"
echo "=========================="

echo ""
echo "📊 1. Statut des conteneurs:"
docker-compose ps

echo ""
echo "🌐 2. Test de connectivité réseau:"
echo "Ping backend depuis l'hôte:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "ÉCHEC"

echo ""
echo "Test direct backend:"
docker-compose exec backend curl -s http://localhost:5000/api/health 2>/dev/null || echo "Backend interne ÉCHEC"

echo ""
echo "📡 3. Ports en écoute:"
netstat -tlnp | grep -E ":(3000|5000|8080)" || ss -tlnp | grep -E ":(3000|5000|8080)"

echo ""
echo "🐳 4. Logs backend (dernières 10 lignes):"
docker-compose logs --tail=10 backend

echo ""
echo "🔧 5. Variables d'environnement frontend:"
docker-compose exec frontend env | grep -E "(REACT_APP|NODE)"

echo ""
echo "🌍 6. Test CURL direct:"
echo "GET /api/health:"
curl -v http://localhost:5000/api/health 2>&1 | head -20

echo ""
echo "POST /api/scan/nmap:"
curl -v -X POST -H "Content-Type: application/json" \
     -d '{"target":"127.0.0.1","args":"-sn"}' \
     http://localhost:5000/api/scan/nmap 2>&1 | head -20

echo ""
echo "🔍 7. Inspection réseau Docker:"
docker network ls
docker network inspect pacha-toolbox_pacha-net 2>/dev/null | grep -A 10 -B 5 "Containers" || echo "Réseau non trouvé"

echo ""
echo "✅ DIAGNOSTIC TERMINÉ"
echo "Si curl fonctionne mais pas le frontend, c'est un problème CORS/JavaScript"
echo "Si curl échoue, c'est un problème de conteneur/réseau"