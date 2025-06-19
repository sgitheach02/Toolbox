#!/bin/bash

echo "🧪 TESTS API PACHA TOOLBOX"
echo "=========================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"

test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-}
    
    echo -n "Testing $method $endpoint... "
    
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
        if [ "$endpoint" = "/health" ]; then
            echo "   Response: $(echo "$body" | jq -r '.message' 2>/dev/null || echo "$body" | head -c 50)..."
        fi
    else
        echo -e "${RED}❌ FAIL${NC} ($http_code)"
        echo "   Error: $(echo "$body" | head -c 100)..."
    fi
    
    echo ""
}

echo "🔍 Vérification des services..."
echo ""

# Test 1: Health check
echo "1. Health Check"
test_endpoint "/health"

# Test 2: Test endpoint
echo "2. Test Endpoint"
test_endpoint "/test"

# Test 3: Test POST
echo "3. Test POST"
test_endpoint "/test" "POST" '{"test":"frontend","timestamp":"'$(date -Iseconds)'"}'

# Test 4: Scan Nmap
echo "4. Scan Nmap"
test_endpoint "/scan/nmap" "POST" '{"target":"127.0.0.1","args":"-sn"}'

# Test 5: Scan Nikto
echo "5. Scan Nikto"  
test_endpoint "/scan/nikto" "POST" '{"target":"127.0.0.1"}'

# Test 6: Frontend accessibility
echo "6. Frontend Access"
echo -n "Testing frontend accessibility... "
frontend_response=$(curl -s -w "%{http_code}" "$FRONTEND_URL" -o /dev/null)
if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} ($frontend_response)"
else
    echo -e "${RED}❌ FAIL${NC} ($frontend_response)"
fi
echo ""

# Test 7: CORS
echo "7. CORS Test"
echo -n "Testing CORS headers... "
cors_response=$(curl -s -I -H "Origin: http://localhost:3000" "$API_URL/health" | grep -i "access-control-allow-origin")
if [ -n "$cors_response" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   CORS: $cors_response"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   No CORS headers found"
fi
echo ""

# Résumé
echo "📊 RÉSUMÉ DES TESTS"
echo "=================="
echo ""
echo "🔗 URLs de test:"
echo "   Backend API: $API_URL"
echo "   Frontend: $FRONTEND_URL"
echo "   Health: $API_URL/health"
echo ""
echo "🚀 Test manuel complet:"
echo "   1. Ouvrir http://localhost:3000"
echo "   2. Vérifier le status API (doit être vert)"
echo "   3. Cliquer sur 'Test API'"
echo "   4. Lancer un scan Nmap sur 127.0.0.1"
echo "   5. Vérifier que les résultats apparaissent"
echo ""
echo "📝 Logs en temps réel:"
echo "   docker-compose logs -f"
echo ""
echo "🔧 Dépannage:"
echo "   - Si API ne répond pas: docker-compose restart backend"
echo "   - Si Frontend ne charge pas: docker-compose restart frontend"
echo "   - Si CORS errors: vérifier les origins dans main.py"
