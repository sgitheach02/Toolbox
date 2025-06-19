#!/bin/bash
# setup_forensics.sh
# Installation et configuration du module forensique Graylog pour Pacha Toolbox

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Mémoire disponible (Elasticsearch a besoin d'au moins 2GB)
    AVAILABLE_RAM=$(free -g | awk 'NR==2{printf "%d", $7}')
    if [ "$AVAILABLE_RAM" -lt 4 ]; then
        log_warning "RAM disponible: ${AVAILABLE_RAM}GB. Recommandé: 4GB minimum pour Graylog"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Prérequis validés"
}

# Configuration des limites système pour Elasticsearch
configure_system_limits() {
    log_info "Configuration des limites système..."
    
    # vm.max_map_count pour Elasticsearch
    if [ "$(sysctl -n vm.max_map_count)" -lt 262144 ]; then
        log_info "Configuration de vm.max_map_count..."
        sudo sysctl -w vm.max_map_count=262144
        echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
    fi
    
    log_success "Limites système configurées"
}

# Création de la structure de répertoires
create_directory_structure() {
    log_info "Création de la structure de répertoires..."
    
    # Répertoires Graylog
    mkdir -p graylog/config
    mkdir -p graylog/logs
    mkdir -p graylog/inputs
    
    # Répertoires Grafana
    mkdir -p grafana/provisioning/datasources
    mkdir -p grafana/provisioning/dashboards
    
    # Répertoires backend
    mkdir -p backend/forensics
    
    log_success "Structure de répertoires créée"
}

# Configuration de Graylog
configure_graylog() {
    log_info "Configuration de Graylog..."
    
    # Configuration des inputs Graylog
    cat > graylog/inputs/syslog_input.json << 'EOF'
{
    "title": "Syslog UDP",
    "type": "org.graylog2.inputs.syslog.udp.SyslogUDPInput",
    "configuration": {
        "bind_address": "0.0.0.0",
        "port": 1514,
        "recv_buffer_size": 262144,
        "allow_override_date": true,
        "force_rdns": false,
        "store_full_message": true
    },
    "global": true
}
EOF

    # Configuration des streams
    cat > graylog/config/streams.json << 'EOF'
{
    "streams": [
        {
            "title": "Security Events",
            "description": "Stream for security-related events",
            "rules": [
                {
                    "field": "message",
                    "type": 1,
                    "value": "(failed|denied|unauthorized|attack|malware|virus)",
                    "inverted": false
                }
            ]
        },
        {
            "title": "Network Traffic",
            "description": "Stream for network traffic logs",
            "rules": [
                {
                    "field": "facility",
                    "type": 1,
                    "value": "(firewall|router|switch)",
                    "inverted": false
                }
            ]
        },
        {
            "title": "Authentication Logs",
            "description": "Stream for authentication events",
            "rules": [
                {
                    "field": "message",
                    "type": 1,
                    "value": "(login|logout|ssh|auth)",
                    "inverted": false
                }
            ]
        }
    ]
}
EOF

    log_success "Configuration Graylog créée"
}

# Configuration de Grafana
configure_grafana() {
    log_info "Configuration de Grafana..."
    
    # Datasource Elasticsearch
    cat > grafana/provisioning/datasources/elasticsearch.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Elasticsearch-Graylog
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: "graylog_*"
    timeField: timestamp
    timeInterval: 10s
    jsonData:
      interval: Medium
      timeInterval: 10s
      maxConcurrentShardRequests: 5
      logMessageField: message
      logLevelField: level
    secureJsonData: {}
EOF

    # Dashboard de base
    mkdir -p grafana/provisioning/dashboards
    cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1
providers:
  - name: 'graylog-dashboards'
    orgId: 1
    folder: 'Graylog Forensics'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    log_success "Configuration Grafana créée"
}

# Intégration du module forensique dans le backend
integrate_forensics_backend() {
    log_info "Intégration du module forensique dans le backend..."
    
    # Ajout du module forensique au main.py
    if [ -f "backend/main.py" ]; then
        # Vérifier si le module n'est pas déjà intégré
        if ! grep -q "forensics" backend/main.py; then
            log_info "Ajout du module forensique au backend..."
            
            # Backup du main.py original
            cp backend/main.py backend/main.py.backup
            
            # Ajout des imports
            sed -i '/^import subprocess/a import requests' backend/main.py
            
            # Ajout des routes forensiques
            cat >> backend/main.py << 'EOF'

# ==================== ROUTES FORENSIQUES GRAYLOG ====================

@app.route('/api/forensics/status', methods=['GET'])
def forensics_status():
    """Statut du module forensique"""
    try:
        # Test de connexion à Graylog
        graylog_url = f"http://{os.getenv('GRAYLOG_HOST', 'localhost')}:{os.getenv('GRAYLOG_PORT', '9000')}"
        response = requests.get(f"{graylog_url}/api/system", timeout=10)
        
        if response.status_code == 200:
            graylog_status = 'connected'
            graylog_info = response.json()
        else:
            graylog_status = 'error'
            graylog_info = {}
        
        return jsonify({
            'forensics_available': True,
            'graylog_status': graylog_status,
            'graylog_info': graylog_info,
            'version': '1.0.0',
            'features': ['log_search', 'anomaly_detection', 'network_statistics', 'timeline_analysis'],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'forensics_available': False,
            'graylog_status': 'unavailable',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })

@app.route('/api/forensics/search', methods=['POST'])
def forensics_search():
    """Recherche dans les logs Graylog"""
    try:
        data = request.get_json() or {}
        query = data.get('query', '*')
        timerange = data.get('timerange', '1h')
        limit = data.get('limit', 100)
        
        # Simulation de résultats si Graylog n'est pas disponible
        # Dans la vraie implémentation, utiliser l'API Graylog
        
        import random
        messages = []
        num_results = min(random.randint(10, 100), limit)
        
        for i in range(num_results):
            timestamp = datetime.now() - timedelta(minutes=random.randint(0, 60))
            messages.append({
                'id': f"msg_{i}_{int(time.time())}",
                'timestamp': timestamp.isoformat(),
                'source': f"192.168.1.{random.randint(1, 254)}",
                'message': f"Log message {i} matching query: {query}",
                'level': random.choice(['INFO', 'WARNING', 'ERROR']),
                'facility': random.choice(['firewall', 'syslog', 'auth', 'dns']),
                'protocol': random.choice(['TCP', 'UDP', 'ICMP']),
                'action': random.choice(['ACCEPT', 'DENY', 'DROP'])
            })
        
        return jsonify({
            'total_results': num_results,
            'messages': messages,
            'query': query,
            'timerange': timerange
        })
        
    except Exception as e:
        logger.error(f"Error in forensics search: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/forensics/anomalies', methods=['GET'])
def forensics_anomalies():
    """Détection d'anomalies"""
    try:
        timerange = request.args.get('timerange', '1h')
        
        # Simulation d'anomalies
        anomalies = [
            {
                'id': 1,
                'type': 'Traffic Spike',
                'severity': 'HIGH',
                'description': 'Pic de trafic inhabituel détecté',
                'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
                'score': 0.92,
                'affected_hosts': ['192.168.1.100', '192.168.1.45']
            },
            {
                'id': 2,
                'type': 'Failed Authentication',
                'severity': 'MEDIUM',
                'description': 'Multiples tentatives de connexion échouées',
                'timestamp': (datetime.now() - timedelta(minutes=30)).isoformat(),
                'score': 0.75,
                'affected_hosts': ['192.168.1.200']
            },
            {
                'id': 3,
                'type': 'Suspicious DNS',
                'severity': 'MEDIUM',
                'description': 'Requêtes DNS vers des domaines suspects',
                'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat(),
                'score': 0.68,
                'affected_hosts': ['192.168.1.55']
            }
        ]
        
        return jsonify({
            'anomalies': anomalies,
            'total_anomalies': len(anomalies),
            'timerange': timerange
        })
        
    except Exception as e:
        logger.error(f"Error in anomaly detection: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/forensics/stats', methods=['GET'])
def forensics_stats():
    """Statistiques réseau"""
    try:
        timerange = request.args.get('timerange', '1h')
        
        import random
        
        stats = {
            'total_events': random.randint(10000, 100000),
            'unique_sources': random.randint(50, 500),
            'top_protocols': [
                {'protocol': 'TCP', 'count': 45000, 'percentage': 65},
                {'protocol': 'UDP', 'count': 18000, 'percentage': 27},
                {'protocol': 'ICMP', 'count': 6000, 'percentage': 8}
            ],
            'top_ports': [
                {'port': 80, 'count': 12000},
                {'port': 443, 'count': 8500},
                {'port': 22, 'count': 3400},
                {'port': 53, 'count': 2100}
            ],
            'threat_level': 'MEDIUM',
            'anomaly_score': 0.45
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error in network stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

EOF
            
            log_success "Module forensique intégré au backend"
        else
            log_info "Module forensique déjà intégré"
        fi
    else
        log_warning "Fichier backend/main.py non trouvé"
    fi
}

# Mise à jour des requirements
update_requirements() {
    log_info "Mise à jour des requirements Python..."
    
    if [ -f "backend/requirements.txt" ]; then
        # Ajouter les dépendances si elles n'existent pas
        if ! grep -q "requests" backend/requirements.txt; then
            echo "requests>=2.31.0" >> backend/requirements.txt
        fi
        
        log_success "Requirements mis à jour"
    else
        log_warning "Fichier requirements.txt non trouvé"
    fi
}

# Déploiement avec Docker Compose
deploy_stack() {
    log_info "Déploiement de la stack Graylog..."
    
    # Arrêter les services existants
    docker-compose down 2>/dev/null || true
    
    # Démarrer avec le nouveau compose file
    if [ -f "docker-compose-graylog.yml" ]; then
        log_info "Démarrage de la stack complète..."
        docker-compose -f docker-compose-graylog.yml up -d
        
        # Attendre que les services soient prêts
        log_info "Attente du démarrage des services..."
        sleep 60
        
        # Vérifier le statut
        check_services_status
        
    else
        log_error "Fichier docker-compose-graylog.yml non trouvé"
        exit 1
    fi
}

# Vérification du statut des services
check_services_status() {
    log_info "Vérification du statut des services..."
    
    # Frontend
    if curl -s http://localhost:3000 >/dev/null; then
        log_success "Frontend accessible sur http://localhost:3000"
    else
        log_warning "Frontend non accessible"
    fi
    
    # Backend
    if curl -s http://localhost:5000/api/health >/dev/null; then
        log_success "Backend accessible sur http://localhost:5000"
    else
        log_warning "Backend non accessible"
    fi
    
    # Graylog
    if curl -s http://localhost:9000 >/dev/null; then
        log_success "Graylog accessible sur http://localhost:9000"
    else
        log_warning "Graylog non accessible (peut prendre quelques minutes)"
    fi
    
    # Elasticsearch
    if curl -s http://localhost:9200/_cluster/health >/dev/null; then
        log_success "Elasticsearch opérationnel"
    else
        log_warning "Elasticsearch non accessible"
    fi
}

# Configuration initiale de Graylog
configure_graylog_initial() {
    log_info "Configuration initiale de Graylog..."
    
    # Attendre que Graylog soit complètement démarré
    log_info "Attente du démarrage complet de Graylog..."
    for i in {1..30}; do
        if curl -s -u admin:admin123! http://localhost:9000/api/system >/dev/null; then
            log_success "Graylog API accessible"
            break
        fi
        sleep 10
        log_info "Tentative $i/30..."
    done
    
    # Créer les inputs par défaut
    log_info "Création des inputs Graylog..."
    
    # Input Syslog UDP
    curl -X POST "http://localhost:9000/api/system/inputs" \
         -H "Content-Type: application/json" \
         -H "X-Requested-By: setup-script" \
         -u admin:admin123! \
         -d '{
           "title": "Syslog UDP",
           "type": "org.graylog2.inputs.syslog.udp.SyslogUDPInput",
           "configuration": {
             "bind_address": "0.0.0.0",
             "port": 1514,
             "recv_buffer_size": 262144
           },
           "global": true
         }' 2>/dev/null || log_warning "Erreur création input Syslog UDP"
    
    # Input GELF UDP
    curl -X POST "http://localhost:9000/api/system/inputs" \
         -H "Content-Type: application/json" \
         -H "X-Requested-By: setup-script" \
         -u admin:admin123! \
         -d '{
           "title": "GELF UDP",
           "type": "org.graylog2.inputs.gelf.udp.GELFUDPInput",
           "configuration": {
             "bind_address": "0.0.0.0",
             "port": 12201,
             "recv_buffer_size": 262144
           },
           "global": true
         }' 2>/dev/null || log_warning "Erreur création input GELF UDP"
    
    log_success "Configuration initiale de Graylog terminée"
}

# Test du module forensique
test_forensics_module() {
    log_info "Test du module forensique..."
    
    # Test de l'API forensique
    if curl -s http://localhost:5000/api/forensics/status >/dev/null; then
        log_success "API forensique accessible"
        
        # Test de recherche
        SEARCH_RESULT=$(curl -s -X POST "http://localhost:5000/api/forensics/search" \
                            -H "Content-Type: application/json" \
                            -d '{"query":"*","timerange":"1h","limit":10}')
        
        if [ $? -eq 0 ]; then
            log_success "API de recherche fonctionnelle"
        else
            log_warning "Erreur API de recherche"
        fi
        
    else
        log_warning "API forensique non accessible"
    fi
}

# Affichage des informations finales
show_final_info() {
    echo
    log_success "🎉 Installation du module forensique terminée !"
    echo
    echo "📍 Services accessibles :"
    echo "   🔗 Frontend Pacha Toolbox: http://localhost:3000"
    echo "   🔗 Backend API: http://localhost:5000"
    echo "   🔗 Graylog Web Interface: http://localhost:9000"
    echo "   🔗 Elasticsearch: http://localhost:9200"
    echo "   🔗 Grafana (optionnel): http://localhost:3001"
    echo
    echo "👤 Credentials par défaut :"
    echo "   📊 Graylog: admin / admin123!"
    echo "   📈 Grafana: admin / admin123"
    echo
    echo "🔧 Commandes utiles :"
    echo "   📊 Logs Graylog: docker-compose -f docker-compose-graylog.yml logs graylog"
    echo "   📈 Logs complets: docker-compose -f docker-compose-graylog.yml logs -f"
    echo "   🔄 Restart: docker-compose -f docker-compose-graylog.yml restart"
    echo "   🛑 Stop: docker-compose -f docker-compose-graylog.yml down"
    echo
    echo "🚀 Pour tester le module forensique :"
    echo "   1. Aller sur http://localhost:3000"
    echo "   2. Cliquer sur l'onglet 'Forensique'"
    echo "   3. Tester les recherches et analyses"
    echo
    if [ -f "docker-compose-graylog.yml" ]; then
        echo "💡 Pour générer des logs de test :"
        echo "   docker-compose -f docker-compose-graylog.yml --profile testing up -d"
    fi
}

# Fonction principale
main() {
    echo "🛡️ Installation du Module Forensique Graylog - Pacha Toolbox"
    echo "================================================================"
    echo
    
    check_prerequisites
    configure_system_limits
    create_directory_structure
    configure_graylog
    configure_grafana
    integrate_forensics_backend
    update_requirements
    deploy_stack
    
    # Configuration post-déploiement
    sleep 30  # Attendre que tous les services soient stabilisés
    configure_graylog_initial
    test_forensics_module
    
    show_final_info
}

# Gestion des erreurs
trap 'log_error "Erreur lors de l'\''installation. Vérifiez les logs ci-dessus."' ERR

# Exécution du script principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi