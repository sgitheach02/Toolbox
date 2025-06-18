# backend/app/routes/bruteforce.py
from flask import Blueprint, request, jsonify
import threading
import os
from app.services.hydra_service import HydraService
from app.utils.task_manager import create_task

bruteforce_bp = Blueprint("bruteforce", __name__)

@bruteforce_bp.route("/hydra", methods=["POST"])
def hydra_attack():
    """Attaque par force brute avec Hydra"""
    data = request.get_json()
    target = data.get("target", "printnightmare.thm")
    service = data.get("service", "smb")  # smb, rdp, ssh, ftp
    username = data.get("username", "administrator")
    wordlist = data.get("wordlist", "rockyou")
    
    if not data.get("confirm_authorization"):
        return jsonify({"error": "Autorisation requise"}), 403
    
    hydra_service = HydraService()
    task_id = create_task("hydra_bruteforce", {
        "target": target,
        "service": service,
        "username": username,
        "wordlist": wordlist
    })
    
    thread = threading.Thread(
        target=hydra_service.run_attack_async,
        args=(target, service, username, wordlist, task_id)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "status": "started",
        "target": target,
        "service": service,
        "username": username
    })

@bruteforce_bp.route("/wordlists", methods=["GET"])
def get_wordlists():
    """Liste des wordlists disponibles"""
    wordlists = {
        "rockyou": "/usr/share/wordlists/rockyou.txt",
        "common": "/usr/share/wordlists/dirb/common.txt",
        "passwords": "/usr/share/wordlists/fasttrack.txt",
        "users": "/usr/share/wordlists/metasploit/unix_users.txt"
    }
    
    available = {}
    for name, path in wordlists.items():
        if os.path.exists(path):
            available[name] = {
                "path": path,
                "size": os.path.getsize(path),
                "lines": sum(1 for line in open(path, 'r', errors='ignore'))
            }
    
    return jsonify({"wordlists": available})