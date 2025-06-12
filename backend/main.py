# backend/main.py - Version avec intégration tcpdump
import os
import sys
import logging
import json
import uuid
import subprocess
import base64
from datetime import datetime
from flask import Flask, jsonify, request, send_file, Response
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
directories = ['/app/reports', '/app/logs', '/app/data', '/app/temp', '/app/reports/pdf']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Import des routes
try:
    from app.routes.network import network_bp
    app.register_blueprint(network_bp, url_prefix='/api/network')
    logger.info("🌐 Routes réseau chargées")
except ImportError as e:
    logger.warning(f"⚠️ Routes réseau non disponibles: {e}")

# Configuration des types de scans
SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Scan Basique",
            "description": "Détection d'hôtes actifs",
            "args": "-sn",
            "icon": "🔍",
            "color": "#3b82f6"
        },
        "ports": {
            "name": "Scan de Ports",
            "description": "Scan des ports les plus courants",
            "args": "-sS --top-ports 1000",
            "icon": "🔌",
            "color": "#10b981"
        },
        "services": {
            "name": "Détection de Services",
            "description": "Identification des services et versions",
            "args": "-sV",
            "icon": "🛠️",
            "color": "#f59e0b"
        },
        "stealth": {
            "name": "Scan Furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2",
            "icon": "🥷",
            "color": "#8b5cf6"
        },
        "aggressive": {
            "name": "Scan Agressif",
            "description": "Scan complet avec détection OS",
            "args": "-A -T4",
            "icon": "💥",
            "color": "#ef4444"
        },
        "vulnerability": {
            "name": "Détection Vulnérabilités",
            "description": "Scan avec scripts de vulnérabilités",
            "args": "--script vuln",
            "icon": "🛡️",
            "color": "#dc2626"
        }
    }
}

# Routes de base
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0 - Avec tcpdump',
        'status': 'running',
        'modules': ['nmap', 'nikto', 'tcpdump'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    logger.info("💚 Health check appelé")
    
    # Vérification des outils
    tools_status = {}
    for tool in ['nmap', 'nikto', 'tcpdump', 'tshark']:
        try:
            subprocess.run(['which', tool], check=True, capture_output=True)
            tools_status[tool] = True
        except:
            tools_status[tool] = False
    
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'tools_available': tools_status,
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

# Routes de scan simplifiées
@app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
def nmap_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    args = data.get('args', '-sn')
    
    logger.info(f"🔍 Scan Nmap: {target} avec {args}")
    
    result = {
        'status': 'completed',
        'scan_id': f'nmap_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'target': target,
        'args': args,
        'timestamp': datetime.now().isoformat(),
        'message': f'Scan Nmap de {target} terminé',
        'results': {
            'hosts_up': 1,
            'ports_open': ['22/tcp', '80/tcp', '443/tcp'],
            'scan_time': '2.5s'
        }
    }
    
    return jsonify(result)

@app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
def nikto_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    
    result = {
        'status': 'completed',
        'scan_id': f'nikto_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'target': target,
        'timestamp': datetime.now().isoformat(),
        'message': f'Scan Nikto de {target} terminé',
        'results': {
            'vulnerabilities': ['Server version disclosure', 'Missing security headers'],
            'scan_time': '15.2s'
        }
    }
    
    return jsonify(result)

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    return jsonify(SCAN_TYPES)

if __name__ == '__main__':
    logger.info("🚀 Démarrage Pacha Toolbox API avec tcpdump")
    app.run(host='0.0.0.0', port=5000, debug=True)
