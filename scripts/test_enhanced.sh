#!/bin/bash

echo "🧪 TEST DES FONCTIONNALITÉS ENHANCED"
echo "===================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"

test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local data=${4:-}
    
    echo -n "🔍 Testing $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ OK${NC} ($http_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($http_code)"
        echo "   Error: $(echo "$body" | head -c 100)..."
        return 1
    fi
}

test_download() {
    echo -n "🔍 Testing report download... "
    
    # Récupérer la liste des rapports
    reports_response=$(curl -s "$API_URL/reports/list")
    
    if echo "$reports_response" | jq -e '.reports[0].filename' > /dev/null 2>&1; then
        filename=$(echo "$reports_response" | jq -r '.reports[0].filename')
        
        # Tester le téléchargement
        download_response=$(curl -s -w "%{http_code}" -o /tmp/test_report.html "$API_URL/reports/download/$filename")
        
        if [ "$download_response" = "200" ] && [ -f "/tmp/test_report.html" ] && [ -s "/tmp/test_report.html" ]; then
            echo -e "${GREEN}✅ OK${NC} (Fichier téléchargé: $(wc -c < /tmp/test_report.html) bytes)"
            rm -f /tmp/test_report.html
        else
            echo -e "${RED}❌ FAIL${NC} (Download failed or empty file)"
        fi
    else
        echo -e "${YELLOW}⚠️ SKIP${NC} (Aucun rapport disponible)"
    fi
}

echo ""
echo "🔍 Tests des nouvelles API..."
echo ""

# Test 1: Types de scans
echo "1. Types de scans disponibles"
if test_endpoint "Scan Types" "/scan/types"; then
    # Afficher un aperçu des types
    types_response=$(curl -s "$API_URL/scan/types")
    nmap_types=$(echo "$types_response" | jq -r '.scan_types.nmap | keys | length' 2>/dev/null || echo "N/A")
    nikto_types=$(echo "$types_response" | jq -r '.scan_types.nikto | keys | length' 2>/dev/null || echo "N/A")
    echo "   📊 Nmap: $nmap_types types, Nikto: $nikto_types types"
fi
echo ""

# Test 2: Scan avec type spécifique
echo "2. Scan Nmap avec type 'ports'"
test_endpoint "Nmap Ports Scan" "/scan/nmap" "POST" '{"target":"127.0.0.1","scan_type":"ports"}'
echo ""

# Test 3: Scan Nikto avec type
echo "3. Scan Nikto avec type 'comprehensive'"
test_endpoint "Nikto Comprehensive" "/scan/nikto" "POST" '{"target":"127.0.0.1","scan_type":"comprehensive"}'
echo ""

# Test 4: Historique des scans
echo "4. Historique des scans"
if test_endpoint "Scans History" "/scans/history"; then
    history_response=$(curl -s "$API_URL/scans/history")
    total_scans=$(echo "$history_response" | jq -r '.total' 2>/dev/null || echo "N/A")
    echo "   📊 Total scans en historique: $total_scans"
fi
echo ""

# Test 5: Liste des rapports
echo "5. Liste des rapports"
if test_endpoint "Reports List" "/reports/list"; then
    reports_response=$(curl -s "$API_URL/reports/list")
    total_reports=$(echo "$reports_response" | jq -r '.total' 2>/dev/null || echo "N/A")
    echo "   📊 Total rapports disponibles: $total_reports"
    
    # Afficher les 3 premiers rapports
    if [ "$total_reports" != "0" ] && [ "$total_reports" != "N/A" ]; then
        echo "   📄 Derniers rapports:"
        echo "$reports_response" | jq -r '.reports[0:3][] | "     - \(.filename) (\(.size) bytes)"' 2>/dev/null || echo "     Erreur parsing JSON"
    fi
fi
echo ""

# Test 6: Téléchargement de rapport
echo "6. Téléchargement de rapport"
test_download
echo ""

# Test 7: Scan avec arguments personnalisés
echo "7. Scan avec arguments personnalisés"
test_endpoint "Custom Args Scan" "/scan/nmap" "POST" '{"target":"127.0.0.1","scan_type":"basic","args":"-sn -v"}'
echo ""

# Test 8: Frontend accessibility
echo "8. Accessibilité Frontend"
echo -n "🔍 Testing frontend... "
frontend_response=$(curl -s -w "%{http_code}" "$FRONTEND_URL" -o /dev/null)
if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} ($frontend_response)"
else
    echo -e "${RED}❌ FAIL${NC} ($frontend_response)"
fi
echo ""

# Test 9: Test complet de workflow
echo "9. Test de workflow complet"
echo "   🔍 Lancement de 3 scans différents pour tester l'historique..."

# Scan 1: Nmap basic
curl -s -X POST -H "Content-Type: application/json" \
    -d '{"target":"127.0.0.1","scan_type":"basic"}' \
    "$API_URL/scan/nmap" > /dev/null

# Scan 2: Nmap services
curl -s -X POST -H "Content-Type: application/json" \
    -d '{"target":"127.0.0.1","scan_type":"services"}' \
    "$API_URL/scan/nmap" > /dev/null

# Scan 3: Nikto fast
curl -s -X POST -H "Content-Type: application/json" \
    -d '{"target":"127.0.0.1","scan_type":"fast"}' \
    "$API_URL/scan/nikto" > /dev/null

sleep 2

# Vérifier l'historique
final_history=$(curl -s "$API_URL/scans/history")
final_count=$(echo "$final_history" | jq -r '.total' 2>/dev/null || echo "0")
final_reports=$(curl -s "$API_URL/reports/list")
reports_count=$(echo "$final_reports" | jq -r '.total' 2>/dev/null || echo "0")

echo "   📊 Résultat: $final_count scans dans l'historique, $reports_count rapports générés"

if [ "$final_count" -ge "3" ] && [ "$reports_count" -ge "3" ]; then
    echo -e "   ${GREEN}✅ Workflow complet OK${NC}"
else
    echo -e "   ${YELLOW}⚠️ Workflow partiel${NC}"
fi
echo ""

# Résumé final
echo "📊 RÉSUMÉ DES TESTS ENHANCED"
echo "============================"
echo ""
echo "✅ Fonctionnalités testées:"
echo "   • Types de scans sélectionnables"
echo "   • Génération automatique de rapports"
echo "   • Téléchargement de rapports"
echo "   • Historique des scans"
echo "   • Arguments personnalisés"
echo "   • Interface web responsive"
echo ""
echo "🔗 URLs pour tests manuels:"
echo "   • Frontend: $FRONTEND_URL"
echo "   • Types de scans: $API_URL/scan/types"
echo "   • Historique: $API_URL/scans/history"
echo "   • Rapports: $API_URL/reports/list"
echo ""
echo "🎯 Test manuel recommandé:"
echo "   1. Ouvrir http://localhost:3000"
echo "   2. Tester les différents types de scans"
echo "   3. Naviguer entre les onglets"
echo "   4. Télécharger un rapport"
echo "   5. Vérifier la prévisualisation"
echo ""
echo "📊 État final:"
final_status_code=$(curl -s -w "%{http_code}" "$API_URL/health" -o /dev/null)
if [ "$final_status_code" = "200" ]; then
    echo -e "   API Status: ${GREEN}✅ Opérationnelle${NC}"
else
    echo -e "   API Status: ${RED}❌ Problème${NC}"
fi

frontend_status_code=$(curl -s -w "%{http_code}" "$FRONTEND_URL" -o /dev/null)
if [ "$frontend_status_code" = "200" ]; then
    echo -e "   Frontend Status: ${GREEN}✅ Opérationnel${NC}"
else
    echo -e "   Frontend Status: ${RED}❌ Problème${NC}"
fi

echo ""
echo "🚀 Prêt pour l'implémentation des modules suivants !"
echo "   💡 Prochaine étape : Module Reconnaissance, Exploitation, etc."
