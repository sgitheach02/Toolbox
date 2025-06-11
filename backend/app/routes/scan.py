from flask import Blueprint, request, jsonify
import subprocess
import os
import uuid
from datetime import datetime, timezone
import threading
import logging
import re
import xml.etree.ElementTree as ET

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

# Stockage en mémoire des scans actifs avec progression
active_scans = {}

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Lancement d'un scan Nmap avec progression en temps réel"""
    try:
        data = request.get_json()
        target = data.get("target", "").strip()
        args = data.get("args", "-sV")
        async_scan = data.get("async", False)

        if not target:
            return jsonify({"error": "La cible est requise"}), 400

        # Validation de sécurité
        if not validate_target(target):
            return jsonify({"error": "Cible invalide ou dangereuse"}), 400

        scan_id = str(uuid.uuid4())
        logger.info(f"🔍 Nouveau scan Nmap: {target} (ID: {scan_id})")

        if async_scan:
            # Scan asynchrone avec suivi de progression
            thread = threading.Thread(
                target=run_nmap_with_progress,
                args=(scan_id, target, args)
            )
            thread.daemon = True
            thread.start()

            active_scans[scan_id] = {
                "status": "starting",
                "target": target,
                "args": args,
                "started_at": datetime.now(),
                "progress": 0,
                "current_phase": "Initialisation",
                "result": None,
                "report_files": []
            }

            return jsonify({
                "scan_id": scan_id,
                "status": "started",
                "target": target,
                "message": "Scan Nmap lancé en arrière-plan",
                "progress_url": f"/api/scan/status/{scan_id}"
            })
        else:
            # Scan synchrone
            result = run_nmap_sync(scan_id, target, args)
            return jsonify(result)

    except Exception as e:
        logger.error(f"Erreur scan Nmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

def validate_target(target):
    """Validation robuste de la cible"""
    import ipaddress

    # Caractères dangereux
    dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '<', '>']
    if any(char in target for char in dangerous_chars):
        return False

    # Longueur raisonnable
    if len(target) > 253:
        return False

    try:
        # Test IP
        ip = ipaddress.ip_address(target)
        # Autoriser seulement les IPs locales et de test
        if ip.is_private or ip.is_loopback or str(ip) in ['1.1.1.1', '8.8.8.8']:
            return True
        return False
    except ValueError:
        try:
            # Test réseau
            network = ipaddress.ip_network(target, strict=False)
            return network.is_private
        except ValueError:
            # Test nom d'hôte/domaine
            allowed_hosts = ['dvwa', 'metasploitable', 'backend', 'localhost']
            if target.lower() in allowed_hosts:
                return True

            # Validation domaine basique
            domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
            return bool(re.match(domain_pattern, target)) and len(target.split('.')) >= 2

def run_nmap_with_progress(scan_id, target, args):
    """Exécution Nmap avec suivi de progression"""
    try:
        # Mise à jour du statut
        active_scans[scan_id]["status"] = "running"
        active_scans[scan_id]["current_phase"] = "Résolution DNS"
        active_scans[scan_id]["progress"] = 5

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_xml = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
        output_txt = f"/app/reports/nmap_{scan_id}_{timestamp}.txt"

        # Commande Nmap avec sortie verbose pour progression
        command = f"nmap {args} -v -oX {output_xml} -oN {output_txt} {target}"

        logger.info(f"Exécution: {command}")

        # Lancement avec suivi en temps réel
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )

        output_lines = []

        # Lecture en temps réel avec progression
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break

            if line:
                output_lines.append(line.strip())
                update_scan_progress(scan_id, line)

        process.wait()

        if process.returncode == 0:
            # Génération du rapport HTML
            active_scans[scan_id]["current_phase"] = "Génération des rapports"
            active_scans[scan_id]["progress"] = 90

            html_report = generate_nmap_html_report(output_xml, target, scan_id, timestamp)
            html_file = f"/app/reports/nmap_{scan_id}_{timestamp}.html"

            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_report)

            # Liste des fichiers générés
            report_files = []
            for file_path in [output_xml, output_txt, html_file]:
                if os.path.exists(file_path):
                    report_files.append({
                        "filename": os.path.basename(file_path),
                        "size": os.path.getsize(file_path),
                        "format": os.path.splitext(file_path)[1][1:] or "html",
                        "download_url": f"/api/download/{os.path.basename(file_path)}"
                    })

            active_scans[scan_id].update({
                "status": "completed",
                "progress": 100,
                "current_phase": "Terminé",
                "result": "\n".join(output_lines),
                "report_files": report_files,
                "completed_at": datetime.now()
            })

            logger.info(f"✅ Scan {scan_id} terminé avec succès")

        else:
            active_scans[scan_id].update({
                "status": "failed",
                "progress": 0,
                "current_phase": "Échec",
                "result": "\n".join(output_lines),
                "error": "Échec de l'exécution Nmap"
            })

            logger.error(f"❌ Scan {scan_id} échoué")

    except Exception as e:
        logger.error(f"Erreur scan asynchrone {scan_id}: {str(e)}")
        active_scans[scan_id].update({
            "status": "failed",
            "progress": 0,
            "current_phase": "Erreur",
            "error": str(e)
        })

def update_scan_progress(scan_id, line):
    """Mise à jour de la progression basée sur la sortie Nmap"""
    if scan_id not in active_scans:
        return

    line_lower = line.lower()

    # Phases de progression Nmap
    if "starting nmap" in line_lower:
        active_scans[scan_id]["current_phase"] = "Démarrage Nmap"
        active_scans[scan_id]["progress"] = 10
    elif "dns resolution" in line_lower or "resolving" in line_lower:
        active_scans[scan_id]["current_phase"] = "Résolution DNS"
        active_scans[scan_id]["progress"] = 15
    elif "ping scan" in line_lower or "host discovery" in line_lower:
        active_scans[scan_id]["current_phase"] = "Découverte d'hôtes"
        active_scans[scan_id]["progress"] = 25
    elif "scanning" in line_lower and "ports" in line_lower:
        active_scans[scan_id]["current_phase"] = "Scan des ports"
        active_scans[scan_id]["progress"] = 40
    elif "service detection" in line_lower or "version detection" in line_lower:
        active_scans[scan_id]["current_phase"] = "Détection des services"
        active_scans[scan_id]["progress"] = 60
    elif "os detection" in line_lower:
        active_scans[scan_id]["current_phase"] = "Détection OS"
        active_scans[scan_id]["progress"] = 70
    elif "script scanning" in line_lower:
        active_scans[scan_id]["current_phase"] = "Exécution des scripts"
        active_scans[scan_id]["progress"] = 80
    elif "nmap done" in line_lower:
        active_scans[scan_id]["current_phase"] = "Finalisation"
        active_scans[scan_id]["progress"] = 85

def run_nmap_sync(scan_id, target, args):
    """Exécution synchrone du scan Nmap"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_xml = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
        output_txt = f"/app/reports/nmap_{scan_id}_{timestamp}.txt"

        command = f"nmap {args} -oX {output_xml} -oN {output_txt} {target}"

        logger.info(f"Exécution synchrone: {command}")

        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            return {"error": result.stderr or "Erreur Nmap inconnue", "scan_id": scan_id}

        # Génération du rapport HTML
        html_report = generate_nmap_html_report(output_xml, target, scan_id, timestamp)
        html_file = f"/app/reports/nmap_{scan_id}_{timestamp}.html"

        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_report)

        # Analyse des résultats
        scan_summary = analyze_nmap_results(output_xml)

        # Liste des fichiers générés
        report_files = []
        for file_path in [output_xml, output_txt, html_file]:
            if os.path.exists(file_path):
                report_files.append({
                    "filename": os.path.basename(file_path),
                    "size": os.path.getsize(file_path),
                    "format": os.path.splitext(file_path)[1][1:] or "html",
                    "download_url": f"/api/download/{os.path.basename(file_path)}"
                })

        return {
            "scan_id": scan_id,
            "result": result.stdout,
            "target": target,
            "timestamp": timestamp,
            "report_files": report_files,
            "summary": scan_summary,
            "status": "completed"
        }

    except subprocess.TimeoutExpired:
        return {"error": "Timeout du scan (5 minutes)", "scan_id": scan_id}
    except Exception as e:
        logger.error(f"Erreur exécution Nmap: {str(e)}")
        return {"error": str(e), "scan_id": scan_id}

def analyze_nmap_results(xml_file):
    """Analyse rapide des résultats Nmap"""
    try:
        if not os.path.exists(xml_file):
            return {"error": "Fichier XML non trouvé"}

        tree = ET.parse(xml_file)
        root = tree.getroot()

        summary = {
            "hosts_total": 0,
            "hosts_up": 0,
            "ports_total": 0,
            "ports_open": 0,
            "services": {},
            "scan_duration": root.get("elapsed", "0") + "s"
        }

        for host in root.findall(".//host"):
            summary["hosts_total"] += 1

            status = host.find("status")
            if status is not None and status.get("state") == "up":
                summary["hosts_up"] += 1

            for port in host.findall(".//port"):
                summary["ports_total"] += 1

                state = port.find("state")
                if state is not None and state.get("state") == "open":
                    summary["ports_open"] += 1

                    service = port.find("service")
                    if service is not None:
                        service_name = service.get("name", "unknown")
                        summary["services"][service_name] = summary["services"].get(service_name, 0) + 1

        return summary

    except Exception as e:
        return {"error": f"Erreur analyse: {str(e)}"}

def generate_nmap_html_report(xml_file, target, scan_id, timestamp):
    """Génération d'un rapport HTML basé sur le fichier XML de Nmap"""
    try:
        if not os.path.exists(xml_file):
            return "<html><body><h1>Erreur</h1><p>Fichier XML non trouvé</p></body></html>"

        tree = ET.parse(xml_file)
        root = tree.getroot()

        # Début du rapport HTML
        html_content = f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Rapport Nmap - {target}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                h1, h2 {{ color: #8B0000; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .host {{ margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }}
                .port-item {{ margin-bottom: 10px; }}
                .service-name {{ font-weight: bold; }}
                .critical {{ color: red; }}
                .warning {{ color: orange; }}
                .info {{ color: blue; }}
            </style>
        </head>
        <body>
            <h1>Rapport de scan Nmap</h1>
            <p><strong>Cible:</strong> {target}</p>
            <p><strong>ID de scan:</strong> {scan_id}</p>
            <p><strong>Date:</strong> {timestamp}</p>

            <h2>Résumé du scan</h2>
        """

        summary = analyze_nmap_results(xml_file)
        scan_duration = summary.get("scan_duration", "0s")

        html_content += f"""
            <p><strong>Durée du scan:</strong> {scan_duration}</p>
            <p><strong>Nombre total d'hôtes:</strong> {summary.get('hosts_total', 0)}</p>
            <p><strong>Nombre d'hôtes actifs:</strong> {summary.get('hosts_up', 0)}</p>
            <p><strong>Nombre total de ports scannés:</strong> {summary.get('ports_total', 0)}</p>
            <p><strong>Nombre de ports ouverts:</strong> {summary.get('ports_open', 0)}</p>

            <h2>Détails par hôte</h2>
        """

        for host in root.findall(".//host"):
            host_address = host.find("address").get("addr") if host.find("address") is not None else "Unknown"
            host_status = host.find("status").get("state") if host.find("status") is not None else "Unknown"
            os_info = host.find(".//osmatch")
            os_name = os_info.get("name") if os_info is not None else "Unknown"

            html_content += f"""
            <div class="host">
                <h3>Hôte: {host_address}</h3>
                <p><strong>Statut:</strong> {host_status}</p>
                <p><strong>Système d'exploitation:</strong> {os_name}</p>
                <h4>Ports ouverts:</h4>
            """

            ports = []
            for port in host.findall(".//port"):
                port_id = port.get("portid")
                protocol = port.get("protocol", "unknown")
                state = port.find("state").get("state") if port.find("state") is not None else "Unknown"
                service = port.find("service")
                service_name = service.get("name", "unknown") if service is not None else "unknown"
                product = service.get("product", "") if service is not None else ""
                version = service.get("version", "") if service is not None else ""
                service_info = f"{product} {version}".strip()

                ports.append({
                    "port_id": port_id,
                    "protocol": protocol,
                    "state": state,
                    "service_name": service_name,
                    "service_info": service_info
                })

            if ports:
                html_content += """
                <table>
                    <tr>
                        <th>Port</th>
                        <th>Protocole</th>
                        <th>Service</th>
                        <th>Détails du service</th>
                    </tr>
                """

                for port in ports:
                    html_content += f"""
                    <tr>
                        <td>{port['port_id']}</td>
                        <td>{port['protocol']}</td>
                        <td>{port['service_name']}</td>
                        <td>{port['service_info']}</td>
                    </tr>
                    """

                html_content += """
                </table>
                """

            html_content += """
            </div>
            """

        html_content += """
            </body>
        </html>
        """

        return html_content

    except Exception as e:
        return f"<html><body><h1>Erreur</h1><p>Erreur lors de la génération du rapport: {str(e)}</p></body></html>"

@scan_bp.route("/status/<scan_id>", methods=["GET"])
def get_scan_status(scan_id):
    """Récupération du statut d'un scan avec progression"""
    try:
        if scan_id not in active_scans:
            return jsonify({"error": "Scan non trouvé"}), 404

        scan_info = active_scans[scan_id]

        # Calcul du temps écoulé
        elapsed_time = (datetime.now() - scan_info["started_at"]).total_seconds()

        response = {
            "scan_id": scan_id,
            "status": scan_info["status"],
            "target": scan_info["target"],
            "progress": scan_info["progress"],
            "current_phase": scan_info["current_phase"],
            "elapsed_time": int(elapsed_time),
            "started_at": scan_info["started_at"].isoformat()
        }

        if scan_info.get("completed_at"):
            response["completed_at"] = scan_info["completed_at"].isoformat()
            response["total_duration"] = int((scan_info["completed_at"] - scan_info["started_at"]).total_seconds())

        if scan_info.get("result"):
            response["result"] = scan_info["result"]

        if scan_info.get("report_files"):
            response["report_files"] = scan_info["report_files"]

        if scan_info.get("error"):
            response["error"] = scan_info["error"]

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/list", methods=["GET"])
def list_active_scans():
    """Liste des scans actifs et récents"""
    try:
        scans = []
        current_time = datetime.now()

        for scan_id, scan_info in active_scans.items():
            elapsed_time = (current_time - scan_info["started_at"]).total_seconds()

            scan_data = {
                "scan_id": scan_id,
                "status": scan_info["status"],
                "target": scan_info["target"],
                "progress": scan_info.get("progress", 0),
                "current_phase": scan_info.get("current_phase", "Unknown"),
                "elapsed_time": int(elapsed_time),
                "started_at": scan_info["started_at"].isoformat()
            }

            if scan_info.get("completed_at"):
                scan_data["completed_at"] = scan_info["completed_at"].isoformat()

            if scan_info.get("report_files"):
                scan_data["report_files"] = scan_info["report_files"]

            scans.append(scan_data)

        # Tri par date de création (plus récent en premier)
        scans.sort(key=lambda x: x["started_at"], reverse=True)

        return jsonify({
            "scans": scans,
            "total": len(scans),
            "active": len([s for s in scans if s["status"] == "running"])
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/masscan", methods=["POST"])
def masscan_scan():
    """Scan rapide avec Masscan (fallback vers Nmap)"""
    try:
        data = request.get_json()
        target = data.get("target", "").strip()
        ports = data.get("ports", "1-1000")
        rate = data.get("rate", "1000")

        if not target:
            return jsonify({"error": "La cible est requise"}), 400

        if not validate_target(target):
            return jsonify({"error": "Cible invalide"}), 400

        scan_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"/app/reports/masscan_{scan_id}_{timestamp}.xml"

        # Utilisation de Nmap en mode rapide (pas de Masscan dans l'image)
        command = f"nmap -p{ports} -T4 --max-rate={rate} -oX {output_file} {target}"

        logger.info(f"Scan rapide: {command}")

        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            return jsonify({"error": result.stderr or "Erreur scan rapide"}), 500

        report_files = []
        if os.path.exists(output_file):
            report_files.append({
                "filename": os.path.basename(output_file),
                "size": os.path.getsize(output_file),
                "format": "xml",
                "download_url": f"/api/download/{os.path.basename(output_file)}"
            })

        return jsonify({
            "result": result.stdout,
            "target": target,
            "timestamp": timestamp,
            "report_files": report_files,
            "status": "completed"
        })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout du scan rapide (2 minutes)"}), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout du scan rapide (2 minutes)"}), 500
    except Exception as e:
        logger.error(f"Erreur scan rapide: {str(e)}")
        return jsonify({"error": str(e)}), 500

from flask import send_file

@scan_bp.route("/download/<filename>", methods=["GET"])
def download_report(filename):
    try:
        file_path = os.path.join("/app/reports", filename)

        if not os.path.exists(file_path):
            return jsonify({"error": "Fichier non trouvé"}), 404

        return send_file(file_path, as_attachment=True, download_name=filename)
    except Exception as e:
        logger.error(f"Erreur téléchargement: {str(e)}")
        return jsonify({"error": "Erreur lors du téléchargement"}), 500

@scan_bp.route("/health", methods=["GET"])
def health_check():
    """Point de contrôle de santé de l'API de scan"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "message": "API de scan fonctionnelle"
    })

@scan_bp.route("/clear", methods=["POST"])
def clear_active_scans():
    try:
        active_scans.clear()
        return jsonify({"message": "Scans actifs effacés"}), 200
    except Exception as e:
        logger.error(f"Erreur lors de l'effacement des scans: {str(e)}")
        return jsonify({"error": str(e)}), 500
@scan_bp.route("/status", methods=["GET"])
def get_all_scan_status():
    """Récupère le statut de tous les scans actifs"""
    try:
        return jsonify(active_scans), 200
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statuts: {str(e)}")
        return jsonify({"error": str(e)}), 500
@scan_bp.route("/stop/<scan_id>", methods=["POST"])
def stop_scan(scan_id):
    """Arrête un scan en cours"""
    try:
        if scan_id not in active_scans:
            return jsonify({"error": "Scan non trouvé"}), 404

        active_scans[scan_id]["status"] = "stopped"
        return jsonify({"message": "Scan arrêté"}), 200
    except Exception as e:
        logger.error(f"Erreur lors de l'arrêt du scan: {str(e)}")
        return jsonify({"error": str(e)}), 500          