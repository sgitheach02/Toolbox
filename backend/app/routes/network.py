# backend/app/routes/network.py
from flask import Blueprint, request, jsonify
import subprocess
import threading
from app.services.tcpdump_service import TCPDumpService
from app.utils.task_manager import create_task

network_bp = Blueprint("network", __name__)

@network_bp.route("/capture/start", methods=["POST"])
def start_capture():
    """Démarrage capture réseau avec tcpdump"""
    data = request.get_json()
    interface = data.get("interface", "eth0")
    duration = data.get("duration", 300)  # 5 minutes par défaut
    filter_expr = data.get("filter", "host printnightmare.thm")
    
    tcpdump_service = TCPDumpService()
    task_id = create_task("network_capture", {
        "interface": interface,
        "duration": duration,
        "filter": filter_expr
    })
    
    thread = threading.Thread(
        target=tcpdump_service.start_capture_async,
        args=(interface, duration, filter_expr, task_id)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "status": "started",
        "interface": interface,
        "duration": duration
    })

@network_bp.route("/analyze", methods=["POST"])
def analyze_capture():
    """Analyse d'une capture réseau"""
    data = request.get_json()
    pcap_file = data.get("pcap_file")
    
    if not pcap_file or not os.path.exists(f"/app/reports/{pcap_file}"):
        return jsonify({"error": "Fichier PCAP non trouvé"}), 404
    
    tcpdump_service = TCPDumpService()
    analysis = tcpdump_service.analyze_pcap(f"/app/reports/{pcap_file}")
    
    return jsonify({
        "pcap_file": pcap_file,
        "analysis": analysis
    })