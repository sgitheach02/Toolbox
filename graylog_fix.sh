#!/bin/bash
# Réparation Graylog - Version propre et méthodique

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔧 Réparation de la stack Graylog"
echo "================================="

# 1. Configuration système préalable
configure_system() {
    log_info "Configuration des paramètres système..."
    
    # vm.max_map_count pour Elasticsearch
    current_max_map=$(sysctl -n vm.max_map_count)
    if [ "$current_max_map" -lt 262144 ]; then
        log_info "Configuration de vm.max_map_count..."
        sudo sysctl -w vm.max_map_count=262144
        log_success "vm.max_map_count configuré à 262144"
    fi
}

# 2. Arrêt propre des services
stop_services() {
    log_info "Arrêt propre des services..."
    
    # Essayer d'abord avec le fichier graylog spécifique
    if [ -f "docker-compose-graylog.yml" ]; then
        docker-compose -f docker-compose-graylog.yml down 2>/dev/null || true
        log_info "Services Graylog arrêtés"
    fi
    
    # Puis le fichier principal
    if [ -f "docker-compose.yml" ]; then
        docker-compose down 2>/dev/null || true
        log_info "Services principaux arrêtés"
    fi
    
    # Nettoyer les conteneurs orphelins
    docker container prune -f >/dev/null 2>&1 || true
    
    log_success "Arrêt des services terminé"
}

# 3. Vérification des fichiers de configuration
check_config_files() {
    log_info "Vérification des fichiers de configuration..."
    
    if [ ! -f "docker-compose-graylog.yml" ]; then
        log_error "Fichier docker-compose-graylog.yml manquant"
        echo "Créez le fichier avec la configuration de la base de connaissances"
        exit 1
    fi
    
    log_success "Fichiers de configuration présents"
}

# 4. Démarrage ordonné des services
start_services() {
    log_info "Démarrage ordonné des services..."
    
    # MongoDB d'abord
    log_info "Démarrage de MongoDB..."
    docker-compose -f docker-compose-graylog.yml up -d mongodb
    sleep 15
    
    # Puis Elasticsearch
    log_info "Démarrage d'Elasticsearch..."
    docker-compose -f docker-compose-graylog.yml up -d elasticsearch
    
    # Attendre qu'Elasticsearch soit prêt
    log_info "Attente d'Elasticsearch..."
    for i in {1..30}; do
        if curl -s http://localhost:9200/_cluster/health >/dev/null 2>&1; then
            log_success "Elasticsearch opérationnel"
            break
        fi
        sleep 5
        echo -n "."
    done
    echo
    
    # Enfin Graylog
    log_info "Démarrage de Graylog..."
    docker-compose -f docker-compose-graylog.yml up -d graylog
    
    # Autres services
    log_info "Démarrage des autres services..."
    docker-compose -f docker-compose-graylog.yml up -d
    
    log_success "Tous les services démarrés"
}

# 5. Vérification du statut final
verify_services() {
    log_info "Vérification du statut des services..."
    
    sleep 30  # Laisser le temps aux services de démarrer
    
    # MongoDB
    if docker exec $(docker ps -q --filter "name=mongodb") mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        log_success "MongoDB opérationnel"
    else
        log_warning "MongoDB non accessible"
    fi
    
    # Elasticsearch
    if curl -s http://localhost:9200/_cluster/health >/dev/null 2>&1; then
        log_success "Elasticsearch opérationnel"
    else
        log_warning "Elasticsearch non accessible"
    fi
    
    # Graylog avec attente
    log_info "Attente de Graylog (peut prendre 2-3 minutes)..."
    for i in {1..60}; do
        if curl -s http://localhost:9000 >/dev/null 2>&1; then
            log_success "Graylog opérationnel sur http://localhost:9000"
            echo "🔑 Credentials: admin / admin123!"
            break
        fi
        sleep 5
        if [ $((i % 6)) -eq 0 ]; then
            echo -n " (${i}/60)"
        else
            echo -n "."
        fi
    done
    echo
    
    if ! curl -s http://localhost:9000 >/dev/null 2>&1; then
        log_warning "Graylog non accessible après 5 minutes"
        echo "Vérifiez les logs: docker-compose -f docker-compose-graylog.yml logs graylog"
    fi
}

# 6. Informations finales
show_info() {
    echo -e "\n📍 Services accessibles :"
    echo "   🔗 Graylog: http://localhost:9000 (admin/admin123!)"
    echo "   🔗 Elasticsearch: http://localhost:9200"
    echo "   🔗 Frontend: http://localhost:3000"
    echo "   🔗 Backend API: http://localhost:5000"
    
    echo -e "\n🔧 Commandes utiles :"
    echo "   📊 Logs Graylog: docker-compose -f docker-compose-graylog.yml logs graylog"
    echo "   🔄 Restart: docker-compose -f docker-compose-graylog.yml restart graylog"
    echo "   📈 Statut: docker-compose -f docker-compose-graylog.yml ps"
}

# Fonction principale
main() {
    configure_system
    stop_services
    check_config_files
    start_services
    verify_services
    show_info
    
    log_success "Réparation terminée !"
}

# Gestion des erreurs
trap 'log_error "Erreur lors de la réparation. Vérifiez les étapes ci-dessus."' ERR

# Exécution
main "$@"
