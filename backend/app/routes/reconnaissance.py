# backend/app/routes/reconnaissance.py
from flask import Blueprint, request, jsonify
import subprocess
import uuid
import os
from datetime import datetime
import threading
from app.utils.task_manager import create_task, update_task_status
from app.utils.validators import validate_target
from app.services.nmap_service import NmapService
from app.services.openvas_service import OpenVASService

recon_bp = Blueprint("reconnaissance", __name__)

@recon_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Scan Nmap avec différents profils"""
    data = request.get_json()
    target = data.get("target", "printnightmare.thm")
    scan_type = data.get("scan_type", "quick")
    
    if not validate_target(target):
        return jsonify({"error": "Cible invalide"}), 400
    
    scan_profiles = {
        "quick": "-sS -T4 --top-ports 1000",
        "full": "-sS -sU -T4 -A -v",
        "stealth": "-sS -T2 -f",
        "vuln": "--script vuln -sV",
        "printnightmare": "-p 135,139,445,3389 -sV --script smb-vuln*"
    }
    
    nmap_service = NmapService()
    task_id = create_task("nmap_scan", {"target": target, "scan_type": scan_type})
    
    # Lancement asynchrone
    thread = threading.Thread(
        target=nmap_service.run_scan_async,
        args=(target, scan_profiles.get(scan_type), task_id)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "status": "started",
        "target": target,
        "scan_type": scan_type
    })

@recon_bp.route("/openvas", methods=["POST"])
def openvas_scan():
    """Scan de vulnérabilités OpenVAS"""
    data = request.get_json()
    target = data.get("target", "printnightmare.thm")
    
    openvas_service = OpenVASService()
    task_id = create_task("openvas_scan", {"target": target})
    
    thread = threading.Thread(
        target=openvas_service.run_scan_async,
        args=(target, task_id)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "status": "started",
        "target": target
    })

@recon_bp.route("/searchsploit", methods=["POST"])
def searchsploit_query():
    """Recherche d'exploits avec SearchSploit"""
    data = request.get_json()
    query = data.get("query", "print nightmare")
    
    try:
        cmd = f"searchsploit {query} --json"
        result = subprocess.run(
            cmd.split(),
            capture_output=True,
            text=True,
            timeout=30,
            cwd="/app/exploitdb"
        )
        
        if result.returncode == 0:
            import json
            exploits = json.loads(result.stdout)
            return jsonify({
                "query": query,
                "exploits": exploits.get("RESULTS_EXPLOIT", []),
                "count": len(exploits.get("RESULTS_EXPLOIT", []))
            })
        else:
            return jsonify({"error": result.stderr}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500