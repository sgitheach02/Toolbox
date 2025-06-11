from flask import Blueprint, request, jsonify
import subprocess
import uuid
import os
import threading
from datetime import datetime
import logging

# Utilisation de votre système de task manager existant
try:
    from app.utils.task_manager import create_task, update_task_status
except ImportError:
    # Fallback si votre task_manager est différent
    def create_task(task_type, data):
        return str(uuid.uuid4())
    
    def update_task_status(task_id, status, result=None):
        print(f"Task {task_id}: {status}")

try:
    from app.utils.validators import validate_target
except ImportError:
    # Fallback simple
    def validate_target(target):
        allowed = ["127.0.0.1", "localhost", "printnightmare.thm"]
        return target in allowed or target.startswith("192.168.") or target.startswith("172.20.")

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

@scan_bp.route("/test", methods=["GET", "POST"])
def test_scan():
    """Test de la route scan - Compatible avec votre structure"""
    return jsonify({
        "message": "Route scan fonctionnelle !",
        "status": "OK",
        "available_endpoints": [
            "/api/scan/nmap",
            "/api/scan/masscan", 
            "/api/scan/test"
        ],
        "timestamp": datetime.now().isoformat()
    })

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Scan Nmap - Simple et efficace"""
    try:
        data = request.get_json() or {}
        target = data.get("target", "127.0.0.1")
        args = data.get("args", "-sn")
        
        logger.info(f"🔍 Scan Nmap: {target}")
        
        if not validate_target(target):
            return jsonify({"error": "Cible non autorisée"}), 400
        
        # Création de la tâche
        task_id = create_task("nmap_scan", {"target": target, "args": args})
        
        # Lancement asynchrone
        thread = threading.Thread(
            target=run_nmap_simple,
            args=(target, args, task_id),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started",
            "target": target,
            "message": f"Scan Nmap lancé sur {target}"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur Nmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/masscan", methods=["POST"])
def masscan_scan():
    """Scan Masscan rapide"""
    try:
        data = request.get_json() or {}
        target = data.get("target", "127.0.0.1")
        ports = data.get("ports", "1-1000")
        
        if not validate_target(target):
            return jsonify({"error": "Cible non autorisée"}), 400
        
        task_id = create_task("masscan", {"target": target, "ports": ports})
        
        thread = threading.Thread(
            target=run_masscan_simple,
            args=(target, ports, task_id),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "started", 
            "target": target,
            "ports": ports
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/status/<task_id>", methods=["GET"])
def get_status(task_id):
    """Statut d'une tâche"""
    try:
        # Utilisation de votre système existant
        from app.utils.task_manager import get_task_status
        status = get_task_status(task_id)
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "task_id": task_id,
            "status": "unknown",
            "error": str(e)
        })

def run_nmap_simple(target, args, task_id):
    """Exécution Nmap simple"""
    try:
        update_task_status(task_id, "running")
        
        # Génération des noms de fichiers
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        scan_id = str(uuid.uuid4())[:8]
        
        xml_file = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
        txt_file = f"/app/reports/nmap_{scan_id}_{timestamp}.txt"
        
        # Commande Nmap sécurisée
        cmd = [
            "nmap", target,
            *args.split(),
            "-oX", xml_file,
            "-oN", txt_file
        ]
        
        logger.info(f"🔍 Exécution: {' '.join(cmd)}")
        
        # Exécution avec timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            # Génération du rapport HTML simple
            html_file = f"/app/reports/nmap_{scan_id}_{timestamp}.html"
            html_content = generate_simple_html_report(xml_file, target, scan_id, timestamp)
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            update_task_status(task_id, "completed", {
                "scan_id": scan_id,
                "target": target,
                "files": [
                    os.path.basename(xml_file),
                    os.path.basename(txt_file),
                    os.path.basename(html_file)
                ],
                "download_urls": [
                    f"/api/download/{os.path.basename(xml_file)}",
                    f"/api/download/{os.path.basename(txt_file)}",
                    f"/api/download/{os.path.basename(html_file)}"
                ]
            })
        else:
            update_task_status(task_id, "failed", {"error": result.stderr})
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout (5 min)"})
    except Exception as e:
        update_task_status(task_id, "failed", {"error": str(e)})

def run_masscan_simple(target, ports, task_id):
    """Exécution Masscan avec fallback Nmap"""
    try:
        update_task_status(task_id, "running")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        scan_id = str(uuid.uuid4())[:8]
        xml_file = f"/app/reports/masscan_{scan_id}_{timestamp}.xml"
        
        # Tentative Masscan, sinon Nmap
        try:
            subprocess.run(["which", "masscan"], check=True, capture_output=True)
            cmd = ["masscan", target, "-p", ports, "--rate", "1000", "-oX", xml_file]
        except subprocess.CalledProcessError:
            cmd = ["nmap", "-p", ports, "--max-rate=1000", "-oX", xml_file, target]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        
        if result.returncode == 0:
            update_task_status(task_id, "completed", {
                "scan_id": scan_id,
                "target": target,
                "ports": ports,
                "file": os.path.basename(xml_file),
                "download_url": f"/api/download/{os.path.basename(xml_file)}"
            })
        else:
            update_task_status(task_id, "failed", {"error": result.stderr})
            
    except Exception as e:
        update_task_status(task_id, "failed", {"error": str(e)})

def generate_simple_html_report(xml_file, target, scan_id, timestamp):
    """Génération d'un rapport HTML simple"""
    try:
        # Lecture basique du XML pour extraire les infos
        if os.path.exists(xml_file):
            with open(xml_file, 'r') as f:
                xml_content = f.read()
        else:
            xml_content = "Aucun contenu XML"
        
        # Template HTML simple
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rapport Nmap - {target}</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                .summary {{ background: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .content {{ background: #f8f9fa; padding: 15px; border-radius: 5px; }}
                code {{ background: #e9ecef; padding: 2px 5px; border-radius: 3px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔍 Rapport de Scan Nmap</h1>
                    <p><strong>Cible:</strong> {target}</p>
                    <p><strong>ID du Scan:</strong> {scan_id}</p>
                    <p><strong>Date:</strong> {timestamp}</p>
                    <p><strong>Scanner:</strong> Pacha Toolbox v2</p>
                </div>
        
                <div class="summary">
                    <h2>📊 Résumé</h2>
                    <p><strong>Scan terminé avec succès</strong></p>
                    <p>Fichier XML généré: <code>{os.path.basename(xml_file)}</code></p>
                </div>

                <div class="content">
                    <h3>📄 Détails du scan</h3>
                    <p>Rapport détaillé disponible dans le fichier XML.</p>
                    <p>Consultez les fichiers .xml et .txt pour les résultats complets.</p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #7f8c8d;">
                    <p>Rapport généré par Pacha Toolbox</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
        
    except Exception as e:
        return f"<html><body><h1>Erreur génération rapport</h1><p>{str(e)}</p></body></html>"