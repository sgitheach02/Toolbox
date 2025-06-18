# backend/main.py - Backend CORRIGÉ Pacha Toolbox
import os
import sys
import logging
import json
import uuid
import subprocess
import threading
import time
import signal
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
        logging.FileHandler('./logs/pacha-toolbox.log') if os.path.exists('./logs') else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Variables globales pour le suivi des tâches
active_scans = {}
scan_outputs = {}
scan_history = []
task_status = {}

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
# PARSERS GLOBAUX
# ============================================================

def parse_nmap_output_fixed(output):
    """Parser Nmap corrigé - VERSION CLEAN sans doublons"""
    results = {
        "hosts_up": 0,
        "ports_open": [],
        "services": [],
        "summary": "Scan terminé",
        "detailed_ports": [],
        "os_detection": [],
        "service_details": [],
        "scripts_output": [],
        "scan_stats": {},
        "target_info": {}
    }
    
    lines = output.split('\n')
    logger.info(f"🔍 Parsing {len(lines)} lignes de sortie Nmap CORRIGÉ")
    
    in_port_section = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Host UP detection
        if 'Host is up' in line:
            results["hosts_up"] += 1
            # Extraire latency si disponible
            if '(' in line and ')' in line:
                latency = line.split('(')[1].split(')')[0]
                results["target_info"]["latency"] = latency
            logger.info(f"✅ Host UP trouvé")
            
        # Target info
        elif 'Nmap scan report for' in line:
            target_info = line.replace('Nmap scan report for ', '')
            results["target_info"]["target"] = target_info
            logger.info(f"🎯 Target: {target_info}")
            
        # ❌ IGNORER les "Discovered open port" - source non fiable !
        elif 'Discovered open port' in line:
            # Ces ports peuvent être fermés dans les résultats finaux
            # On les ignore pour éviter les doublons et incohérences
            logger.debug(f"🚫 Ignoré: {line_stripped}")
            continue
            
        # Section des ports (format tableau) - SEULE SOURCE FIABLE
        elif line_stripped.startswith('PORT') and 'STATE' in line and 'SERVICE' in line:
            in_port_section = True
            logger.info("📊 Début section ports (source autoritaire)")
            continue
            
        # Fin de la section des ports
        elif in_port_section and (line_stripped == '' or line_stripped.startswith('Service Info') or line_stripped.startswith('OS')):
            in_port_section = False
            logger.info("📊 Fin section ports")
            
        # Parser les ports UNIQUEMENT depuis la section finale
        elif in_port_section and '/' in line_stripped and any(state in line_stripped for state in ['open', 'closed', 'filtered']):
            parts = line_stripped.split()
            if len(parts) >= 3:
                port_num = parts[0].split('/')[0]
                protocol = parts[0].split('/')[1] if '/' in parts[0] else 'tcp'
                state = parts[1]
                service = parts[2] if len(parts) > 2 else 'unknown'
                version = ' '.join(parts[3:]) if len(parts) > 3 else ''
                
                # Créer l'entrée du port
                port_info = {
                    "port": port_num,
                    "protocol": protocol,
                    "state": state,
                    "service": service,
                    "version": version,
                    "raw": f"{parts[0]} {state} {service}"
                }
                
                if version:
                    port_info["raw"] += f" {version}"
                
                results["detailed_ports"].append(port_info)
                
                # Ajouter aux listes pour compatibilité
                if state == 'open':
                    results["ports_open"].append(port_info["raw"])
                    if service != 'unknown':
                        results["services"].append(service)
                
                logger.info(f"🔓 Port ajouté: {port_info['raw']}")
        
        # Scripts NSE output
        elif line.startswith('|') or line.startswith('|_'):
            script_output = line.strip()
            results["scripts_output"].append(script_output)
            # Associer au dernier port si possible
            if results["detailed_ports"]:
                last_port = results["detailed_ports"][-1]
                if "scripts" not in last_port:
                    last_port["scripts"] = []
                last_port["scripts"].append(script_output)
            logger.debug(f"📜 Script: {script_output[:50]}...")
            
        # OS Detection
        elif 'OS CPE:' in line or ('Running' in line and 'OS' in line):
            results["os_detection"].append(line_stripped)
            logger.info(f"💻 OS: {line_stripped[:50]}...")
            
        elif 'Aggressive OS guesses:' in line:
            # Capturer les OS guesses suivants
            j = i + 1
            while j < len(lines) and (lines[j].strip().startswith('-') or '%' in lines[j]):
                if lines[j].strip():
                    results["os_detection"].append(lines[j].strip())
                j += 1
                
        # Service detection details
        elif 'Service Info:' in line:
            service_info = line.replace('Service Info:', '').strip()
            results["service_details"].append(service_info)
            logger.info(f"🔧 Service info: {service_info}")
            
        # Scan statistics
        elif 'Nmap done:' in line:
            stats = line.strip()
            results["scan_stats"]["summary"] = stats
            logger.info(f"📈 Stats: {stats}")
            
        elif 'Raw packets sent:' in line:
            results["scan_stats"]["packets"] = line.strip()
            
        # Uptime guess
        elif 'Uptime guess:' in line:
            results["target_info"]["uptime"] = line.replace('Uptime guess:', '').strip()
            
        # Network distance
        elif 'Network Distance:' in line:
            results["target_info"]["distance"] = line.replace('Network Distance:', '').strip()
    
    # Nettoyer les doublons dans les services
    results["services"] = list(set(results["services"]))
    
    # Compter les ports ouverts
    open_ports = len([p for p in results["detailed_ports"] if p.get("state") == "open"])
    results["summary"] = f"Scan terminé: {results['hosts_up']} host(s), {open_ports} port(s) ouverts"
    
    logger.info(f"🎯 RÉSULTATS FINAUX CORRIGÉS:")
    logger.info(f"   - Hosts: {results['hosts_up']}")
    logger.info(f"   - Ports ouverts: {open_ports}")
    logger.info(f"   - Services uniques: {len(results['services'])}")
    logger.info(f"   - Total ports détaillés: {len(results['detailed_ports'])}")
    
    return results


def run_nmap_scan_fixed(target, scan_type, task_id):
    """Version corrigée du scan Nmap avec parser amélioré"""
    try:
        logger.info(f"🚀 DÉMARRAGE scan Nmap CORRIGÉ pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Exécution en cours..."})
        
        # Configuration des types de scan
        scan_configs = {
            'quick': ['-T4', '-F'],                 # Fast scan, top ports
            'basic': ['-sV'],                       # Version detection only
            'standard': ['-sV', '-sC'],             # Version + default scripts
            'intense': ['-sV', '-sC', '-A', '-T4'], # Aggressive + OS detection
            'comprehensive': ['-sS', '-sV', '-sC', '-A', '-T4', '-p-']  # All ports
        }
        
        # Construire la commande
        cmd = ['nmap'] + scan_configs.get(scan_type, ['-sV']) + [target]
        
        logger.info(f"🔍 COMMANDE EXACTE: {' '.join(cmd)}")
        
        # Exécuter le scan avec timeout approprié
        timeout = 600 if scan_type == 'comprehensive' else 300
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        logger.info(f"🏁 Scan terminé avec code: {result.returncode}")
        
        if result.returncode == 0:
            # Parser avec la version corrigée
            results = parse_nmap_output_fixed(result.stdout)
            
            # Validation des résultats
            if results["hosts_up"] == 0:
                logger.warning("⚠️ Aucun host détecté - possible problème de parsing")
            
            logger.info(f"✅ Résultats parsés et validés")
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "command": ' '.join(cmd),  # Enregistrer la commande exacte
                "results": results,
                "raw_output": result.stdout,
                "parsing_version": "fixed_v1"
            })
        else:
            logger.error(f"❌ Erreur scan: {result.stderr}")
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur inconnue",
                "command": ' '.join(cmd)
            })
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Timeout du scan {task_id}")
        update_task_status(task_id, "failed", {"error": f"Timeout du scan ({timeout//60} minutes)"})
    except Exception as e:
        logger.error(f"❌ EXCEPTION scan Nmap {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})


# Test function pour valider le parsing
def test_parsing_consistency():
    """Fonction de test pour vérifier la cohérence du parsing"""
    test_output = """
Starting Nmap 7.97 ( https://nmap.org ) at 2025-06-18 21:43 +0200
Nmap scan report for scanme.nmap.org (50.116.1.184)
Host is up (0.061s latency).
Not shown: 996 filtered tcp ports (no-responses)
PORT    STATE  SERVICE  VERSION
22/tcp  open   ssh      OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.13
80/tcp  open   http     Apache httpd 2.4.7
113/tcp closed ident
443/tcp open   https    Apache httpd 2.4.7
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Nmap done: 1 IP address (1 host up) scanned in 3.91 seconds
"""
    
    results = parse_nmap_output_fixed(test_output)
    
    print("🧪 Test du parsing corrigé:")
    print(f"   Hosts UP: {results['hosts_up']}")
    print(f"   Ports détaillés: {len(results['detailed_ports'])}")
    print(f"   Ports ouverts: {len([p for p in results['detailed_ports'] if p['state'] == 'open'])}")
    print(f"   Services: {results['services']}")
    
    return results

def parse_nikto_output(output):
    """Parser la sortie Nikto"""
    results = {
        "vulnerabilities": [],
        "total_checks": 0,
        "scan_time": "Unknown"
    }
    
    lines = output.split('\n')
    for line in lines:
        if line.startswith('+ '):
            vuln = line.replace('+ ', '')
            results["vulnerabilities"].append({
                "description": vuln,
                "severity": "MEDIUM"
            })
    
    results["total_checks"] = len(results["vulnerabilities"])
    return results

def parse_hydra_output(output):
    """Parser la sortie Hydra"""
    results = {
        "credentials_found": [],
        "attempts": 0,
        "success": False
    }
    
    lines = output.split('\n')
    for line in lines:
        if 'login:' in line and 'password:' in line:
            results["credentials_found"].append(line.strip())
            results["success"] = True
    
    return results

def parse_metasploit_output(output):
    """Parser la sortie Metasploit"""
    results = {
        "sessions": [],
        "success": False,
        "errors": []
    }
    
    lines = output.split('\n')
    for line in lines:
        if 'Meterpreter session' in line and 'opened' in line:
            results["sessions"].append(line.strip())
            results["success"] = True
        elif 'error' in line.lower():
            results["errors"].append(line.strip())
    
    return results

# ============================================================
# SERVICES DE SCAN GLOBAUX
# ============================================================

def run_nmap_scan(target, scan_type, task_id):
    """Exécuter un scan Nmap - FONCTION GLOBALE"""
    try:
        logger.info(f"🚀 DÉMARRAGE RÉEL du scan Nmap pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Exécution en cours..."})
        
        # Configuration des types de scan
        scan_configs = {
            'quick': ['-T4', '-F'],
            'basic': ['-sV', '-sC'],
            'intense': ['-T4', '-A', '-v'],
            'comprehensive': ['-sS', '-sV', '-sC', '-A', '-T4']
        }
        
        # Construire la commande
        cmd = ['nmap'] + scan_configs.get(scan_type, ['-sn']) + [target]
        
        logger.info(f"🔍 COMMANDE RÉELLE: {' '.join(cmd)}")
        
        # Exécuter le scan
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        logger.info(f"🏁 Scan terminé avec code: {result.returncode}")
        logger.info(f"📄 Sortie: {result.stdout[:200]}...")
        
        if result.returncode == 0:
            # Parser les résultats
            results = parse_nmap_output_fixed(result.stdout)
            parse_nmap_output = parse_nmap_output_fixed
            logger.info(f"✅ Résultats parsés: {results}")
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "results": results,
                "raw_output": result.stdout
            })
        else:
            logger.error(f"❌ Erreur scan: {result.stderr}")
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur inconnue"
            })
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Timeout du scan {task_id}")
        update_task_status(task_id, "failed", {"error": "Timeout du scan (5 minutes)"})
    except Exception as e:
        logger.error(f"❌ EXCEPTION scan Nmap {task_id}: {e}")
        import traceback
        logger.error(f"❌ TRACEBACK: {traceback.format_exc()}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_nikto_scan(target, scan_type, task_id):
    """Exécuter un scan Nikto"""
    try:
        update_task_status(task_id, "running", {"message": "Démarrage scan Nikto"})
        
        # Configuration des scans
        scan_configs = {
            'quick': ['-maxtime', '120'],
            'basic': ['-maxtime', '300'],
            'comprehensive': ['-maxtime', '600', '-Tuning', 'x']
        }
        
        # Construire la commande
        cmd = ['nikto', '-h', target] + scan_configs.get(scan_type, ['-maxtime', '300'])
        
        logger.info(f"🕷️ Exécution Nikto: {' '.join(cmd)}")
        
        # Exécuter le scan
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=700
        )
        
        if result.returncode == 0:
            # Parser les résultats
            results = parse_nikto_output(result.stdout)
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "results": results,
                "raw_output": result.stdout
            })
        else:
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur scan Nikto"
            })
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout du scan Nikto"})
    except Exception as e:
        logger.error(f"❌ Erreur scan Nikto: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_tcpdump_capture(interface, duration, filter_expr, task_id):
    """Exécuter une capture tcpdump"""
    try:
        update_task_status(task_id, "running", {"message": "Démarrage capture tcpdump"})
        
        # Fichier de capture
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pcap_file = f"{DIRECTORIES['reports']}/capture_{timestamp}.pcap"
        
        # Construire la commande
        cmd = ['tcpdump', '-i', interface, '-w', pcap_file, '-G', str(duration), '-W', '1']
        if filter_expr:
            cmd.append(filter_expr)
        
        logger.info(f"📡 Exécution tcpdump: {' '.join(cmd)}")
        
        # Exécuter la capture
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=duration + 30
        )
        
        if result.returncode == 0 and os.path.exists(pcap_file):
            file_size = os.path.getsize(pcap_file)
            
            update_task_status(task_id, "completed", {
                "interface": interface,
                "duration": duration,
                "filter": filter_expr,
                "pcap_file": os.path.basename(pcap_file),
                "file_size": file_size,
                "packets_captured": "Analysis needed"
            })
        else:
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur capture tcpdump"
            })
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout de la capture"})
    except Exception as e:
        logger.error(f"❌ Erreur capture tcpdump: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_hydra_attack(target, service, username, wordlist, task_id):
    """Exécuter une attaque Hydra"""
    try:
        update_task_status(task_id, "running", {"message": "Démarrage attaque Hydra"})
        
        # Construire la commande selon le service
        if service == 'ssh':
            cmd = ['hydra', '-l', username, '-P', wordlist, f'ssh://{target}']
        elif service == 'ftp':
            cmd = ['hydra', '-l', username, '-P', wordlist, f'ftp://{target}']
        elif service == 'rdp':
            cmd = ['hydra', '-l', username, '-P', wordlist, f'rdp://{target}']
        else:
            update_task_status(task_id, "failed", {"error": f"Service {service} non supporté"})
            return
        
        logger.info(f"🔨 Exécution Hydra: {' '.join(cmd)}")
        
        # Exécuter l'attaque
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800  # 30 minutes max
        )
        
        # Parser les résultats
        results = parse_hydra_output(result.stdout)
        
        update_task_status(task_id, "completed", {
            "target": target,
            "service": service,
            "username": username,
            "results": results,
            "raw_output": result.stdout
        })
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout de l'attaque (30 minutes)"})
    except Exception as e:
        logger.error(f"❌ Erreur attaque Hydra: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_metasploit_exploit(exploit, target, payload, lhost, task_id):
    """Exécuter un exploit Metasploit"""
    try:
        update_task_status(task_id, "running", {"message": "Démarrage exploit Metasploit"})
        
        # Créer un script MSF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        script_file = f"{DIRECTORIES['temp']}/msf_script_{timestamp}.rc"
        
        msf_script = f"""use {exploit}
set RHOSTS {target}
set PAYLOAD {payload}
set LHOST {lhost}
set LPORT 4444
exploit -j
sessions -l
exit
"""
        
        with open(script_file, 'w') as f:
            f.write(msf_script)
        
        # Exécuter via msfconsole
        cmd = ['msfconsole', '-q', '-r', script_file]
        
        logger.info(f"💣 Exécution Metasploit: {exploit} contre {target}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        # Parser les résultats
        results = parse_metasploit_output(result.stdout)
        
        update_task_status(task_id, "completed", {
            "exploit": exploit,
            "target": target,
            "payload": payload,
            "results": results,
            "raw_output": result.stdout
        })
        
        # Nettoyer
        if os.path.exists(script_file):
            os.remove(script_file)
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout de l'exploit (5 minutes)"})
    except Exception as e:
        logger.error(f"❌ Erreur exploit Metasploit: {e}")
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
    
    # Initialisation des répertoires
    ensure_directories()
    
    # ============================================================
    # AUTHENTIFICATION
    # ============================================================
    
    # Base de données utilisateurs simple
    users_db = {
        'admin': {
            'id': 1,
            'username': 'admin',
            'password_hash': generate_password_hash('admin123'),
            'email': 'admin@pacha-toolbox.local',
            'role': 'admin'
        },
        'user': {
            'id': 2,
            'username': 'user',
            'password_hash': generate_password_hash('user123'),
            'email': 'user@pacha-toolbox.local',
            'role': 'user'
        }
    }
    
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization')
            if token and token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            if not token:
                return jsonify({'error': 'Token manquant'}), 401
            
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                current_user = users_db.get(data['username'])
                if not current_user:
                    return jsonify({'error': 'Token invalide'}), 401
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expiré'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Token invalide'}), 401
            
            return f(current_user, *args, **kwargs)
        return decorated
    
    # ============================================================
    # ROUTES PRINCIPALES
    # ============================================================
    
    @app.route('/', methods=['GET'])
    def root():
        """Route racine"""
        return jsonify({
            'name': 'Pacha Security Toolbox API',
            'version': '2.0.0',
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'description': 'Professional Penetration Testing Suite + Graylog Forensics',
            'endpoints': [
                '/api/health',
                '/api/auth/login',
                '/api/auth/register',
                '/api/scan/nmap',
                '/api/scan/nikto',
                '/api/scan/tcpdump',
                '/api/scan/hydra',
                '/api/scan/metasploit',
                '/api/scan/status/<task_id>',
                '/api/scan/history'
            ]
        })
    
    @app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
    def health_check():
        """Vérification de santé de l'API"""
        try:
            # Test des outils
            tools_status = {
                'nmap': subprocess.run(['which', 'nmap'], capture_output=True).returncode == 0,
                'nikto': subprocess.run(['which', 'nikto'], capture_output=True).returncode == 0,
                'tcpdump': subprocess.run(['which', 'tcpdump'], capture_output=True).returncode == 0,
                'hydra': subprocess.run(['which', 'hydra'], capture_output=True).returncode == 0,
                'msfconsole': subprocess.run(['which', 'msfconsole'], capture_output=True).returncode == 0
            }
            
            logger.info("💚 Health check appelé - Système opérationnel")
            
            return jsonify({
                'status': 'healthy',
                'message': 'API Pacha Toolbox opérationnelle',
                'tools': tools_status,
                'active_tasks': len([t for t in task_status.values() if t.get('status') == 'running']),
                'method': request.method,
                'cors_enabled': True,
                'version': '2.0.0',
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur health check: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur health check: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # ============================================================
    # ROUTES D'AUTHENTIFICATION
    # ============================================================
    
    @app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
    def login():
        """Connexion utilisateur"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            username = data.get('username', '')
            password = data.get('password', '')
            
            if not username or not password:
                return jsonify({'error': 'Nom d\'utilisateur et mot de passe requis'}), 400
            
            user = users_db.get(username)
            if not user or not check_password_hash(user['password_hash'], password):
                return jsonify({'error': 'Identifiants invalides'}), 401
            
            # Générer le token JWT
            token = jwt.encode({
                'username': username,
                'exp': datetime.utcnow().timestamp() + 86400  # 24h
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            logger.info(f"✅ Connexion réussie: {username}")
            
            return jsonify({
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role']
                },
                'expires_in': 86400
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur login: {e}")
            return jsonify({'error': 'Erreur de connexion'}), 500
    
    @app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
    def register():
        """Inscription utilisateur"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            username = data.get('username', '')
            email = data.get('email', '')
            password = data.get('password', '')
            
            if not username or not email or not password:
                return jsonify({'error': 'Tous les champs sont requis'}), 400
            
            if username in users_db:
                return jsonify({'error': 'Nom d\'utilisateur déjà utilisé'}), 400
            
            if len(password) < 8:
                return jsonify({'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400
            
            # Créer le nouvel utilisateur
            new_user = {
                'id': len(users_db) + 1,
                'username': username,
                'password_hash': generate_password_hash(password),
                'email': email,
                'role': 'user'
            }
            
            users_db[username] = new_user
            
            logger.info(f"✅ Nouvel utilisateur créé: {username}")
            
            return jsonify({
                'message': 'Compte créé avec succès',
                'user': {
                    'id': new_user['id'],
                    'username': new_user['username'],
                    'email': new_user['email'],
                    'role': new_user['role']
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur register: {e}")
            return jsonify({'error': 'Erreur de création de compte'}), 500
    
    # ============================================================
    # ROUTES DE SCAN
    # ============================================================
    
    @app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
    def nmap_scan():
        """Endpoint pour les scans Nmap"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            target = data.get('target', '127.0.0.1')
            scan_type = data.get('scanType', 'basic')
            
            if not target:
                return jsonify({'error': 'Target requis'}), 400
            
            # Générer l'ID de tâche
            task_id = generate_task_id('nmap')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "target": target,
                "scan_type": scan_type
            })
            
            logger.info(f"🎯 LANCEMENT THREAD pour task {task_id}")
            
            # Démarrer le scan en arrière-plan avec les FONCTIONS GLOBALES
            thread = threading.Thread(
                target=run_nmap_scan,
                args=(target, scan_type, task_id)
            )
            thread.daemon = True
            thread.start()
            
            logger.info(f"🔍 Scan Nmap démarré: {task_id} - {target}")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Scan Nmap de {target} démarré',
                'target': target,
                'scan_type': scan_type
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur scan Nmap: {e}")
            import traceback
            logger.error(f"❌ TRACEBACK: {traceback.format_exc()}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors du scan: {str(e)}'
            }), 500
    
    @app.route('/api/scan/status/<task_id>', methods=['GET'])
    def get_scan_status(task_id):
        """Récupérer le statut d'une tâche"""
        try:
            if task_id not in task_status:
                return jsonify({'error': 'Tâche non trouvée'}), 404
            
            status = task_status[task_id]
            logger.info(f"📊 Status demandé pour {task_id}: {status.get('status')}")
            return jsonify({
                'task_id': task_id,
                'status': status.get('status', 'unknown'),
                'data': status.get('data', {}),
                'updated_at': status.get('updated_at'),
                'completed_at': status.get('completed_at')
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération statut: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/scan/history', methods=['GET'])
    def scan_history():
        """Historique des scans"""
        try:
            # Retourner l'historique des tâches terminées
            history = []
            for task_id, status_data in task_status.items():
                if status_data.get('status') in ['completed', 'failed']:
                    history.append({
                        'task_id': task_id,
                        'status': status_data.get('status'),
                        'data': status_data.get('data', {}),
                        'completed_at': status_data.get('completed_at'),
                        'tool': task_id.split('_')[0]  # Extraire l'outil depuis l'ID
                    })
            
            # Trier par date de completion (plus récent en premier)
            history.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
            
            return jsonify({
                'scans': history,
                'total': len(history)
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération historique: {e}")
            return jsonify({
                'scans': [],
                'total': 0,
                'error': str(e)
            }), 500
    
    # ============================================================
    # GESTION DES ERREURS
    # ============================================================
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Endpoint non trouvé',
            'message': 'L\'endpoint demandé n\'existe pas',
            'status': 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Erreur interne 500: {error}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'message': 'Une erreur inattendue s\'est produite',
            'status': 500
        }), 500
    
    @app.before_request
    def log_request_info():
        """Log des requêtes pour debug"""
        if app.config['DEBUG']:
            logger.debug(f"📥 {request.method} {request.path} - IP: {request.remote_addr}")
    
    @app.after_request
    def after_request(response):
        """Headers de sécurité"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        if app.config['DEBUG']:
            logger.debug(f"📤 Response {response.status_code} pour {request.path}")
        
        return response
    
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
    
    logger.info(f"🚀 Démarrage Pacha Toolbox API sur {host}:{port}")
    logger.info("🎯 Endpoints disponibles:")
    logger.info("   • GET  /                    - Informations API")
    logger.info("   • GET  /api/health          - Health check")
    logger.info("   • POST /api/auth/login      - Connexion")
    logger.info("   • POST /api/auth/register   - Inscription")
    logger.info("   • POST /api/scan/nmap       - Scan Nmap")
    logger.info("   • POST /api/scan/nikto      - Scan Nikto")
    logger.info("   • POST /api/scan/tcpdump    - Capture tcpdump")
    logger.info("   • POST /api/scan/hydra      - Attaque Hydra")
    logger.info("   • POST /api/scan/metasploit - Exploit Metasploit")
    logger.info("   • GET  /api/scan/status/<id> - Statut tâche")
    logger.info("   • GET  /api/scan/history    - Historique scans")
    logger.info("")
    logger.info("👤 Comptes par défaut:")
    logger.info("   • admin:admin123 (administrateur)")
    logger.info("   • user:user123 (utilisateur)")
    logger.info("")
    logger.info("🔧 DEBUG: Fonctions de scan définies au niveau global")
    logger.info(f"🔧 DEBUG: run_nmap_scan = {run_nmap_scan}")
    
    app.run(
        host=host,
        port=port,
        debug=app.config['DEBUG'],
        threaded=True
    )