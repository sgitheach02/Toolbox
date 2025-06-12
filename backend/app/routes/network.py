# backend/app/routes/network.py - Intégration tcpdump optimisée
from flask import Blueprint, request, jsonify, send_file
import subprocess
import threading
import uuid
import os
import signal
from datetime import datetime
import logging
import json
import time

network_bp = Blueprint("network", __name__)
logger = logging.getLogger(__name__)

# Stockage des captures actives
active_captures = {}

@network_bp.route("/capture/interfaces", methods=["GET"])
def get_network_interfaces():
    """Liste des interfaces réseau disponibles"""
    try:
        # Récupération des interfaces avec tcpdump
        result = subprocess.run(
            ["tcpdump", "-D"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        interfaces = []
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('.')
                    if len(parts) >= 2:
                        interface_name = parts[1].strip().split()[0]
                        interfaces.append({
                            "name": interface_name,
                            "display": line.strip(),
                            "active": True
                        })
        
        # Interfaces par défaut si tcpdump -D échoue
        if not interfaces:
            interfaces = [
                {"name": "eth0", "display": "eth0 (Primary)", "active": True},
                {"name": "lo", "display": "lo (Loopback)", "active": True},
                {"name": "any", "display": "any (All interfaces)", "active": True}
            ]
        
        return jsonify({
            "interfaces": interfaces,
            "default": "eth0",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur interfaces: {str(e)}")
        return jsonify({
            "interfaces": [
                {"name": "eth0", "display": "eth0 (Default)", "active": True},
                {"name": "any", "display": "any (All interfaces)", "active": True}
            ],
            "default": "eth0",
            "error": str(e)
        })

@network_bp.route("/capture/start", methods=["POST"])
def start_capture():
    """Démarrage d'une capture tcpdump"""
    try:
        data = request.get_json() or {}
        
        # Configuration de la capture
        interface = data.get("interface", "eth0")
        duration = min(int(data.get("duration", 300)), 3600)  # Max 1h
        filter_expr = data.get("filter", "")
        capture_name = data.get("name", f"capture_{datetime.now().strftime('%H%M%S')}")
        
        # Génération d'un ID unique
        capture_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Nom du fichier de capture
        pcap_filename = f"capture_{capture_id}_{timestamp}.pcap"
        pcap_path = f"/app/reports/{pcap_filename}"
        
        # Filtres prédéfinis utiles
        predefined_filters = {
            "smb": "port 445 or port 139",
            "http": "port 80 or port 8080",
            "https": "port 443",
            "ssh": "port 22",
            "dns": "port 53",
            "web": "port 80 or port 443 or port 8080",
            "printnightmare": "host printnightmare.thm and (port 445 or port 135)",
            "all": ""
        }
        
        # Application du filtre
        if filter_expr in predefined_filters:
            bpf_filter = predefined_filters[filter_expr]
        else:
            bpf_filter = filter_expr
        
        logger.info(f"📡 Démarrage capture: {interface} -> {pcap_filename}")
        
        # Démarrage de la capture en arrière-plan
        thread = threading.Thread(
            target=run_tcpdump_capture,
            args=(capture_id, interface, duration, bpf_filter, pcap_path, capture_name),
            daemon=True
        )
        thread.start()
        
        # Stockage des infos de capture
        active_captures[capture_id] = {
            "id": capture_id,
            "name": capture_name,
            "interface": interface,
            "duration": duration,
            "filter": bpf_filter,
            "filename": pcap_filename,
            "path": pcap_path,
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "pid": None,
            "packets_captured": 0
        }
        
        return jsonify({
            "capture_id": capture_id,
            "status": "started",
            "message": f"Capture {capture_name} démarrée sur {interface}",
            "details": {
                "interface": interface,
                "duration": duration,
                "filter": bpf_filter,
                "output_file": pcap_filename
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage capture: {str(e)}")
        return jsonify({"error": str(e)}), 500

def run_tcpdump_capture(capture_id, interface, duration, bpf_filter, pcap_path, capture_name):
    """Fonction d'exécution de tcpdump en arrière-plan"""
    try:
        # Construction de la commande tcpdump
        cmd = [
            "tcpdump",
            "-i", interface,
            "-w", pcap_path,
            "-G", str(duration),
            "-W", "1",
            "-q"
        ]
        
        # Ajout du filtre si présent
        if bpf_filter.strip():
            cmd.append(bpf_filter)
        
        logger.info(f"🔧 Commande tcpdump: {' '.join(cmd)}")
        
        # Lancement de tcpdump
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Mise à jour du PID
        if capture_id in active_captures:
            active_captures[capture_id]["pid"] = process.pid
        
        # Attente de la fin
        stdout, stderr = process.communicate(timeout=duration + 30)
        
        # Analyse des résultats
        packets_captured = 0
        if stderr:
            for line in stderr.split('\n'):
                if 'packets captured' in line:
                    try:
                        packets_captured = int(line.split()[0])
                    except:
                        pass
        
        # Mise à jour du statut
        if capture_id in active_captures:
            active_captures[capture_id].update({
                "status": "completed",
                "end_time": datetime.now().isoformat(),
                "packets_captured": packets_captured,
                "file_size": os.path.getsize(pcap_path) if os.path.exists(pcap_path) else 0
            })
        
        logger.info(f"✅ Capture {capture_name} terminée: {packets_captured} paquets")
        
    except Exception as e:
        logger.error(f"❌ Erreur capture {capture_name}: {str(e)}")
        if capture_id in active_captures:
            active_captures[capture_id]["status"] = "error"
            active_captures[capture_id]["error"] = str(e)

@network_bp.route("/capture/status", methods=["GET"])
def get_captures_status():
    """Statut de toutes les captures"""
    try:
        return jsonify({
            "active_captures": len([c for c in active_captures.values() if c["status"] == "running"]),
            "total_captures": len(active_captures),
            "captures": list(active_captures.values()),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@network_bp.route("/capture/stop/<capture_id>", methods=["POST"])
def stop_capture(capture_id):
    """Arrêt d'une capture en cours"""
    try:
        if capture_id not in active_captures:
            return jsonify({"error": "Capture non trouvée"}), 404
        
        capture = active_captures[capture_id]
        
        if capture["status"] != "running":
            return jsonify({"error": "Capture non active"}), 400
        
        # Arrêt du processus
        if capture.get("pid"):
            try:
                os.kill(capture["pid"], signal.SIGTERM)
                logger.info(f"🛑 Capture {capture_id} arrêtée")
            except ProcessLookupError:
                logger.warning(f"⚠️ Processus {capture['pid']} déjà terminé")
        
        # Mise à jour du statut
        active_captures[capture_id]["status"] = "stopped"
        active_captures[capture_id]["end_time"] = datetime.now().isoformat()
        
        return jsonify({
            "message": f"Capture {capture['name']} arrêtée",
            "capture_id": capture_id,
            "status": "stopped"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur arrêt capture: {str(e)}")
        return jsonify({"error": str(e)}), 500

@network_bp.route("/capture/download/<capture_id>", methods=["GET"])
def download_capture(capture_id):
    """Téléchargement d'un fichier de capture"""
    try:
        if capture_id not in active_captures:
            return jsonify({"error": "Capture non trouvée"}), 404
        
        capture = active_captures[capture_id]
        pcap_path = capture["path"]
        
        if not os.path.exists(pcap_path):
            return jsonify({"error": "Fichier de capture non trouvé"}), 404
        
        return send_file(
            pcap_path,
            as_attachment=True,
            download_name=capture["filename"],
            mimetype='application/vnd.tcpdump.pcap'
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement: {str(e)}")
        return jsonify({"error": str(e)}), 500

@network_bp.route("/capture/filters", methods=["GET"])
def get_predefined_filters():
    """Liste des filtres prédéfinis"""
    filters = {
        "Protocoles Web": {
            "http": {"filter": "port 80", "description": "Trafic HTTP"},
            "https": {"filter": "port 443", "description": "Trafic HTTPS"},
            "web": {"filter": "port 80 or port 443", "description": "Tout trafic web"}
        },
        "Protocoles Réseau": {
            "ssh": {"filter": "port 22", "description": "Connexions SSH"},
            "dns": {"filter": "port 53", "description": "Requêtes DNS"},
            "dhcp": {"filter": "port 67 or port 68", "description": "Trafic DHCP"},
            "ftp": {"filter": "port 21", "description": "Connexions FTP"}
        },
        "Protocoles Windows": {
            "smb": {"filter": "port 445 or port 139", "description": "Partages SMB"},
            "rpc": {"filter": "port 135", "description": "RPC Windows"},
            "netbios": {"filter": "port 137 or port 138", "description": "NetBIOS"}
        },
        "Sécurité": {
            "printnightmare": {"filter": "host printnightmare.thm and (port 445 or port 135)", "description": "Analyse Print Nightmare"},
            "suspicious": {"filter": "port 4444 or port 1234 or port 31337", "description": "Ports suspects"},
            "icmp": {"filter": "icmp", "description": "Messages ICMP/Ping"}
        }
    }
    
    return jsonify({
        "categories": filters,
        "usage": "Utilisez le nom du filtre (ex: 'http', 'smb') ou écrivez votre propre filtre BPF"
    })
