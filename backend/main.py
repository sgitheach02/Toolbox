backend/main.py - Backend avec module tcpdump intégré et optimisé + MODULE RAPPORTS

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import threading
import subprocess
import time
import logging
from datetime import datetime
import json
import os
import uuid
import signal
import psutil
import re
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Variables globales pour les scans
active_scans = {}
scan_outputs = {}
scan_history = []

# Variables globales pour les captures réseau
active_captures = {}
capture_outputs = {}
capture_history = []

# Configuration des répertoires pour les rapports
BASE_DIR = Path(__file__).parent.parent if Path(__file__).parent.parent.exists() else Path('/tmp')
REPORTS_DIR = BASE_DIR / 'data' / 'reports'
REPORTS_PDF_DIR = BASE_DIR / 'data' / 'reports' / 'pdf'
TEMP_DIR = BASE_DIR / 'data' / 'temp'

def ensure_reports_directories():
    """Créer les répertoires pour les rapports"""
    for directory in [REPORTS_DIR, REPORTS_PDF_DIR, TEMP_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Répertoire rapports: {directory}")

def format_file_size(size_bytes):
    """Formatage de la taille des fichiers"""
    if size_bytes == 0:
        return "0 B"
    size_units = ['B', 'KB', 'MB', 'GB']
    i = 0
    while size_bytes >= 1024 and i < len(size_units) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f} {size_units[i]}"

# Cache pour éviter les logs répétitifs
last_request_time = {}
REQUEST_THROTTLE = 2.0

def should_log_request(endpoint, client_ip):
    """Détermine si on doit logger cette requête pour éviter le spam"""
    key = f"{endpoint}_{client_ip}"
    current_time = time.time()
    
    if key in last_request_time:
        if current_time - last_request_time[key] < REQUEST_THROTTLE:
            return False
    
    last_request_time[key] = current_time
    return True

def calculate_duration(start_time, end_time):
    """Calculer la durée entre deux timestamps"""
    try:
        start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        duration = end - start
        return str(duration).split('.')[0]
    except:
        return "N/A"

def add_scan_to_history(scan_data):
    """Ajouter un scan à l'historique de manière sécurisée"""
    global scan_history
    
    if not isinstance(scan_history, list):
        scan_history = []
    
    history_entry = {
        'scan_id': scan_data.get('scan_id', ''),
        'tool': scan_data.get('tool', 'unknown'),
        'target': scan_data.get('target', ''),
        'scan_type': scan_data.get('scan_type', 'basic'),
        'status': scan_data.get('status', 'completed'),
        'start_time': scan_data.get('start_time', datetime.now().isoformat()),
        'end_time': scan_data.get('end_time', datetime.now().isoformat()),
        'duration': scan_data.get('duration', 'N/A'),
        'report_filename': scan_data.get('report_filename', None),
        'pdf_filename': scan_data.get('pdf_filename', None),
        'error': scan_data.get('error', None)
    }
    
    scan_history.append(history_entry)
    
    if len(scan_history) > 100:
        scan_history = scan_history[-100:]
    
    logger.info(f"📚 Scan {scan_data.get('scan_id')} added to history")

def add_capture_to_history(capture_data):
    """Ajouter une capture à l'historique"""
    global capture_history
    
    if not isinstance(capture_history, list):
        capture_history = []
    
    history_entry = {
        'capture_id': capture_data.get('capture_id', ''),
        'interface': capture_data.get('interface', 'unknown'),
        'filter': capture_data.get('filter', ''),
        'status': capture_data.get('status', 'completed'),
        'start_time': capture_data.get('start_time', datetime.now().isoformat()),
        'end_time': capture_data.get('end_time', datetime.now().isoformat()),
        'duration': capture_data.get('duration', 'N/A'),
        'packets_captured': capture_data.get('packets_captured', 0),
        'file_size': capture_data.get('file_size', 'N/A'),
        'filename': capture_data.get('filename', None),
        'error': capture_data.get('error', None)
    }
    
    capture_history.append(history_entry)
    
    if len(capture_history) > 100:
        capture_history = capture_history[-100:]
    
    logger.info(f"📡 Capture {capture_data.get('capture_id')} added to history")

def check_tool_availability(tool):
    """Vérifier si un outil est disponible sur le système"""
    try:
        result = subprocess.run(['which', tool], capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False

def get_network_interfaces():
    """Obtenir la liste des interfaces réseau disponibles"""
    interfaces = []
    
    try:
        # Méthode 1: Utiliser tcpdump -D
        if check_tool_availability('tcpdump'):
            result = subprocess.run(['tcpdump', '-D'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0 and result.stdout:
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        # Format: "1.eth0 [Up, Running]"
                        parts = line.split('.')
                        if len(parts) >= 2:
                            interface_name = parts[1].split()[0]
                            status = "Up" if "Up" in line else "Down"
                            interfaces.append({
                                "name": interface_name,
                                "display": f"{interface_name} - {status}",
                                "active": "Up" in line
                            })
        
        # Méthode 2: Utiliser ip link (si tcpdump échoue)
        if not interfaces:
            try:
                result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    for line in lines:
                        if ': ' in line and '@' not in line:
                            parts = line.split(': ')
                            if len(parts) >= 2:
                                interface_name = parts[1].split('@')[0]
                                if interface_name not in ['lo']:  # Exclure loopback par défaut
                                    interfaces.append({
                                        'name': interface_name,
                                        'display': f"{interface_name} - Network Interface",
                                        'active': True
                                    })
            except:
                pass
        
        # Interfaces par défaut si aucune trouvée
        if not interfaces:
            interfaces = [
                {'name': 'eth0', 'display': 'eth0 - Ethernet', 'active': True},
                {'name': 'wlan0', 'display': 'wlan0 - WiFi', 'active': True},
                {'name': 'any', 'display': 'any - All Interfaces', 'active': True}
            ]
        
        # Toujours ajouter 'any' et 'lo' à la fin
        if not any(iface['name'] == 'any' for iface in interfaces):
            interfaces.append({'name': 'any', 'display': 'any - All Interfaces', 'active': True})
        if not any(iface['name'] == 'lo' for iface in interfaces):
            interfaces.append({'name': 'lo', 'display': 'lo - Loopback', 'active': True})
        
        return interfaces
        
    except Exception as e:
        logger.error(f"❌ Error getting interfaces: {e}")
        return [
            {'name': 'eth0', 'display': 'eth0 - Ethernet', 'active': True},
            {'name': 'any', 'display': 'any - All Interfaces', 'active': True}
        ]

# ==================== ROUTES API HEALTH & BASE ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check de l'API"""
    client_ip = request.remote_addr
    if should_log_request('health', client_ip):
        logger.info(f"🏥 Health check from {client_ip}")
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_scans': len(active_scans),
        'active_captures': len(active_captures),
        'total_history': len(scan_history),
        'capture_history': len(capture_history),
        'version': '2.1.0',
        'modules': ['scans', 'network_capture', 'tcpdump', 'reports']
    })

@app.route('/', methods=['GET'])
def root():
    """Route racine de l'API"""
    return jsonify({
        'message': 'PACHA Security Platform API with Network Capture + Reports',
        'version': '2.1.0',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'modules': ['scans', 'network_capture', 'reports'],
        'endpoints': {
            'health': '/api/health',
            'scans': {
                'active': '/api/scan/active',
                'history': '/api/scan/history',
                'start': '/api/scan/start',
                'stop': '/api/scan/stop/<scan_id>',
                'live': '/api/scan/live/<scan_id>'
            },
            'network': {
                'interfaces': '/api/network/interfaces',
                'active_captures': '/api/network/capture/active',
                'capture_history': '/api/network/capture/history',
                'start_capture': '/api/network/capture/start',
                'stop_capture': '/api/network/capture/stop/<capture_id>',
                'live_capture': '/api/network/capture/live/<capture_id>',
                'download_capture': '/api/network/capture/download/<capture_id>'
            },
            'reports': {
                'list': '/api/reports/list',
                'download': '/api/reports/download/<filename>',
                'preview': '/api/reports/preview/<filename>',
                'generate': '/api/reports/generate',
                'stats': '/api/reports/stats',
                'cleanup': '/api/reports/cleanup',
                'test': '/api/reports/test'
            }
        }
    })

# ==================== ROUTES API SCANS ====================

@app.route('/api/scan/active', methods=['GET', 'OPTIONS'])
def get_active_scans():
    """Obtenir la liste des scans actifs"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if should_log_request('scan_active', client_ip):
        logger.info(f"📋 Active scans requested by {client_ip} - Count: {len(active_scans)}")
    
    return jsonify(list(active_scans.values()))

@app.route('/api/scan/history', methods=['GET', 'OPTIONS'])
def get_scan_history():
    """Obtenir l'historique des scans"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if should_log_request('scan_history', client_ip):
        logger.info(f"📚 History requested by {client_ip} - Count: {len(scan_history)}")
    
    try:
        sorted_history = sorted(scan_history, key=lambda x: x.get('start_time', ''), reverse=True)
        return jsonify(sorted_history[:50])
    except Exception as e:
        logger.error(f"❌ Error getting history: {e}")
        return jsonify([])

@app.route('/api/scan/live/<scan_id>', methods=['GET', 'OPTIONS'])
def get_live_output(scan_id):
    """Obtenir l'output en temps réel d'un scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    
    if scan_id not in scan_outputs:
        if should_log_request(f'live_not_found_{scan_id}', client_ip):
            logger.warning(f"❌ Scan {scan_id} not found for {client_ip}")
        return jsonify({
            'error': 'Scan not found',
            'scan_id': scan_id,
            'lines': [],
            'total_lines': 0,
            'is_running': False
        }), 404
    
    if should_log_request(f'live_output_{scan_id}', client_ip):
        output_count = len(scan_outputs[scan_id])
        is_running = scan_id in active_scans and active_scans[scan_id]['status'] == 'running'
        logger.info(f"📄 Output requested for {scan_id} - Lines: {output_count}, Running: {is_running}")
    
    output_lines = scan_outputs[scan_id]
    is_running = scan_id in active_scans and active_scans[scan_id]['status'] == 'running'
    
    return jsonify({
        'scan_id': scan_id,
        'lines': output_lines,
        'total_lines': len(output_lines),
        'is_running': is_running,
        'last_updated': datetime.now().isoformat()
    })

@app.route('/api/scan/start', methods=['POST', 'OPTIONS'])
def start_scan():
    """Démarrer un nouveau scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json() or {}
        tool = data.get('tool', 'nmap')
        target = data.get('target', '')
        scan_type = data.get('scanType', data.get('scan_type', 'basic'))
        
        client_ip = request.remote_addr
        logger.info(f"🚀 New scan request from {client_ip}: {tool} -> {target} ({scan_type})")
        
        if not target:
            return jsonify({'error': 'Target is required'}), 400
        
        if tool == 'nikto':
            if not (target.startswith('http://') or target.startswith('https://')):
                logger.error(f"❌ Invalid Nikto target: {target}")
                return jsonify({'error': 'Nikto requires HTTP/HTTPS URL (e.g., http://example.com)'}), 400
        elif tool == 'nmap':
            if target.startswith(('http://', 'https://')):
                target = target.replace('http://', '').replace('https://', '').split('/')[0]
                logger.info(f"🔧 Target cleaned for nmap: {target}")
        
        scan_id = f"{tool}_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        if tool == 'nmap':
            command = build_nmap_command(target, scan_type)
        elif tool == 'nikto':
            command = build_nikto_command(target, scan_type)
        else:
            return jsonify({'error': f'Unsupported tool: {tool}'}), 400
        
        logger.info(f"🚀 Command to execute: {' '.join(command)}")
        
        scan_entry = {
            'scan_id': scan_id,
            'tool': tool,
            'target': target,
            'scan_type': scan_type,
            'status': 'starting',
            'start_time': datetime.now().isoformat(),
            'command': ' '.join(command),
            'client_ip': client_ip
        }
        
        active_scans[scan_id] = scan_entry
        scan_outputs[scan_id] = []
        
        thread = threading.Thread(target=execute_scan, args=(command, scan_id, tool, target, scan_type))
        thread.daemon = True
        thread.start()
        
        logger.info(f"✅ Scan {scan_id} started successfully")
        
        return jsonify({
            'scan_id': scan_id,
            'status': 'started',
            'message': f'{tool} scan started successfully',
            'target': target,
            'scan_type': scan_type
        })
        
    except Exception as e:
        logger.error(f"❌ Error starting scan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/stop/<scan_id>', methods=['POST', 'OPTIONS'])
def stop_scan(scan_id):
    """Arrêter un scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    if scan_id not in active_scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    active_scans[scan_id]['status'] = 'stopped'
    active_scans[scan_id]['end_time'] = datetime.now().isoformat()
    
    if 'start_time' in active_scans[scan_id]:
        duration = calculate_duration(active_scans[scan_id]['start_time'], active_scans[scan_id]['end_time'])
        active_scans[scan_id]['duration'] = duration
    
    add_scan_to_history(active_scans[scan_id])
    
    def cleanup_scan():
        time.sleep(5)
        active_scans.pop(scan_id, None)
        def cleanup_output():
            time.sleep(60)
            scan_outputs.pop(scan_id, None)
        threading.Thread(target=cleanup_output, daemon=True).start()
    
    threading.Thread(target=cleanup_scan, daemon=True).start()
    
    logger.info(f"🛑 Scan {scan_id} stopped")
    
    return jsonify({
        'scan_id': scan_id,
        'status': 'stopped',
        'message': 'Scan stopped successfully'
    })

# ==================== ROUTES API NETWORK CAPTURE ====================

@app.route('/api/network/interfaces', methods=['GET', 'OPTIONS'])
def get_network_interfaces_api():
    """Obtenir la liste des interfaces réseau disponibles"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        interfaces = get_network_interfaces()
        
        return jsonify({
            'interfaces': interfaces,
            'default': 'eth0',
            'timestamp': datetime.now().isoformat(),
            'tcpdump_available': check_tool_availability('tcpdump')
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting interfaces: {e}")
        return jsonify({
            'interfaces': [
                {'name': 'eth0', 'display': 'eth0 - Ethernet', 'active': True},
                {'name': 'any', 'display': 'any - All Interfaces', 'active': True}
            ],
            'default': 'eth0',
            'error': str(e),
            'tcpdump_available': False
        })

@app.route('/api/network/capture/active', methods=['GET', 'OPTIONS'])
def get_active_captures():
    """Obtenir la liste des captures actives"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if should_log_request('capture_active', client_ip):
        logger.info(f"📡 Active captures requested by {client_ip} - Count: {len(active_captures)}")
    
    return jsonify(list(active_captures.values()))

@app.route('/api/network/capture/history', methods=['GET', 'OPTIONS'])
def get_capture_history():
    """Obtenir l'historique des captures"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if should_log_request('capture_history', client_ip):
        logger.info(f"📡 Capture history requested by {client_ip} - Count: {len(capture_history)}")
    
    try:
        sorted_history = sorted(capture_history, key=lambda x: x.get('start_time', ''), reverse=True)
        return jsonify(sorted_history[:50])
    except Exception as e:
        logger.error(f"❌ Error getting capture history: {e}")
        return jsonify([])

@app.route('/api/network/capture/start', methods=['POST', 'OPTIONS'])
def start_capture():
    """Démarrer une nouvelle capture tcpdump"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json() or {}
        interface = data.get('interface', 'eth0')
        filter_expr = data.get('filter', '')
        duration = min(int(data.get('duration', 60)), 600)  # Max 10 minutes
        packet_count = min(int(data.get('packet_count', 100)), 10000)  # Max 10k packets
        
        client_ip = request.remote_addr
        logger.info(f"📡 New capture request from {client_ip}: {interface} with filter '{filter_expr}'")
        
        capture_id = f"capture_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        # Créer le répertoire de captures s'il n'existe pas
        capture_dir = '/tmp/captures'
        os.makedirs(capture_dir, exist_ok=True)
        
        filename = f"{capture_id}.pcap"
        filepath = os.path.join(capture_dir, filename)
        
        command = build_tcpdump_command(interface, filter_expr, duration, packet_count, filepath)
        
        logger.info(f"📡 Tcpdump command: {' '.join(command)}")
        
        capture_entry = {
            'capture_id': capture_id,
            'interface': interface,
            'filter': filter_expr,
            'duration': duration,
            'packet_count': packet_count,
            'status': 'starting',
            'start_time': datetime.now().isoformat(),
            'filename': filename,
            'filepath': filepath,
            'command': ' '.join(command),
            'client_ip': client_ip,
            'packets_captured': 0
        }
        
        active_captures[capture_id] = capture_entry
        capture_outputs[capture_id] = []
        
        thread = threading.Thread(target=execute_capture, args=(command, capture_id, interface, filter_expr, duration, packet_count, filepath))
        thread.daemon = True
        thread.start()
        
        logger.info(f"✅ Capture {capture_id} started successfully")
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'started',
            'message': f'Network capture started on {interface}',
            'interface': interface,
            'filter': filter_expr,
            'duration': duration
        })
        
    except Exception as e:
        logger.error(f"❌ Error starting capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/stop/<capture_id>', methods=['POST', 'OPTIONS'])
def stop_capture(capture_id):
    """Arrêter une capture"""
    if request.method == 'OPTIONS':
        return '', 200
    
    if capture_id not in active_captures:
        return jsonify({'error': 'Capture not found'}), 404
    
    try:
        # Tenter d'arrêter le processus tcpdump
        capture_entry = active_captures[capture_id]
        if 'process' in capture_entry and capture_entry['process']:
            try:
                capture_entry['process'].terminate()
                time.sleep(1)
                if capture_entry['process'].poll() is None:
                    capture_entry['process'].kill()
            except:
                pass
        
        active_captures[capture_id]['status'] = 'stopped'
        active_captures[capture_id]['end_time'] = datetime.now().isoformat()
        
        if 'start_time' in active_captures[capture_id]:
            duration = calculate_duration(active_captures[capture_id]['start_time'], active_captures[capture_id]['end_time'])
            active_captures[capture_id]['duration'] = duration
        
        # Obtenir la taille du fichier
        filepath = active_captures[capture_id].get('filepath', '')
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            active_captures[capture_id]['file_size'] = f"{file_size / 1024:.1f} KB"
        
        add_capture_to_history(active_captures[capture_id])
        
        def cleanup_capture():
            time.sleep(5)
            active_captures.pop(capture_id, None)
            def cleanup_output():
                time.sleep(60)
                capture_outputs.pop(capture_id, None)
            threading.Thread(target=cleanup_output, daemon=True).start()
        
        threading.Thread(target=cleanup_capture, daemon=True).start()
        
        logger.info(f"🛑 Capture {capture_id} stopped")
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'stopped',
            'message': 'Capture stopped successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Error stopping capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/live/<capture_id>', methods=['GET', 'OPTIONS'])
def get_live_capture_output(capture_id):
    """Obtenir l'output en temps réel d'une capture"""
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    
    if capture_id not in capture_outputs:
        if should_log_request(f'capture_live_not_found_{capture_id}', client_ip):
            logger.warning(f"❌ Capture {capture_id} not found for {client_ip}")
        return jsonify({
            'error': 'Capture not found',
            'capture_id': capture_id,
            'lines': [],
            'total_lines': 0,
            'is_running': False
        }), 404
    
    if should_log_request(f'capture_live_output_{capture_id}', client_ip):
        output_count = len(capture_outputs[capture_id])
        is_running = capture_id in active_captures and active_captures[capture_id]['status'] == 'running'
        logger.info(f"📡 Capture output requested for {capture_id} - Lines: {output_count}, Running: {is_running}")
    
    output_lines = capture_outputs[capture_id]
    is_running = capture_id in active_captures and active_captures[capture_id]['status'] == 'running'
    
    return jsonify({
        'capture_id': capture_id,
        'lines': output_lines,
        'total_lines': len(output_lines),
        'is_running': is_running,
        'packets_captured': active_captures.get(capture_id, {}).get('packets_captured', 0),
        'last_updated': datetime.now().isoformat()
    })

@app.route('/api/network/capture/download/<capture_id>', methods=['GET'])
def download_capture(capture_id):
    """Télécharger un fichier de capture PCAP"""
    try:
        # Chercher dans les captures actives
        if capture_id in active_captures:
            filepath = active_captures[capture_id].get('filepath')
            filename = active_captures[capture_id].get('filename', f'{capture_id}.pcap')
        else:
            # Chercher dans l'historique
            capture_entry = None
            for capture in capture_history:
                if capture.get('capture_id') == capture_id:
                    capture_entry = capture
                    break
            
            if not capture_entry:
                return jsonify({'error': 'Capture not found'}), 404
            
            filepath = f"/tmp/captures/{capture_entry.get('filename', f'{capture_id}.pcap')}"
            filename = capture_entry.get('filename', f'{capture_id}.pcap')
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({'error': 'Capture file not found'}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        logger.error(f"❌ Error downloading capture {capture_id}: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES API RAPPORTS - NOUVEAU MODULE ====================

@app.route('/api/reports/test', methods=['GET'])
def test_reports():
    """Test de la fonctionnalité rapports"""
    try:
        ensure_reports_directories()
        
        # Création de rapports de test
        test_reports = []
        for i in range(3):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"report_test_{i+1}_{timestamp}.html"
            content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rapport de Test {i+1}</title>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1 {{ color: #333; }}
                    .info {{ background: #f0f0f0; padding: 10px; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <h1>Rapport de Test {i+1}</h1>
                <div class="info">
                    <p><strong>Généré le:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p><strong>Système:</strong> Pacha Toolbox v2.1</p>
                    <p><strong>Type:</strong> Test automatique</p>
                </div>
                <h2>Contenu du rapport</h2>
                <p>Ce rapport de test a été généré automatiquement pour valider le système de rapports.</p>
            </body>
            </html>
            """
            
            file_path = REPORTS_DIR / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            test_reports.append({
                'filename': filename,
                'path': str(file_path),
                'download_url': f'/api/reports/download/{filename}'
            })
        
        logger.info(f"✅ {len(test_reports)} rapports de test créés")
        
        return jsonify({
            'status': 'success',
            'message': f'{len(test_reports)} rapports de test créés',
            'reports': test_reports,
            'reports_directory': str(REPORTS_DIR)
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur test rapports: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste des rapports disponibles"""
    try:
        ensure_reports_directories()
        reports = []
        
        # Parcourir les deux répertoires
        for directory in [REPORTS_DIR, REPORTS_PDF_DIR]:
            if directory.exists():
                for file_path in directory.glob('report_*'):
                    if file_path.is_file():
                        stat = file_path.stat()
                        reports.append({
                            'filename': file_path.name,
                            'size': stat.st_size,
                            'size_formatted': format_file_size(stat.st_size),
                            'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                            'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            'format': file_path.suffix.upper().replace('.', ''),
                            'download_url': f"/api/reports/download/{file_path.name}",
                            'preview_url': f"/api/reports/preview/{file_path.name}"
                        })
        
        # Tri par date de création (plus récent en premier)
        reports.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Statistiques
        stats = {
            'total': len(reports),
            'by_format': {},
            'total_size': sum(r['size'] for r in reports),
            'total_size_formatted': format_file_size(sum(r['size'] for r in reports))
        }
        
        for fmt in ['HTML', 'PDF', 'JSON', 'TXT']:
            stats['by_format'][fmt] = len([r for r in reports if r['format'] == fmt])
        
        return jsonify({
            "total": len(reports),
            "reports": reports,
            "stats": stats,
            "message": f"{len(reports)} rapports disponibles"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste rapports: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/download/<filename>', methods=['GET'])
def download_report(filename):
    """Téléchargement d'un rapport"""
    try:
        ensure_reports_directories()
        safe_filename = os.path.basename(filename)
        
        # Chercher dans les deux répertoires
        for directory in [REPORTS_DIR, REPORTS_PDF_DIR]:
            file_path = directory / safe_filename
            if file_path.exists():
                logger.info(f"📥 Téléchargement: {safe_filename}")
                return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
        return jsonify({"error": "Rapport non trouvé"}), 404
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement rapport: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/preview/<filename>', methods=['GET'])
def preview_report(filename):
    """Prévisualisation d'un rapport"""
    try:
        ensure_reports_directories()
        safe_filename = os.path.basename(filename)
        
        # Chercher dans les répertoires
        for directory in [REPORTS_DIR, REPORTS_PDF_DIR]:
            file_path = directory / safe_filename
            if file_path.exists():
                if safe_filename.endswith('.html'):
                    logger.info(f"👁️ Prévisualisation HTML: {safe_filename}")
                    return send_file(file_path, mimetype='text/html')
                elif safe_filename.endswith('.json'):
                    logger.info(f"👁️ Prévisualisation JSON: {safe_filename}")
                    return send_file(file_path, mimetype='application/json')
                else:
                    return jsonify({"error": "Type de fichier non prévisualisable"}), 400
        
        return jsonify({"error": "Rapport non trouvé"}), 404
        
    except Exception as e:
        logger.error(f"❌ Erreur prévisualisation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """Génération d'un nouveau rapport"""
    try:
        data = request.get_json() or {}
        report_type = data.get('type', 'test')
        title = data.get('title', 'Rapport généré')
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"report_{report_type}_{timestamp}.html"
        
        content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                .info {{ background: #f0f0f0; padding: 10px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <h1>{title}</h1>
            <div class="info">
                <p><strong>Type:</strong> {report_type}</p>
                <p><strong>Généré le:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Système:</strong> Pacha Toolbox v2.1</p>
            </div>
            <h2>Contenu du rapport</h2>
            <p>Ce rapport a été généré automatiquement par le système Pacha Toolbox.</p>
        </body>
        </html>
        """
        
        file_path = REPORTS_DIR / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"✅ Rapport généré: {filename}")
        
        return jsonify({
            'status': 'success',
            'filename': filename,
            'download_url': f'/api/reports/download/{filename}',
            'preview_url': f'/api/reports/preview/{filename}',
            'message': f'Rapport {filename} généré avec succès'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur génération rapport: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/stats', methods=['GET'])
def get_reports_stats():
    """Statistiques des rapports"""
    try:
        ensure_reports_directories()
        
        stats = {
            'total_files': 0,
            'total_size': 0,
            'total_size_formatted': '0 B',
            'by_format': {'HTML': 0, 'PDF': 0, 'JSON': 0, 'TXT': 0},
            'by_date': {},
            'oldest_report': None,
            'newest_report': None
        }
        
        all_files = []
        
        # Analyser tous les fichiers
        for directory in [REPORTS_DIR, REPORTS_PDF_DIR]:
            if directory.exists():
                for file_path in directory.glob('report_*'):
                    if file_path.is_file():
                        stat = file_path.stat()
                        
                        file_info = {
                            'filename': file_path.name,
                            'size': stat.st_size,
                            'created': datetime.fromtimestamp(stat.st_ctime),
                            'format': file_path.suffix.upper().replace('.', '') or 'TXT'
                        }
                        
                        all_files.append(file_info)
                        stats['total_files'] += 1
                        stats['total_size'] += stat.st_size
                        
                        # Compter par format
                        fmt = file_info['format']
                        if fmt in stats['by_format']:
                            stats['by_format'][fmt] += 1
        
        # Formatage de la taille totale
        stats['total_size_formatted'] = format_file_size(stats['total_size'])
        
        # Fichiers les plus anciens/récents
        if all_files:
            all_files.sort(key=lambda x: x['created'])
            stats['oldest_report'] = {
                'filename': all_files[0]['filename'],
                'created': all_files[0]['created'].isoformat()
            }
            stats['newest_report'] = {
                'filename': all_files[-1]['filename'],
                'created': all_files[-1]['created'].isoformat()
            }
        
        return jsonify({
            'stats': stats,
            'message': f"Statistiques de {stats['total_files']} rapports"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur statistiques rapports: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/cleanup', methods=['POST'])
def cleanup_reports():
    """Nettoyage des anciens rapports"""
    try:
        data = request.get_json() or {}
        days_old = data.get('days_old', 30)
        
        ensure_reports_directories()
        deleted_files = []
        cutoff_date = datetime.now().timestamp() - (days_old * 24 * 3600)
        
        for directory in [REPORTS_DIR, REPORTS_PDF_DIR]:
            if directory.exists():
                for file_path in directory.glob('report_*'):
                    if file_path.is_file():
                        if file_path.stat().st_ctime < cutoff_date:
                            try:
                                file_path.unlink()
                                deleted_files.append(file_path.name)
                                logger.info(f"🗑️ Supprimé: {file_path.name}")
                            except Exception as e:
                                logger.error(f"❌ Erreur suppression {file_path.name}: {e}")
        
        return jsonify({
            'status': 'success',
            'deleted_count': len(deleted_files),
            'deleted_files': deleted_files,
            'message': f'{len(deleted_files)} fichiers supprimés (plus anciens que {days_old} jours)'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur nettoyage rapports: {e}")
        return jsonify({'error': str(e)}), 500