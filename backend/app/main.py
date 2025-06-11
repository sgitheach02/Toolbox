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

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'pacha-toolbox-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Configuration CORS très permissive pour corriger les problèmes
CORS(app, 
     origins="*",  # Autoriser toutes les origines
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=False)

# Middleware pour gérer les requêtes OPTIONS
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Création des répertoires nécessaires
os.makedirs('/app/data', exist_ok=True)
os.makedirs('/app/reports', exist_ok=True)
os.makedirs('/app/temp', exist_ok=True)
os.makedirs('/app/logs', exist_ok=True)

# Import des routes essentielles
from app.routes.scan import scan_bp
from app.routes.reports import reports_bp

app.register_blueprint(scan_bp, url_prefix="/api/scan")
app.register_blueprint(reports_bp, url_prefix="/api/reports")

logging.info("✅ Routes essentielles chargées")

# Routes optionnelles
optional_routes = [
    ("app.routes.wireshark", "wireshark_bp", "/api/wireshark"),
    ("app.routes.metasploit", "metasploit_bp", "/api/metasploit"),
    ("app.routes.openvas", "openvas_bp", "/api/openvas")
]

for module_name, blueprint_name, url_prefix in optional_routes:
    try:
        module = __import__(module_name, fromlist=[blueprint_name])
        blueprint = getattr(module, blueprint_name)
        app.register_blueprint(blueprint, url_prefix=url_prefix)
        logging.info(f"✅ Routes {blueprint_name} chargées")
    except Exception as e:
        logging.warning(f"⚠️ Routes {blueprint_name} non disponibles: {e}")

@app.route('/api/health')
def health_check():
    """Point de contrôle de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'message': 'API Pacha Toolbox fonctionnelle'
    })

@app.route('/api/download/<path:filename>')
def download_file(filename):
    """Téléchargement sécurisé des fichiers de rapport"""
    try:
        safe_filename = os.path.basename(filename)
        file_path = os.path.join('/app/reports', safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Fichier non trouvé'}), 404
            
        if not os.path.commonpath(['/app/reports', file_path]) == '/app/reports':
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
    except Exception as e:
        logging.error(f"Erreur téléchargement: {str(e)}")
        return jsonify({'error': 'Erreur lors du téléchargement'}), 500

@app.route('/api/targets')
def get_targets():
    """Liste des cibles disponibles pour les tests"""
    return jsonify({
        'targets': [
            {
                'name': 'DVWA (Damn Vulnerable Web App)',
                'host': 'dvwa',
                'ip': '172.18.0.x',
                'ports': [80],
                'description': 'Application web intentionnellement vulnérable',
                'recommended_for': ['nmap', 'openvas', 'wireshark']
            },
            {
                'name': 'Metasploitable 2',
                'host': 'metasploitable',
                'ip': '172.18.0.x',
                'ports': [22, 21, 80, 443, 3306],
                'description': 'VM Linux avec vulnérabilités multiples',
                'recommended_for': ['nmap', 'metasploit', 'openvas']
            },
            {
                'name': 'Backend Local',
                'host': 'backend',
                'ip': '172.18.0.x',
                'ports': [5000],
                'description': 'API Backend Pacha Toolbox',
                'recommended_for': ['nmap', 'wireshark']
            },
            {
                'name': 'Localhost',
                'host': '127.0.0.1',
                'ip': '127.0.0.1',
                'ports': [5000],
                'description': 'Machine locale',
                'recommended_for': ['nmap']
            }
        ]
    })

# Test de connectivité réseau
@app.route('/api/network/test')
def network_test():
    """Test de connectivité réseau vers les cibles"""
    import subprocess
    
    targets = ['dvwa', 'metasploitable', 'backend', '127.0.0.1']
    results = {}
    
    for target in targets:
        try:
            # Ping test
            result = subprocess.run(['ping', '-c', '1', '-W', '2', target], 
                                  capture_output=True, text=True, timeout=5)
            results[target] = {
                'reachable': result.returncode == 0,
                'response_time': 'N/A'
            }
        except:
            results[target] = {
                'reachable': False,
                'response_time': 'N/A'
            }
    
    return jsonify({'network_test': results})

# Gestion des erreurs
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint non trouvé'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == "__main__":
    logging.info("🚀 Démarrage de Pacha Toolbox Backend")
    app.run(host="0.0.0.0", port=5000, debug=True)