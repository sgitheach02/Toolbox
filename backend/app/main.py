from flask import Flask, send_file, jsonify, request
from flask_cors import CORS
import os
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'app Flask
app = Flask(__name__)

# Configuration CORS ultra-permissive pour le développement
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
     supports_credentials=True)

# Création des répertoires nécessaires
directories = ['/app/reports', '/app/data', '/app/logs', '/app/temp']
for directory in directories:
    os.makedirs(directory, exist_ok=True)
    logger.info(f"📁 Répertoire créé/vérifié: {directory}")

# Middleware pour logging et CORS
@app.before_request
def before_request():
    logger.info(f"🌐 {request.method} {request.url} from {request.remote_addr}")
    
    # Gestion des requêtes OPTIONS (preflight CORS)
    if request.method == "OPTIONS":
        logger.info("🔄 Requête OPTIONS (preflight)")
        response = jsonify({'status': 'preflight ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response

@app.after_request
def after_request(response):
    """Headers CORS pour toutes les réponses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

def register_routes():
    """Enregistrement sécurisé de toutes les routes"""
    routes_registered = []
    
    # Routes principales
    route_configs = [
        ('app.routes.scan', 'scan_bp', '/api/scan'),
        ('app.routes.dashboard', 'dashboard_bp', '/api/dashboard'),
        ('app.routes.reports', 'reports_bp', '/api/reports'),
        ('app.routes.reconnaissance', 'recon_bp', '/api/recon'),
        ('app.routes.exploitation', 'exploit_bp', '/api/exploit'),
        ('app.routes.network', 'network_bp', '/api/network'),
        ('app.routes.bruteforce', 'bruteforce_bp', '/api/bruteforce'),
        ('app.routes.openvas', 'openvas_bp', '/api/openvas'),
    ]
    
    for module_name, blueprint_name, url_prefix in route_configs:
        try:
            module = __import__(module_name, fromlist=[blueprint_name])
            blueprint = getattr(module, blueprint_name)
            app.register_blueprint(blueprint, url_prefix=url_prefix)
            routes_registered.append(f"✅ {blueprint_name} -> {url_prefix}")
            logger.info(f"✅ Route chargée: {blueprint_name} -> {url_prefix}")
        except ImportError as e:
            logger.warning(f"⚠️ Module non trouvé: {module_name} - {e}")
        except AttributeError as e:
            logger.warning(f"⚠️ Blueprint non trouvé: {blueprint_name} - {e}")
        except Exception as e:
            logger.error(f"❌ Erreur chargement {module_name}: {e}")
    
    logger.info(f"📋 Routes enregistrées: {len(routes_registered)}")
    return routes_registered

# Chargement des routes
logger.info("🔧 Chargement des routes...")
registered_routes = register_routes()

# Routes de base
@app.route('/', methods=['GET'])
def root():
    """Route racine pour debug"""
    return jsonify({
        'message': 'Pacha Toolbox API v2.0',
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'routes_loaded': len(registered_routes),
        'available_endpoints': [
            '/api/health',
            '/api/test',
            '/api/scan/*',
            '/api/recon/*',
            '/api/exploit/*',
            '/api/reports/*',
            '/api/network/*',
            '/api/bruteforce/*',
            '/api/openvas/*'
        ]
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    """Endpoint de santé avec support multi-méthodes"""
    logger.info("💚 Health check appelé")
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat(),
        'routes_loaded': len(registered_routes)
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_endpoint():
    """Endpoint de test complet"""
    logger.info(f"🧪 Test endpoint appelé - {request.method}")
    
    data = {
        'message': 'Test endpoint fonctionnel',
        'method': request.method,
        'timestamp': datetime.now().isoformat(),
        'headers': dict(request.headers),
        'args': dict(request.args)
    }
    
    if request.method == 'POST':
        try:
            json_data = request.get_json()
            data['received_data'] = json_data or 'Pas de données JSON'
        except Exception as e:
            data['json_error'] = str(e)
    
    return jsonify(data)

@app.route('/api/status', methods=['GET'])
def api_status():
    """Status complet de l'API"""
    return jsonify({
        'api_version': '2.0.0',
        'status': 'operational',
        'routes_loaded': registered_routes,
        'directories': {
            'reports': os.path.exists('/app/reports'),
            'data': os.path.exists('/app/data'),
            'logs': os.path.exists('/app/logs'),
            'temp': os.path.exists('/app/temp')
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/download/<filename>')
def download_file(filename):
    """Téléchargement sécurisé des fichiers"""
    try:
        # Sécurisation du nom de fichier
        safe_filename = os.path.basename(filename)
        file_path = os.path.join('/app/reports', safe_filename)
        
        logger.info(f"📥 Demande de téléchargement: {file_path}")
        
        if not os.path.exists(file_path):
            logger.warning(f"❌ Fichier non trouvé: {file_path}")
            return jsonify({'error': 'Fichier non trouvé'}), 404
        
        return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement: {e}")
        return jsonify({'error': str(e)}), 500

# Gestion d'erreurs globale
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"❌ 404: {request.url}")
    return jsonify({
        'error': 'Endpoint non trouvé',
        'url': request.url,
        'method': request.method,
        'available_endpoints': [
            '/api/health',
            '/api/test',
            '/api/status',
            '/api/scan/*',
            '/api/recon/*',
            '/api/exploit/*'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ 500: {error}")
    return jsonify({
        'error': 'Erreur interne du serveur',
        'message': str(error)
    }), 500

@app.errorhandler(405)
def method_not_allowed(error):
    logger.warning(f"❌ 405: {request.method} not allowed for {request.url}")
    return jsonify({
        'error': 'Méthode non autorisée',
        'method': request.method,
        'url': request.url
    }), 405

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend v2.0")
    logger.info(f"🌐 CORS: Configuration permissive activée")
    logger.info(f"📁 Répertoires: {directories}")
    logger.info(f"📋 Routes chargées: {len(registered_routes)}")
    
    # Test de connectivité interne
    logger.info("🧪 Test des routes internes...")
    with app.test_client() as client:
        response = client.get('/api/health')
        logger.info(f"✅ Health check interne: {response.status_code}")
    
    # Démarrage du serveur
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)