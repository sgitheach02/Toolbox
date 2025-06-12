# backend/main.py - Point d'entrée principal
import os
import sys
import logging
from datetime import datetime

# Ajout du répertoire app au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from flask import Flask, jsonify, request
from flask_cors import CORS

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'application Flask
app = Flask(__name__)

# Configuration CORS permissive
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Création des répertoires nécessaires
directories = ['/app/reports', '/app/logs', '/app/data', '/app/temp']
for directory in directories:
    os.makedirs(directory, exist_ok=True)
    logger.info(f"📁 Répertoire vérifié: {directory}")

def register_routes():
    """Chargement sécurisé des routes existantes"""
    routes_loaded = []
    
    try:
        # Import des routes existantes selon votre architecture
        from app.routes.reconnaissance import recon_bp
        app.register_blueprint(recon_bp, url_prefix="/api/recon")
        routes_loaded.append("recon")
    except Exception as e:
        logger.warning(f"Route recon non chargée: {e}")
    
    try:
        from app.routes.exploitation import exploit_bp
        app.register_blueprint(exploit_bp, url_prefix="/api/exploit")
        routes_loaded.append("exploit")
    except Exception as e:
        logger.warning(f"Route exploit non chargée: {e}")
    
    try:
        from app.routes.network import network_bp
        app.register_blueprint(network_bp, url_prefix="/api/network")
        routes_loaded.append("network")
    except Exception as e:
        logger.warning(f"Route network non chargée: {e}")
    
    try:
        from app.routes.bruteforce import bruteforce_bp
        app.register_blueprint(bruteforce_bp, url_prefix="/api/bruteforce")
        routes_loaded.append("bruteforce")
    except Exception as e:
        logger.warning(f"Route bruteforce non chargée: {e}")

    try:
        from app.routes.reports import reports_bp
        app.register_blueprint(reports_bp, url_prefix="/api/reports")
        routes_loaded.append("reports")
    except Exception as e:
        logger.warning(f"Route reports non chargée: {e}")

    try:
        from app.routes.dashboard import dashboard_bp
        app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
        routes_loaded.append("dashboard")
    except Exception as e:
        logger.warning(f"Route dashboard non chargée: {e}")

    try:
        from app.routes.scan import scan_bp
        app.register_blueprint(scan_bp, url_prefix="/api/scan")
        routes_loaded.append("scan")
    except Exception as e:
        logger.warning(f"Route scan non chargée: {e}")

    return routes_loaded

# Chargement des routes
logger.info("🔧 Chargement des routes...")
loaded_routes = register_routes()
logger.info(f"📋 Routes chargées: {loaded_routes}")

# Routes de base essentielles
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0',
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'routes_loaded': loaded_routes
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    logger.info("💚 Health check appelé")
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat(),
        'routes_loaded': loaded_routes
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_endpoint():
    logger.info(f"🧪 Test endpoint - {request.method}")
    data = {
        'message': 'Test endpoint fonctionnel',
        'method': request.method,
        'timestamp': datetime.now().isoformat()
    }
    if request.method == 'POST' and request.get_json():
        data['received_data'] = request.get_json()
    return jsonify(data)

# Routes de fallback pour tests rapides
@app.route('/api/scan/<tool>', methods=['POST', 'OPTIONS'])
def fallback_scan(tool):
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    
    result = {
        'status': 'completed',
        'tool': tool,
        'target': target,
        'timestamp': datetime.now().isoformat(),
        'message': f'Scan {tool} simulé (en développement)',
        'results': {
            'simulation': True,
            'ports': ['22/tcp', '80/tcp', '443/tcp'] if tool == 'nmap' else [],
            'vulnerabilities': ['Test vuln 1', 'Test vuln 2'] if tool == 'nikto' else []
        }
    }
    
    logger.info(f"🔍 Scan {tool} simulé pour {target}")
    return jsonify(result)

# Gestion d'erreurs
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'available_endpoints': [
            '/api/health',
            '/api/test',
            '/api/scan/*'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur 500: {error}")
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend v2.0")
    logger.info(f"🌐 CORS configuré pour localhost:3000")
    logger.info(f"📁 Répertoires créés: {directories}")
    logger.info(f"📋 Routes chargées: {loaded_routes}")
    
    # Test de santé interne
    with app.test_client() as client:
        response = client.get('/api/health')
        logger.info(f"✅ Health check interne: {response.status_code}")
    
    # Démarrage du serveur
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)