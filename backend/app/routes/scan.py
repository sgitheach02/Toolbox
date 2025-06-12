from flask import Blueprint, request, jsonify
import subprocess
import uuid
import os
import threading
from datetime import datetime
import logging
import json

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

# Fichier de compteurs simple
COUNTERS_FILE = "/app/data/scan_counters.json"

def load_counters():
    """Charge les compteurs de scans"""
    try:
        os.makedirs("/app/data", exist_ok=True)
        if os.path.exists(COUNTERS_FILE):
            with open(COUNTERS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Erreur chargement compteurs: {e}")
    
    return {
        "basic": 0,
        "version": 0,
        "stealth": 0,
        "aggressive": 0,
        "printnightmare": 0,
        "os": 0,
        "ports": 0,
        "masscan": 0
    }

def save_counters(counters):
    """Sauvegarde les compteurs"""
    try:
        os.makedirs(os.path.dirname(COUNTERS_FILE), exist_ok=True)
        with open(COUNTERS_FILE, 'w') as f:
            json.dump(counters, f, indent=2)
    except Exception as e:
        logger.error(f"Erreur sauvegarde compteurs: {e}")

@scan_bp.route("/counters", methods=["GET"])
def get_scan_counters():
    """Récupère les compteurs actuels"""
    try:
        counters = load_counters()
        return jsonify({
            "counters": counters,
            "next_versions": {k: v + 1 for k, v in counters.items()},
            "status": "ok"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/test", methods=["GET"])
def test_scan():
    """Test de la route scan"""
    return jsonify({
        "message": "Route scan fonctionnelle !",
        "status": "OK",
        "timestamp": datetime.now().isoformat()
    })

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Scan Nmap basique qui fonctionne"""
    try:
        data = request.get_json() or {}
        target = data.get("target", "127.0.0.1")
        args = data.get("args", "-sn")
        scan_type = data.get("scan_type", "basic")
        
        logger.info(f"🔍 Scan Nmap: {target} (type: {scan_type})")
        
        # Validation basique
        allowed_targets = ["127.0.0.1", "localhost", "printnightmare.thm"]
        if not (target in allowed_targets or target.startswith("192.168.") or target.startswith("172.")):
            return jsonify({"error": "Cible non autorisée"}), 400
        
        # Incrémentation compteur
        counters = load_counters()
        counters[scan_type] = counters.get(scan_type, 0) + 1
        save_counters(counters)
        
        # Génération des noms
        scan_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        scan_name = f"Scan_nmap_{scan_type}_v{counters[scan_type]}_{timestamp}"
        
        # Exécution directe simple
        thread = threading.Thread(
            target=run_simple_nmap,
            args=(target, args, scan_name, scan_id),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            "scan_id": scan_id,
            "status": "started",
            "target": target,
            "scan_type": scan_type,
            "scan_name": scan_name,
            "version": counters[scan_type],
            "message": f"Scan {scan_type} v{counters[scan_type]} lancé"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur Nmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

def run_simple_nmap(target, args, scan_name, scan_id):
    """Exécution Nmap simple"""
    try:
        logger.info(f"🔍 Démarrage scan: {scan_name}")
        
        # Fichiers de sortie
        xml_file = f"/app/reports/{scan_name}.xml"
        txt_file = f"/app/reports/{scan_name}.txt"
        html_file = f"/app/reports/{scan_name}.html"
        
        # Commande Nmap
        cmd = [
            "nmap", target,
            *args.split(),
            "-oX", xml_file,
            "-oN", txt_file
        ]
        
        logger.info(f"📡 Commande: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            # Génération HTML simple
            html_content = generate_simple_html(target, scan_name, scan_id)
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            logger.info(f"✅ Scan terminé: {scan_name}")
        else:
            logger.error(f"❌ Erreur scan: {result.stderr}")
            
    except Exception as e:
        logger.error(f"❌ Erreur execution: {str(e)}")

def generate_simple_html(target, scan_name, scan_id):
    """HTML simple avec bannière Pacha"""
    return f"""<!DOCTYPE html>
<html>
<head>
    <title>{scan_name}</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; }}
        .banner {{ background: linear-gradient(135deg, #00ff88, #00d4ff); padding: 2rem; text-align: center; }}
        .banner h1 {{ color: #0a0a0a; margin: 0; font-size: 2.5rem; }}
        .content {{ padding: 2rem; max-width: 1200px; margin: 0 auto; }}
        .info {{ background: #1a1a2e; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }}
        .footer {{ text-align: center; padding: 2rem; color: #666; }}
    </style>
</head>
<body>
    <div class="banner">
        <h1>🛡️ PACHA TOOLBOX</h1>
        <p>Professional Penetration Testing Suite</p>
    </div>
    
    <div class="content">
        <div class="info">
            <h2>📊 Informations du Scan</h2>
            <p><strong>Nom:</strong> {scan_name}</p>
            <p><strong>Cible:</strong> {target}</p>
            <p><strong>ID:</strong> {scan_id}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="info">
            <h3>📄 Fichiers Générés</h3>
            <p>• Rapport XML: {scan_name}.xml</p>
            <p>• Rapport Texte: {scan_name}.txt</p>
            <p>• Rapport HTML: {scan_name}.html</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Généré par Pacha Toolbox v2.0 - Confidentiel</p>
    </div>
</body>
</html>"""