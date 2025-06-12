# backend/main.py - Version unifiée avec architecture cohérente
import os
import sys
import logging
import json
import uuid
import subprocess
import base64
import threading
import signal
import time
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

# Configuration CORS permissive
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://frontend:3000"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Création des répertoires nécessaires
directories = ['/app/reports', '/app/logs', '/app/data', '/app/temp', '/app/captures']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Configuration globale des outils
TOOL_CONFIG = {
    "scan_tools": {
        "nmap": {
            "name": "Network Mapper",
            "description": "Scanner de réseau et de ports",
            "executable": "nmap",
            "available": False,
            "icon": "🔍",
            "color": "#3b82f6"
        },
        "nikto": {
            "name": "Web Vulnerability Scanner", 
            "description": "Scanner de vulnérabilités web",
            "executable": "nikto",
            "available": False,
            "icon": "🌐",
            "color": "#06b6d4"
        }
    },
    "network_tools": {
        "tcpdump": {
            "name": "Packet Capture",
            "description": "Capture de paquets réseau",
            "executable": "tcpdump",
            "available": False,
            "icon": "📡",
            "color": "#10b981"
        },
        "tshark": {
            "name": "Wireshark CLI",
            "description": "Analyse de paquets en ligne de commande",
            "executable": "tshark",
            "available": False,
            "icon": "🔬",
            "color": "#8b5cf6"
        }
    }
}

# Types de scans structurés
SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Scan Basique",
            "description": "Détection d'hôtes actifs",
            "args": "-sn",
            "icon": "🔍",
            "color": "#3b82f6",
            "duration": "rapide"
        },
        "ports": {
            "name": "Scan de Ports",
            "description": "Scan des ports les plus courants",
            "args": "-sS --top-ports 1000",
            "icon": "🔌",
            "color": "#10b981",
            "duration": "moyen"
        },
        "services": {
            "name": "Détection de Services",
            "description": "Identification des services et versions",
            "args": "-sV",
            "icon": "🛠️",
            "color": "#f59e0b",
            "duration": "long"
        },
        "stealth": {
            "name": "Scan Furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2",
            "icon": "🥷",
            "color": "#8b5cf6",
            "duration": "très long"
        },
        "aggressive": {
            "name": "Scan Agressif",
            "description": "Scan complet avec détection OS",
            "args": "-A -T4",
            "icon": "💥",
            "color": "#ef4444",
            "duration": "long"
        },
        "vulnerability": {
            "name": "Détection Vulnérabilités",
            "description": "Scan avec scripts de vulnérabilités",
            "args": "--script vuln",
            "icon": "🛡️",
            "color": "#dc2626",
            "duration": "très long"
        }
    },
    "nikto": {
        "basic": {
            "name": "Scan Web Basique",
            "description": "Scan de vulnérabilités web standard",
            "args": "-h {target}",
            "icon": "🌐",
            "color": "#06b6d4",
            "duration": "moyen"
        },
        "comprehensive": {
            "name": "Scan Complet",
            "description": "Analyse complète avec tous les plugins",
            "args": "-h {target} -Plugins @@ALL",
            "icon": "🔍",
            "color": "#dc2626",
            "duration": "très long"
        },
        "fast": {
            "name": "Scan Rapide",
            "description": "Scan rapide des vulnérabilités critiques",
            "args": "-h {target} -Fast",
            "icon": "⚡",
            "color": "#10b981",
            "duration": "rapide"
        }
    }
}

# Stockage global des activités
active_scans = {}
active_captures = {}
scan_history = []
capture_history = []

# ==================== UTILITAIRES ====================

def check_tool_availability():
    """Vérifie la disponibilité des outils"""
    all_tools = {**TOOL_CONFIG["scan_tools"], **TOOL_CONFIG["network_tools"]}
    
    for tool_name, tool_info in all_tools.items():
        try:
            subprocess.run(['which', tool_info["executable"]], 
                         check=True, capture_output=True)
            tool_info["available"] = True
            logger.info(f"✅ {tool_name} disponible")
        except:
            tool_info["available"] = False
            logger.warning(f"❌ {tool_name} non disponible")

def generate_scan_id(tool):
    """Génère un ID unique pour un scan"""
    return f"{tool}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

def generate_capture_id():
    """Génère un ID unique pour une capture"""
    return f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

# ==================== ROUTES DE BASE ====================

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0 - Scanner & Capture unifié',
        'status': 'running',
        'modules': ['nmap', 'nikto', 'tcpdump', 'tshark'],
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
    
    logger.info("💚 Health check appelé")
    
    # Vérification des outils à chaque appel
    check_tool_availability()
    
    # Compilation du statut
    tools_summary = {}
    for category, tools in TOOL_CONFIG.items():
        tools_summary[category] = {
            name: info["available"] for name, info in tools.items()
        }
    
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'tools_available': tools_summary,
        'active_scans': len(active_scans),
        'active_captures': len(active_captures),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Statut global de l'application"""
    return jsonify({
        'active_scans': len(active_scans),
        'active_captures': len(active_captures),
        'scan_history_count': len(scan_history),
        'capture_history_count': len(capture_history),
        'tools_status': TOOL_CONFIG,
        'uptime': datetime.now().isoformat()
    })

# ==================== ROUTES DE SCAN ====================

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    """Retourne tous les types de scans disponibles"""
    return jsonify({
        'scan_types': SCAN_TYPES,
        'tools_status': TOOL_CONFIG["scan_tools"]
    })

@app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
def nmap_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    custom_args = data.get('args')
    
    # Validation du type de scan
    if scan_type not in SCAN_TYPES['nmap']:
        return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
    
    scan_config = SCAN_TYPES['nmap'][scan_type]
    scan_id = generate_scan_id('nmap')
    
    # Arguments finaux
    final_args = custom_args if custom_args else scan_config['args']
    
    logger.info(f"🔍 Scan Nmap démarré: {scan_id} - {target} ({scan_type})")
    
    # Simulation de résultats (remplacer par vraie exécution)
    scan_result = {
        'scan_id': scan_id,
        'tool': 'nmap',
        'scan_type': scan_type,
        'scan_config': scan_config,
        'target': target,
        'args': final_args,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'duration': '3.2s',
        'results': {
            'hosts_discovered': 1,
            'ports_open': ['22/tcp (ssh)', '80/tcp (http)', '443/tcp (https)'],
            'services_detected': ['OpenSSH 8.0', 'nginx 1.18.0', 'OpenSSL 1.1.1'],
            'os_detection': 'Linux 3.2 - 4.9'
        }
    }
    
    # Ajout à l'historique
    scan_history.insert(0, scan_result)
    if len(scan_history) > 100:  # Limite de l'historique
        scan_history.pop()
    
    return jsonify(scan_result)

@app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
def nikto_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', 'http://127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    
    # Validation du type de scan
    if scan_type not in SCAN_TYPES['nikto']:
        return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
    
    scan_config = SCAN_TYPES['nikto'][scan_type]
    scan_id = generate_scan_id('nikto')
    
    logger.info(f"🌐 Scan Nikto démarré: {scan_id} - {target} ({scan_type})")
    
    # Simulation de résultats basés sur le type
    vulnerabilities = []
    risk_level = 'low'
    
    if scan_type == 'comprehensive':
        vulnerabilities = [
            'Server version disclosure (nginx/1.18.0)',
            'Missing security headers (X-Frame-Options, CSP)',
            'Directory traversal potential in /admin/',
            'XSS vulnerability in search parameter',
            'Backup files found (.bak extensions)',
            'Information disclosure in HTTP headers'
        ]
        risk_level = 'high'
    elif scan_type == 'fast':
        vulnerabilities = [
            'Server version disclosure',
            'Missing X-Frame-Options header'
        ]
        risk_level = 'low'
    else:  # basic
        vulnerabilities = [
            'Server version disclosure (nginx/1.18.0)',
            'Missing security headers (X-Frame-Options, CSP)',
            'Cookie security flags missing'
        ]
        risk_level = 'medium'
    
    scan_result = {
        'scan_id': scan_id,
        'tool': 'nikto',
        'scan_type': scan_type,
        'scan_config': scan_config,
        'target': target,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'duration': '12.8s',
        'results': {
            'vulnerabilities_found': len(vulnerabilities),
            'vulnerabilities': vulnerabilities,
            'risk_level': risk_level,
            'pages_tested': 156,
            'plugins_used': 23
        }
    }
    
    # Ajout à l'historique
    scan_history.insert(0, scan_result)
    if len(scan_history) > 100:
        scan_history.pop()
    
    return jsonify(scan_result)

@app.route('/api/scans/history', methods=['GET'])
def get_scan_history():
    """Historique des scans"""
    limit = request.args.get('limit', 50, type=int)
    tool_filter = request.args.get('tool')
    
    filtered_history = scan_history
    if tool_filter:
        filtered_history = [s for s in scan_history if s['tool'] == tool_filter]
    
    return jsonify({
        'scans': filtered_history[:limit],
        'total': len(filtered_history),
        'limit': limit
    })

# ==================== ROUTES NETWORK/CAPTURE ====================

@app.route('/api/network/interfaces', methods=['GET'])
def get_network_interfaces():
    """Liste des interfaces réseau disponibles"""
    try:
        result = subprocess.run(
            ["tcpdump", "-D"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        interfaces = []
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('.')
                    if len(parts) >= 2:
                        number = parts[0]
                        name = parts[1].split()[0]
                        description = ' '.join(parts[1].split()[1:]) if len(parts[1].split()) > 1 else "Interface réseau"
                        
                        interfaces.append({
                            'id': number,
                            'name': name,
                            'description': description,
                            'full_line': line.strip()
                        })
        
        return jsonify({
            'interfaces': interfaces,
            'total': len(interfaces),
            'tool_available': TOOL_CONFIG["network_tools"]["tcpdump"]["available"]
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des interfaces: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/start', methods=['POST'])
def start_capture():
    """Démarre une capture de paquets"""
    data = request.get_json() or {}
    interface = data.get('interface', 'any')
    filter_expr = data.get('filter', '')
    packet_count = data.get('packet_count', 100)
    
    capture_id = generate_capture_id()
    capture_file = f"/app/captures/{capture_id}.pcap"
    
    # Construction de la commande tcpdump
    cmd = ['tcpdump', '-i', interface, '-w', capture_file, '-c', str(packet_count)]
    if filter_expr:
        cmd.append(filter_expr)
    
    logger.info(f"📡 Démarrage capture {capture_id} sur {interface}")
    
    try:
        # Démarrage du processus tcpdump
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Stockage de la capture active
        active_captures[capture_id] = {
            'process': process,
            'interface': interface,
            'filter': filter_expr,
            'packet_count': packet_count,
            'capture_file': capture_file,
            'start_time': datetime.now().isoformat(),
            'status': 'running'
        }
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'started',
            'interface': interface,
            'filter': filter_expr,
            'packet_count': packet_count,
            'message': f'Capture démarrée sur {interface}'
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de la capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/<capture_id>/stop', methods=['POST'])
def stop_capture(capture_id):
    """Arrête une capture spécifique"""
    if capture_id not in active_captures:
        return jsonify({'error': 'Capture non trouvée'}), 404
    
    capture_info = active_captures[capture_id]
    process = capture_info['process']
    
    try:
        # Arrêt du processus
        process.terminate()
        process.wait(timeout=5)
        
        # Mise à jour du statut
        capture_info['status'] = 'completed'
        capture_info['end_time'] = datetime.now().isoformat()
        
        # Ajout à l'historique
        capture_history.insert(0, capture_info.copy())
        
        # Suppression des captures actives
        del active_captures[capture_id]
        
        logger.info(f"📡 Capture {capture_id} arrêtée")
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'stopped',
            'message': 'Capture arrêtée avec succès'
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'arrêt de la capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/captures/active', methods=['GET'])
def get_active_captures():
    """Liste des captures actives"""
    captures_info = []
    
    for capture_id, info in active_captures.items():
        captures_info.append({
            'capture_id': capture_id,
            'interface': info['interface'],
            'filter': info['filter'],
            'packet_count': info['packet_count'],
            'start_time': info['start_time'],
            'status': info['status']
        })
    
    return jsonify({
        'active_captures': captures_info,
        'total': len(captures_info)
    })

@app.route('/api/network/captures/history', methods=['GET'])
def get_capture_history():
    """Historique des captures"""
    limit = request.args.get('limit', 50, type=int)
    
    history_info = []
    for capture in capture_history[:limit]:
        info = capture.copy()
        # Suppression du processus pour la sérialisation JSON
        if 'process' in info:
            del info['process']
        history_info.append(info)
    
    return jsonify({
        'captures': history_info,
        'total': len(capture_history),
        'limit': limit
    })

# ==================== INITIALISATION ====================

def initialize_app():
    """Initialisation de l'application"""
    logger.info("🚀 Initialisation de Pacha Toolbox")
    
    # Vérification des outils
    check_tool_availability()
    
    # Nettoyage des anciens fichiers temporaires
    for temp_dir in ['/app/temp', '/app/captures']:
        if os.path.exists(temp_dir):
            for file in os.listdir(temp_dir):
                if file.endswith('.pcap') or file.endswith('.tmp'):
                    try:
                        os.remove(os.path.join(temp_dir, file))
                    except:
                        pass
    
    logger.info("✅ Initialisation terminée")

# ==================== DÉMARRAGE ====================

if __name__ == '__main__':
    initialize_app()
    logger.info("🌐 Démarrage Pacha Toolbox API v2.0")
    app.run(host='0.0.0.0', port=5000, debug=True)