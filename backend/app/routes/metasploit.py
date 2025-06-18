from flask import Blueprint, request, jsonify
import docker
import json
import uuid
import time
import threading
import os
from datetime import datetime
import logging
from app.utils.task_manager import create_task, update_task_status

metasploit_bp = Blueprint("metasploit", __name__)
logger = logging.getLogger(__name__)

# Client Docker pour interagir avec le conteneur Metasploit
docker_client = docker.from_env()

class MetasploitClient:
    def __init__(self):
        self.container_name = "pacha-toolbox-metasploit-1"
        self.session_id = None
    
    def get_container(self):
        """Récupération du conteneur Metasploit"""
        try:
            return docker_client.containers.get(self.container_name)
        except docker.errors.NotFound:
            logger.error("Conteneur Metasploit non trouvé")
            return None
    
    def execute_command(self, command, timeout=60):
        """Exécution d'une commande dans le conteneur Metasploit"""
        try:
            container = self.get_container()
            if not container:
                return {"error": "Conteneur Metasploit non disponible"}
            
            # Exécution de la commande via msfconsole
            exec_command = f'echo "{command}" | msfconsole -q'
            
            result = container.exec_run(
                cmd=["bash", "-c", exec_command],
                timeout=timeout
            )
            
            return {
                "exit_code": result.exit_code,
                "output": result.output.decode('utf-8', errors='ignore')
            }
            
        except Exception as e:
            logger.error(f"Erreur exécution commande Metasploit: {str(e)}")
            return {"error": str(e)}
    
    def search_exploits(self, query):
        """Recherche d'exploits"""
        command = f"search {query}"
        return self.execute_command(command)
    
    def get_exploit_info(self, exploit_name):
        """Informations sur un exploit spécifique"""
        command = f"info {exploit_name}"
        return self.execute_command(command)
    
    def run_exploit(self, exploit_config):
        """Exécution d'un exploit avec configuration"""
        commands = [
            f"use {exploit_config['exploit']}",
            f"set RHOSTS {exploit_config['target']}",
            f"set RPORT {exploit_config.get('port', '80')}"
        ]
        
        # Ajout des options supplémentaires
        for option, value in exploit_config.get('options', {}).items():
            commands.append(f"set {option} {value}")
        
        # Payload si spécifié
        if 'payload' in exploit_config:
            commands.append(f"set PAYLOAD {exploit_config['payload']}")
        
        commands.append("exploit")
        
        full_command = "; ".join(commands)
        return self.execute_command(full_command, timeout=120)

@metasploit_bp.route("/search", methods=["POST"])
def search_exploits():
    """Recherche d'exploits dans Metasploit"""
    try:
        data = request.get_json()
        query = data.get("query")
        
        if not query:
            return jsonify({"error": "Terme de recherche requis"}), 400
        
        client = MetasploitClient()
        result = client.search_exploits(query)
        
        if "error" in result:
            return jsonify(result), 500
        
        # Parsing des résultats de recherche
        exploits = parse_search_results(result["output"])
        
        return jsonify({
            "query": query,
            "exploits": exploits,
            "raw_output": result["output"]
        })
        
    except Exception as e:
        logger.error(f"Erreur recherche exploits: {str(e)}")
        return jsonify({"error": str(e)}), 500

def parse_search_results(output):
    """Parsing des résultats de recherche d'exploits"""
    exploits = []
    lines = output.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and not line.startswith('=') and not line.startswith('Matching'):
            parts = line.split()
            if len(parts) >= 3:
                try:
                    name = parts[0]
                    date = parts[1] if len(parts) > 1 else ""
                    rank = parts[2] if len(parts) > 2 else ""
                    description = " ".join(parts[3:]) if len(parts) > 3 else ""
                    
                    if name.startswith('exploit/') or name.startswith('auxiliary/'):
                        exploits.append({
                            "name": name,
                            "date": date,
                            "rank": rank,
                            "description": description
                        })
                except:
                    continue
    
    return exploits

@metasploit_bp.route("/info", methods=["POST"])
def get_exploit_info():
    """Informations détaillées sur un exploit"""
    try:
        data = request.get_json()
        exploit_name = data.get("exploit_name")
        
        if not exploit_name:
            return jsonify({"error": "Nom de l'exploit requis"}), 400
        
        client = MetasploitClient()
        result = client.get_exploit_info(exploit_name)
        
        if "error" in result:
            return jsonify(result), 500
        
        # Parsing des informations de l'exploit
        info = parse_exploit_info(result["output"])
        
        return jsonify({
            "exploit_name": exploit_name,
            "info": info,
            "raw_output": result["output"]
        })
        
    except Exception as e:
        logger.error(f"Erreur info exploit: {str(e)}")
        return jsonify({"error": str(e)}), 500

def parse_exploit_info(output):
    """Parsing des informations d'un exploit"""
    info = {
        "name": "",
        "description": "",
        "author": [],
        "references": [],
        "targets": [],
        "options": {}
    }
    
    lines = output.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        
        if line.startswith('Name:'):
            info["name"] = line.replace('Name:', '').strip()
        elif line.startswith('Description:'):
            info["description"] = line.replace('Description:', '').strip()
        elif line.startswith('Author:'):
            info["author"] = [line.replace('Author:', '').strip()]
        elif 'Basic options:' in line:
            current_section = "options"
        elif 'Targets:' in line:
            current_section = "targets"
        elif current_section == "options" and '|' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 4:
                option_name = parts[1]
                option_value = parts[2]
                option_required = parts[3]
                option_desc = parts[4] if len(parts) > 4 else ""
                
                info["options"][option_name] = {
                    "value": option_value,
                    "required": option_required,
                    "description": option_desc
                }
    
    return info

@metasploit_bp.route("/exploit", methods=["POST"])
def run_exploit():
    """Exécution d'un exploit"""
    try:
        data = request.get_json()
        exploit_config = {
            "exploit": data.get("exploit"),
            "target": data.get("target"),
            "port": data.get("port", "80"),
            "payload": data.get("payload"),
            "options": data.get("options", {})
        }
        
        if not exploit_config["exploit"] or not exploit_config["target"]:
            return jsonify({"error": "Exploit et cible requis"}), 400
        
        # Génération d'un ID unique pour l'exploitation
        exploit_id = str(uuid.uuid4())
        
        # Vérification de sécurité - empêcher les attaques sur des réseaux privés sans autorisation explicite
        if not data.get("confirm_authorization", False):
            return jsonify({
                "error": "Autorisation explicite requise pour l'exécution d'exploits",
                "message": "Ajoutez 'confirm_authorization': true à votre requête"
            }), 403
        
        # Lancement asynchrone de l'exploit
        task_id = create_task("metasploit_exploit", exploit_config)
        thread = threading.Thread(
            target=run_exploit_async,
            args=(exploit_id, exploit_config, task_id)
        )
        thread.start()
        
        return jsonify({
            "exploit_id": exploit_id,
            "task_id": task_id,
            "status": "started",
            "exploit": exploit_config["exploit"],
            "target": exploit_config["target"],
            "message": "Exploitation lancée en arrière-plan"
        })
        
    except Exception as e:
        logger.error(f"Erreur exécution exploit: {str(e)}")
        return jsonify({"error": str(e)}), 500

def run_exploit_async(exploit_id, exploit_config, task_id):
    """Exécution asynchrone d'un exploit"""
    try:
        from backend.main import socketio
        
        update_task_status(task_id, "running")
        socketio.emit('exploit_status', {
            'exploit_id': exploit_id,
            'status': 'running',
            'message': 'Exploitation en cours...'
        })
        
        client = MetasploitClient()
        result = client.run_exploit(exploit_config)
        
        # Sauvegarde du résultat
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"/app/reports/metasploit_{exploit_id}_{timestamp}.txt"
        
        with open(result_file, 'w', encoding='utf-8') as f:
            f.write(f"Exploit: {exploit_config['exploit']}\n")
            f.write(f"Target: {exploit_config['target']}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write("=" * 50 + "\n")
            f.write(result.get("output", "Aucune sortie"))
        
        if "error" in result:
            update_task_status(task_id, "failed", result["error"])
            socketio.emit('exploit_status', {
                'exploit_id': exploit_id,
                'status': 'failed',
                'error': result["error"]
            })
        else:
            update_task_status(task_id, "completed", {
                "exploit_id": exploit_id,
                "output": result["output"],
                "result_file": os.path.basename(result_file)
            })
            socketio.emit('exploit_status', {
                'exploit_id': exploit_id,
                'status': 'completed',
                'output': result["output"],
                'result_file': {
                    'filename': os.path.basename(result_file),
                    'size': os.path.getsize(result_file),
                    'download_url': f"/api/download/{os.path.basename(result_file)}"
                }
            })
            
    except Exception as e:
        logger.error(f"Erreur exploitation asynchrone: {str(e)}")
        update_task_status(task_id, "failed", str(e))
        socketio.emit('exploit_status', {
            'exploit_id': exploit_id,
            'status': 'failed',
            'error': str(e)
        })

@metasploit_bp.route("/auxiliary", methods=["POST"])
def run_auxiliary():
    """Exécution d'un module auxiliaire"""
    try:
        data = request.get_json()
        auxiliary_name = data.get("auxiliary")
        target = data.get("target")
        options = data.get("options", {})
        
        if not auxiliary_name or not target:
            return jsonify({"error": "Module auxiliaire et cible requis"}), 400
        
        commands = [
            f"use {auxiliary_name}",
            f"set RHOSTS {target}"
        ]
        
        # Ajout des options
        for option, value in options.items():
            commands.append(f"set {option} {value}")
        
        commands.append("run")
        
        full_command = "; ".join(commands)
        
        client = MetasploitClient()
        result = client.execute_command(full_command, timeout=120)
        
        if "error" in result:
            return jsonify(result), 500
        
        # Sauvegarde du résultat
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"/app/reports/auxiliary_{auxiliary_name.replace('/', '_')}_{timestamp}.txt"
        
        with open(result_file, 'w', encoding='utf-8') as f:
            f.write(f"Auxiliary: {auxiliary_name}\n")
            f.write(f"Target: {target}\n")
            f.write(f"Options: {json.dumps(options, indent=2)}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write("=" * 50 + "\n")
            f.write(result["output"])
        
        return jsonify({
            "auxiliary": auxiliary_name,
            "target": target,
            "options": options,
            "output": result["output"],
            "result_file": {
                "filename": os.path.basename(result_file),
                "size": os.path.getsize(result_file),
                "download_url": f"/api/download/{os.path.basename(result_file)}"
            },
            "timestamp": timestamp
        })
        
    except Exception as e:
        logger.error(f"Erreur module auxiliaire: {str(e)}")
        return jsonify({"error": str(e)}), 500

@metasploit_bp.route("/payloads", methods=["GET"])
def get_payloads():
    """Liste des payloads disponibles"""
    try:
        platform = request.args.get("platform", "")
        arch = request.args.get("arch", "")
        
        query = "show payloads"
        if platform:
            query += f" platform:{platform}"
        if arch:
            query += f" arch:{arch}"
        
        client = MetasploitClient()
        result = client.execute_command(query)
        
        if "error" in result:
            return jsonify(result), 500
        
        # Parsing des payloads
        payloads = parse_payloads(result["output"])
        
        return jsonify({
            "platform": platform,
            "arch": arch,
            "payloads": payloads,
            "count": len(payloads)
        })
        
    except Exception as e:
        logger.error(f"Erreur liste payloads: {str(e)}")
        return jsonify({"error": str(e)}), 500

def parse_payloads(output):
    """Parsing de la liste des payloads"""
    payloads = []
    lines = output.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith('payload/'):
            parts = line.split()
            if len(parts) >= 1:
                payload_name = parts[0]
                description = " ".join(parts[1:]) if len(parts) > 1 else ""
                
                payloads.append({
                    "name": payload_name,
                    "description": description
                })
    
    return payloads

@metasploit_bp.route("/generate", methods=["POST"])
def generate_payload():
    """Génération d'un payload"""
    try:
        data = request.get_json()
        payload = data.get("payload")
        lhost = data.get("lhost")
        lport = data.get("lport", "4444")
        format_type = data.get("format", "exe")
        
        if not payload or not lhost:
            return jsonify({"error": "Payload et LHOST requis"}), 400
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"/app/reports/payload_{timestamp}.{format_type}"
        
        command = f"msfvenom -p {payload} LHOST={lhost} LPORT={lport} -f {format_type} -o {output_file}"
        
        container = docker_client.containers.get("pacha-toolbox-metasploit-1")
        result = container.exec_run(
            cmd=["bash", "-c", command],
            timeout=60
        )
        
        if result.exit_code == 0 and os.path.exists(output_file):
            return jsonify({
                "payload": payload,
                "lhost": lhost,
                "lport": lport,
                "format": format_type,
                "output_file": {
                    "filename": os.path.basename(output_file),
                    "size": os.path.getsize(output_file),
                    "download_url": f"/api/download/{os.path.basename(output_file)}"
                },
                "message": "Payload généré avec succès"
            })
        else:
            return jsonify({
                "error": "Échec de la génération du payload",
                "output": result.output.decode('utf-8', errors='ignore')
            }), 500
            
    except Exception as e:
        logger.error(f"Erreur génération payload: {str(e)}")
        return jsonify({"error": str(e)}), 500

@metasploit_bp.route("/sessions", methods=["GET"])
def get_sessions():
    """Liste des sessions actives"""
    try:
        client = MetasploitClient()
        result = client.execute_command("sessions -l")
        
        if "error" in result:
            return jsonify(result), 500
        
        # Parsing des sessions
        sessions = parse_sessions(result["output"])
        
        return jsonify({
            "sessions": sessions,
            "count": len(sessions)
        })
        
    except Exception as e:
        logger.error(f"Erreur liste sessions: {str(e)}")
        return jsonify({"error": str(e)}), 500

def parse_sessions(output):
    """Parsing de la liste des sessions"""
    sessions = []
    lines = output.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and line[0].isdigit():
            parts = line.split()
            if len(parts) >= 4:
                session_id = parts[0]
                session_type = parts[1]
                info = " ".join(parts[2:])
                
                sessions.append({
                    "id": session_id,
                    "type": session_type,
                    "info": info
                })
    
    return sessions

@metasploit_bp.route("/session/<session_id>/command", methods=["POST"])
def session_command(session_id):
    """Exécution d'une commande dans une session"""
    try:
        data = request.get_json()
        command = data.get("command")
        
        if not command:
            return jsonify({"error": "Commande requise"}), 400
        
        client = MetasploitClient()
        full_command = f"sessions -i {session_id} -c '{command}'"
        result = client.execute_command(full_command)
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify({
            "session_id": session_id,
            "command": command,
            "output": result["output"]
        })
        
    except Exception as e:
        logger.error(f"Erreur commande session: {str(e)}")
        return jsonify({"error": str(e)}), 500

@metasploit_bp.route("/status", methods=["GET"])
def get_metasploit_status():
    """Statut du service Metasploit"""
    try:
        container = docker_client.containers.get("pacha-toolbox-metasploit-1")
        
        return jsonify({
            "container_status": container.status,
            "container_id": container.id[:12],
            "image": container.image.tags[0] if container.image.tags else "unknown",
            "created": container.attrs.get("Created", ""),
            "started": container.attrs.get("State", {}).get("StartedAt", "")
        })
        
    except docker.errors.NotFound:
        return jsonify({"error": "Conteneur Metasploit non trouvé"}), 404
    except Exception as e:
        logger.error(f"Erreur statut Metasploit: {str(e)}")
        return jsonify({"error": str(e)}), 500