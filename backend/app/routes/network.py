from flask import Blueprint, request, jsonify
import subprocess
import threading
import uuid
import os
from datetime import datetime
import logging

# Correction: Nom du blueprint cohérent
network_bp = Blueprint("network", __name__)
logger = logging.getLogger(__name__)

@network_bp.route("/capture/start", methods=["POST"])
def start_tcpdump_capture():
    """Démarrage capture tcpdump - Print Nightmare optimisé"""
    try:
        data = request.get_json() or {}
        
        # Configuration optimisée pour Print Nightmare
        interface = data.get("interface", "eth0")
        duration = data.get("duration", 300)  # 5 minutes
        filter_type = data.get("filter_type", "smb_rpc")
        
        # Filtres prédéfinis pour Print Nightmare
        filters = {
            "smb_rpc": "host printnightmare.thm and (port 445 or port 135 or port 139)",
            "smb_only": "host printnightmare.thm and port 445",
            "rpc_only": "host printnightmare.thm and port 135", 
            "all_traffic": "host printnightmare.thm",
            "print_spooler": "host printnightmare.thm and port 445 and tcp[13] & 0x02 != 0"
        }
        
        bpf_filter = filters.get(filter_type, filters["smb_rpc"])
        custom_filter = data.get("custom_filter")
        if custom_filter:
            bpf_filter = custom_filter
        
        # Génération du nom de fichier
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        capture_id = str(uuid.uuid4())[:8]
        pcap_file = f"/app/reports/capture_{capture_id}_{timestamp}.pcap"
        
        logger.info(f"📡 Démarrage capture tcpdump: {interface} -> {pcap_file}")
        
        # Lancement asynchrone
        thread = threading.Thread(
            target=run_tcpdump_capture,
            args=(interface, duration, bpf_filter, pcap_file, capture_id),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            "capture_id": capture_id,
            "status": "started",
            "interface": interface,
            "duration": duration,
            "filter": bpf_filter,
            "output_file": os.path.basename(pcap_file),
            "message": f"Capture tcpdump démarrée sur {interface}"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur capture tcpdump: {str(e)}")
        return jsonify({"error": str(e)}), 500

@network_bp.route("/capture/stop/<capture_id>", methods=["POST"])
def stop_tcpdump_capture(capture_id):
    """Arrêt d'une capture en cours"""
    try:
        # Arrêt du processus tcpdump par capture_id
        subprocess.run(["pkill", "-f", f"tcpdump.*{capture_id}"], check=False)
        
        return jsonify({
            "capture_id": capture_id,
            "status": "stopped",
            "message": "Capture arrêtée"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@network_bp.route("/status", methods=["GET"])
def network_status():
    """Statut du module réseau"""
    return jsonify({
        "status": "operational",
        "tcpdump_available": True,
        "interfaces": ["eth0", "lo"],
        "message": "Module réseau fonctionnel"
    })

@network_bp.route("/filters", methods=["GET"])
def get_predefined_filters():
    """Liste des filtres prédéfinis pour Print Nightmare"""
    filters = {
        "smb_rpc": {
            "name": "SMB + RPC (Print Nightmare)",
            "filter": "host printnightmare.thm and (port 445 or port 135 or port 139)",
            "description": "Capture tout le trafic SMB et RPC vers la cible"
        },
        "smb_only": {
            "name": "SMB seulement",
            "filter": "host printnightmare.thm and port 445",
            "description": "Capture uniquement le trafic SMB"
        },
        "rpc_only": {
            "name": "RPC seulement", 
            "filter": "host printnightmare.thm and port 135",
            "description": "Capture uniquement le trafic RPC Endpoint Mapper"
        },
        "print_spooler": {
            "name": "Print Spooler (connexions)",
            "filter": "host printnightmare.thm and port 445 and tcp[13] & 0x02 != 0",
            "description": "Capture les connexions TCP vers le Print Spooler"
        },
        "all_traffic": {
            "name": "Tout le trafic",
            "filter": "host printnightmare.thm", 
            "description": "Capture tout le trafic vers/depuis la cible"
        }
    }
    
    return jsonify({"filters": filters})

def run_tcpdump_capture(interface, duration, bpf_filter, pcap_file, capture_id):
    """Exécution de la capture tcpdump"""
    try:
        logger.info(f"🔍 Tcpdump: {interface} pendant {duration}s")
        
        # Commande tcpdump optimisée
        cmd = [
            "timeout", str(duration),
            "tcpdump", 
            "-i", interface,
            "-w", pcap_file,
            "-s", "65535",  # Capture complète
            "-n",           # Pas de résolution DNS
            bpf_filter
        ]
        
        logger.info(f"📡 Commande: {' '.join(cmd)}")
        
        # Exécution avec gestion d'erreurs
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=duration + 30
        )
        
        if os.path.exists(pcap_file) and os.path.getsize(pcap_file) > 0:
            logger.info(f"✅ Capture terminée: {pcap_file} ({os.path.getsize(pcap_file)} bytes)")
        else:
            logger.warning(f"⚠️ Aucun paquet capturé ou fichier vide: {pcap_file}")
            
    except Exception as e:
        logger.error(f"❌ Erreur capture tcpdump: {str(e)}")