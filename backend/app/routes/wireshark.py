from flask import Blueprint, request, jsonify
import subprocess
import os
import uuid
import threading
import time
import signal
from datetime import datetime
import logging
from app.utils.task_manager import create_task, update_task_status

wireshark_bp = Blueprint("wireshark", __name__)
logger = logging.getLogger(__name__)

# Dictionnaire pour stocker les processus de capture actifs
active_captures = {}

@wireshark_bp.route("/capture/start", methods=["POST"])
def start_packet_capture():
    """Démarrage d'une capture de paquets avec tshark"""
    try:
        data = request.get_json()
        interface = data.get("interface", "eth0")
        duration = data.get("duration", 60)  # Durée en secondes
        filter_expression = data.get("filter", "")
        capture_name = data.get("name", f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        # Génération d'un ID unique pour la capture
        capture_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Nom du fichier de capture
        pcap_file = f"/app/reports/wireshark_{capture_name}_{timestamp}.pcap"
        
        # Construction de la commande tshark
        command = [
            "tshark",
            "-i", interface,
            "-a", f"duration:{duration}",
            "-w", pcap_file
        ]
        
        # Ajout du filtre si spécifié
        if filter_expression:
            command.extend(["-f", filter_expression])
        
        # Démarrage du processus de capture
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Stockage du processus actif
        active_captures[capture_id] = {
            "process": process,
            "start_time": datetime.now(),
            "duration": duration,
            "interface": interface,
            "filter": filter_expression,
            "pcap_file": pcap_file,
            "capture_name": capture_name,
            "status": "running"
        }
        
        # Lancement du monitoring en arrière-plan
        thread = threading.Thread(
            target=monitor_capture,
            args=(capture_id,)
        )
        thread.start()
        
        return jsonify({
            "capture_id": capture_id,
            "status": "started",
            "interface": interface,
            "duration": duration,
            "filter": filter_expression,
            "pcap_file": os.path.basename(pcap_file),
            "message": "Capture de paquets démarrée"
        })
        
    except Exception as e:
        logger.error(f"Erreur démarrage capture: {str(e)}")
        return jsonify({"error": str(e)}), 500

def monitor_capture(capture_id):
    """Monitoring d'une capture en arrière-plan"""
    try:
        from app.main import socketio
        
        capture_info = active_captures.get(capture_id)
        if not capture_info:
            return
        
        process = capture_info["process"]
        
        # Attente de la fin du processus
        stdout, stderr = process.communicate()
        
        # Mise à jour du statut
        if process.returncode == 0:
            capture_info["status"] = "completed"
            
            # Génération d'informations sur le fichier
            pcap_file = capture_info["pcap_file"]
            if os.path.exists(pcap_file):
                file_size = os.path.getsize(pcap_file)
                
                # Analyse rapide du fichier
                analysis = analyze_pcap_file(pcap_file)
                
                socketio.emit('capture_status', {
                    'capture_id': capture_id,
                    'status': 'completed',
                    'file_info': {
                        'filename': os.path.basename(pcap_file),
                        'size': file_size,
                        'download_url': f"/api/download/{os.path.basename(pcap_file)}"
                    },
                    'analysis': analysis
                })
            else:
                capture_info["status"] = "failed"
                socketio.emit('capture_status', {
                    'capture_id': capture_id,
                    'status': 'failed',
                    'error': 'Fichier de capture non créé'
                })
        else:
            capture_info["status"] = "failed"
            socketio.emit('capture_status', {
                'capture_id': capture_id,
                'status': 'failed',
                'error': stderr or 'Erreur inconnue'
            })
            
    except Exception as e:
        logger.error(f"Erreur monitoring capture {capture_id}: {str(e)}")
        if capture_id in active_captures:
            active_captures[capture_id]["status"] = "failed"

def analyze_pcap_file(pcap_file):
    """Analyse rapide d'un fichier PCAP"""
    try:
        # Utilisation de tshark pour l'analyse
        commands = {
            "packet_count": ["tshark", "-r", pcap_file, "-q", "-z", "io,stat,0"],
            "protocols": ["tshark", "-r", pcap_file, "-q", "-z", "io,phs"],
            "conversations": ["tshark", "-r", pcap_file, "-q", "-z", "conv,ip"]
        }
        
        analysis = {}
        
        for analysis_type, command in commands.items():
            try:
                result = subprocess.run(
                    command,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0:
                    analysis[analysis_type] = result.stdout.strip()
            except subprocess.TimeoutExpired:
                analysis[analysis_type] = "Timeout lors de l'analyse"
            except Exception as e:
                analysis[analysis_type] = f"Erreur: {str(e)}"
        
        return analysis
        
    except Exception as e:
        logger.error(f"Erreur analyse PCAP: {str(e)}")
        return {"error": str(e)}

@wireshark_bp.route("/capture/stop/<capture_id>", methods=["POST"])
def stop_packet_capture(capture_id):
    """Arrêt d'une capture de paquets"""
    try:
        if capture_id not in active_captures:
            return jsonify({"error": "Capture non trouvée"}), 404
        
        capture_info = active_captures[capture_id]
        process = capture_info["process"]
        
        if capture_info["status"] == "running":
            # Envoi du signal SIGTERM pour arrêter proprement
            process.terminate()
            
            # Attente de l'arrêt (max 5 secondes)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Forcer l'arrêt si nécessaire
                process.kill()
                process.wait()
            
            capture_info["status"] = "stopped"
            
            return jsonify({
                "capture_id": capture_id,
                "status": "stopped",
                "message": "Capture arrêtée"
            })
        else:
            return jsonify({
                "capture_id": capture_id,
                "status": capture_info["status"],
                "message": "Capture déjà arrêtée"
            })
            
    except Exception as e:
        logger.error(f"Erreur arrêt capture: {str(e)}")
        return jsonify({"error": str(e)}), 500

@wireshark_bp.route("/capture/status/<capture_id>", methods=["GET"])
def get_capture_status(capture_id):
    """Récupération du statut d'une capture"""
    try:
        if capture_id not in active_captures:
            return jsonify({"error": "Capture non trouvée"}), 404
        
        capture_info = active_captures[capture_id]
        
        # Calcul du temps écoulé
        elapsed_time = (datetime.now() - capture_info["start_time"]).total_seconds()
        remaining_time = max(0, capture_info["duration"] - elapsed_time)
        
        status_info = {
            "capture_id": capture_id,
            "status": capture_info["status"],
            "interface": capture_info["interface"],
            "filter": capture_info["filter"],
            "elapsed_time": int(elapsed_time),
            "remaining_time": int(remaining_time),
            "duration": capture_info["duration"],
            "start_time": capture_info["start_time"].isoformat()
        }
        
        # Ajout des informations de fichier si la capture est terminée
        if capture_info["status"] in ["completed", "stopped"]:
            pcap_file = capture_info["pcap_file"]
            if os.path.exists(pcap_file):
                status_info["file_info"] = {
                    "filename": os.path.basename(pcap_file),
                    "size": os.path.getsize(pcap_file),
                    "download_url": f"/api/download/{os.path.basename(pcap_file)}"
                }
        
        return jsonify(status_info)
        
    except Exception as e:
        logger.error(f"Erreur statut capture: {str(e)}")
        return jsonify({"error": str(e)}), 500

@wireshark_bp.route("/capture/list", methods=["GET"])
def list_captures():
    """Liste de toutes les captures"""
    try:
        captures = []
        for capture_id, capture_info in active_captures.items():
            elapsed_time = (datetime.now() - capture_info["start_time"]).total_seconds()
            
            capture_data = {
                "capture_id": capture_id,
                "status": capture_info["status"],
                "capture_name": capture_info["capture_name"],
                "interface": capture_info["interface"],
                "start_time": capture_info["start_time"].isoformat(),
                "elapsed_time": int(elapsed_time)
            }
            
            if capture_info["status"] in ["completed", "stopped"]:
                pcap_file = capture_info["pcap_file"]
                if os.path.exists(pcap_file):
                    capture_data["file_info"] = {
                        "filename": os.path.basename(pcap_file),
                        "size": os.path.getsize(pcap_file)
                    }
            
            captures.append(capture_data)
        
        return jsonify({"captures": captures})
        
    except Exception as e:
        logger.error(f"Erreur liste captures: {str(e)}")
        return jsonify({"error": str(e)}), 500

@wireshark_bp.route("/interfaces", methods=["GET"])
def get_network_interfaces():
    """Récupération des interfaces réseau disponibles"""
    try:
        # Utilisation de tshark pour lister les interfaces
        result = subprocess.run(
            ["tshark", "-D"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            interfaces = []
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    # Format: "1. eth0 (Ethernet)"
                    parts = line.split('.', 1)
                    if len(parts) > 1:
                        interface_info = parts[1].strip()
                        interface_name = interface_info.split()[0]
                        description = interface_info
                        
                        interfaces.append({
                            "name": interface_name,
                            "description": description
                        })
            
            return jsonify({"interfaces": interfaces})
        else:
            return jsonify({"error": "Impossible de lister les interfaces"}), 500
            
    except Exception as e:
        logger.error(f"Erreur interfaces réseau: {str(e)}")
        return jsonify({"error": str(e)}), 500

@wireshark_bp.route("/analyze", methods=["POST"])
def analyze_pcap():
    """Analyse approfondie d'un fichier PCAP"""
    try:
        data = request.get_json()
        filename = data.get("filename")
        
        if not filename:
            return jsonify({"error": "Nom de fichier requis"}), 400
        
        pcap_file = f"/app/reports/{filename}"
        
        if not os.path.exists(pcap_file):
            return jsonify({"error": "Fichier non trouvé"}), 404
        
        # Analyse détaillée
        analysis = {
            "basic_stats": get_basic_stats(pcap_file),
            "protocol_hierarchy": get_protocol_hierarchy(pcap_file),
            "conversations": get_conversations(pcap_file),
            "endpoints": get_endpoints(pcap_file),
            "http_requests": get_http_requests(pcap_file)
        }
        
        # Génération d'un rapport HTML
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"/app/reports/wireshark_analysis_{timestamp}.html"
        
        generate_wireshark_report(analysis, report_file, filename)
        
        return jsonify({
            "analysis": analysis,
            "report_file": {
                "filename": os.path.basename(report_file),
                "size": os.path.getsize(report_file),
                "download_url": f"/api/download/{os.path.basename(report_file)}"
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur analyse PCAP: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_basic_stats(pcap_file):
    """Statistiques de base du fichier PCAP"""
    try:
        result = subprocess.run(
            ["capinfos", pcap_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else "Erreur"
    except:
        return "Non disponible"

def get_protocol_hierarchy(pcap_file):
    """Hiérarchie des protocoles"""
    try:
        result = subprocess.run(
            ["tshark", "-r", pcap_file, "-q", "-z", "io,phs"],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else "Erreur"
    except:
        return "Non disponible"

def get_conversations(pcap_file):
    """Conversations IP"""
    try:
        result = subprocess.run(
            ["tshark", "-r", pcap_file, "-q", "-z", "conv,ip"],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else "Erreur"
    except:
        return "Non disponible"

def get_endpoints(pcap_file):
    """Points de terminaison"""
    try:
        result = subprocess.run(
            ["tshark", "-r", pcap_file, "-q", "-z", "endpoints,ip"],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else "Erreur"
    except:
        return "Non disponible"

def get_http_requests(pcap_file):
    """Requêtes HTTP"""
    try:
        result = subprocess.run(
            ["tshark", "-r", pcap_file, "-Y", "http.request", "-T", "fields", "-e", "http.host", "-e", "http.request.uri", "-e", "http.request.method"],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else "Erreur"
    except:
        return "Non disponible"

def generate_wireshark_report(analysis, report_file, pcap_filename):
    """Génération d'un rapport HTML pour l'analyse Wireshark"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rapport d'analyse Wireshark - {pcap_filename}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2 {{ color: #333; }}
            pre {{ background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }}
            .section {{ margin-bottom: 30px; }}
        </style>
    </head>
    <body>
        <h1>Rapport d'analyse Wireshark</h1>
        <p><strong>Fichier analysé:</strong> {pcap_filename}</p>
        <p><strong>Date d'analyse:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="section">
            <h2>Statistiques de base</h2>
            <pre>{analysis.get('basic_stats', 'Non disponible')}</pre>
        </div>
        
        <div class="section">
            <h2>Hiérarchie des protocoles</h2>
            <pre>{analysis.get('protocol_hierarchy', 'Non disponible')}</pre>
        </div>
        
        <div class="section">
            <h2>Conversations IP</h2>
            <pre>{analysis.get('conversations', 'Non disponible')}</pre>
        </div>
        
        <div class="section">
            <h2>Points de terminaison</h2>
            <pre>{analysis.get('endpoints', 'Non disponible')}</pre>
        </div>
        
        <div class="section">
            <h2>Requêtes HTTP</h2>
            <pre>{analysis.get('http_requests', 'Non disponible')}</pre>
        </div>
    </body>
    </html>
    """
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(html_content)