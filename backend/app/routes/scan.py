# backend/app/routes/scan.py
from flask import Blueprint, request, jsonify
import subprocess
import uuid
import os
import threading
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import logging
import re

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

# Configuration des outils
TOOLS_CONFIG = {
    'nmap': {
        'binary': 'nmap',
        'max_timeout': 300,
        'allowed_args': ['-sV', '-sS', '-sT', '-sU', '-sC', '-A', '-O', '-p', '-T1', '-T2', '-T3', '-T4', '-T5']
    },
    'masscan': {
        'binary': 'masscan',
        'max_timeout': 180,
        'max_rate': 10000
    }
}

# Dictionnaire pour stocker les tâches en cours
active_tasks = {}

# Fonctions utilitaires
def validate_target(target):
    """Validation sécurisée des cibles"""
    if not target:
        return False
    
    # Cibles autorisées pour les tests
    allowed_targets = [
        "127.0.0.1", "localhost", 
        "printnightmare.thm", "metasploitable.thm",
        "scanme.nmap.org"
    ]
    
    # Plages IP autorisées (environnements de test)
    allowed_ranges = [
        "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
        "10.0.", "10.1.", "10.2."
    ]
    
    # Vérification directe
    if target in allowed_targets:
        return True
    
    # Vérification des plages
    for range_prefix in allowed_ranges:
        if target.startswith(range_prefix):
            return True
    
    return False

def sanitize_args(args, tool_type='nmap'):
    """Nettoyage et validation des arguments"""
    if not args:
        return "-sV"  # Par défaut
    
    # Suppression des caractères dangereux
    dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '"', "'"]
    clean_args = args
    for char in dangerous_chars:
        clean_args = clean_args.replace(char, '')
    
    if tool_type == 'nmap':
        # Validation des arguments Nmap
        allowed_args = TOOLS_CONFIG['nmap']['allowed_args']
        arg_parts = clean_args.split()
        validated_args = []
        
        for part in arg_parts:
            if any(part.startswith(allowed) for allowed in allowed_args):
                validated_args.append(part)
        
        return ' '.join(validated_args) if validated_args else "-sV"
    
    return clean_args

def create_task(task_type, data):
    """Création d'une nouvelle tâche"""
    task_id = str(uuid.uuid4())
    task = {
        'id': task_id,
        'type': task_type,
        'status': 'created',
        'created_at': datetime.now().isoformat(),
        'data': data,
        'result': None,
        'error': None
    }
    active_tasks[task_id] = task
    logger.info(f"📝 Tâche créée: {task_id} ({task_type})")
    return task_id

def update_task_status(task_id, status, result=None, error=None):
    """Mise à jour du statut d'une tâche"""
    if task_id in active_tasks:
        active_tasks[task_id]['status'] = status
        active_tasks[task_id]['updated_at'] = datetime.now().isoformat()
        if result:
            active_tasks[task_id]['result'] = result
        if error:
            active_tasks[task_id]['error'] = error
        logger.info(f"📝 Tâche {task_id}: {status}")

def parse_nmap_output(output):
    """Parsing avancé de la sortie Nmap"""
    result = {
        'hosts_up': 0,
        'hosts_scanned': 0,
        'open_ports': [],
        'services': [],
        'os_detection': [],
        'raw_output': output
    }
    
    lines = output.split('\n')
    current_host = None
    
    for line in lines:
        line = line.strip()
        
        # Détection d'hôtes actifs
        if 'Nmap scan report for' in line:
            current_host = line.split('for ')[1].split(' ')[0]
            result['hosts_up'] += 1
        
        # Ports ouverts
        if current_host and '/tcp' in line or '/udp' in line:
            parts = line.split()
            if len(parts) >= 3 and 'open' in parts[1]:
                port_info = {
                    'host': current_host,
                    'port': parts[0],
                    'state': parts[1],
                    'service': parts[2] if len(parts) > 2 else 'unknown'
                }
                result['open_ports'].append(port_info)
        
        # Détection OS
        if 'OS details:' in line:
            result['os_detection'].append(line.replace('OS details: ', ''))
    
    # Statistiques finales
    for line in lines:
        if 'Nmap done:' in line:
            match = re.search(r'(\d+) IP address.*scanned', line)
            if match:
                result['hosts_scanned'] = int(match.group(1))
    
    return result

def run_nmap_scan(target, args, task_id):
    """Exécution d'un scan Nmap en arrière-plan"""
    try:
        update_task_status(task_id, 'running')
        
        # Construction de la commande
        safe_args = sanitize_args(args, 'nmap')
        cmd = ['nmap'] + safe_args.split() + [target]
        
        logger.info(f"🔍 Commande Nmap: {' '.join(cmd)}")
        
        # Exécution avec timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TOOLS_CONFIG['nmap']['max_timeout']
        )
        
        if result.returncode == 0:
            parsed_result = parse_nmap_output(result.stdout)
            
            # Sauvegarde du rapport
            report_file = f"/app/reports/nmap_scan_{task_id}.txt"
            with open(report_file, 'w') as f:
                f.write(result.stdout)
            
            parsed_result['report_file'] = report_file
            parsed_result['command'] = ' '.join(cmd)
            
            update_task_status(task_id, 'completed', parsed_result)
            logger.info(f"✅ Scan Nmap terminé: {task_id}")
        else:
            error_msg = result.stderr or "Erreur inconnue"
            update_task_status(task_id, 'failed', error=error_msg)
            logger.error(f"❌ Erreur Nmap: {error_msg}")
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, 'timeout', error="Timeout dépassé")
        logger.error(f"⏰ Timeout Nmap: {task_id}")
    except Exception as e:
        update_task_status(task_id, 'error', error=str(e))
        logger.error(f"❌ Exception Nmap: {e}")

def run_masscan_scan(target, ports, rate, task_id):
    """Exécution d'un scan Masscan en arrière-plan"""
    try:
        update_task_status(task_id, 'running')
        
        # Validation du rate
        safe_rate = min(int(rate), TOOLS_CONFIG['masscan']['max_rate'])
        
        # Construction de la commande
        cmd = [
            'masscan',
            target,
            '-p', str(ports),
            '--rate', str(safe_rate),
            '--output-format', 'xml'
        ]
        
        logger.info(f"🚀 Commande Masscan: {' '.join(cmd)}")
        
        # Exécution avec timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TOOLS_CONFIG['masscan']['max_timeout']
        )
        
        if result.returncode == 0:
            # Parsing XML si disponible
            parsed_result = {
                'raw_output': result.stdout,
                'command': ' '.join(cmd),
                'open_ports': []
            }
            
            # Tentative de parsing XML
            try:
                root = ET.fromstring(result.stdout)
                for host in root.findall('.//host'):
                    addr = host.find('address').get('addr')
                    for port in host.findall('.//port'):
                        parsed_result['open_ports'].append({
                            'host': addr,
                            'port': port.get('portid'),
                            'protocol': port.get('protocol'),
                            'state': port.find('state').get('state')
                        })
            except ET.ParseError:
                logger.warning("⚠️ Impossible de parser la sortie XML Masscan")
            
            # Sauvegarde du rapport
            report_file = f"/app/reports/masscan_scan_{task_id}.xml"
            with open(report_file, 'w') as f:
                f.write(result.stdout)
            
            parsed_result['report_file'] = report_file
            
            update_task_status(task_id, 'completed', parsed_result)
            logger.info(f"✅ Scan Masscan terminé: {task_id}")
        else:
            error_msg = result.stderr or "Erreur inconnue"
            update_task_status(task_id, 'failed', error=error_msg)
            logger.error(f"❌ Erreur Masscan: {error_msg}")
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, 'timeout', error="Timeout dépassé")
        logger.error(f"⏰ Timeout Masscan: {task_id}")
    except Exception as e:
        update_task_status(task_id, 'error', error=str(e))
        logger.error(f"❌ Exception Masscan: {e}")

# Routes de l'API
@scan_bp.route("/test", methods=["GET", "POST"])
def test_scan():
    """Test de la route scan"""
    return jsonify({
        "message": "Module scan fonctionnel !",
        "version": "2.0",
        "available_endpoints": [
            "/api/scan/nmap",
            "/api/scan/masscan",
            "/api/scan/status/<task_id>",
            "/api/scan/tasks"
        ]
    })

@scan_bp.route("/nmap", methods=["POST"])
def start_nmap_scan():
    """Lancement d'un scan Nmap"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Données JSON requises"}), 400
        
        target = data.get('target')
        args = data.get('args', '-sV')
        
        # Validation
        if not target:
            return jsonify({"error": "Paramètre 'target' requis"}), 400
        
        if not validate_target(target):
            return jsonify({"error": "Cible non autorisée"}), 403
        
        # Création de la tâche
        task_id = create_task('nmap_scan', {
            'target': target,
            'args': args,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(
            target=run_nmap_scan,
            args=(target, args, task_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "target": target,
            "args": args,
            "message": "Scan Nmap démarré"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage Nmap: {e}")
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/masscan", methods=["POST"])
def start_masscan_scan():
    """Lancement d'un scan Masscan"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Données JSON requises"}), 400
        
        target = data.get('target')
        ports = data.get('ports', '1-1000')
        rate = data.get('rate', '1000')
        
        # Validation
        if not target:
            return jsonify({"error": "Paramètre 'target' requis"}), 400
        
        if not validate_target(target):
            return jsonify({"error": "Cible non autorisée"}), 403
        
        # Création de la tâche
        task_id = create_task('masscan_scan', {
            'target': target,
            'ports': ports,
            'rate': rate,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(
            target=run_masscan_scan,
            args=(target, ports, rate, task_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "target": target,
            "ports": ports,
            "rate": rate,
            "message": "Scan Masscan démarré"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage Masscan: {e}")
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/status/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """Récupération du statut d'une tâche"""
    if task_id not in active_tasks:
        return jsonify({"error": "Tâche non trouvée"}), 404
    
    task = active_tasks[task_id]
    return jsonify(task)

@scan_bp.route("/tasks", methods=["GET"])
def list_tasks():
    """Liste de toutes les tâches"""
    return jsonify({
        "total_tasks": len(active_tasks),
        "tasks": list(active_tasks.values())
    })

@scan_bp.route("/kill/<task_id>", methods=["POST"])
def kill_task(task_id):
    """Arrêt d'une tâche (si possible)"""
    if task_id not in active_tasks:
        return jsonify({"error": "Tâche non trouvée"}), 404
    
    update_task_status(task_id, 'killed')
    return jsonify({
        "task_id": task_id,
        "status": "killed",
        "message": "Tâche marquée comme arrêtée"
    })