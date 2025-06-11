from flask import Flask, send_file, jsonify
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

# Configuration CORS
CORS(app, origins=["http://localhost:3000", "http://frontend:3000"])

# Création des répertoires nécessaires
os.makedirs('/app/data', exist_ok=True)
os.makedirs('/app/reports', exist_ok=True)
os.makedirs('/app/temp', exist_ok=True)
os.makedirs('/app/logs', exist_ok=True)

# Import des routes de base
try:
    from app.routes.scan import scan_bp
    app.register_blueprint(scan_bp, url_prefix="/api/scan")
    logging.info("✅ Routes scan chargées")
except Exception as e:
    logging.error(f"❌ Erreur routes scan: {e}")

try:
    from app.routes.reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    logging.info("✅ Routes reports chargées")
except Exception as e:
    logging.error(f"❌ Erreur routes reports: {e}")

# Routes optionnelles (qui peuvent échouer)
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
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0'
    }

@app.route('/api/download/<path:filename>')
def download_file(filename):
    """Téléchargement sécurisé des fichiers de rapport"""
    try:
        # Nettoyer le nom de fichier
        safe_filename = os.path.basename(filename)
        file_path = os.path.join('/app/reports', safe_filename)
        
        logging.info(f"Tentative téléchargement: {file_path}")
        
        # Vérifications de sécurité
        if not os.path.exists(file_path):
            logging.error(f"Fichier non trouvé: {file_path}")
            return {'error': 'Fichier non trouvé'}, 404
            
        if not os.path.commonpath(['/app/reports', file_path]) == '/app/reports':
            logging.error(f"Chemin non sécurisé: {file_path}")
            return {'error': 'Accès non autorisé'}, 403
        
        logging.info(f"✅ Téléchargement: {safe_filename}")
        return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
    except Exception as e:
        logging.error(f"Erreur téléchargement fichier {filename}: {str(e)}")
        return {'error': 'Erreur lors du téléchargement'}, 500

@app.route('/api/network/info')
def network_info():
    """Informations réseau pour aider avec les IPs"""
    try:
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Essayer de détecter l'IP du conteneur
        container_ip = "172.18.0.1"  # IP par défaut Docker
        try:
            import subprocess
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            if result.returncode == 0:
                ips = result.stdout.strip().split()
                if ips:
                    container_ip = ips[0]
        except:
            pass
        
        return {
            "hostname": hostname,
            "local_ip": local_ip,
            "container_ip": container_ip,
            "dvwa_suggested_ip": "172.18.0.1",  # IP réseau Docker
            "user_subnet": "172.29.103.151/20",
            "suggested_targets": [
                "127.0.0.1",
                "172.18.0.1",
                "172.29.103.151"
            ]
        }
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/reports/files')
def list_report_files():
    """Liste des fichiers de rapport avec informations détaillées"""
    try:
        reports_dir = '/app/reports'
        files = []
        
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                filepath = os.path.join(reports_dir, filename)
                if os.path.isfile(filepath):
                    stat = os.path.getsize(filepath)
                    files.append({
                        'filename': filename,
                        'size': stat,
                        'download_url': f'/api/download/{filename}'
                    })
        
        return {'files': files}
    except Exception as e:
        logging.error(f"Erreur liste fichiers: {str(e)}")
        return {'error': str(e)}, 500

if __name__ == "__main__":
    logging.info("🚀 Démarrage de Pacha Toolbox Backend")
    app.run(host="0.0.0.0", port=5000, debug=True)