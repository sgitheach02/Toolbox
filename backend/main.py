#!/usr/bin/env python3
# main.py - Backend PACHA Security Platform FONCTIONNEL
import os
import sys
import json
import uuid
import subprocess
import threading
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import psutil
import logging

# Configuration Flask
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Variables globales
active_scans = {}
scan_history = []
scan_outputs = {}

# Configuration des répertoires
REPORTS_DIR = "/app/reports"
TEMP_DIR = "/app/temp"

# Créer les répertoires nécessaires
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# ==================== UTILITAIRES ====================

def check_tool_available(tool_name):
    """Vérifier si un outil est disponible"""
    try:
        result = subprocess.run(['which', tool_name], capture_output=True, text=True)
        return result.returncode == 0
    except:
        return False

def generate_scan_id():
    """Générer un ID unique pour un scan"""
    return str(uuid.uuid4())[:8]

def get_timestamp():
    """Obtenir un timestamp formaté"""
    return datetime.now().isoformat()

def execute_command(command, scan_id):
    """Exécuter une commande et capturer l'output"""
    logger.info(f"🚀 Exécution commande scan {scan_id}: {' '.join(command)}")
    
    try:
        # Initialiser l'output pour ce scan
        scan_outputs[scan_id] = []
        
        # Mettre à jour le statut
        if scan_id in active_scans:
            active_scans[scan_id]['status'] = 'running'
        
        # Exécuter la commande
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Lire l'output ligne par ligne
        output_lines = []
        for line in iter(process.stdout.readline, ''):
            line = line.strip()
            if line:
                output_lines.append(line)
                scan_outputs[scan_id].append(line)
                logger.info(f"📄 Scan {scan_id}: {line}")
        
        # Attendre la fin du processus
        process.wait()
        
        # Mettre à jour le statut final
        if scan_id in active_scans:
            active_scans[scan_id]['status'] = 'completed' if process.returncode == 0 else 'error'
            active_scans[scan_id]['end_time'] = get_timestamp()
            active_scans[scan_id]['return_code'] = process.returncode
            
            # Ajouter à l'historique
            scan_history.append(active_scans[scan_id].copy())
            
            # Retirer des scans actifs après un délai
            threading.Timer(5.0, lambda: active_scans.pop(scan_id, None)).start()
        
        logger.info(f"✅ Scan {scan_id} terminé avec code {process.returncode}")
        return output_lines, process.returncode
        
    except Exception as e:
        logger.error(f"❌ Erreur scan {scan_id}: {e}")
        if scan_id in active_scans:
            active_scans[scan_id]['status'] = 'error'
            active_scans[scan_id]['error'] = str(e)
        return [], 1

# ==================== ROUTES API ====================

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check de l'API"""
    if request.method == 'OPTIONS':
        return '', 200
    
    tools_status = {
        'nmap': check_tool_available('nmap'),
        'nikto': check_tool_available('nikto'),
        'masscan': check_tool_available('masscan'),
        'dirb': check_tool_available('dirb')
    }
    
    return jsonify({
        'status': 'healthy',
        'message': 'PACHA Security Platform API',
        'version': '2.0.0',
        'tools_available': tools_status,
        'active_scans': len(active_scans),
        'timestamp': get_timestamp()
    })

@app.route('/api/tools/status', methods=['GET', 'OPTIONS'])
def get_tools_status():
    """Statut des outils de sécurité"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'nmap': check_tool_available('nmap'),
        'nikto': check_tool_available('nikto'),
        'masscan': check_tool_available('masscan'),
        'dirb': check_tool_available('dirb'),
        'gobuster': check_tool_available('gobuster'),
        'sqlmap': check_tool_available('sqlmap')
    })

@app.route('/api/scan/types', methods=['GET', 'OPTIONS'])
def get_scan_types():
    """Types de scans disponibles"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'nmap': {
            'basic': {
                'name': 'Basic Port Scan',
                'description': 'Fast TCP port scan (-sS -T4)',
                'estimated_time': '1-5 minutes'
            },
            'stealth': {
                'name': 'Stealth SYN Scan',
                'description': 'Stealthy SYN scan (-sS -T2)',
                'estimated_time': '5-15 minutes'
            },
            'comprehensive': {
                'name': 'Comprehensive Scan',
                'description': 'Service detection + OS fingerprinting (-sC -sV -O)',
                'estimated_time': '10-30 minutes'
            },
            'udp': {
                'name': 'UDP Scan',
                'description': 'UDP port discovery (-sU --top-ports 1000)',
                'estimated_time': '15-45 minutes'
            }
        },
        'nikto': {
            'fast': {
                'name': 'Fast Web Scan',
                'description': 'Quick vulnerability assessment (-Tuning 1,2,3)',
                'estimated_time': '2-10 minutes'
            },
            'comprehensive': {
                'name': 'Deep Web Scan',
                'description': 'Comprehensive web vulnerability scan (-Tuning 1,2,3,4,5,6,7,8,9)',
                'estimated_time': '10-60 minutes'
            }
        }
    })

@app.route('/api/scan/start', methods=['POST', 'OPTIONS'])
def start_scan():
    """Démarrer un nouveau scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        tool = data.get('tool', 'nmap')
        target = data.get('target', '')
        scan_type = data.get('scanType', 'basic')
        
        if not target:
            return jsonify({'error': 'Target is required'}), 400
        
        # Vérifier que l'outil est disponible
        if not check_tool_available(tool):
            return jsonify({'error': f'{tool} is not available on this system'}), 400
        
        # Générer un ID de scan
        scan_id = generate_scan_id()
        
        # Préparer la commande selon l'outil
        if tool == 'nmap':
            command = build_nmap_command(target, scan_type)
        elif tool == 'nikto':
            command = build_nikto_command(target, scan_type)
        else:
            return jsonify({'error': f'Unsupported tool: {tool}'}), 400
        
        # Créer l'entrée de scan
        scan_entry = {
            'scan_id': scan_id,
            'tool': tool,
            'target': target,
            'scan_type': scan_type,
            'status': 'starting',
            'start_time': get_timestamp(),
            'command': ' '.join(command)
        }
        
        active_scans[scan_id] = scan_entry
        
        # Démarrer le scan en arrière-plan
        thread = threading.Thread(target=execute_command, args=(command, scan_id))
        thread.daemon = True
        thread.start()
        
        logger.info(f"🎯 Scan {scan_id} démarré: {tool} {target}")
        
        return jsonify({
            'scan_id': scan_id,
            'status': 'started',
            'message': f'{tool} scan started successfully',
            'target': target,
            'scan_type': scan_type
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage scan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/active', methods=['GET', 'OPTIONS'])
def get_active_scans():
    """Obtenir la liste des scans actifs"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify(list(active_scans.values()))

@app.route('/api/scan/history', methods=['GET', 'OPTIONS'])
def get_scan_history():
    """Obtenir l'historique des scans"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Trier par date de début (plus récent en premier)
    sorted_history = sorted(scan_history, key=lambda x: x.get('start_time', ''), reverse=True)
    return jsonify(sorted_history[:50])  # Limiter à 50 résultats

@app.route('/api/scan/live/<scan_id>', methods=['GET', 'OPTIONS'])
def get_live_output(scan_id):
    """Obtenir l'output en temps réel d'un scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    if scan_id not in scan_outputs:
        return jsonify({'error': 'Scan not found'}), 404
    
    # Récupérer les nouvelles lignes depuis la dernière fois
    last_line = int(request.args.get('last_line', 0))
    output_lines = scan_outputs[scan_id]
    new_lines = output_lines[last_line:] if last_line < len(output_lines) else []
    
    is_running = scan_id in active_scans and active_scans[scan_id]['status'] == 'running'
    
    return jsonify({
        'scan_id': scan_id,
        'new_lines': new_lines,
        'total_lines': len(output_lines),
        'last_line': len(output_lines),
        'is_running': is_running
    })

@app.route('/api/scan/stop/<scan_id>', methods=['POST', 'OPTIONS'])
def stop_scan(scan_id):
    """Arrêter un scan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    if scan_id not in active_scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    # Marquer comme arrêté
    active_scans[scan_id]['status'] = 'stopped'
    active_scans[scan_id]['end_time'] = get_timestamp()
    
    # Ajouter à l'historique
    scan_history.append(active_scans[scan_id].copy())
    
    # Retirer des scans actifs
    del active_scans[scan_id]
    
    logger.info(f"🛑 Scan {scan_id} arrêté")
    
    return jsonify({
        'scan_id': scan_id,
        'status': 'stopped',
        'message': 'Scan stopped successfully'
    })

# ==================== FONCTIONS DE CONSTRUCTION DE COMMANDES ====================

def build_nmap_command(target, scan_type):
    """Construire la commande Nmap"""
    base_cmd = ['nmap']
    
    if scan_type == 'basic':
        cmd = base_cmd + ['-sS', '-T4', '--open', target]
    elif scan_type == 'stealth':
        cmd = base_cmd + ['-sS', '-T2', '--open', target]
    elif scan_type == 'comprehensive':
        cmd = base_cmd + ['-sC', '-sV', '-O', '-T4', '--open', target]
    elif scan_type == 'udp':
        cmd = base_cmd + ['-sU', '--top-ports', '1000', '-T4', target]
    else:
        cmd = base_cmd + ['-sS', '-T4', '--open', target]
    
    return cmd

def build_nikto_command(target, scan_type):
    """Construire la commande Nikto"""
    base_cmd = ['nikto', '-h', target]
    
    if scan_type == 'fast':
        cmd = base_cmd + ['-Tuning', '1,2,3', '-timeout', '10']
    elif scan_type == 'comprehensive':
        cmd = base_cmd + ['-Tuning', '1,2,3,4,5,6,7,8,9', '-timeout', '20']
    else:
        cmd = base_cmd + ['-Tuning', '1,2,3', '-timeout', '10']
    
    return cmd

# ==================== POINT D'ENTRÉE ====================

if __name__ == '__main__':
    logger.info("🚀 Démarrage PACHA Security Platform Backend")
    logger.info(f"📁 Reports directory: {REPORTS_DIR}")
    logger.info(f"📁 Temp directory: {TEMP_DIR}")
    
    # Vérifier les outils disponibles
    tools = ['nmap', 'nikto', 'masscan', 'dirb']
    for tool in tools:
        status = "✅" if check_tool_available(tool) else "❌"
        logger.info(f"{status} {tool.upper()}")
    
    # Démarrer le serveur
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )