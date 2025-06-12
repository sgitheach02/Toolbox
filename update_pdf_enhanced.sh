#!/bin/bash

echo "🎨 PACHA TOOLBOX - ENHANCED PDF + PREVIEW"
echo "========================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info "Implémentation des fonctionnalités Enhanced PDF + Preview..."

# 1. Sauvegarde
log_info "Sauvegarde des fichiers actuels..."
mkdir -p backup_enhanced_$(date +%Y%m%d_%H%M%S)
cp backend/main.py backend/requirements.txt frontend/src/App.js frontend/src/App.css backup_enhanced_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# 2. Arrêt des services
log_info "Arrêt des services..."
docker-compose down

# 3. Mise à jour du requirements.txt pour supporter PDF
log_info "Mise à jour des dépendances Python..."
cat > backend/requirements.txt << 'EOF'
# Requirements.txt Enhanced avec support PDF
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
requests==2.31.0
python-dateutil==2.8.2
psutil==5.9.5

# Support PDF et templates
Jinja2==3.1.2
EOF

# 4. Mise à jour du Dockerfile pour installer wkhtmltopdf
log_info "Mise à jour du Dockerfile avec wkhtmltopdf..."
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

# Installation des outils système incluant wkhtmltopdf
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nmap \
    netcat-openbsd \
    wkhtmltopdf \
    xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Création des répertoires
RUN mkdir -p /app/reports /app/reports/pdf /app/logs /app/data /app/temp

# Variables d'environnement
ENV PYTHONPATH=/app
ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Commande de démarrage
CMD ["python", "main.py"]
EOF

# 5. Instructions pour copier les artifacts
log_warning "📋 ÉTAPES MANUELLES REQUISES:"
echo ""
echo "   1. Copiez le contenu de l'artifact 'enhanced_reports_backend' dans:"
echo "      backend/main.py"
echo ""
echo "   2. Copiez le contenu de l'artifact 'enhanced_frontend_with_pdf' dans:"
echo "      frontend/src/App.js"
echo ""
echo "   3. Copiez le contenu de l'artifact CSS mis à jour dans:"
echo "      frontend/src/App.css"
echo ""

read -p "Appuyez sur Entrée quand les fichiers sont copiés..."

# 6. Reconstruction et démarrage
log_info "Reconstruction des images Docker avec support PDF..."
docker-compose build --no-cache

log_info "Démarrage des services Enhanced..."
docker-compose up -d

# 7. Attente du démarrage
log_info "Attente du démarrage des services..."
sleep 25

# 8. Vérifications
log_info "Vérification des services..."

# Test API Enhanced
log_info "Test de l'API Enhanced..."
for i in {1..30}; do
    health_response=$(curl -s http://localhost:5000/api/health 2>/dev/null)
    if echo "$health_response" | grep -q "PDF_Export"; then
        log_success "API Enhanced avec support PDF opérationnelle !"
        break
    else
        echo -n "."
        sleep 2
    fi
done

# Test des nouvelles fonctionnalités
echo ""
log_info "Test des nouvelles fonctionnalités..."

# Test des types de scans
echo "🧪 Test types de scans:"
curl -s http://localhost:5000/api/scan/types | jq '.scan_types.nmap | keys' 2>/dev/null && log_success "Types de scans OK" || log_warning "Types de scans - vérification manuelle"

# Test scan avec génération de rapport
echo ""
echo "🧪 Test scan avec génération de rapport Enhanced:"
scan_result=$(curl -s -X POST http://localhost:5000/api/scan/nmap \
    -H "Content-Type: application/json" \
    -d '{"target":"127.0.0.1","scan_type":"ports"}' 2>/dev/null)

if echo "$scan_result" | grep -q "report_filename"; then
    log_success "Génération de rapport HTML OK"
    
    # Extraction du nom du rapport
    report_filename=$(echo "$scan_result" | jq -r '.report_filename' 2>/dev/null)
    
    if [ "$report_filename" != "null" ] && [ -n "$report_filename" ]; then
        echo "   📄 Rapport généré: $report_filename"
        
        # Test de prévisualisation
        echo "🧪 Test prévisualisation:"
        preview_status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5000/api/reports/preview/$report_filename" 2>/dev/null)
        if [ "$preview_status" = "200" ]; then
            log_success "Prévisualisation HTML OK"
        else
            log_warning "Prévisualisation - vérification manuelle"
        fi
        
        # Test conversion PDF
        echo "🧪 Test conversion PDF:"
        pdf_result=$(curl -s -X POST http://localhost:5000/api/reports/convert-to-pdf \
            -H "Content-Type: application/json" \
            -d "{\"html_filename\":\"$report_filename\"}" 2>/dev/null)
        
        if echo "$pdf_result" | grep -q "pdf_filename"; then
            log_success "Conversion PDF OK"
            pdf_filename=$(echo "$pdf_result" | jq -r '.pdf_filename' 2>/dev/null)
            echo "   📄 PDF généré: $pdf_filename"
        else
            log_warning "Conversion PDF - vérification manuelle"
        fi
    fi
else
    log_warning "Génération de rapport - vérification manuelle"
fi

# Test liste des rapports
echo ""
echo "🧪 Test liste des rapports Enhanced:"
reports_response=$(curl -s http://localhost:5000/api/reports/list 2>/dev/null)
if echo "$reports_response" | grep -q "reports"; then
    total_reports=$(echo "$reports_response" | jq '.total' 2>/dev/null)
    log_success "Liste des rapports OK ($total_reports rapports)"
else
    log_warning "Liste des rapports - vérification manuelle"
fi

# Test frontend
echo ""
echo "🧪 Test Frontend Enhanced:"
frontend_status=$(curl -s -w "%{http_code}" http://localhost:3000 -o /dev/null 2>/dev/null)
if [ "$frontend_status" = "200" ]; then
    log_success "Frontend Enhanced accessible"
else
    log_warning "Frontend - vérification manuelle"
fi

# 9. Résumé final
echo ""
log_success "🎉 IMPLÉMENTATION ENHANCED PDF TERMINÉE !"
echo ""
echo "📍 Nouvelles fonctionnalités disponibles:"
echo "   ✅ Rapports HTML professionnels avec design moderne"
echo "   ✅ Génération automatique de PDF (wkhtmltopdf)"
echo "   ✅ Prévisualisation HTML intégrée (modal)"
echo "   ✅ Interface à onglets améliorée"
echo "   ✅ Actions multiples par rapport (HTML/PDF)"
echo "   ✅ Conversion HTML→PDF à la demande"
echo "   ✅ Badges de formats et métadonnées"
echo ""
echo "🔗 URLs d'accès:"
echo "   • Frontend Enhanced: http://localhost:3000"
echo "   • API Health: http://localhost:5000/api/health"
echo "   • Types de scans: http://localhost:5000/api/scan/types"
echo "   • Liste rapports: http://localhost:5000/api/reports/list"
echo ""
echo "🎯 Test complet recommandé:"
echo "   1. Ouvrir http://localhost:3000"
echo "   2. Onglet 'Nouveau Scan' → Sélectionner 'Nmap' > 'Scan de Ports'"
echo "   3. Cible: 127.0.0.1 → Lancer le scan"
echo "   4. Onglet 'Historique' → Voir le scan avec badges HTML/PDF"
echo "   5. Cliquer 'Aperçu' → Modal de prévisualisation"
echo "   6. Cliquer 'Créer PDF' → Conversion automatique"
echo "   7. Onglet 'Rapports' → Voir tous les rapports avec actions"
echo "   8. Télécharger HTML et PDF"
echo ""
echo "🛠️ APIs Enhanced disponibles:"
echo "   • GET  /api/reports/preview/{filename} - Prévisualisation"
echo "   • GET  /api/reports/download/pdf/{filename} - Téléchargement PDF"
echo "   • POST /api/reports/convert-to-pdf - Conversion HTML→PDF"
echo "   • POST /api/reports/bulk-convert - Conversion en lot"
echo ""
echo "📊 Vérification du status:"

# Status final
api_status=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if echo "$api_status" | grep -q "PDF_Export"; then
    echo -e "   API Enhanced: ${GREEN}✅ Opérationnelle avec PDF${NC}"
else
    echo -e "   API Enhanced: ${RED}❌ Problème détecté${NC}"
fi

frontend_check=$(curl -s -w "%{http_code}" http://localhost:3000 -o /dev/null 2>/dev/null)
if [ "$frontend_check" = "200" ]; then
    echo -e "   Frontend Enhanced: ${GREEN}✅ Opérationnel${NC}"
else
    echo -e "   Frontend Enhanced: ${RED}❌ Problème détecté${NC}"
fi

# Vérification wkhtmltopdf dans le conteneur
echo ""
echo "🔧 Vérification des outils:"
docker-compose exec backend which wkhtmltopdf >/dev/null 2>&1 && \
    echo -e "   wkhtmltopdf: ${GREEN}✅ Installé${NC}" || \
    echo -e "   wkhtmltopdf: ${RED}❌ Non installé${NC}"

echo ""
echo "📝 Logs en temps réel:"
echo "   docker-compose logs -f"
echo ""
echo "🚀 Prêt pour les tests Enhanced PDF + Preview !"
echo "   💡 Prochaine étape possible : Modules Reconnaissance, Exploitation, etc."
