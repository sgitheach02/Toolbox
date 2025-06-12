# backend/app/routes/reconnaissance.py
from flask import Blueprint, request, jsonify
import uuid
import threading
import json
import socket
import dns.resolver
from datetime import datetime
import logging
import re
import whois

recon_bp = Blueprint("reconnaissance", __name__)
logger = logging.getLogger(__name__)

# Configuration des outils de reconnaissance
RECON_TOOLS = {
    'whois': {
        'timeout': 30,
        'enabled': True
    },
    'dns': {
        'timeout': 15,
        'enabled': True,
        'record_types': ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA']
    },
    'subdomains': {
        'timeout': 60,
        'wordlist': '/usr/share/wordlists/subdomains.txt',
        'enabled': True
    },
    'port_discovery': {
        'timeout': 120,
        'top_ports': 1000,
        'enabled': True
    }
}

# Stockage des tâches de reconnaissance
recon_tasks = {}

def create_recon_task(task_type, data):
    """Création d'une tâche de reconnaissance"""
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
    recon_tasks[task_id] = task
    logger.info(f"📝 Tâche reconnaissance créée: {task_id} ({task_type})")
    return task_id

def update_recon_task_status(task_id, status, result=None, error=None):
    """Mise à jour du statut d'une tâche de reconnaissance"""
    if task_id in recon_tasks:
        recon_tasks[task_id]['status'] = status
        recon_tasks[task_id]['updated_at'] = datetime.now().isoformat()
        if result:
            recon_tasks[task_id]['result'] = result
        if error:
            recon_tasks[task_id]['error'] = error
        logger.info(f"📝 Tâche reconnaissance {task_id}: {status}")

def validate_domain(domain):
    """Validation d'un nom de domaine"""
    if not domain:
        return False
    
    # Pattern pour valider un domaine
    domain_pattern = re.compile(
        r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$'
    )
    
    # Domaines autorisés pour les tests
    allowed_domains = [
        'example.com', 'test.com', 'localhost',
        'scanme.nmap.org', 'testphp.vulnweb.com'
    ]
    
    # Vérification du pattern
    if not domain_pattern.match(domain):
        return False
    
    # Vérification des domaines autorisés (pour la sécurité)
    if domain in allowed_domains:
        return True
    
    # Autoriser les sous-domaines des domaines de test
    for allowed in allowed_domains:
        if domain.endswith('.' + allowed):
            return True
    
    return False

def perform_whois_lookup(domain, task_id):
    """Recherche WHOIS pour un domaine"""
    try:
        update_recon_task_status(task_id, 'running')
        
        logger.info(f"🔍 WHOIS lookup pour: {domain}")
        
        # Utilisation de la bibliothèque whois
        w = whois.whois(domain)
        
        # Formatage des résultats
        result = {
            'domain': domain,
            'registrar': w.registrar,
            'creation_date': str(w.creation_date) if w.creation_date else None,
            'expiration_date': str(w.expiration_date) if w.expiration_date else None,
            'updated_date': str(w.updated_date) if w.updated_date else None,
            'name_servers': w.name_servers if w.name_servers else [],
            'status': w.status if w.status else [],
            'emails': w.emails if w.emails else [],
            'raw_whois': str(w)
        }
        
        # Sauvegarde du rapport
        report_file = f"/app/reports/whois_{domain}_{task_id}.json"
        with open(report_file, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        result['report_file'] = report_file
        
        update_recon_task_status(task_id, 'completed', result)
        logger.info(f"✅ WHOIS lookup terminé: {task_id}")
        
    except Exception as e:
        error_msg = f"Erreur WHOIS: {str(e)}"
        update_recon_task_status(task_id, 'failed', error=error_msg)
        logger.error(f"❌ Erreur WHOIS: {e}")

def perform_dns_enumeration(domain, task_id):
    """Énumération DNS complète"""
    try:
        update_recon_task_status(task_id, 'running')
        
        logger.info(f"🔍 Énumération DNS pour: {domain}")
        
        result = {
            'domain': domain,
            'dns_records': {},
            'subdomains': [],
            'dns_servers': []
        }
        
        # Énumération des types d'enregistrements DNS
        for record_type in RECON_TOOLS['dns']['record_types']:
            try:
                answers = dns.resolver.resolve(domain, record_type)
                result['dns_records'][record_type] = [str(rdata) for rdata in answers]
                logger.info(f"📊 {record_type} records trouvés: {len(answers)}")
            except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.LifetimeTimeout):
                result['dns_records'][record_type] = []
        
        # Recherche de sous-domaines communs
        common_subdomains = [
            'www', 'mail', 'ftp', 'admin', 'test', 'dev', 'staging',
            'api', 'app', 'blog', 'shop', 'support', 'help'
        ]
        
        for subdomain in common_subdomains:
            full_domain = f"{subdomain}.{domain}"
            try:
                answers = dns.resolver.resolve(full_domain, 'A')
                result['subdomains'].append({
                    'subdomain': full_domain,
                    'ips': [str(rdata) for rdata in answers]
                })
                logger.info(f"📍 Sous-domaine trouvé: {full_domain}")
            except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.LifetimeTimeout):
                pass
        
        # Sauvegarde du rapport
        report_file = f"/app/reports/dns_enum_{domain}_{task_id}.json"
        with open(report_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        result['report_file'] = report_file
        
        update_recon_task_status(task_id, 'completed', result)
        logger.info(f"✅ Énumération DNS terminée: {task_id}")
        
    except Exception as e:
        error_msg = f"Erreur énumération DNS: {str(e)}"
        update_recon_task_status(task_id, 'failed', error=error_msg)
        logger.error(f"❌ Erreur DNS: {e}")

def perform_port_discovery(target, task_id):
    """Découverte de ports avec socket scanning"""
    try:
        update_recon_task_status(task_id, 'running')
        
        logger.info(f"🔍 Découverte de ports pour: {target}")
        
        # Ports communs à scanner
        common_ports = [
            21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 993, 995,
            1723, 3306, 3389, 5432, 5900, 6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007
        ]
        
        open_ports = []
        closed_ports = []
        
        for port in common_ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((target, port))
                
                if result == 0:
                    # Port ouvert - tentative d'identification du service
                    try:
                        sock.send(b'HEAD / HTTP/1.0\r\n\r\n')
                        banner = sock.recv(1024).decode('utf-8', errors='ignore')
                    except:
                        banner = ""
                    
                    open_ports.append({
                        'port': port,
                        'state': 'open',
                        'banner': banner[:200] if banner else None
                    })
                    logger.info(f"📖 Port ouvert: {port}")
                else:
                    closed_ports.append(port)
                
                sock.close()
                
            except Exception as e:
                closed_ports.append(port)
                logger.debug(f"Port {port} fermé ou filtré: {e}")
        
        result = {
            'target': target,
            'open_ports': open_ports,
            'total_scanned': len(common_ports),
            'open_count': len(open_ports),
            'closed_count': len(closed_ports)
        }
        
        # Sauvegarde du rapport
        report_file = f"/app/reports/port_discovery_{target}_{task_id}.json"
        with open(report_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        result['report_file'] = report_file
        
        update_recon_task_status(task_id, 'completed', result)
        logger.info(f"✅ Découverte de ports terminée: {task_id}")
        
    except Exception as e:
        error_msg = f"Erreur découverte de ports: {str(e)}"
        update_recon_task_status(task_id, 'failed', error=error_msg)
        logger.error(f"❌ Erreur port discovery: {e}")

def perform_comprehensive_recon(target, task_id):
    """Reconnaissance complète d'une cible"""
    try:
        update_recon_task_status(task_id, 'running')
        
        logger.info(f"🔍 Reconnaissance complète pour: {target}")
        
        result = {
            'target': target,
            'timestamp': datetime.now().isoformat(),
            'whois_data': None,
            'dns_data': None,
            'port_data': None,
            'summary': {}
        }
        
        # 1. WHOIS si c'est un domaine
        if validate_domain(target):
            try:
                w = whois.whois(target)
                result['whois_data'] = {
                    'registrar': w.registrar,
                    'creation_date': str(w.creation_date) if w.creation_date else None,
                    'expiration_date': str(w.expiration_date) if w.expiration_date else None,
                    'name_servers': w.name_servers if w.name_servers else []
                }
            except Exception as e:
                logger.warning(f"⚠️ Erreur WHOIS: {e}")
        
        # 2. Énumération DNS
        if validate_domain(target):
            try:
                dns_records = {}
                for record_type in ['A', 'AAAA', 'MX', 'TXT']:
                    try:
                        answers = dns.resolver.resolve(target, record_type)
                        dns_records[record_type] = [str(rdata) for rdata in answers]
                    except:
                        dns_records[record_type] = []
                
                result['dns_data'] = dns_records
            except Exception as e:
                logger.warning(f"⚠️ Erreur DNS: {e}")
        
        # 3. Découverte de ports basique
        try:
            # Résolution du nom si nécessaire
            try:
                ip_target = socket.gethostbyname(target)
            except:
                ip_target = target
            
            # Scan des ports les plus communs
            quick_ports = [21, 22, 23, 25, 53, 80, 135, 139, 443, 445, 993, 995, 3389, 5432, 3306]
            open_ports = []
            
            for port in quick_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    if sock.connect_ex((ip_target, port)) == 0:
                        open_ports.append(port)
                    sock.close()
                except:
                    pass
            
            result['port_data'] = {
                'target_ip': ip_target,
                'open_ports': open_ports,
                'scanned_ports': quick_ports
            }
        except Exception as e:
            logger.warning(f"⚠️ Erreur port scan: {e}")
        
        # 4. Résumé
        result['summary'] = {
            'domain_valid': validate_domain(target),
            'whois_available': result['whois_data'] is not None,
            'dns_records_found': len(result['dns_data'] or {}) > 0,
            'open_ports_count': len(result['port_data']['open_ports']) if result['port_data'] else 0,
            'target_type': 'domain' if validate_domain(target) else 'ip'
        }
        
        # Sauvegarde du rapport
        report_file = f"/app/reports/comprehensive_recon_{target}_{task_id}.json"
        with open(report_file, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        result['report_file'] = report_file
        
        update_recon_task_status(task_id, 'completed', result)
        logger.info(f"✅ Reconnaissance complète terminée: {task_id}")
        
    except Exception as e:
        error_msg = f"Erreur reconnaissance complète: {str(e)}"
        update_recon_task_status(task_id, 'failed', error=error_msg)
        logger.error(f"❌ Erreur reconnaissance complète: {e}")

# Routes de l'API de reconnaissance
@recon_bp.route("/test", methods=["GET"])
def test_recon():
    """Test du module de reconnaissance"""
    return jsonify({
        "message": "Module reconnaissance fonctionnel !",
        "version": "1.0",
        "available_endpoints": [
            "/api/recon/whois",
            "/api/recon/dns",
            "/api/recon/ports",
            "/api/recon/comprehensive",
            "/api/recon/status/<task_id>",
            "/api/recon/tasks"
        ],
        "tools_status": RECON_TOOLS
    })

@recon_bp.route("/whois", methods=["POST"])
def start_whois_lookup():
    """Démarrage d'une recherche WHOIS"""
    try:
        data = request.get_json()
        
        if not data or 'domain' not in data:
            return jsonify({"error": "Paramètre 'domain' requis"}), 400
        
        domain = data['domain'].strip().lower()
        
        if not validate_domain(domain):
            return jsonify({"error": "Domaine non valide ou non autorisé"}), 403
        
        # Création de la tâche
        task_id = create_recon_task('whois_lookup', {
            'domain': domain,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(target=perform_whois_lookup, args=(domain, task_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "domain": domain,
            "message": "Recherche WHOIS démarrée"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage WHOIS: {e}")
        return jsonify({"error": str(e)}), 500

@recon_bp.route("/dns", methods=["POST"])
def start_dns_enumeration():
    """Démarrage d'une énumération DNS"""
    try:
        data = request.get_json()
        
        if not data or 'domain' not in data:
            return jsonify({"error": "Paramètre 'domain' requis"}), 400
        
        domain = data['domain'].strip().lower()
        
        if not validate_domain(domain):
            return jsonify({"error": "Domaine non valide ou non autorisé"}), 403
        
        # Création de la tâche
        task_id = create_recon_task('dns_enumeration', {
            'domain': domain,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(target=perform_dns_enumeration, args=(domain, task_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "domain": domain,
            "message": "Énumération DNS démarrée"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage DNS: {e}")
        return jsonify({"error": str(e)}), 500

@recon_bp.route("/ports", methods=["POST"])
def start_port_discovery():
    """Démarrage de la découverte de ports"""
    try:
        data = request.get_json()
        
        if not data or 'target' not in data:
            return jsonify({"error": "Paramètre 'target' requis"}), 400
        
        target = data['target'].strip()
        
        # Validation basique de la cible
        if not (validate_domain(target) or target.startswith('192.168.') or target.startswith('127.')):
            return jsonify({"error": "Cible non autorisée"}), 403
        
        # Création de la tâche
        task_id = create_recon_task('port_discovery', {
            'target': target,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(target=perform_port_discovery, args=(target, task_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "target": target,
            "message": "Découverte de ports démarrée"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage port discovery: {e}")
        return jsonify({"error": str(e)}), 500

@recon_bp.route("/comprehensive", methods=["POST"])
def start_comprehensive_recon():
    """Démarrage d'une reconnaissance complète"""
    try:
        data = request.get_json()
        
        if not data or 'target' not in data:
            return jsonify({"error": "Paramètre 'target' requis"}), 400
        
        target = data['target'].strip().lower()
        
        # Validation de la cible
        if not (validate_domain(target) or target.startswith('192.168.') or target.startswith('127.')):
            return jsonify({"error": "Cible non autorisée"}), 403
        
        # Création de la tâche
        task_id = create_recon_task('comprehensive_recon', {
            'target': target,
            'started_at': datetime.now().isoformat()
        })
        
        # Lancement en arrière-plan
        thread = threading.Thread(target=perform_comprehensive_recon, args=(target, task_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "target": target,
            "message": "Reconnaissance complète démarrée"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage reconnaissance complète: {e}")
        return jsonify({"error": str(e)}), 500

@recon_bp.route("/status/<task_id>", methods=["GET"])
def get_recon_task_status(task_id):
    """Récupération du statut d'une tâche de reconnaissance"""
    if task_id not in recon_tasks:
        return jsonify({"error": "Tâche non trouvée"}), 404
    
    task = recon_tasks[task_id]
    return jsonify(task)

@recon_bp.route("/tasks", methods=["GET"])
def list_recon_tasks():
    """Liste de toutes les tâches de reconnaissance"""
    return jsonify({
        "total_tasks": len(recon_tasks),
        "tasks": list(recon_tasks.values())
    })

@recon_bp.route("/tools", methods=["GET"])
def get_recon_tools_status():
    """Status des outils de reconnaissance"""
    return jsonify({
        "tools": RECON_TOOLS,
        "available_operations": [
            "whois_lookup",
            "dns_enumeration", 
            "port_discovery",
            "comprehensive_recon"
        ]
    })