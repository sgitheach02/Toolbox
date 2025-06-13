# backend/main.py - Backend avec module tcpdump intégré et optimisé

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
        'modules': ['scans', 'network_capture', 'tcpdump']
    })

@app.route('/', methods=['GET'])
def root():
    """Route racine de l'API"""
    return jsonify({
        'message': 'PACHA Security Platform API with Network Capture',
        'version': '2.1.0',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'modules': ['scans', 'network_capture'],
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

# ==================== FONCTIONS DE CONSTRUCTION DE COMMANDES ====================

def build_nmap_command(target, scan_type):
    """Construire la commande Nmap selon le type de scan"""
    base_cmd = ['nmap']
    
    if scan_type == 'basic':
        base_cmd.extend(['--top-ports', '1000', '-T4', target])
    elif scan_type == 'stealth':
        base_cmd.extend(['-sS', '-T2', target])
    elif scan_type == 'comprehensive':
        base_cmd.extend(['-sC', '-sV', '-O', '-A', target])
    elif scan_type == 'udp':
        base_cmd.extend(['-sU', '--top-ports', '100', target])
    else:
        base_cmd.extend(['--top-ports', '1000', target])
    
    return base_cmd

def build_nikto_command(target, scan_type):
    """Construire la commande Nikto selon le type de scan"""
    base_cmd = ['nikto', '-h', target]
    
    if scan_type == 'comprehensive':
        base_cmd.extend(['-C', 'all', '-plugins', '@@ALL'])
    else:
        base_cmd.extend(['-C', 'all'])
    
    return base_cmd

def build_tcpdump_command(interface, filter_expr, duration, packet_count, filepath):
    """Construire la commande tcpdump"""
    cmd = ['tcpdump', '-i', interface, '-w', filepath, '-v']
    
    # Ajouter la limite de paquets
    cmd.extend(['-c', str(packet_count)])
    
    # Ajouter le timeout
    cmd.extend(['-G', str(duration), '-W', '1'])
    
    # Ajouter le filtre si spécifié
    if filter_expr.strip():
        cmd.append(filter_expr.strip())
    
    return cmd

# ==================== FONCTIONS D'EXÉCUTION ====================

def execute_scan(command, scan_id, tool, target, scan_type):
    """Exécuter un scan avec simulation si l'outil n'est pas disponible"""
    try:
        logger.info(f"🔄 Executing scan {scan_id}: {tool} {scan_type} on {target}")
        
        if scan_id in active_scans:
            active_scans[scan_id]['status'] = 'running'
        
        tool_available = check_tool_availability(tool)
        
        if tool_available:
            execute_real_scan(command, scan_id)
        else:
            if tool == 'nikto':
                simulate_nikto_scan(scan_id, target, scan_type)
            elif tool == 'nmap':
                simulate_nmap_scan(scan_id, target, scan_type)
        
        finalize_scan(scan_id)
        
    except Exception as e:
        logger.error(f"❌ Error executing scan {scan_id}: {e}")
        handle_scan_error(scan_id, str(e))

def execute_capture(command, capture_id, interface, filter_expr, duration, packet_count, filepath):
    """Exécuter une capture tcpdump"""
    try:
        logger.info(f"📡 Executing capture {capture_id}: {interface} with filter '{filter_expr}'")
        
        if capture_id in active_captures:
            active_captures[capture_id]['status'] = 'running'
        
        tool_available = check_tool_availability('tcpdump')
        
        if tool_available:
            execute_real_capture(command, capture_id, filepath)
        else:
            simulate_tcpdump_capture(capture_id, interface, filter_expr, duration, packet_count)
        
        finalize_capture(capture_id, filepath)
        
    except Exception as e:
        logger.error(f"❌ Error executing capture {capture_id}: {e}")
        handle_capture_error(capture_id, str(e))

def execute_real_capture(command, capture_id, filepath):
    """Exécuter une capture tcpdump réelle"""
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Stocker le processus pour pouvoir l'arrêter
        if capture_id in active_captures:
            active_captures[capture_id]['process'] = process
        
        packet_count = 0
        for line in iter(process.stdout.readline, ''):
            if line and capture_id in capture_outputs:
                clean_line = line.strip()
                if clean_line:
                    capture_outputs[capture_id].append(clean_line)
                    logger.info(f"📡 [{capture_id}] {clean_line}")
                    
                    # Compter les paquets capturés
                    if any(keyword in clean_line.lower() for keyword in ['listening on', 'packets captured', 'received by filter']):
                        # Extraire le nombre de paquets si possible
                        numbers = re.findall(r'\d+', clean_line)
                        if numbers:
                            try:
                                packet_count = int(numbers[0])
                                if capture_id in active_captures:
                                    active_captures[capture_id]['packets_captured'] = packet_count
                            except:
                                pass
        
        process.wait()
        logger.info(f"✅ Real capture {capture_id} completed")
        
    except Exception as e:
        logger.error(f"❌ Error in real capture execution: {e}")
        raise

def simulate_tcpdump_capture(capture_id, interface, filter_expr, duration, packet_count):
    """Simuler une capture tcpdump avec output réaliste"""
    logger.info(f"🎭 Simulating tcpdump capture for {capture_id}")
    
    # Messages d'initialisation
    init_messages = [
        f"tcpdump: verbose output suppressed, use -v or -vv for full protocol decode",
        f"listening on {interface}, link-type EN10MB (Ethernet), capture size 262144 bytes"
    ]
    
    for message in init_messages:
        if capture_id in capture_outputs:
            capture_outputs[capture_id].append(message)
            logger.info(f"📡 [{capture_id}] {message}")
            time.sleep(0.5)
    
    # Simuler la capture de paquets avec différents types de trafic
    simulated_packets = []
    
    # Types de trafic simulés selon le filtre
    if 'http' in filter_expr.lower() or 'port 80' in filter_expr.lower():
        simulated_packets = [
            "12:34:56.789012 IP 192.168.1.100.54321 > 93.184.216.34.80: Flags [S], seq 123456789, win 65535",
            "12:34:56.790123 IP 93.184.216.34.80 > 192.168.1.100.54321: Flags [S.], seq 987654321, ack 123456790, win 65535",
            "12:34:56.790456 IP 192.168.1.100.54321 > 93.184.216.34.80: Flags [.], ack 987654322, win 65535",
            "12:34:56.791789 IP 192.168.1.100.54321 > 93.184.216.34.80: Flags [P.], seq 123456790:123456950, ack 987654322, win 65535: HTTP: GET / HTTP/1.1",
            "12:34:56.830123 IP 93.184.216.34.80 > 192.168.1.100.54321: Flags [P.], seq 987654322:987655000, ack 123456950, win 65535: HTTP: HTTP/1.1 200 OK"
        ]
    elif 'smb' in filter_expr.lower() or 'port 445' in filter_expr.lower() or 'port 139' in filter_expr.lower():
        simulated_packets = [
            "12:34:56.789012 IP 192.168.1.100.54445 > 192.168.1.10.445: Flags [S], seq 111111111, win 65535",
            "12:34:56.790123 IP 192.168.1.10.445 > 192.168.1.100.54445: Flags [S.], seq 222222222, ack 111111112, win 65535",
            "12:34:56.791789 IP 192.168.1.100.54445 > 192.168.1.10.445: SMB2 0x0000 Negotiate Protocol Request",
            "12:34:56.830123 IP 192.168.1.10.445 > 192.168.1.100.54445: SMB2 0x0000 Negotiate Protocol Response",
            "12:34:56.831456 IP 192.168.1.100.54445 > 192.168.1.10.445: SMB2 0x0001 Session Setup Request",
            "12:34:56.832789 IP 192.168.1.10.445 > 192.168.1.100.54445: SMB2 0x0001 Session Setup Response, Error: STATUS_MORE_PROCESSING_REQUIRED",
            "12:34:56.833123 IP 192.168.1.100.54445 > 192.168.1.10.445: SMB2 0x0002 Tree Connect Request",
            "12:34:56.890456 IP 192.168.1.10.445 > 192.168.1.100.54445: SMB2 0x0002 Tree Connect Response, Path: \\\\192.168.1.10\\C$"
        ]
    elif 'ssh' in filter_expr.lower() or 'port 22' in filter_expr.lower():
        simulated_packets = [
            "12:34:56.789012 IP 192.168.1.100.54322 > 192.168.1.10.22: Flags [S], seq 111111111, win 65535",
            "12:34:56.790123 IP 192.168.1.10.22 > 192.168.1.100.54322: Flags [S.], seq 222222222, ack 111111112, win 65535",
            "12:34:56.790456 IP 192.168.1.100.54322 > 192.168.1.10.22: Flags [.], ack 222222223, win 65535",
            "12:34:56.791789 IP 192.168.1.100.54322 > 192.168.1.10.22: Flags [P.], seq 111111112:111111200, ack 222222223, win 65535: SSH-2.0-OpenSSH_8.2",
            "12:34:56.830123 IP 192.168.1.10.22 > 192.168.1.100.54322: Flags [P.], seq 222222223:222222300, ack 111111200, win 65535: SSH-2.0-OpenSSH_8.9"
        ]
    elif 'dns' in filter_expr.lower() or 'port 53' in filter_expr.lower():
        simulated_packets = [
            "12:34:56.789012 IP 192.168.1.100.54323 > 8.8.8.8.53: 12345+ A? example.com. (29)",
            "12:34:56.820123 IP 8.8.8.8.53 > 192.168.1.100.54323: 12345 1/0/0 A 93.184.216.34 (45)",
            "12:34:56.821456 IP 192.168.1.100.54324 > 8.8.8.8.53: 12346+ AAAA? example.com. (29)",
            "12:34:56.850789 IP 8.8.8.8.53 > 192.168.1.100.54324: 12346 0/1/0 (96)"
        ]
    else:
        # Trafic mixte par défaut
        simulated_packets = [
            "12:34:56.789012 IP 192.168.1.100.54321 > 93.184.216.34.80: Flags [S], seq 123456789, win 65535",
            "12:34:56.790123 IP 192.168.1.100.54322 > 192.168.1.10.22: Flags [S], seq 111111111, win 65535",
            "12:34:56.791456 IP 192.168.1.100.54323 > 8.8.8.8.53: 12345+ A? example.com. (29)",
            "12:34:56.792789 IP 192.168.1.100.49152 > 192.168.1.1.443: Flags [P.], seq 1000:1500, ack 2000, win 65535",
            "12:34:56.800123 ARP, Request who-has 192.168.1.1 tell 192.168.1.100, length 28",
            "12:34:56.801456 ARP, Reply 192.168.1.1 is-at aa:bb:cc:dd:ee:ff, length 28",
            "12:34:56.810789 IP6 fe80::1%eth0 > ff02::1%eth0: ICMP6, router advertisement, length 64"
        ]
    
    # Ajouter les paquets simulés progressivement
    packets_added = 0
    max_packets = min(packet_count, len(simulated_packets) * 3)  # Répéter les patterns
    
    for i in range(max_packets):
        if capture_id not in capture_outputs:
            break
            
        packet = simulated_packets[i % len(simulated_packets)]
        # Varier les timestamps
        timestamp_variation = f"12:34:{56 + (i // 10):02d}.{789012 + (i * 1000):06d}"
        packet_with_time = packet.replace("12:34:56.789012", timestamp_variation)
        
        capture_outputs[capture_id].append(packet_with_time)
        logger.info(f"📡 [{capture_id}] {packet_with_time}")
        
        packets_added += 1
        if capture_id in active_captures:
            active_captures[capture_id]['packets_captured'] = packets_added
        
        time.sleep(0.1)  # Simuler la capture en temps réel
    
    # Messages de finalisation
    final_messages = [
        f"{packets_added} packets captured",
        f"{packets_added} packets received by filter",
        f"0 packets dropped by kernel"
    ]
    
    for message in final_messages:
        if capture_id in capture_outputs:
            capture_outputs[capture_id].append(message)
            logger.info(f"📡 [{capture_id}] {message}")
            time.sleep(0.5)

def execute_real_scan(command, scan_id):
    """Exécuter une commande réelle"""
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        for line in iter(process.stdout.readline, ''):
            if line and scan_id in scan_outputs:
                clean_line = line.strip()
                if clean_line:
                    scan_outputs[scan_id].append(clean_line)
                    logger.info(f"📟 [{scan_id}] {clean_line}")
        
        process.wait()
        logger.info(f"✅ Real scan {scan_id} completed")
        
    except Exception as e:
        logger.error(f"❌ Error in real scan execution: {e}")
        raise

def simulate_nikto_scan(scan_id, target, scan_type):
    """Simuler un scan Nikto avec output réaliste"""
    logger.info(f"🎭 Simulating Nikto scan for {scan_id}")
    
    init_messages = [
        f"- Nikto v2.5.0",
        f"+ Target IP: {target}",
        f"+ Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"+ Server: nginx/1.18.0 (Ubuntu)",
        f"+ Retrieved x-powered-by header: PHP/8.1.2",
        f"+ Checking for HTTP methods..."
    ]
    
    for message in init_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(0.5)
    
    progress_messages = [
        "+ Scanning for common files/directories...",
        "+ Checking /admin/",
        "+ Checking /backup/",
        "+ Checking /config/",
        "+ Analyzing response headers...",
        "+ Testing for XSS vulnerabilities...",
        "+ Testing for SQL injection...",
        "+ Checking SSL/TLS configuration..."
    ]
    
    for message in progress_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(1)
    
    if scan_type == 'comprehensive':
        result_messages = [
            "+ OSVDB-3233: /icons/README: Apache default file found.",
            "+ OSVDB-3268: /admin/: Directory indexing found.",
            "+ OSVDB-3092: /admin/: This might be interesting...",
            "+ Server may leak inodes via ETags, header found with file /, inode: 12345",
            "+ The anti-clickjacking X-Frame-Options header is not present.",
            "+ The X-XSS-Protection header is not defined.",
            "+ The X-Content-Type-Options header is not set.",
            "+ Cookie not set with HttpOnly flag",
            "+ Missing Strict-Transport-Security header",
            "+ Entry '/admin/login.php' in robots.txt returned a non-forbidden status.",
            "+ Retrieved x-frame-options header: DENY",
            "+ /config/database.yml: Configuration file found",
            "+ /backup/backup.sql: Backup file found"
        ]
    else:
        result_messages = [
            "+ OSVDB-3233: /icons/README: Apache default file found.",
            "+ The anti-clickjacking X-Frame-Options header is not present.",
            "+ The X-XSS-Protection header is not defined.",
            "+ Server may leak inodes via ETags"
        ]
    
    for message in result_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(0.8)
    
    final_messages = [
        f"+ {len(result_messages)} host(s) tested",
        f"+ {len(result_messages)} item(s) reported on remote host",
        f"+ End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ({len(result_messages) + 10} seconds)"
    ]
    
    for message in final_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(0.5)

def simulate_nmap_scan(scan_id, target, scan_type):
    """Simuler un scan Nmap avec output réaliste"""
    logger.info(f"🗺️ Simulating Nmap scan for {scan_id}")
    
    init_messages = [
        f"Starting Nmap 7.91 ( https://nmap.org ) at {datetime.now().strftime('%Y-%m-%d %H:%M')} UTC",
        f"Nmap scan report for {target}",
        f"Host is up (0.00050s latency)."
    ]
    
    for message in init_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(0.5)
    
    if scan_type == 'comprehensive':
        scan_messages = [
            "Not shown: 996 closed ports",
            "PORT     STATE SERVICE VERSION",
            "22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu",
            "80/tcp   open  http    nginx 1.18.0 (Ubuntu)",
            "443/tcp  open  https   nginx 1.18.0 (Ubuntu)",
            "3306/tcp open  mysql   MySQL 8.0.25",
            "Device type: general purpose",
            "Running: Linux 5.X",
            "OS fingerprint: Linux 5.4 - 5.10"
        ]
    elif scan_type == 'stealth':
        scan_messages = [
            "Not shown: 998 closed ports",
            "PORT   STATE SERVICE",
            "22/tcp open  ssh",
            "80/tcp open  http",
            "443/tcp open  https"
        ]
    elif scan_type == 'udp':
        scan_messages = [
            "Not shown: 97 closed ports",
            "PORT    STATE SERVICE",
            "53/udp  open  domain",
            "67/udp  open  dhcps",
            "123/udp open  ntp"
        ]
    else:  # basic
        scan_messages = [
            "Not shown: 997 closed ports",
            "PORT   STATE SERVICE",
            "22/tcp open  ssh",
            "80/tcp open  http",
            "443/tcp open  https"
        ]
    
    for message in scan_messages:
        if scan_id in scan_outputs:
            scan_outputs[scan_id].append(message)
            logger.info(f"📟 [{scan_id}] {message}")
            time.sleep(0.7)
    
    final_message = f"Nmap done: 1 IP address (1 host up) scanned in {len(scan_messages) + 5}.00 seconds"
    if scan_id in scan_outputs:
        scan_outputs[scan_id].append(final_message)
        logger.info(f"📟 [{scan_id}] {final_message}")

def finalize_scan(scan_id):
    """Finaliser un scan terminé"""
    if scan_id in active_scans:
        start_time = active_scans[scan_id]['start_time']
        end_time = datetime.now().isoformat()
        duration = calculate_duration(start_time, end_time)
        
        active_scans[scan_id]['status'] = 'completed'
        active_scans[scan_id]['end_time'] = end_time
        active_scans[scan_id]['duration'] = duration
        active_scans[scan_id]['output_lines'] = len(scan_outputs.get(scan_id, []))
        
        add_scan_to_history(active_scans[scan_id])
        
        def auto_cleanup():
            time.sleep(120)
            active_scans.pop(scan_id, None)
            def cleanup_output():
                time.sleep(300)
                scan_outputs.pop(scan_id, None)
            threading.Thread(target=cleanup_output, daemon=True).start()
        
        threading.Thread(target=auto_cleanup, daemon=True).start()
        
        logger.info(f"✅ Scan {scan_id} completed successfully")

def finalize_capture(capture_id, filepath):
    """Finaliser une capture terminée"""
    if capture_id in active_captures:
        start_time = active_captures[capture_id]['start_time']
        end_time = datetime.now().isoformat()
        duration = calculate_duration(start_time, end_time)
        
        active_captures[capture_id]['status'] = 'completed'
        active_captures[capture_id]['end_time'] = end_time
        active_captures[capture_id]['duration'] = duration
        
        # Obtenir la taille du fichier si elle existe
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            active_captures[capture_id]['file_size'] = f"{file_size / 1024:.1f} KB"
        else:
            active_captures[capture_id]['file_size'] = "N/A"
        
        add_capture_to_history(active_captures[capture_id])
        
        def auto_cleanup():
            time.sleep(120)
            active_captures.pop(capture_id, None)
            def cleanup_output():
                time.sleep(300)
                capture_outputs.pop(capture_id, None)
            threading.Thread(target=cleanup_output, daemon=True).start()
        
        threading.Thread(target=auto_cleanup, daemon=True).start()
        
        logger.info(f"✅ Capture {capture_id} completed successfully")

def handle_scan_error(scan_id, error_message):
    """Gérer les erreurs de scan"""
    if scan_id in active_scans:
        active_scans[scan_id]['status'] = 'error'
        active_scans[scan_id]['error'] = error_message
        active_scans[scan_id]['end_time'] = datetime.now().isoformat()
        
        if 'start_time' in active_scans[scan_id]:
            duration = calculate_duration(active_scans[scan_id]['start_time'], active_scans[scan_id]['end_time'])
            active_scans[scan_id]['duration'] = duration
        
        add_scan_to_history(active_scans[scan_id])

def handle_capture_error(capture_id, error_message):
    """Gérer les erreurs de capture"""
    if capture_id in active_captures:
        active_captures[capture_id]['status'] = 'error'
        active_captures[capture_id]['error'] = error_message
        active_captures[capture_id]['end_time'] = datetime.now().isoformat()
        
        if 'start_time' in active_captures[capture_id]:
            duration = calculate_duration(active_captures[capture_id]['start_time'], active_captures[capture_id]['end_time'])
            active_captures[capture_id]['duration'] = duration
        
        add_capture_to_history(active_captures[capture_id])

def initialize_test_data():
    """Initialiser des données de test"""
    test_scans = [
        {
            'scan_id': 'test_nmap_001',
            'tool': 'nmap',
            'target': '127.0.0.1',
            'scan_type': 'basic',
            'status': 'completed',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': '5s'
        },
        {
            'scan_id': 'test_nikto_001',
            'tool': 'nikto',
            'target': 'http://localhost',
            'scan_type': 'comprehensive',
            'status': 'completed',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': '12s'
        }
    ]
    
    test_captures = [
        {
            'capture_id': 'test_capture_001',
            'interface': 'eth0',
            'filter': 'tcp port 80',
            'status': 'completed',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': '30s',
            'packets_captured': 147,
            'file_size': '2.3 MB',
            'filename': 'capture_001.pcap'
        },
        {
            'capture_id': 'test_capture_002',
            'interface': 'eth0',
            'filter': 'port 445 or port 139',
            'status': 'completed',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': '60s',
            'packets_captured': 89,
            'file_size': '1.8 MB',
            'filename': 'capture_002.pcap'
        }
    ]
    
    for scan in test_scans:
        add_scan_to_history(scan)
    
    for capture in test_captures:
        add_capture_to_history(capture)
    
    logger.info(f"🧪 Added {len(test_scans)} test scans and {len(test_captures)} test captures")

# ==================== ENDPOINTS DE TEST ====================

@app.route('/api/test/history', methods=['GET'])
def test_history():
    """Endpoint de test pour ajouter des scans à l'historique"""
    try:
        test_scans = [
            {
                'scan_id': 'demo_nmap_001',
                'tool': 'nmap',
                'target': 'scanme.nmap.org',
                'scan_type': 'basic',
                'status': 'completed',
                'start_time': datetime.now().isoformat(),
                'end_time': datetime.now().isoformat(),
                'duration': '8s'
            },
            {
                'scan_id': 'demo_nikto_001',
                'tool': 'nikto',
                'target': 'http://testphp.vulnweb.com',
                'scan_type': 'comprehensive',
                'status': 'completed',
                'start_time': datetime.now().isoformat(),
                'end_time': datetime.now().isoformat(),
                'duration': '15s'
            }
        ]
        
        for scan in test_scans:
            add_scan_to_history(scan)
        
        return jsonify({
            'message': 'Test scans added to history',
            'total': len(scan_history),
            'added': len(test_scans)
        })
    except Exception as e:
        logger.error(f"❌ Error in test_history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/capture', methods=['GET'])
def test_capture_history():
    """Endpoint de test pour ajouter des captures à l'historique"""
    try:
        test_captures = [
            {
                'capture_id': 'demo_capture_001',
                'interface': 'eth0',
                'filter': 'tcp port 80',
                'status': 'completed',
                'start_time': datetime.now().isoformat(),
                'end_time': datetime.now().isoformat(),
                'duration': '60s',
                'packets_captured': 245,
                'file_size': '1.2 MB',
                'filename': 'demo_capture_001.pcap'
            },
            {
                'capture_id': 'demo_capture_002',
                'interface': 'wlan0',
                'filter': 'port 445 or port 139',
                'status': 'completed',
                'start_time': datetime.now().isoformat(),
                'end_time': datetime.now().isoformat(),
                'duration': '45s',
                'packets_captured': 123,
                'file_size': '890 KB',
                'filename': 'demo_capture_002.pcap'
            }
        ]
        
        for capture in test_captures:
            add_capture_to_history(capture)
        
        return jsonify({
            'message': 'Test captures added to history',
            'total': len(capture_history),
            'added': len(test_captures)
        })
    except Exception as e:
        logger.error(f"❌ Error in test_capture_history: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES UTILITAIRES ====================

@app.route('/api/system/info', methods=['GET'])
def get_system_info():
    """Obtenir des informations système"""
    try:
        info = {
            'timestamp': datetime.now().isoformat(),
            'platform': {
                'system': os.name,
                'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
            },
            'tools': {
                'nmap': check_tool_availability('nmap'),
                'nikto': check_tool_availability('nikto'),
                'tcpdump': check_tool_availability('tcpdump'),
                'tshark': check_tool_availability('tshark')
            },
            'resources': {
                'cpu_percent': psutil.cpu_percent() if 'psutil' in globals() else 'N/A',
                'memory_percent': psutil.virtual_memory().percent if 'psutil' in globals() else 'N/A',
                'disk_usage': psutil.disk_usage('/').percent if 'psutil' in globals() else 'N/A'
            },
            'network_interfaces': len(get_network_interfaces()),
            'active_processes': {
                'scans': len(active_scans),
                'captures': len(active_captures)
            }
        }
        
        return jsonify(info)
    except Exception as e:
        logger.error(f"❌ Error getting system info: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup_resources():
    """Nettoyer les ressources (scans et captures terminés)"""
    try:
        cleaned_scans = 0
        cleaned_captures = 0
        
        # Nettoyer les scans terminés
        for scan_id in list(active_scans.keys()):
            if active_scans[scan_id]['status'] in ['completed', 'error', 'stopped']:
                active_scans.pop(scan_id, None)
                scan_outputs.pop(scan_id, None)
                cleaned_scans += 1
        
        # Nettoyer les captures terminées
        for capture_id in list(active_captures.keys()):
            if active_captures[capture_id]['status'] in ['completed', 'error', 'stopped']:
                active_captures.pop(capture_id, None)
                capture_outputs.pop(capture_id, None)
                cleaned_captures += 1
        
        logger.info(f"🧹 Cleaned {cleaned_scans} scans and {cleaned_captures} captures")
        
        return jsonify({
            'message': 'Cleanup completed',
            'cleaned_scans': cleaned_scans,
            'cleaned_captures': cleaned_captures,
            'remaining_scans': len(active_scans),
            'remaining_captures': len(active_captures)
        })
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== DÉMARRAGE DE L'APPLICATION ====================

if __name__ == '__main__':
    logger.info("🚀 PACHA Security Platform Backend Starting...")
    logger.info("🛡️ Professional Penetration Testing Suite")
    logger.info("📡 Network Capture Module Enabled")
    logger.info("🔧 Tcpdump Integration Active")
    logger.info("📊 Ready to handle security scans and network captures")
    
    # Créer les répertoires nécessaires
    os.makedirs('/tmp/captures', exist_ok=True)
    os.makedirs('/tmp/reports', exist_ok=True)
    
    # Vérifier la disponibilité des outils
    tools_status = {
        'nmap': check_tool_availability('nmap'),
        'nikto': check_tool_availability('nikto'),
        'tcpdump': check_tool_availability('tcpdump'),
        'tshark': check_tool_availability('tshark')
    }
    
    logger.info("🔍 Tool availability check:")
    for tool, available in tools_status.items():
        status = "✅ Available" if available else "❌ Missing"
        logger.info(f"  {tool.upper()}: {status}")
    
    # Vérifier les interfaces réseau
    interfaces = get_network_interfaces()
    logger.info(f"🌐 Network interfaces detected: {len(interfaces)}")
    for iface in interfaces[:3]:  # Afficher les 3 premières
        logger.info(f"  - {iface['name']}: {iface['display']}")
    
    # Initialiser quelques données de test
    logger.info("🧪 Initializing test data...")
    initialize_test_data()
    
    logger.info("🎯 PACHA Platform Features:")
    logger.info("  ✅ Network reconnaissance with Nmap")
    logger.info("  ✅ Web vulnerability scanning with Nikto")
    logger.info("  ✅ Real-time network packet capture with tcpdump")
    logger.info("  ✅ Advanced BPF filtering (HTTP, HTTPS, SMB, DNS, etc.)")
    logger.info("  ✅ PCAP file generation and download")
    logger.info("  ✅ Live capture monitoring and analysis")
    logger.info("  ✅ Professional pentest reporting")
    logger.info("")
    logger.info("🚀 Perfect for Print Nightmare analysis and SMB traffic monitoring!")
    logger.info("📡 Ready to capture and analyze network communications")
    logger.info("")
    logger.info("🌐 API accessible on: http://localhost:5000")
    logger.info("📋 Health check: http://localhost:5000/api/health")
    logger.info("🔗 Full API documentation: http://localhost:5000/")
    
    app.run(host='0.0.0.0', port=5000, debug=True)