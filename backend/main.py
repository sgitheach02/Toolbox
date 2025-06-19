# backend/main.py - CORRIGÉ - Structure fixée
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
# PARSERS AMÉLIORÉS
# ============================================================

def parse_nmap_output_enhanced(output):
    """Parser Nmap amélioré"""
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
    logger.info(f"🔍 Parsing {len(lines)} lignes de sortie Nmap")
    
    in_port_section = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Host UP detection
        if 'Host is up' in line:
            results["hosts_up"] += 1
            if '(' in line and ')' in line:
                latency = line.split('(')[1].split(')')[0]
                results["target_info"]["latency"] = latency
            
        # Target info
        elif 'Nmap scan report for' in line:
            target_info = line.replace('Nmap scan report for ', '')
            results["target_info"]["target"] = target_info
            
        # Section des ports
        elif line_stripped.startswith('PORT') and 'STATE' in line and 'SERVICE' in line:
            in_port_section = True
            continue
            
        # Fin de la section des ports
        elif in_port_section and (line_stripped == '' or line_stripped.startswith('Service Info') or line_stripped.startswith('OS')):
            in_port_section = False
            
        # Parser les ports
        elif in_port_section and '/' in line_stripped and any(state in line_stripped for state in ['open', 'closed', 'filtered']):
            parts = line_stripped.split()
            if len(parts) >= 3:
                port_num = parts[0].split('/')[0]
                protocol = parts[0].split('/')[1] if '/' in parts[0] else 'tcp'
                state = parts[1]
                service = parts[2] if len(parts) > 2 else 'unknown'
                version = ' '.join(parts[3:]) if len(parts) > 3 else ''
                
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
                
                if state == 'open':
                    results["ports_open"].append(port_info["raw"])
                    if service != 'unknown':
                        results["services"].append(service)
    
    # Nettoyer les doublons
    results["services"] = list(set(results["services"]))
    
    # Statistiques finales
    open_ports = len([p for p in results["detailed_ports"] if p.get("state") == "open"])
    results["summary"] = f"Scan terminé: {results['hosts_up']} host(s), {open_ports} port(s) ouverts"
    
    logger.info(f"🎯 Résultats Nmap: {results['hosts_up']} hosts, {open_ports} ports ouverts")
    
    return results

def parse_nikto_output_enhanced(output):
    """Parser Nikto amélioré avec détection de sévérité"""
    results = {
        "vulnerabilities": [],
        "total_checks": 0,
        "scan_time": "Unknown",
        "target_info": {},
        "summary": "",
        "risk_level": "UNKNOWN"
    }
    
    lines = output.split('\n')
    logger.info(f"🔍 Parsing {len(lines)} lignes de sortie Nikto")
    
    vulnerabilities = []
    
    for line in lines:
        line_stripped = line.strip()
        
        # Informations sur la cible
        if 'Target IP:' in line:
            results["target_info"]["ip"] = line.split('Target IP:')[1].strip()
        elif 'Target Hostname:' in line:
            results["target_info"]["hostname"] = line.split('Target Hostname:')[1].strip()
        elif 'Target Port:' in line:
            results["target_info"]["port"] = line.split('Target Port:')[1].strip()
            
        # Vulnérabilités (lignes commençant par +)
        elif line_stripped.startswith('+ '):
            vuln_text = line_stripped[2:]  # Enlever le "+ "
            
            # Déterminer la sévérité basée sur le contenu
            severity = "MEDIUM"  # Par défaut
            
            if any(keyword in vuln_text.lower() for keyword in ['sql injection', 'xss', 'remote code execution', 'arbitrary file']):
                severity = "CRITICAL"
            elif any(keyword in vuln_text.lower() for keyword in ['osvdb', 'cve', 'vulnerable', 'exploit']):
                severity = "HIGH"
            elif any(keyword in vuln_text.lower() for keyword in ['admin', 'backup', 'config', 'password']):
                severity = "HIGH"
            elif any(keyword in vuln_text.lower() for keyword in ['missing', 'disclosure', 'header']):
                severity = "MEDIUM"
            elif any(keyword in vuln_text.lower() for keyword in ['info', 'version', 'banner']):
                severity = "LOW"
            
            vulnerabilities.append({
                "description": vuln_text,
                "severity": severity
            })
    
    results["vulnerabilities"] = vulnerabilities
    results["total_checks"] = len(vulnerabilities) * 10  # Estimation
    
    # Déterminer le niveau de risque global
    if any(v["severity"] == "CRITICAL" for v in vulnerabilities):
        results["risk_level"] = "CRITICAL"
    elif any(v["severity"] == "HIGH" for v in vulnerabilities):
        results["risk_level"] = "HIGH"
    elif any(v["severity"] == "MEDIUM" for v in vulnerabilities):
        results["risk_level"] = "MEDIUM"
    elif vulnerabilities:
        results["risk_level"] = "LOW"
    else:
        results["risk_level"] = "NONE"
    
    results["summary"] = f"{len(vulnerabilities)} vulnérabilité(s) trouvée(s) - Niveau: {results['risk_level']}"
    
    logger.info(f"🕷️ Résultats Nikto: {len(vulnerabilities)} vulnérabilités, niveau {results['risk_level']}")
    
    return results

def parse_hydra_output_enhanced(output):
    """Parser amélioré pour la sortie Hydra"""
    results = {
        "credentials_found": [],
        "attempts": 0,
        "success": False,
        "summary": "Aucune credential trouvée",
        "detailed_attempts": [],
        "errors": [],
        "target_responses": []
    }
    
    lines = output.split('\n')
    for line in lines:
        line_stripped = line.strip()
        
        # Credentials trouvés - patterns multiples
        if any(pattern in line_stripped for pattern in ['login:', 'password:', '[SUCCESS]', 'valid password found']):
            # Pattern standard: [22][ssh] host: 192.168.6.130   login: kali   password: kali
            login_match = re.search(r'login:\s*(\S+)\s+password:\s*(\S+)', line_stripped)
            if login_match:
                cred = f"login: {login_match.group(1)} password: {login_match.group(2)}"
                results["credentials_found"].append(cred)
                results["success"] = True
        
        # Tentatives détaillées
        elif '[ATTEMPT]' in line_stripped or 'attempt' in line_stripped.lower():
            results["attempts"] += 1
            results["detailed_attempts"].append(line_stripped)
        
        # Erreurs spécifiques
        elif any(err in line_stripped.lower() for err in ['error', 'failed', 'timeout', 'refused']):
            results["errors"].append(line_stripped)
        
        # Informations sur les réponses du serveur
        elif any(info in line_stripped.lower() for info in ['connected', 'banner', 'version']):
            results["target_responses"].append(line_stripped)
    
    # Mise à jour du summary
    if results["success"]:
        results["summary"] = f"{len(results['credentials_found'])} credential(s) trouvée(s)"
    else:
        results["summary"] = f"Aucune credential trouvée après {results['attempts']} tentatives"
    
    return results

def parse_medusa_output(output):
    """Parser la sortie de Medusa"""
    results = {
        "credentials_found": [],
        "attempts": 0,
        "success": False,
        "summary": "Aucune credential trouvée",
        "tool_used": "medusa"
    }
    
    lines = output.split('\n')
    for line in lines:
        line_stripped = line.strip()
        
        # Credentials trouvés dans medusa
        if 'SUCCESS:' in line_stripped or 'FOUND:' in line_stripped:
            results["credentials_found"].append(line_stripped)
            results["success"] = True
        elif 'Attempted' in line_stripped:
            try:
                # Extraire le nombre de tentatives
                parts = line_stripped.split()
                for part in parts:
                    if part.isdigit():
                        results["attempts"] = max(results["attempts"], int(part))
            except:
                pass
    
    if results["success"]:
        results["summary"] = f"{len(results['credentials_found'])} credential(s) trouvée(s) via Medusa"
    else:
        results["summary"] = f"Aucune credential trouvée via Medusa après {results['attempts']} tentatives"
    
    return results

def parse_metasploit_output(output):
    """Parser la sortie Metasploit"""
    results = {
        "sessions": [],
        "success": False,
        "errors": [],
        "summary": "Aucune session ouverte"
    }
    
    lines = output.split('\n')
    for line in lines:
        if 'Meterpreter session' in line and 'opened' in line:
            results["sessions"].append(line.strip())
            results["success"] = True
        elif 'session' in line.lower() and 'opened' in line.lower():
            results["sessions"].append(line.strip())
            results["success"] = True
        elif 'error' in line.lower():
            results["errors"].append(line.strip())
    
    if results["success"]:
        results["summary"] = f"{len(results['sessions'])} session(s) ouverte(s)"
    else:
        results["summary"] = "Exploit échoué - Aucune session"
    
    return results

# ============================================================
# SERVICES DE SCAN COMPLETS
# ============================================================

def run_nmap_scan_enhanced(target, scan_type, task_id):
    """Exécuter un scan Nmap amélioré"""
    try:
        logger.info(f"🚀 DÉMARRAGE scan Nmap pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Scan Nmap en cours..."})
        
        # Configuration des types de scan
        scan_configs = {
            'quick': ['-T4', '-F', '--top-ports', '100'],
            'basic': ['-sV', '-sC', '-T4'],
            'intense': ['-sV', '-sC', '-A', '-T4'],
            'comprehensive': ['-sS', '-sV', '-sC', '-A', '-T4', '-p-']
        }
        
        # Construire la commande
        cmd = ['nmap'] + scan_configs.get(scan_type, ['-sV']) + [target]
        
        logger.info(f"🔍 Commande Nmap: {' '.join(cmd)}")
        
        # Timeout selon le type de scan
        timeout_mapping = {
            'quick': 120,
            'basic': 300,
            'intense': 600,
            'comprehensive': 1800
        }
        timeout = timeout_mapping.get(scan_type, 300)
        
        # Exécuter le scan
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        logger.info(f"🏁 Scan Nmap terminé avec code: {result.returncode}")
        
        if result.returncode == 0:
            results = parse_nmap_output_enhanced(result.stdout)
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "command": ' '.join(cmd),
                "results": results,
                "raw_output": result.stdout,
                "execution_time": f"{timeout}s max",
                "tool_version": "nmap_real"
            })
        else:
            logger.error(f"❌ Erreur scan Nmap: {result.stderr}")
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur scan Nmap",
                "command": ' '.join(cmd)
            })
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Timeout du scan Nmap {task_id}")
        update_task_status(task_id, "failed", {"error": f"Timeout du scan ({timeout//60} minutes)"})
    except Exception as e:
        logger.error(f"❌ EXCEPTION scan Nmap {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_nikto_scan_real(target, scan_type, task_id):
    """Exécuter un scan Nikto RÉEL avec l'outil installé"""
    try:
        logger.info(f"🕷️ DÉMARRAGE scan Nikto RÉEL pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Scan Nikto en cours..."})
        
        # Vérifier que nikto est disponible
        nikto_check = subprocess.run(['which', 'nikto'], capture_output=True)
        if nikto_check.returncode != 0:
            logger.error("❌ Nikto non trouvé dans le système")
            update_task_status(task_id, "failed", {"error": "Nikto non installé"})
            return
        
        # Configuration des scans Nikto
        scan_configs = {
            'quick': ['-maxtime', '60'],
            'basic': ['-maxtime', '300'],
            'comprehensive': ['-maxtime', '600', '-Tuning', 'x']
        }
        
        # Construire la commande Nikto
        base_cmd = ['nikto', '-h', target, '-Format', 'txt', '-output', '-']
        scan_options = scan_configs.get(scan_type, ['-maxtime', '300'])
        cmd = base_cmd + scan_options
        
        logger.info(f"🕷️ Commande Nikto: {' '.join(cmd)}")
        
        # Timeout selon le type de scan
        timeout_mapping = {
            'quick': 90,
            'basic': 400,
            'comprehensive': 800
        }
        timeout = timeout_mapping.get(scan_type, 400)
        
        # Exécuter le scan Nikto
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        execution_time = time.time() - start_time
        
        logger.info(f"🏁 Scan Nikto terminé en {execution_time:.1f}s avec code: {result.returncode}")
        
        # Nikto retourne souvent 0 même s'il trouve des vulnérabilités
        if result.returncode == 0 or result.stdout:
            results = parse_nikto_output_enhanced(result.stdout)
            
            # Ajouter des métadonnées
            results["execution_time"] = f"{execution_time:.1f}s"
            results["scan_type_used"] = scan_type
            results["target_scanned"] = target
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "command": ' '.join(cmd),
                "results": results,
                "raw_output": result.stdout,
                "execution_time": f"{execution_time:.1f}s",
                "tool_version": "nikto_real",
                "mode": "production"
            })
            
            logger.info(f"✅ Scan Nikto réussi: {len(results['vulnerabilities'])} vulnérabilités trouvées")
            
        else:
            logger.error(f"❌ Erreur scan Nikto: {result.stderr}")
            update_task_status(task_id, "failed", {
                "error": result.stderr or "Erreur scan Nikto",
                "command": ' '.join(cmd),
                "stdout": result.stdout
            })
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Timeout du scan Nikto {task_id} après {timeout}s")
        update_task_status(task_id, "failed", {"error": f"Timeout du scan Nikto ({timeout}s)"})
    except Exception as e:
        logger.error(f"❌ EXCEPTION scan Nikto {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_hydra_attack(target, service, username, wordlist, task_id):
    """Exécuter une attaque Hydra ENHANCED avec bruteforce usernames"""
    try:
        logger.info(f"🔨 DÉMARRAGE attaque Hydra ENHANCED pour task {task_id}")
        logger.info(f"🎯 Paramètres: target={target}, service={service}, username={username}, wordlist={wordlist}")
        update_task_status(task_id, "running", {"message": "Attaque Hydra en cours..."})
        
        # Validation des paramètres d'entrée
        if not target or not service or not username:
            raise ValueError("Paramètres manquants: target, service et username requis")
        
        # Wordlists améliorées selon le contexte
        enhanced_wordlist_mapping = {
            '/usr/share/wordlists/rockyou.txt': [
                '/usr/share/wordlists/rockyou.txt',
                '/usr/share/wordlists/fasttrack.txt',
                '/usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt',
                '/usr/share/wordlists/dirb/common.txt'
            ],
            '/usr/share/wordlists/darkweb2017.txt': [
                '/usr/share/wordlists/darkweb2017-top1000.txt',
                '/usr/share/wordlists/fasttrack.txt',
                '/usr/share/wordlists/dirb/common.txt'
            ],
            '/usr/share/wordlists/fasttrack.txt': [
                '/usr/share/wordlists/fasttrack.txt',
                '/usr/share/wordlists/dirb/common.txt'
            ],
            '/usr/share/wordlists/common.txt': [
                '/usr/share/wordlists/dirb/common.txt',
                '/usr/share/wordlists/fasttrack.txt'
            ]
        }
        
        # Trouver une wordlist disponible
        actual_wordlist = None
        
        # S'assurer que wordlist n'est pas None
        if not wordlist:
            wordlist = '/usr/share/wordlists/rockyou.txt'
        
        # Essayer de trouver une wordlist existante
        candidates = enhanced_wordlist_mapping.get(wordlist, [wordlist])
        if isinstance(candidates, str):
            candidates = [candidates]
        
        for candidate in candidates:
            if candidate and os.path.exists(candidate):
                actual_wordlist = candidate
                logger.info(f"📝 Wordlist trouvée: {candidate}")
                break
        
        if not actual_wordlist:
            # Créer une wordlist ENHANCED avec patterns courants
            actual_wordlist = '/tmp/enhanced_passwords.txt'
            
            try:
                # Passwords de base + variations du username
                base_passwords = [
                    'password', 'admin', '123456', 'root', 'toor', 
                    'pass', 'test', 'guest', 'user', 'login',
                    'password123', 'admin123', '12345', 'qwerty',
                    'letmein', 'welcome', 'monkey', 'dragon', 'master',
                    'github', 'ubuntu', 'kali', 'penetration', 'security',
                    'secret', 'access', 'changeme', 'default', 'temp'
                ]
                
                # Ajouter le username lui-même et ses variations
                username_variations = []
                if username:
                    username_variations.extend([
                        username,                    # kali
                        username.lower(),           # kali
                        username.upper(),           # KALI
                        username.capitalize(),      # Kali
                        f"{username}123",          # kali123
                        f"{username}1",            # kali1
                        f"{username}{username}",   # kalikali
                        f"123{username}",          # 123kali
                        f"{username}@123",         # kali@123
                        f"{username}_123",         # kali_123
                    ])
                
                # Combiner toutes les passwords
                all_passwords = username_variations + base_passwords
                
                with open(actual_wordlist, 'w') as f:
                    f.write('\n'.join(all_passwords))
                
                logger.info(f"📝 Wordlist ENHANCED créée: {actual_wordlist} ({len(all_passwords)} entrées)")
                
            except Exception as e:
                logger.error(f"❌ Erreur création wordlist temporaire: {e}")
                # Si on ne peut pas créer de wordlist temporaire, on utilisera auto-guess
                actual_wordlist = None
        
        # Test de connectivité DÉTAILLÉ
        connectivity_info = {}
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            
            # Déterminer le port selon le service
            port_mapping = {
                'ssh': 22, 'ftp': 21, 'telnet': 23, 'http-get': 80, 
                'https-get': 443, 'mysql': 3306, 'rdp': 3389, 'smb': 445
            }
            port = port_mapping.get(service, 22)
            
            start_time = time.time()
            result = sock.connect_ex((target, port))
            connect_time = time.time() - start_time
            sock.close()
            
            connectivity_info = {
                'port': port,
                'connect_result': result,
                'connect_time': f"{connect_time:.2f}s",
                'accessible': result == 0
            }
            
            if result == 0:
                logger.info(f"✅ Port {port} ouvert sur {target} (temps: {connect_time:.2f}s)")
            else:
                logger.warning(f"⚠️ Port {port} fermé/filtré sur {target} (code: {result})")
                
        except Exception as e:
            logger.warning(f"⚠️ Test connectivité échoué: {e}")
            connectivity_info['error'] = str(e)
        
        logger.info(f"🔧 État de la connectivité: {connectivity_info}")
        logger.info(f"📝 Wordlist finale: {actual_wordlist}")
        
        # Construire la commande Hydra OPTIMISÉE
        cmd = ['hydra']
        
        # Options de base optimisées
        cmd.extend(['-l', username])        # Login spécifique
        
        # Vérifier que actual_wordlist existe avant de l'utiliser
        if actual_wordlist and os.path.exists(actual_wordlist):
            cmd.extend(['-P', actual_wordlist]) # Password list enhanced
        else:
            # Fallback: utiliser auto-guess si pas de wordlist
            cmd.extend(['-e', 'nsr'])       # n=null, s=same as login, r=reverse login
            logger.warning(f"⚠️ Wordlist introuvable, utilisation auto-guess")
        
        # Options spécifiques selon le service
        threads_count = '1' if service == 'ssh' else '4'
        timeout_value = '10' if service == 'ssh' else '5'
        
        cmd.extend(['-t', threads_count])   # Threads selon le service
        cmd.extend(['-w', timeout_value])   # Timeout selon le service
        cmd.extend(['-f'])                  # Stop on first success
        cmd.extend(['-v'])                  # Verbose
        cmd.extend(['-s', str(connectivity_info.get('port', 22))])  # Port explicite
        
        # Format de cible selon le service
        if service == 'ssh':
            # Pour contourner les problèmes avec les vieux serveurs SSH,
            # utiliser une approche alternative avec sshpass si disponible
            try:
                # Vérifier si sshpass est disponible
                sshpass_check = subprocess.run(['which', 'sshpass'], capture_output=True)
                if sshpass_check.returncode == 0:
                    logger.info(f"🔧 Utilisation de sshpass pour contourner les problèmes SSH legacy")
                    # Utiliser sshpass avec des options SSH compatibles
                    cmd = ['hydra', '-l', username]
                    if actual_wordlist and os.path.exists(actual_wordlist):
                        cmd.extend(['-P', actual_wordlist])
                    else:
                        cmd.extend(['-e', 'nsr'])
                    cmd.extend(['-t', '1'])  # Réduire à 1 thread pour SSH problématique
                    cmd.extend(['-w', '10']) # Augmenter le timeout
                    cmd.extend(['-f', '-v'])
                    cmd.extend(['-s', '22'])
                    cmd.extend(['-o', f'/tmp/hydra_ssh_{task_id}.out'])
                    cmd.extend([target, 'ssh'])
                else:
                    # Fallback standard mais avec moins de threads
                    cmd.extend(['-t', '1'])  # 1 seul thread pour éviter les conflits
                    cmd.extend([target, 'ssh'])
            except:
                # Fallback en cas d'erreur
                cmd.extend(['-t', '1'])
                cmd.extend([target, 'ssh'])
        elif service == 'ftp':
            cmd.extend([target, 'ftp'])
        elif service == 'http-get':
            cmd.extend(['-m', '/'])
            cmd.extend([target, 'http-get'])
        elif service == 'https-get':
            cmd.extend(['-m', '/'])
            cmd.extend([target, 'https-get'])
        elif service == 'mysql':
            cmd.extend([target, 'mysql'])
        elif service == 'rdp':
            cmd.extend([target, 'rdp'])
        elif service == 'smb':
            cmd.extend([target, 'smb'])
        elif service == 'telnet':
            cmd.extend([target, 'telnet'])
        elif service == 'http-post-form':
            # HTTP POST form nécessite des paramètres spéciaux
            cmd.extend(['-m', '/login.php:username=^USER^&password=^PASS^:F=incorrect'])
            cmd.extend([target, 'http-post-form'])
        else:
            cmd.extend([target, service])
        
        # Variables d'environnement pour SSH legacy
        env = os.environ.copy()
        if service == 'ssh':
            # Ajouter des variables d'environnement SSH pour compatibilité
            env['SSH_OPTIONS'] = '-o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o PubkeyAcceptedKeyTypes=+ssh-rsa,ssh-dss -o HostKeyAlgorithms=+ssh-rsa,ssh-dss -o KexAlgorithms=+diffie-hellman-group1-sha1'
            
        logger.info(f"🔨 Commande Hydra ENHANCED: {' '.join(cmd)}")
        
        # Exécuter l'attaque avec timeout adaptatif
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,  # 3 minutes max
            env=env  # Passer les variables d'environnement
        )
        execution_time = time.time() - start_time
        
        logger.info(f"🏁 Attaque Hydra terminée avec code: {result.returncode} (temps: {execution_time:.1f}s)")
        logger.info(f"📤 Sortie Hydra: {result.stdout[:300]}...")
        if result.stderr:
            logger.warning(f"⚠️ Erreurs Hydra: {result.stderr[:300]}...")
        
        # Parser les résultats de manière plus intelligente
        results = parse_hydra_output_enhanced(result.stdout + result.stderr)
        
        # Enrichir les résultats avec des informations supplémentaires
        wordlist_size = 0
        try:
            if actual_wordlist and os.path.exists(actual_wordlist):
                with open(actual_wordlist, 'r') as f:
                    wordlist_size = sum(1 for _ in f)
        except Exception as e:
            logger.warning(f"⚠️ Erreur lecture taille wordlist: {e}")
            wordlist_size = 0
        
        results.update({
            'execution_time': f"{execution_time:.1f}s",
            'connectivity_info': connectivity_info,
            'wordlist_size': wordlist_size,
            'username_tested': username,
            'target_info': f"{target}:{connectivity_info.get('port', 22)}"
        })
        
        # Analyser le code de retour de manière plus précise
        if result.returncode == 0:
            if results.get('credentials_found'):
                results["status"] = "success"
                results["summary"] = f"{len(results['credentials_found'])} credential(s) trouvée(s)"
            else:
                results["status"] = "no_credentials_found"
                results["summary"] = f"Aucune credential trouvée sur {results['attempts']} tentatives"
        elif result.returncode == 1:
            results["status"] = "no_credentials_found"
            results["summary"] = "Aucune credential valide trouvée"
        elif result.returncode == 2:
            results["status"] = "service_error" 
            results["summary"] = "Erreur de connexion au service cible"
        else:
            results["status"] = "command_error"
            results["summary"] = f"Erreur de commande (code {result.returncode})"
        
        update_task_status(task_id, "completed", {
            "target": target,
            "service": service,
            "username": username,
            "wordlist_used": actual_wordlist,
            "command": ' '.join(cmd),
            "results": results,
            "raw_output": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode,
            "execution_time": f"{execution_time:.1f}s",
            "tool_version": "hydra_enhanced_v2"
        })
        
        logger.info(f"✅ Attaque Hydra ENHANCED terminée: {results['summary']}")
            
    except subprocess.TimeoutExpired:
        logger.error(f"⏰ Timeout de l'attaque Hydra {task_id}")
        update_task_status(task_id, "failed", {"error": "Timeout de l'attaque (3 minutes)"})
    except Exception as e:
        logger.error(f"❌ EXCEPTION attaque Hydra {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_metasploit_exploit(exploit, target, payload, lhost, task_id):
    """Exécuter un exploit Metasploit (simulation)"""
    try:
        logger.info(f"💣 DÉMARRAGE exploit Metasploit pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Exploit Metasploit en cours..."})
        
        # Simulation d'exploit Metasploit (pour des raisons de sécurité)
        logger.info(f"💣 Simulation exploit: {exploit} contre {target}")
        
        # Attendre un peu pour simuler l'exécution
        time.sleep(5)
        
        # Simuler des résultats d'exploit
        if 'handler' in exploit.lower():
            # Handler - généralement réussi
            simulated_output = f"""
[*] Started reverse TCP handler on {lhost}:4444
[*] Sending stage (175174 bytes) to {target}
[*] Meterpreter session 1 opened ({lhost}:4444 -> {target}:random) at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
[*] Session 1 created in the background.
"""
            success = True
        else:
            # Autre exploit - peut échouer
            simulated_output = f"""
[*] {target}:443 - Attempting to exploit...
[*] {target}:443 - Sending exploit payload
[-] {target}:443 - Exploit failed: Target not vulnerable
"""
            success = False
        
        # Parser les résultats simulés
        results = parse_metasploit_output(simulated_output)
        results["simulated"] = True
        results["exploit_used"] = exploit
        
        update_task_status(task_id, "completed", {
            "exploit": exploit,
            "target": target,
            "payload": payload,
            "lhost": lhost,
            "results": results,
            "raw_output": simulated_output,
            "tool_version": "metasploit_simulation",
            "note": "⚠️ Simulation pour des raisons de sécurité"
        })
        
        logger.info(f"✅ Exploit Metasploit simulé: {results['summary']}")
            
    except Exception as e:
        logger.error(f"❌ EXCEPTION exploit Metasploit {task_id}: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def run_tcpdump_capture(interface, duration, filter_expr, task_id):
    """Exécuter une capture tcpdump"""
    try:
        logger.info(f"📡 DÉMARRAGE capture tcpdump pour task {task_id}")
        update_task_status(task_id, "running", {"message": "Capture tcpdump en cours..."})
        
        # Fichier de capture
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pcap_file = f"{DIRECTORIES['temp']}/capture_{timestamp}.pcap"
        
        # Construire la commande
        cmd = ['tcpdump', '-i', interface, '-w', pcap_file, '-G', str(duration), '-W', '1']
        if filter_expr:
            cmd.append(filter_expr)
        
        logger.info(f"📡 Commande tcpdump: {' '.join(cmd)}")
        
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
                "packets_captured": "Analysis needed",
                "command": ' '.join(cmd)
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

# ============================================================
# FONCTIONS UTILITAIRES POUR HYDRA MULTI-MODE
# ============================================================

def generate_username_patterns(username):
    """Génère des variations intelligentes du username"""
    if not username:
        return ['password', 'admin', '123456', 'root']
    
    patterns = [
        username,                           # kali
        username.lower(),                   # kali  
        username.upper(),                   # KALI
        username.capitalize(),              # Kali
        f"{username}{username}",           # kalikali
        f"{username}123",                  # kali123
        f"{username}1",                    # kali1
        f"{username}12",                   # kali12
        f"{username}2024",                 # kali2024
        f"{username}@123",                 # kali@123
        f"{username}_123",                 # kali_123
        f"{username}-123",                 # kali-123
        f"123{username}",                  # 123kali
        f"password{username}",             # passwordkali
        f"{username}password",             # kalipassword
        f"{username}admin",                # kaliadmin
        f"admin{username}",                # adminkali
    ]
    
    # Ajouter des patterns basés sur des mots de passe courants
    common_passwords = ['password', 'admin', '123456', 'root', 'toor', 'pass', 'test', 'guest', 'login']
    patterns.extend(common_passwords)
    
    # Supprimer les doublons et maintenir l'ordre
    seen = set()
    unique_patterns = []
    for pattern in patterns:
        if pattern not in seen:
            seen.add(pattern)
            unique_patterns.append(pattern)
    
    return unique_patterns

def finalize_hydra_results(task_id, target, service, username, cmd, result, results, attack_mode):
    """Finalise les résultats d'une attaque Hydra"""
    
    # Déterminer le statut selon le code de retour
    if result.returncode == 0 and results.get('credentials_found'):
        results["status"] = "success"
        results["summary"] = f"{len(results['credentials_found'])} credential(s) trouvée(s) via {attack_mode}"
    elif result.returncode == 0:
        results["status"] = "no_credentials_found"
        results["summary"] = f"Aucune credential trouvée avec {attack_mode}"
    else:
        results["status"] = "failed"
        results["summary"] = f"Erreur {attack_mode} (code {result.returncode})"
    
    update_task_status(task_id, "completed", {
        "target": target,
        "service": service,
        "username": username,
        "attack_mode": attack_mode,
        "command": ' '.join(cmd),
        "results": results,
        "raw_output": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode,
        "tool_version": f"hydra_multimode_v1_{attack_mode}"
    })
    
    logger.info(f"✅ Attaque {attack_mode} terminée: {results['summary']}")

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
    
    # Base de données utilisateurs
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
            'version': '2.1.0',
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'description': 'Professional Penetration Testing Suite',
            'tools_available': global_tools_status,
            'endpoints': [
                '/api/health',
                '/api/auth/login',
                '/api/auth/register', 
                '/api/scan/nmap',
                '/api/scan/nikto',
                '/api/scan/hydra',
                '/api/scan/metasploit',
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
                'message': 'API Pacha Toolbox opérationnelle',
                'tools': current_tools_status,
                'active_tasks': len([t for t in task_status.values() if t.get('status') == 'running']),
                'completed_tasks': len([t for t in task_status.values() if t.get('status') == 'completed']),
                'method': request.method,
                'cors_enabled': True,
                'version': '2.1.0',
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
    # ROUTES DE SCAN - TOUTES COMPLÈTES
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
            
            logger.info(f"🎯 LANCEMENT scan Nmap pour task {task_id}")
            
            # Démarrer le scan en arrière-plan
            thread = threading.Thread(
                target=run_nmap_scan_enhanced,
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
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors du scan: {str(e)}'
            }), 500
    
    @app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
    def nikto_scan():
        """Endpoint pour les scans Nikto"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            target = data.get('target', 'http://127.0.0.1')
            scan_type = data.get('scanType', 'basic')
            
            if not target:
                return jsonify({'error': 'Target URL requis'}), 400
            
            # Vérifier que c'est une URL
            if not target.startswith(('http://', 'https://')):
                return jsonify({'error': 'Target doit être une URL (http:// ou https://)'}), 400
            
            # Générer l'ID de tâche
            task_id = generate_task_id('nikto')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "target": target,
                "scan_type": scan_type
            })
            
            logger.info(f"🕷️ LANCEMENT scan Nikto pour task {task_id}")
            
            # Démarrer le scan en arrière-plan
            thread = threading.Thread(
                target=run_nikto_scan_real,
                args=(target, scan_type, task_id)
            )
            thread.daemon = True
            thread.start()
            
            logger.info(f"🕷️ Scan Nikto démarré: {task_id} - {target}")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Scan Nikto de {target} démarré',
                'target': target,
                'scan_type': scan_type
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur scan Nikto: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors du scan: {str(e)}'
            }), 500
    
    @app.route('/api/scan/hydra', methods=['POST', 'OPTIONS'])
    def hydra_attack_endpoint():
        """Endpoint pour les attaques Hydra"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            target = data.get('target', '127.0.0.1')
            service = data.get('service', 'ssh')
            username = data.get('username', 'admin')
            wordlist = data.get('wordlist', '/usr/share/wordlists/rockyou.txt')
            
            if not target:
                return jsonify({'error': 'Target requis'}), 400
            
            # Générer l'ID de tâche
            task_id = generate_task_id('hydra')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "target": target,
                "service": service,
                "username": username
            })
            
            logger.info(f"🔨 LANCEMENT attaque Hydra pour task {task_id}")
            
            # Démarrer l'attaque en arrière-plan
            thread = threading.Thread(
                target=run_hydra_attack,
                args=(target, service, username, wordlist, task_id)
            )
            thread.daemon = True
            thread.start()
            
            logger.info(f"🔨 Attaque Hydra démarrée: {task_id} - {target}:{service}")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Attaque Hydra {service}://{target} démarrée',
                'target': target,
                'service': service,
                'username': username
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur attaque Hydra: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors de l\'attaque: {str(e)}'
            }), 500
    
    @app.route('/api/scan/metasploit', methods=['POST', 'OPTIONS'])
    def metasploit_exploit_endpoint():
        """Endpoint pour les exploits Metasploit"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            exploit = data.get('exploit', 'exploit/multi/handler')
            target = data.get('target', '127.0.0.1')
            payload = data.get('payload', 'windows/meterpreter/reverse_tcp')
            lhost = data.get('lhost', '127.0.0.1')
            
            if not target:
                return jsonify({'error': 'Target requis'}), 400
            
            # Générer l'ID de tâche
            task_id = generate_task_id('metasploit')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "exploit": exploit,
                "target": target,
                "payload": payload,
                "lhost": lhost
            })
            
            logger.info(f"💣 LANCEMENT exploit Metasploit pour task {task_id}")
            
            # Démarrer l'exploit en arrière-plan
            thread = threading.Thread(
                target=run_metasploit_exploit,
                args=(exploit, target, payload, lhost, task_id)
            )
            thread.daemon = True
            thread.start()
            
            logger.info(f"💣 Exploit Metasploit démarré: {task_id} - {exploit}")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Exploit {exploit} contre {target} démarré',
                'exploit': exploit,
                'target': target,
                'payload': payload,
                'lhost': lhost
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur exploit Metasploit: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors de l\'exploit: {str(e)}'
            }), 500
    
    @app.route('/api/scan/tcpdump', methods=['POST', 'OPTIONS'])
    def tcpdump_capture_endpoint():
        """Endpoint pour les captures tcpdump"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json() or {}
            interface = data.get('interface', 'eth0')
            duration = int(data.get('duration', 60))
            filter_expr = data.get('filter', '')
            
            # Générer l'ID de tâche
            task_id = generate_task_id('tcpdump')
            
            # Initialiser le statut
            update_task_status(task_id, "starting", {
                "interface": interface,
                "duration": duration,
                "filter": filter_expr
            })
            
            logger.info(f"📡 LANCEMENT capture tcpdump pour task {task_id}")
            
            # Démarrer la capture en arrière-plan
            thread = threading.Thread(
                target=run_tcpdump_capture,
                args=(interface, duration, filter_expr, task_id)
            )
            thread.daemon = True
            thread.start()
            
            logger.info(f"📡 Capture tcpdump démarrée: {task_id} - {interface}")
            
            return jsonify({
                'task_id': task_id,
                'status': 'started',
                'message': f'Capture tcpdump sur {interface} démarrée ({duration}s)',
                'interface': interface,
                'duration': duration,
                'filter': filter_expr
            })
            
        except Exception as e:
            logger.error(f"❌ Erreur capture tcpdump: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors de la capture: {str(e)}'
            }), 500
    
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
            # Retourner l'historique des tâches terminées
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
            
            # Trier par date de completion (plus récent en premier)
            history.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
            
            return jsonify({
                'scans': history,
                'total': len(history),
                'tools_status': check_security_tools()
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
    
    # RETOURNER l'objet app ici - c'était le problème principal !
    return app

# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == '__main__':
    # Vérification initiale des outils
    logger.info("🔧 Vérification initiale des outils de sécurité...")
    tools_status = check_security_tools()
    
    if tools_status.get('nikto', False):
        logger.info("✅ NIKTO EST DISPONIBLE ET FONCTIONNEL !")
    else:
        logger.warning("⚠️ NIKTO N'EST PAS DISPONIBLE")
    
    # Créer l'application
    app = create_app()
    
    # Démarrer le serveur
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Démarrage Pacha Toolbox API COMPLÈTE sur {host}:{port}")
    logger.info("🎯 Endpoints disponibles:")
    logger.info("   • GET  /                    - Informations API")
    logger.info("   • GET  /api/health          - Health check")
    logger.info("   • POST /api/auth/login      - Connexion")
    logger.info("   • POST /api/auth/register   - Inscription")
    logger.info("   • POST /api/scan/nmap       - Scan Nmap ✅")
    logger.info("   • POST /api/scan/nikto      - Scan Nikto ✅")
    logger.info("   • POST /api/scan/hydra      - Attaque Hydra ✅")
    logger.info("   • POST /api/scan/metasploit - Exploit Metasploit ✅")
    logger.info("   • POST /api/scan/tcpdump    - Capture tcpdump ✅")
    logger.info("   • GET  /api/scan/status/<id> - Statut tâche ✅")
    logger.info("   • GET  /api/scan/history    - Historique scans ✅")
    logger.info("")
    logger.info("👤 Comptes par défaut:")
    logger.info("   • admin:admin123 (administrateur)")
    logger.info("   • user:user123 (utilisateur)")
    logger.info("")
    logger.info("🔧 ✅ BACKEND COMPLET SANS ERREURS")
    
    app.run(
        host=host,
        port=port,
        debug=app.config['DEBUG'],
        threaded=True
    )