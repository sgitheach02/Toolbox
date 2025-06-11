from flask import Flask, send_file, jsonify, request
from flask_cors import CORS
import os
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS ULTRA PERMISSIF - Pour éliminer tout problème CORS
CORS(app, 
     origins="*",
     methods="*", 
     allow_headers="*",
     supports_credentials=False,
     send_wildcard=True)

# Middleware pour debug et CORS manuel
@app.before_request
def before_request():
    logger.info(f"🌐 {request.method} {request.url} from {request.remote_addr}")
    
    # CORS préflight
    if request.method == "OPTIONS":
        logger.info("🔄 Requête OPTIONS (preflight)")
        response = jsonify({'status': 'preflight ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response

@app.after_request
def after_request(response):
    # Headers CORS pour toutes les réponses
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

# Création des répertoires
os.makedirs('/app/reports', exist_ok=True)
os.makedirs('/app/data', exist_ok=True)
os.makedirs('/app/logs', exist_ok=True)

# Import et enregistrement des routes avec gestion d'erreurs
def register_routes():
    """Enregistrement sécurisé des routes"""
    try:
        from app.routes.scan import scan_bp
        app.register_blueprint(scan_bp, url_prefix="/api/scan")
        logger.info("✅ Routes scan chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes scan: {e}")

    try:
        from app.routes.dashboard import dashboard_bp
        app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
        logger.info("✅ Routes dashboard chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes dashboard: {e}")

    try:
        from app.routes.reports import reports_bp
        app.register_blueprint(reports_bp, url_prefix="/api/reports")
        logger.info("✅ Routes reports chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes reports: {e}")

    try:
        from app.routes.reconnaissance import recon_bp
        app.register_blueprint(recon_bp, url_prefix="/api/recon")
        logger.info("✅ Routes reconnaissance chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes reconnaissance: {e}")

    try:
        from app.routes.exploitation import exploit_bp
        app.register_blueprint(exploit_bp, url_prefix="/api/exploit")
        logger.info("✅ Routes exploitation chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes exploitation: {e}")

    try:
        from app.routes.network import network_bp
        app.register_blueprint(network_bp, url_prefix="/api/network")
        logger.info("✅ Routes network chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes network: {e}")

    try:
        from app.routes.bruteforce import bruteforce_bp
        app.register_blueprint(bruteforce_bp, url_prefix="/api/bruteforce")
        logger.info("✅ Routes bruteforce chargées")
    except Exception as e:
        logger.error(f"❌ Erreur routes bruteforce: {e}")

# Chargement des routes
logger.info("🔧 Chargement des routes...")
register_routes()

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    """Test de santé avec méthodes multiples"""
    logger.info("💚 Health check appelé")
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_endpoint():
    """Endpoint de test simple"""
    logger.info("🧪 Test endpoint appelé")
    
    data = {
        'message': 'Test endpoint fonctionnel',
        'method': request.method,
        'timestamp': datetime.now().isoformat()
    }
    
    if request.method == 'POST':
        try:
            json_data = request.get_json()
            data['received_data'] = json_data
        except:
            data['received_data'] = 'No JSON data'
    
    return jsonify(data)

@app.route('/api/download/<filename>')
def download_file(filename):
    """Téléchargement des rapports"""
    try:
        safe_filename = os.path.basename(filename)
        file_path = os.path.join('/app/reports', safe_filename)
        
        logger.info(f"📥 Download: {file_path}")
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Fichier non trouvé'}), 404
            
        return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
    except Exception as e:
        logger.error(f"❌ Erreur download: {e}")
        return jsonify({'error': str(e)}), 500

# Route racine pour debug
@app.route('/')
def root():
    return jsonify({
        'message': 'Pacha Toolbox API',
        'status': 'running',
        'endpoints': [
            '/api/health',
            '/api/test', 
            '/api/scan/*',
            '/api/recon/*',
            '/api/exploit/*',
            '/api/reports/*'
        ]
    })

# Gestion d'erreurs
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"❌ 404: {request.url}")
    return jsonify({
        'error': 'Endpoint non trouvé',
        'url': request.url,
        'method': request.method
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ 500: {error}")
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend")
    logger.info(f"🌐 CORS: Toutes origines autorisées")
    logger.info(f"📁 Reports: /app/reports")
    
    # Test de connectivité interne
    logger.info("🧪 Test des routes importées...")
    with app.test_client() as client:
        response = client.get('/api/health')
        logger.info(f"✅ Health check interne: {response.status_code}")
    
app.run(host="0.0.0.0", port=5000, debug=True)

try:
    from app.routes.scan import scan_bp
    app.register_blueprint(scan_bp, url_prefix="/api/scan")
    logger.info("✅ Routes scan chargées")
except Exception as e:
    logger.error(f"❌ Erreur routes scan: {e}")
    