from flask import Blueprint, request, jsonify
import subprocess
import threading
import uuid
import os
from datetime import datetime
import logging

# Si votre route s'appelle wireshark_bp, gardons le nom
tcpdump_bp = Blueprint("tcpdump", __name__)
logger = logging.getLogger(__name__)

@tcpdump_bp.route("/capture/start", methods=["POST"])
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

@tcpdump_bp.route("/capture/stop/<capture_id>", methods=["POST"])
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

@tcpdump_bp.route("/analyze/<filename>", methods=["GET"])
def analyze_pcap():
    """Analyse rapide d'un fichier PCAP avec tcpdump"""
    try:
        filename = request.view_args['filename']
        pcap_path = f"/app/reports/{filename}"
        
        if not os.path.exists(pcap_path):
            return jsonify({"error": "Fichier PCAP non trouvé"}), 404
        
        # Analyses tcpdump
        analysis = {}
        
        # 1. Statistiques générales
        cmd = ["tcpdump", "-r", pcap_path, "-q", "-n"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        total_packets = len([l for l in result.stdout.split('\n') if l.strip()])
        analysis["total_packets"] = total_packets
        
        # 2. Top IPs
        cmd = ["tcpdump", "-r", pcap_path, "-n", "-q", "|", "awk", "'{print $3}'", "|", "cut", "-d.", "-f1-4", "|", "sort", "|", "uniq", "-c", "|", "sort", "-nr"]
        result = subprocess.run(" ".join(cmd), shell=True, capture_output=True, text=True)
        analysis["top_ips"] = result.stdout.strip().split('\n')[:5]
        
        # 3. Protocoles détectés
        protocols = {"TCP": 0, "UDP": 0, "ICMP": 0, "ARP": 0}
        for line in result.stdout.split('\n'):
            if 'TCP' in line.upper(): protocols["TCP"] += 1
            elif 'UDP' in line.upper(): protocols["UDP"] += 1
            elif 'ICMP' in line.upper(): protocols["ICMP"] += 1
            elif 'ARP' in line.upper(): protocols["ARP"] += 1
        analysis["protocols"] = protocols
        
        # 4. Analyse spécifique SMB/RPC
        smb_analysis = analyze_smb_traffic(pcap_path)
        analysis["smb_analysis"] = smb_analysis
        
        return jsonify({
            "filename": filename,
            "file_size": os.path.getsize(pcap_path),
            "analysis": analysis,
            "analyzed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur analyse PCAP: {str(e)}")
        return jsonify({"error": str(e)}), 500

@tcpdump_bp.route("/filters", methods=["GET"])
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

@tcpdump_bp.route("/live/<interface>", methods=["GET"])
def live_capture_preview(interface):
    """Aperçu en direct du trafic (premiers paquets)"""
    try:
        # Capture de 10 paquets pour preview
        cmd = ["timeout", "10", "tcpdump", "-i", interface, "-c", "10", "-n", "host", "printnightmare.thm"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        return jsonify({
            "interface": interface,
            "preview_packets": result.stdout.split('\n'),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
            
            # Analyse rapide post-capture
            quick_analysis = analyze_capture_summary(pcap_file)
            
            # Sauvegarde des métadonnées
            metadata_file = pcap_file.replace('.pcap', '_metadata.json')
            import json
            with open(metadata_file, 'w') as f:
                json.dump({
                    "capture_id": capture_id,
                    "interface": interface,
                    "duration": duration,
                    "filter": bpf_filter,
                    "file_size": os.path.getsize(pcap_file),
                    "analysis": quick_analysis,
                    "completed_at": datetime.now().isoformat()
                }, f, indent=2)
                
        else:
            logger.warning(f"⚠️ Aucun paquet capturé ou fichier vide: {pcap_file}")
            
    except Exception as e:
        logger.error(f"❌ Erreur capture tcpdump: {str(e)}")

def analyze_smb_traffic(pcap_path):
    """Analyse spécifique du trafic SMB"""
    try:
        # Analyse SMB avec tcpdump
        cmd = ["tcpdump", "-r", pcap_path, "-n", "port", "445"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        smb_packets = len([l for l in result.stdout.split('\n') if l.strip()])
        
        return {
            "smb_packets": smb_packets,
            "has_smb_traffic": smb_packets > 0,
            "sample_connections": result.stdout.split('\n')[:5]
        }
        
    except Exception as e:
        return {"error": str(e)}

def analyze_capture_summary(pcap_path):
    """Analyse rapide post-capture"""
    try:
        cmd = ["tcpdump", "-r", pcap_path, "-q", "-n"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        lines = [l for l in result.stdout.split('\n') if l.strip()]
        
        return {
            "total_packets": len(lines),
            "file_size_mb": round(os.path.getsize(pcap_path) / (1024*1024), 2),
            "has_data": len(lines) > 0
        }
        
    except Exception as e:
        return {"error": str(e)}