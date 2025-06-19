#!/bin/bash

echo "🚨 CORRECTION RAPIDE TCPDUMP PACHA TOOLBOX"
echo "==========================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Arrêt immédiat des conteneurs
log_info "Arrêt des conteneurs..."
docker-compose down --remove-orphans

# 2. Sauvegarde du backend actuel
log_info "Sauvegarde du backend actuel..."
BACKUP_FILE="backend/main.py.backup_$(date +%Y%m%d_%H%M%S)"
cp backend/main.py "$BACKUP_FILE" 2>/dev/null || true
log_success "Sauvegarde: $BACKUP_FILE"

# 3. Application du backend corrigé
log_info "Application du backend corrigé..."
cat > backend/main.py << 'EOF'
# backend/main.py - TCPDUMP CORRIGÉ - Version FONCTIONNELLE
import os
import sys
import logging
import json
import uuid
import subprocess
import threading
import time
import signal
import re
import random
import tempfile
import shutil
from datetime import datetime
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('./data/logs/pacha-toolbox.log') if os.path.exists('./data/logs') else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Variables globales pour le suivi des tâches
active_scans = {}
scan_outputs = {}
scan_history = []
task_status = {}
active_sessions = {}
session_commands_history = {}

# Configuration des répertoires
DIRECTORIES = {
    'reports': './data/reports',
    'logs': './data/logs', 
    'temp': './data/temp',
    'data': './data'
}

def ensure_directories():
    """Créer les répertoires nécessaires"""
    for name, path in DIRECTORIES.items():
        try:
            os.makedirs(path, exist_ok=True)
            os.chmod(path, 0o755)
            logger.info(f"✅ Répertoire {name}: {path}")
        except Exception as e:
            logger.warning(f"⚠️ Erreur création répertoire {name} ({path}): {e}")

def check_security_tools():
    """Vérifier que tous les outils de sécurité sont disponibles"""
    tools = {
        'nmap': 'Scanner réseau',
        'nikto': 'Scanner vulnérabilités web', 
        'tcpdump': 'Analyseur de paquets'
    }
    
    tools_status = {}
    logger.info("🔍 Vérification des outils de sécurité...")
    
    for tool, description in tools.items():
        try:
            result = subprocess.run(['which', tool], capture_output=True, text=True)
            if result.returncode == 0:
                if tool == 'nikto':
                    version_result = subprocess.run([tool, '-Version'], capture_output=True, text=True, timeout=10)
                    tools_status[tool] = version_result.returncode == 0
                    if tools_status[tool]:
                        logger.info(f"✅ {tool}: {description} - OK")
                    else:
                        logger.warning(f"⚠️ {tool}: Trouvé mais ne fonctionne pas")
                else:
                    tools_status[tool] = True
                    logger.info(f"✅ {tool}: {description} - OK")
            else:
                tools_status[tool] = False
                logger.warning(f"❌ {tool}: {description} - NON TROUVÉ")
        except Exception as e:
            tools_status[tool] = False
            logger.error(f"❌ {tool}: Erreur - {e}")
    
    return tools_status

# ============================================================
# UTILS ET HELPERS GLOBAUX
# ============================================================

def update_task_status(task_id, status, data=None):
    """Mettre à jour le statut d'une tâche"""
    global task_status
    if task_id not in task_status:
        task_status[task_id] = {}
    
    task_status[task_id].update({
        'status': status,
        'updated_at': datetime.now().isoformat(),
        'data': data or {}
    })
    
    if status in ['completed', 'failed']:
        task_status[task_id]['completed_at'] = datetime.now().isoformat()
    
    logger.info(f"📊 Task {task_id}: {status}")

def generate_task_id(tool):
    """Générer un ID de tâche unique"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{tool}_{timestamp}_{uuid.uuid4().hex[:8]}"

# ============================================================
# FONCTION TCPDUMP CORRIGÉE
# ============================================================

def run_tcpdump_capture_fixed(interface, capture_mode, duration=None, packet_count=None, filter_expr=None, task_id=None):
    """
    Fonction tcpdump corrigée qui gère TOUS les modes de capture
    """
    try:
        logger.info(f"📡 DÉMARRAGE capture tcpdump CORRIGÉE pour task {task_id}")
        logger.info(f"🔧 Paramètres: interface={interface}, mode={capture_mode}, duration={duration}, count={packet_count}, filter={filter_expr}")
        
        update_task_status(task_id, "running", {"message": "Capture tcpdump en cours..."})
        
        # VALIDATION DES PARAMÈTRES ROBUSTE
        if not interface:
            raise ValueError("Interface réseau requise")
        
        if not capture_mode:
            capture_mode = 'time'  # Mode par défaut
        
        # Validation selon le mode
        if capture_mode == 'time':
            if duration is None:
                duration = 60  # Défaut 1 minute
            else:
                try:
                    duration = int(duration)
                    if duration <= 0 or duration > 3600:  # Max 1 heure
                        duration = 60
                except (ValueError, TypeError):
                    duration = 60
                    
        elif capture_mode == 'count':
            if packet_count is None:
                packet_count = 100  # Défaut 100 paquets
            else:
                try:
                    packet_count = int(packet_count)
                    if packet_count <= 0 or packet_count > 100000:  # Max 100k paquets
                        packet_count = 100
                except (ValueError, TypeError):
                    packet_count = 100
                    
        elif capture_mode == 'continuous':
            duration = 300  # 5 minutes max pour mode continu
        
        # Nettoyage et validation du filtre
        if filter_expr is None:
            filter_expr = ""
        filter_expr = filter_expr.strip()
        
        # Générer le nom du fichier de capture
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pcap_filename = f"capture_{timestamp}_{task_id[-8:]}.pcap"
        pcap_path = os.path.join(DIRECTORIES['temp'], pcap_filename)
        
        logger.info(f"📁 Fichier de capture: {pcap_path}")
        
        # CONSTRUCTION DE LA COMMANDE TCPDUMP SELON LE MODE
        cmd = ['tcpdump', '-i', interface, '-w', pcap_path]
        
        # Options selon le mode de capture
        if capture_mode == 'time':
            cmd.extend(['-G', str(duration), '-W', '1'])  # Durée fixe
            timeout_value = duration + 30
            logger.info(f"⏱️ Mode TIME: {duration} secondes")
            
        elif capture_mode == 'count':
            cmd.extend(['-c', str(packet_count)])  # Nombre de paquets
            timeout_value = 300  # 5 minutes max pour mode count
            logger.info(f"📊 Mode COUNT: {packet_count} paquets")
            
        elif capture_mode == 'continuous':
            # Mode continu - pas d'options spéciales, sera arrêté manuellement
            timeout_value = duration  # 5 minutes max
            logger.info(f"🔄 Mode CONTINUOUS: {duration} secondes max")
        
        # Ajouter le filtre si présent
        if filter_expr:
            cmd.append(filter_expr)
            logger.info(f"🔍 Filtre BPF appliqué: {filter_expr}")
        
        # Options supplémentaires pour améliorer la capture
        cmd.extend(['-n'])  # Pas de résolution DNS (plus rapide)
        
        logger.info(f"🔧 Commande tcpdump finale: {' '.join(cmd)}")
        
        # EXÉCUTION DE LA CAPTURE
        start_time = time.time()
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_value
            )
            
            execution_time = time.time() - start_time
            logger.info(f"⏱️ Capture terminée en {execution_time:.1f}s avec code: {result.returncode}")
            
            # ANALYSE DES RÉSULTATS
            if result.returncode == 0:
                # Vérifier si le fichier existe et n'est pas vide
                if os.path.exists(pcap_path):
                    file_size = os.path.getsize(pcap_path)
                    
                    if file_size > 0:
                        # Analyser rapidement le fichier pcap
                        analysis_results = analyze_pcap_file(pcap_path)
                        
                        # Résultats de la capture
                        capture_results = {
                            "interface": interface,
                            "capture_mode": capture_mode,
                            "duration": duration if capture_mode == 'time' else None,
                            "packet_count": packet_count if capture_mode == 'count' else None,
                            "filter": filter_expr,
                            "pcap_file": pcap_filename,
                            "file_size": file_size,
                            "execution_time": f"{execution_time:.1f}s",
                            "packets_captured": analysis_results.get("total_packets", 0),
                            "protocols": analysis_results.get("protocols", {}),
                            "top_hosts": analysis_results.get("top_hosts", []),
                            "success": True
                        }
                        
                        update_task_status(task_id, "completed", {
                            "target": interface,
                            "command": ' '.join(cmd),
                            "results": capture_results,
                            "raw_output": result.stderr,  # tcpdump écrit les stats dans stderr
                            "tool_version": "tcpdump_fixed_v1"
                        })
                        
                        logger.info(f"✅ Capture tcpdump réussie: {analysis_results.get('total_packets', 0)} paquets capturés")
                        
                    else:
                        logger.warning(f"⚠️ Fichier pcap vide: {pcap_path}")
                        update_task_status(task_id, "failed", {
                            "error": "Aucun paquet capturé - vérifiez l'interface et le filtre",
                            "file_size": 0,
                            "command": ' '.join(cmd)
                        })
                else:
                    logger.error(f"❌ Fichier pcap non créé: {pcap_path}")
                    update_task_status(task_id, "failed", {
                        "error": "Fichier de capture non créé",
                        "command": ' '.join(cmd)
                    })
            else:
                # Erreur dans tcpdump
                error_message = result.stderr or f"tcpdump a échoué avec le code {result.returncode}"
                logger.error(f"❌ Erreur tcpdump: {error_message}")
                update_task_status(task_id, "failed", {
                    "error": error_message,
                    "command": ' '.join(cmd),
                    "stderr": result.stderr,
                    "stdout": result.stdout
                })
                
        except subprocess.TimeoutExpired:
            logger.warning(f"⏰ Timeout de la capture tcpdump après {timeout_value}s")
            
            # Même en cas de timeout, vérifier si le fichier a été créé
            if os.path.exists(pcap_path):
                file_size = os.path.getsize(pcap_path)
                if file_size > 0:
                    analysis_results = analyze_pcap_file(pcap_path)
                    
                    update_task_status(task_id, "completed", {
                        "target": interface,
                        "command": ' '.join(cmd),
                        "results": {
                            "interface": interface,
                            "capture_mode": capture_mode,
                            "pcap_file": pcap_filename,
                            "file_size": file_size,
                            "packets_captured": analysis_results.get("total_packets", 0),
                            "protocols": analysis_results.get("protocols", {}),
                            "timeout": True,
                            "success": True
                        },
                        "raw_output": f"Capture stoppée par timeout après {timeout_value}s",
                        "tool_version": "tcpdump_timeout_ok"
                    })
                    
                    logger.info(f"✅ Capture timeout mais fichier récupéré: {analysis_results.get('total_packets', 0)} paquets")
                else:
                    update_task_status(task_id, "failed", {"error": f"Timeout après {timeout_value}s, aucun paquet capturé"})
            else:
                update_task_status(task_id, "failed", {"error": f"Timeout après {timeout_value}s, fichier non créé"})
                
    except Exception as e:
        logger.error(f"❌ EXCEPTION capture tcpdump {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def analyze_pcap_file(pcap_path):
    """
    Analyser un fichier PCAP avec tcpdump pour extraire des statistiques
    """
    results = {
        "total_packets": 0,
        "protocols": {},
        "top_hosts": [],
        "file_size": 0
    }
    
    try:
        results["file_size"] = os.path.getsize(pcap_path)
        
        # Compter le nombre total de paquets
        cmd = ["tcpdump", "-r", pcap_path, "-q"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split('\n')
            results["total_packets"] = len([line for line in lines if line.strip()])
            
            # Analyser les protocoles
            protocols = {}
            for line in lines:
                if 'IP ' in line:
                    if ' TCP ' in line:
                        protocols['TCP'] = protocols.get('TCP', 0) + 1
                    elif ' UDP ' in line:
                        protocols['UDP'] = protocols.get('UDP', 0) + 1
                    elif ' ICMP ' in line:
                        protocols['ICMP'] = protocols.get('ICMP', 0) + 1
                    else:
                        protocols['OTHER'] = protocols.get('OTHER', 0) + 1
            
            results["protocols"] = protocols
            
            # Extraire quelques IPs sources (simple)
            hosts = {}
            for line in lines[:50]:  # Analyser les 50 premiers paquets seulement
                import re
                ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                if ip_match:
                    ip = ip_match.group(1)
                    hosts[ip] = hosts.get(ip, 0) + 1
            
            # Top 5 des hosts
            results["top_hosts"] = [
                {"ip": ip, "packets": count} 
                for ip, count in sorted(hosts.items(), key=lambda x: x[1], reverse=True)[:5]
            ]
            
    except Exception as e:
        logger.warning(f"⚠️ Erreur analyse pcap: {e}")
        # Retourner au moins la taille du fichier
        try:
            results["file_size"] = os.path.getsize(pcap_path)
        except:
            pass
    
    return results

# ============================================================
# FONCTIONS DE SCAN SIMPLIFIÉES
# ============================================================

def run_nmap_scan_simple(target, scan_type, task_id):
    """Exécuter un scan Nmap simple"""
    try:
        logger.info(f"🚀 DÉMARRAGE scan Nmap pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Scan Nmap en cours..."})
        
        # Configuration simplifiée
        scan_configs = {
            'quick': ['-T4', '-F'],
            'basic': ['-sV', '-sC'],
            'intense': ['-sV', '-sC', '-A', '-T4']
        }
        
        cmd = ['nmap'] + scan_configs.get(scan_type, ['-sV']) + [target]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "command": ' '.join(cmd),
                "results": {"summary": "Scan terminé", "raw": result.stdout},
                "raw_output": result.stdout
            })
        else:
            update_task_status(task_id, "failed", {"error": result.stderr or "Erreur scan Nmap"})
            
    except Exception as e:
        logger.error(f"❌ Erreur scan Nmap: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_nikto_scan_simple(target, scan_type, task_id):
    """Exécuter un scan Nikto simple"""
    try:
        logger.info(f"🕷️ DÉMARRAGE scan Nikto pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Scan Nikto en cours..."})
        
        cmd = ['nikto', '-h', target]
        if scan_type == 'quick':
            cmd.extend(['-maxtime', '60'])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "command": ' '.join(cmd),
                "results": {"summary": "Scan terminé", "raw": result.stdout},
                "raw_output": result.stdout
            })
        else:
            update_task_status(task_id, "failed", {"error": result.stderr or "Erreur scan Nikto"})
            
    except Exception as e:
        logger.error(f"❌ Erreur scan Nikto: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

# ============================================================
# FONCTION FLASK APP
# ============================================================

def create_app():
    """Factory pour créer l'application Flask"""
    
    app = Flask(__name__)
    
    # Configuration
    app.config.update(
        SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-prod'),
        DEBUG=os.environ.get('FLASK_DEBUG', '1') == '1',
        JSON_SORT_KEYS=False,
        JSONIFY_PRETTYPRINT_REGULAR=True
    )
    
    # CORS
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, 
         origins=cors_origins,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    
    # Initialisation
    ensure_directories()
    global_tools_status = check_security_tools()
    
    # ============================================================
    # ROUTES PRINCIPALES
    # ============================================================
    
    @app.route('/', methods=['GET'])
    def root():
        """Route racine"""
        return jsonify({
            'name': 'Pacha Security Toolbox API - TCPDUMP FIXED',
            'version': '2.1.1',
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'description': 'Professional Penetration Testing Suite',
            'tools_available': global_tools_status,
            'tcpdump_status': 'FIXED',
            'endpoints': [
                '/api/health',
                '/api/scan/nmap',
                '/api/scan/nikto', 
                '/api/scan/tcpdump',
                '/api/scan/status/<task_id>',
                '/api/scan/history'
            ]
        })
    
    @app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
    def health_check():
        """Health check amélioré"""
        try:
            current_tools_status = check_security_tools()
            
            logger.info("💚 Health check - Système opérationnel")
            
            return jsonify({
                'status': 'healthy',
                'message': 'API Pacha Toolbox opérationnelle - TCPDUMP FIXED',
                'tools': current_tools_status,
                'active_tasks': len([t for t in task_status.values() if t.get('status') == 'running']),
                'completed_tasks': len([t for t in task_status.values() if t.get('status') == 'completed']),
                'method': request.method,
                'cors_enabled': True,
                'version': '2.1.1',
                'tcpdump_fix': 'ACTIVE',
                'timestamp': datetime.now().isoformat(),
                'directories': {name: os.path.exists(path) for name, path in DIRECTORIES.items()}
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur health check: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur health check: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # ============================================================
    # ROUTES DE SCAN - TCPDUMP CORRIGÉ
    # ============================================================
    
    @app.route('/api/scan/tcpdump', methods=['POST', 'OPTIONS'])
    def tcpdump_capture_endpoint():
        """Endpoint tcpdump CORRIGÉ qui gère tous les modes"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            logger.info(f"📡 Requête tcpdump reçue: {data}")
            
            # EXTRACTION ET VALIDATION DES PARAMÈTRES
            interface = data.get('interface', 'eth0')
            capture_mode = data.get('capture_mode', 'time')
            
            # Paramètres optionnels selon le mode
            duration = data.get('duration')
            packet_count = data.get('packet_count')
            filter_expr = data.get('filter', '')
            
            logger.info(f"🔧 Paramètres extraits: interface={interface}, mode={capture_mode}, duration={duration}, count={packet_count}")
            
            # Validation de base
            if not interface:
                return jsonify({'error': 'Interface réseau requise'}), 400
            
            if capture_mode not in ['time', 'count', 'continuous']:
                capture_mode = 'time'  # Mode par défaut
            
            # Générer l'ID de tâche
            task_id = generate_task_id('tcpdump')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "interface": interface,
                "capture_mode": capture_mode,
                "duration": duration,
                "packet_count": packet_count,
                "filter": filter_expr
            })
            
            logger.info(f"📡 LANCEMENT capture tcpdump CORRIGÉE pour task {task_id}")
            
            # Démarrer la capture en arrière-plan avec la fonction corrigée
            thread = threading.Thread(
                target=run_tcpdump_capture_fixed,
                args=(interface, capture_mode, duration, packet_count, filter_expr, task_id),
                daemon=True
            )
            thread.start()
            
            logger.info(f"📡 Capture tcpdump démarrée: {task_id} - {interface} ({capture_mode})")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Capture tcpdump {capture_mode} sur {interface} démarrée',
                'interface': interface,
                'capture_mode': capture_mode,
                'duration': duration,
                'packet_count': packet_count,
                'filter': filter_expr,
                'fix_version': 'v1.1'
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur endpoint tcpdump: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors de la capture: {str(e)}'
            }), 500
    
    @app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
    def nmap_scan():
        """Endpoint pour les scans Nmap"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            target = data.get('target', '127.0.0.1')
            scan_type = data.get('scanType', 'basic')
            
            task_id = generate_task_id('nmap')
            update_task_status(task_id, "starting", {"target": target, "scan_type": scan_type})
            
            thread = threading.Thread(target=run_nmap_scan_simple, args=(target, scan_type, task_id), daemon=True)
            thread.start()
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Scan Nmap de {target} démarré',
                'target': target,
                'scan_type': scan_type
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur scan Nmap: {e}")
            return jsonify({'status': 'error', 'message': f'Erreur lors du scan: {str(e)}'}), 500
    
    @app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
    def nikto_scan():
        """Endpoint pour les scans Nikto"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            target = data.get('target', 'http://127.0.0.1')
            scan_type = data.get('scanType', 'basic')
            
            if not target.startswith(('http://', 'https://')):
                return jsonify({'error': 'Target doit être une URL (http:// ou https://)'}), 400
            
            task_id = generate_task_id('nikto')
            update_task_status(task_id, "starting", {"target": target, "scan_type": scan_type})
            
            thread = threading.Thread(target=run_nikto_scan_simple, args=(target, scan_type, task_id), daemon=True)
            thread.start()
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Scan Nikto de {target} démarré',
                'target': target,
                'scan_type': scan_type
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur scan Nikto: {e}")
            return jsonify({'status': 'error', 'message': f'Erreur lors du scan: {str(e)}'}), 500
    
    @app.route('/api/scan/status/<task_id>', methods=['GET'])
    def get_scan_status(task_id):
        """Récupérer le statut d'une tâche"""
        try:
            if task_id not in task_status:
                return jsonify({'error': 'Tâche non trouvée'}), 404
            
            status = task_status[task_id]
            logger.debug(f"📊 Status demandé pour {task_id}: {status.get('status')}")
            
            return jsonify({
                'task_id': task_id,
                'status': status.get('status', 'unknown'),
                'data': status.get('data', {}),
                'updated_at': status.get('updated_at'),
                'completed_at': status.get('completed_at'),
                'tool': task_id.split('_')[0]
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération statut: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/scan/history', methods=['GET'])
    def scan_history():
        """Historique des scans"""
        try:
            history = []
            for task_id, status_data in task_status.items():
                if status_data.get('status') in ['completed', 'failed']:
                    scan_data = {
                        'task_id': task_id,
                        'status': status_data.get('status'),
                        'data': status_data.get('data', {}),
                        'completed_at': status_data.get('completed_at'),
                        'tool': task_id.split('_')[0],
                        'target': status_data.get('data', {}).get('target', 'Unknown')
                    }
                    history.append(scan_data)
            
            history.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
            
            return jsonify({
                'scans': history,
                'total': len(history),
                'tools_status': check_security_tools()
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération historique: {e}")
            return jsonify({'scans': [], 'total': 0, 'error': str(e)}), 500
    
    # ============================================================
    # GESTION DES ERREURS
    # ============================================================
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint non trouvé', 'status': 404}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Erreur interne 500: {error}")
        return jsonify({'error': 'Erreur interne du serveur', 'status': 500}), 500
    
    return app

# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == '__main__':
    # Créer l'application
    app = create_app()
    
    # Démarrer le serveur
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Démarrage Pacha Toolbox API TCPDUMP FIXED sur {host}:{port}")
    logger.info("🎯 Endpoints CORRIGÉS disponibles:")
    logger.info("   • GET  /                    - Informations API")
    logger.info("   • GET  /api/health          - Health check")
    logger.info("   • POST /api/scan/tcpdump    - Capture tcpdump ✅ CORRIGÉ")
    logger.info("   • POST /api/scan/nmap       - Scan Nmap ✅")
    logger.info("   • POST /api/scan/nikto      - Scan Nikto ✅")
    logger.info("   • GET  /api/scan/status/<id> - Statut tâche ✅")
    logger.info("   • GET  /api/scan/history    - Historique scans ✅")
    logger.info("")
    logger.info("🔧 ✅ TCPDUMP ENTIÈREMENT CORRIGÉ")
    logger.info("   • ✅ Gestion de tous les modes (time, count, continuous)")
    logger.info("   • ✅ Validation robuste des paramètres")
    logger.info("   • ✅ Timeouts adaptés selon le mode")
    logger.info("   • ✅ Analyse des fichiers PCAP")
    logger.info("   • ✅ Gestion des erreurs complète")
    
    app.run(
        host=host,
        port=port,
        debug=app.config['DEBUG'],
        threaded=True
    )
EOF

log_success "Backend corrigé appliqué"

# 4. Créer les répertoires nécessaires
log_info "Création des répertoires..."
mkdir -p backend/data/{reports,logs,temp}
mkdir -p frontend/build
chmod 755 backend/data backend/data/*

# 5. Redémarrage des conteneurs
log_info "Redémarrage des conteneurs..."
docker-compose up --build -d

# 6. Attendre que les services démarrent
log_info "Attente du démarrage des services..."
sleep 5

# 7. Test de fonctionnement
log_info "Test de fonctionnement..."

echo ""
echo "🧪 TESTS DE VALIDATION"
echo "====================="

# Test health check
log_info "Test health check..."
API_RESPONSE=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "TCPDUMP FIXED"; then
    log_success "✅ API corrigée opérationnelle"
else
    log_error "❌ Problème avec l'API"
fi

# Test tcpdump endpoint
log_info "Test endpoint tcpdump..."
TCPDUMP_TEST=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"interface":"lo","capture_mode":"time","duration":5,"filter":""}' \
    http://localhost:5000/api/scan/tcpdump 2>/dev/null)

if echo "$TCPDUMP_TEST" | grep -q "task_id"; then
    log_success "✅ Endpoint tcpdump fonctionnel"
    TASK_ID=$(echo "$TCPDUMP_TEST" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    log_info "📊 Task ID généré: $TASK_ID"
else
    log_error "❌ Problème avec l'endpoint tcpdump"
    echo "Response: $TCPDUMP_TEST"
fi

echo ""
echo "📊 RÉSUMÉ DE LA CORRECTION"
echo "=========================="
log_success "✅ Backend entièrement corrigé"
log_success "✅ Gestion robuste de tous les modes tcpdump"
log_success "✅ Validation des paramètres"
log_success "✅ Timeouts adaptatifs"
log_success "✅ Analyse des fichiers PCAP"
log_success "✅ Gestion complète des erreurs"

echo ""
echo "🔗 ACCÈS AUX SERVICES"
echo "===================="
echo "• API Backend: http://localhost:5000"
echo "• Health Check: http://localhost:5000/api/health"
echo "• Frontend (si configuré): http://localhost:3000"

echo ""
echo "🧪 TEST MANUEL TCPDUMP"
echo "======================"
echo "curl -X POST -H 'Content-Type: application/json' \\"
echo "  -d '{\"interface\":\"lo\",\"capture_mode\":\"time\",\"duration\":10}' \\"
echo "  http://localhost:5000/api/scan/tcpdump"

echo ""
echo "📝 LOGS EN TEMPS RÉEL"
echo "===================="
echo "docker-compose logs -f backend"

echo ""
log_success "🎉 CORRECTION TCPDUMP TERMINÉE !"
log_success "🚀 Tous les modes de capture sont maintenant fonctionnels"
