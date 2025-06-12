# backend/main.py - Version améliorée avec rapports et types de scans
import os
import sys
import logging
import json
import uuid
import subprocess
from datetime import datetime
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import xml.etree.ElementTree as ET

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'application Flask
app = Flask(__name__)

# Configuration CORS permissive pour le développement
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://frontend:3000"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Création des répertoires nécessaires
directories = ['/app/reports', '/app/logs', '/app/data', '/app/temp']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Configuration des types de scans
SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Scan Basique",
            "description": "Détection d'hôtes actifs",
            "args": "-sn",
            "icon": "🔍"
        },
        "ports": {
            "name": "Scan de Ports",
            "description": "Scan des ports les plus courants",
            "args": "-sS --top-ports 1000",
            "icon": "🔌"
        },
        "services": {
            "name": "Détection de Services",
            "description": "Identification des services et versions",
            "args": "-sV",
            "icon": "🛠️"
        },
        "stealth": {
            "name": "Scan Furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2",
            "icon": "🥷"
        },
        "aggressive": {
            "name": "Scan Agressif",
            "description": "Scan complet avec détection OS",
            "args": "-A -T4",
            "icon": "💥"
        },
        "vulnerability": {
            "name": "Détection Vulnérabilités",
            "description": "Scan avec scripts de vulnérabilités",
            "args": "--script vuln",
            "icon": "🛡️"
        }
    },
    "nikto": {
        "basic": {
            "name": "Scan Web Basique",
            "description": "Scan de vulnérabilités web standard",
            "args": "-h {target}",
            "icon": "🌐"
        },
        "comprehensive": {
            "name": "Scan Complet",
            "description": "Analyse approfondie avec tous les tests",
            "args": "-h {target} -C all",
            "icon": "🔬"
        },
        "fast": {
            "name": "Scan Rapide",
            "description": "Tests essentiels uniquement",
            "args": "-h {target} -T 2",
            "icon": "⚡"
        }
    }
}

# Stockage des scans
scans_history = []

def generate_scan_report(scan_data):
    """Génère un rapport de scan en HTML"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_id = str(uuid.uuid4())[:8]
    
    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport {scan_data['tool'].upper()} - {scan_data['target']}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto; 
            background: #1a1a2e; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border-radius: 15px;
            overflow: hidden;
        }}
        .banner {{
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            padding: 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        .banner h1 {{
            font-size: 2.5rem;
            color: #0a0a0a;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }}
        .banner .subtitle {{
            font-size: 1.2rem;
            color: #0a0a0a;
            opacity: 0.8;
        }}
        .report-header {{ 
            background: #16213e; 
            color: #00ff88; 
            padding: 2rem; 
            border-bottom: 3px solid #00ff88;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }}
        .info-card {{
            background: rgba(0, 255, 136, 0.1);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #00ff88;
        }}
        .results-section {{
            background: #1a1a2e;
            padding: 2rem;
        }}
        .results-section h3 {{
            color: #00ff88;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }}
        .result-item {{
            background: #0a0a0a;
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            border-left: 4px solid #00ff88;
        }}
        .footer {{
            background: #0a0a0a;
            padding: 2rem;
            text-align: center;
            color: #666;
        }}
        .download-info {{
            background: rgba(0, 212, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border: 1px solid #00d4ff;
        }}
        @media print {{
            body {{ background: white !important; color: black !important; }}
            .banner {{ background: #00ff88 !important; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="banner">
            <h1>🛡️ PACHA TOOLBOX</h1>
            <div class="subtitle">Professional Penetration Testing Suite</div>
        </div>
        
        <div class="report-header">
            <h2>{scan_data['scan_type_info']['icon']} Rapport {scan_data['tool'].upper()}</h2>
            <p><strong>Type:</strong> {scan_data['scan_type_info']['name']}</p>
            <p><strong>Description:</strong> {scan_data['scan_type_info']['description']}</p>
        </div>
        
        <div class="results-section">
            <div class="info-grid">
                <div class="info-card">
                    <strong>🎯 Cible:</strong><br>{scan_data['target']}
                </div>
                <div class="info-card">
                    <strong>🆔 Scan ID:</strong><br>{scan_data['scan_id']}
                </div>
                <div class="info-card">
                    <strong>⏰ Date:</strong><br>{scan_data['timestamp']}
                </div>
                <div class="info-card">
                    <strong>🔧 Arguments:</strong><br>{scan_data['args']}
                </div>
            </div>
            
            <h3>📊 Résultats</h3>
            <div class="result-item">
                <strong>Status:</strong> {scan_data['status']}
            </div>
            <div class="result-item">
                <strong>Message:</strong> {scan_data['message']}
            </div>
            
            {f'''<div class="result-item">
                <strong>Ports Ouverts:</strong><br>
                {', '.join(scan_data['results'].get('ports_open', []))}
            </div>''' if scan_data.get('results', {}).get('ports_open') else ''}
            
            {f'''<div class="result-item">
                <strong>Vulnérabilités:</strong><br>
                {', '.join(scan_data['results'].get('vulnerabilities', []))}
            </div>''' if scan_data.get('results', {}).get('vulnerabilities') else ''}
            
            <div class="download-info">
                <strong>📥 Fichier de Rapport:</strong><br>
                Nom: rapport_{scan_data['tool']}_{report_id}_{timestamp}.html<br>
                Généré: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}<br>
                ID: {report_id}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Rapport généré par Pacha Toolbox v2.0</strong></p>
            <p>Professional Penetration Testing Suite - Confidentiel</p>
            <p>© 2025 - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>"""
    
    # Sauvegarde du rapport
    report_filename = f"rapport_{scan_data['tool']}_{report_id}_{timestamp}.html"
    report_path = os.path.join('/app/reports', report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_filename, report_path

# Routes de base
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0',
        'status': 'running',
        'timestamp': datetime.now().isoformat()
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
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_endpoint():
    logger.info(f"🧪 Test endpoint - {request.method}")
    data = {
        'message': 'Test endpoint fonctionnel',
        'method': request.method,
        'timestamp': datetime.now().isoformat(),
        'success': True
    }
    if request.method == 'POST' and request.get_json():
        data['received_data'] = request.get_json()
    return jsonify(data)

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    """Retourne la liste des types de scans disponibles"""
    return jsonify({
        'scan_types': SCAN_TYPES,
        'message': 'Types de scans disponibles'
    })

@app.route('/api/scan/<tool>', methods=['POST', 'OPTIONS'])
def run_scan(tool):
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    custom_args = data.get('args')
    
    logger.info(f"🔍 Scan {tool} type {scan_type}: {target}")
    
    # Vérification du type de scan
    if tool not in SCAN_TYPES:
        return jsonify({'error': f'Outil {tool} non supporté'}), 400
    
    if scan_type not in SCAN_TYPES[tool]:
        return jsonify({'error': f'Type de scan {scan_type} non disponible pour {tool}'}), 400
    
    scan_config = SCAN_TYPES[tool][scan_type]
    args = custom_args if custom_args else scan_config['args']
    
    # Génération des IDs
    scan_id = f"{tool}_{scan_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Simulation de résultats différents selon le type
    if tool == 'nmap':
        if scan_type == 'basic':
            results = {'hosts_up': 1, 'scan_time': '1.2s'}
        elif scan_type == 'ports':
            results = {'hosts_up': 1, 'ports_open': ['22/tcp', '80/tcp', '443/tcp', '8080/tcp'], 'scan_time': '3.5s'}
        elif scan_type == 'services':
            results = {'hosts_up': 1, 'ports_open': ['22/tcp SSH', '80/tcp HTTP', '443/tcp HTTPS'], 'scan_time': '8.2s'}
        elif scan_type == 'vulnerability':
            results = {'hosts_up': 1, 'vulnerabilities': ['CVE-2021-44228 (Log4j)', 'Weak SSL ciphers'], 'scan_time': '45.1s'}
        else:
            results = {'hosts_up': 1, 'ports_open': ['22/tcp', '80/tcp', '443/tcp'], 'scan_time': '2.5s'}
    
    elif tool == 'nikto':
        if scan_type == 'comprehensive':
            results = {'vulnerabilities': ['Server version disclosure', 'Missing security headers', 'Directory traversal', 'XSS potential'], 'risk_level': 'high'}
        elif scan_type == 'fast':
            results = {'vulnerabilities': ['Server version disclosure'], 'risk_level': 'low'}
        else:
            results = {'vulnerabilities': ['Server version disclosure', 'Missing security headers'], 'risk_level': 'medium'}
    
    # Données du scan
    scan_data = {
        'scan_id': scan_id,
        'tool': tool,
        'scan_type': scan_type,
        'scan_type_info': scan_config,
        'target': target,
        'args': args,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'message': f'Scan {scan_config["name"]} de {target} terminé',
        'results': results
    }
    
    # Génération du rapport
    report_filename, report_path = generate_scan_report(scan_data)
    scan_data['report_filename'] = report_filename
    scan_data['report_url'] = f'/api/reports/download/{report_filename}'
    
    # Sauvegarde dans l'historique
    scans_history.insert(0, scan_data)
    
    # Limitation de l'historique à 50 scans
    if len(scans_history) > 50:
        scans_history.pop()
    
    return jsonify(scan_data)

@app.route('/api/scans/history', methods=['GET'])
def get_scans_history():
    """Retourne l'historique des scans"""
    return jsonify({
        'total': len(scans_history),
        'scans': scans_history,
        'message': 'Historique des scans'
    })

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste tous les rapports disponibles"""
    reports = []
    reports_dir = '/app/reports'
    
    try:
        for filename in os.listdir(reports_dir):
            if filename.endswith('.html') and filename.startswith('rapport_'):
                file_path = os.path.join(reports_dir, filename)
                file_stats = os.stat(file_path)
                
                reports.append({
                    'filename': filename,
                    'size': file_stats.st_size,
                    'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                    'download_url': f'/api/reports/download/{filename}'
                })
        
        # Tri par date de création (plus récent d'abord)
        reports.sort(key=lambda x: x['created'], reverse=True)
        
    except Exception as e:
        logger.error(f"Erreur liste rapports: {e}")
        return jsonify({'error': 'Erreur lors de la récupération des rapports'}), 500
    
    return jsonify({
        'total': len(reports),
        'reports': reports,
        'message': f'{len(reports)} rapports disponibles'
    })

@app.route('/api/reports/download/<filename>', methods=['GET'])
def download_report(filename):
    """Télécharge un rapport"""
    try:
        # Sécurisation du nom de fichier
        safe_filename = os.path.basename(filename)
        reports_dir = '/app/reports'
        file_path = os.path.join(reports_dir, safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport non trouvé'}), 404
        
        if not safe_filename.endswith('.html'):
            return jsonify({'error': 'Type de fichier non autorisé'}), 400
            
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='text/html'
        )
        
    except Exception as e:
        logger.error(f"Erreur téléchargement: {e}")
        return jsonify({'error': 'Erreur lors du téléchargement'}), 500

# Gestion d'erreurs
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint non trouvé'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur 500: {error}")
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend v2.0")
    logger.info("🌐 CORS configuré pour localhost:3000")
    logger.info(f"📊 Types de scans chargés: {len(SCAN_TYPES)} outils")
    
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)