# backend/app/routes/scan.py
from flask import Blueprint, request, jsonify
import subprocess
import os
import json
import uuid
from datetime import datetime
import threading
import logging

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

# Stockage en mémoire des scans actifs
active_scans = {}

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Lancement d'un scan Nmap"""
    try:
        data = request.get_json()
        target = data.get("target")
        args = data.get("args", "-sV")
        async_scan = data.get("async", False)
        
        if not target:
            return jsonify({"error": "La cible est requise"}), 400
        
        # Validation de sécurité basique
        if not validate_target(target):
            return jsonify({"error": "Cible invalide"}), 400
        
        scan_id = str(uuid.uuid4())
        
        if async_scan:
            # Scan asynchrone avec threading
            thread = threading.Thread(
                target=run_nmap_async,
                args=(scan_id, target, args)
            )
            thread.daemon = True
            thread.start()
            
            active_scans[scan_id] = {
                "status": "running",
                "target": target,
                "started_at": datetime.now(),
                "result": None
            }
            
            return jsonify({
                "scan_id": scan_id,
                "status": "started",
                "target": target,
                "message": "Scan lancé en arrière-plan"
            })
        else:
            # Scan synchrone
            result = run_nmap_sync(scan_id, target, args)
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Erreur scan Nmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

def validate_target(target):
    """Validation basique de la cible"""
    import re
    import ipaddress
    
    # Caractères dangereux
    dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '{', '}']
    if any(char in target for char in dangerous_chars):
        return False
    
    try:
        # Test IP
        ipaddress.ip_address(target)
        return True
    except ValueError:
        try:
            # Test réseau
            ipaddress.ip_network(target, strict=False)
            return True
        except ValueError:
            # Test domaine basique
            domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
            return bool(re.match(domain_pattern, target))

def run_nmap_sync(scan_id, target, args):
    """Exécution synchrone du scan Nmap"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_xml = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
        output_txt = f"/app/reports/nmap_{scan_id}_{timestamp}.txt"
        
        # Commande Nmap avec sorties XML et texte
        command = f"nmap {args} -oX {output_xml} -oN {output_txt} {target}"
        
        logger.info(f"Exécution: {command}")
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            return {"error": result.stderr, "scan_id": scan_id}
        
        # Génération du rapport HTML
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
                    "format": os.path.splitext(file_path)[1][1:],
                    "download_url": f"/api/download/{os.path.basename(file_path)}"
                })
        
        return {
            "scan_id": scan_id,
            "result": result.stdout,
            "target": target,
            "timestamp": timestamp,
            "report_files": report_files,
            "status": "completed"
        }
        
    except subprocess.TimeoutExpired:
        return {"error": "Timeout du scan (5 minutes)", "scan_id": scan_id}
    except Exception as e:
        logger.error(f"Erreur exécution Nmap: {str(e)}")
        return {"error": str(e), "scan_id": scan_id}

def run_nmap_async(scan_id, target, args):
    """Exécution asynchrone du scan Nmap"""
    try:
        result = run_nmap_sync(scan_id, target, args)
        
        # Mise à jour du statut
        if scan_id in active_scans:
            active_scans[scan_id]["status"] = "completed" if "error" not in result else "failed"
            active_scans[scan_id]["result"] = result
            active_scans[scan_id]["completed_at"] = datetime.now()
            
    except Exception as e:
        logger.error(f"Erreur scan asynchrone: {str(e)}")
        if scan_id in active_scans:
            active_scans[scan_id]["status"] = "failed"
            active_scans[scan_id]["result"] = {"error": str(e)}

@scan_bp.route("/masscan", methods=["POST"])
def masscan_scan():
    """Scan rapide avec Masscan"""
    try:
        data = request.get_json()
        target = data.get("target")
        ports = data.get("ports", "1-1000")
        rate = data.get("rate", "1000")
        
        if not target:
            return jsonify({"error": "La cible est requise"}), 400
        
        if not validate_target(target):
            return jsonify({"error": "Cible invalide"}), 400
        
        scan_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"/app/reports/masscan_{scan_id}_{timestamp}.xml"
        
        # Vérifier si masscan est disponible
        if not os.path.exists("/usr/local/bin/masscan") and not os.path.exists("/usr/bin/masscan"):
            # Fallback vers nmap pour les ports
            command = f"nmap -p{ports} --max-rate={rate} -oX {output_file} {target}"
        else:
            command = f"masscan -p{ports} --rate={rate} -oX {output_file} {target}"
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            return jsonify({"error": result.stderr}), 500
        
        report_files = []
        if os.path.exists(output_file):
            report_files.append({
                "filename": os.path.basename(output_file),
                "size": os.path.getsize(output_file),
                "format": "xml",
                "download_url": f"/api/download/{os.path.basename(output_file)}"
            })
        
        return jsonify({
            "scan_id": scan_id,
            "result": result.stdout,
            "target": target,
            "ports": ports,
            "rate": rate,
            "timestamp": timestamp,
            "report_files": report_files,
            "status": "completed"
        })
        
    except Exception as e:
        logger.error(f"Erreur Masscan: {str(e)}")
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/status/<scan_id>", methods=["GET"])
def get_scan_status(scan_id):
    """Récupération du statut d'un scan asynchrone"""
    try:
        if scan_id not in active_scans:
            return jsonify({"error": "Scan non trouvé"}), 404
        
        scan_info = active_scans[scan_id]
        elapsed_time = (datetime.now() - scan_info["started_at"]).total_seconds()
        
        response = {
            "scan_id": scan_id,
            "status": scan_info["status"],
            "target": scan_info["target"],
            "elapsed_time": int(elapsed_time),
            "started_at": scan_info["started_at"].isoformat()
        }
        
        if scan_info["result"]:
            response["result"] = scan_info["result"]
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/list", methods=["GET"])
def list_active_scans():
    """Liste des scans actifs"""
    try:
        scans = []
        for scan_id, scan_info in active_scans.items():
            elapsed_time = (datetime.now() - scan_info["started_at"]).total_seconds()
            
            scans.append({
                "scan_id": scan_id,
                "status": scan_info["status"],
                "target": scan_info["target"],
                "elapsed_time": int(elapsed_time),
                "started_at": scan_info["started_at"].isoformat()
            })
        
        return jsonify({"scans": scans})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_nmap_html_report(xml_file, target, scan_id, timestamp):
    """Génération d'un rapport HTML à partir d'un fichier XML Nmap"""
    try:
        if not os.path.exists(xml_file):
            return "<html><body><h1>Fichier XML non trouvé</h1></body></html>"
        
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        html_content = f"""
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
                .host {{ background: #f8f9fa; border: 1px solid #dee2e6; margin: 20px 0; border-radius: 5px; }}
                .host-header {{ background: #3498db; color: white; padding: 15px; border-radius: 5px 5px 0 0; }}
                .host-content {{ padding: 15px; }}
                .ports-table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                .ports-table th, .ports-table td {{ border: 1px solid #dee2e6; padding: 8px; text-align: left; }}
                .ports-table th {{ background: #34495e; color: white; }}
                .open {{ color: #27ae60; font-weight: bold; }}
                .closed {{ color: #e74c3c; }}
                .filtered {{ color: #f39c12; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔍 Rapport de Scan Nmap</h1>
                    <p><strong>Cible:</strong> {target}</p>
                    <p><strong>ID du Scan:</strong> {scan_id}</p>
                    <p><strong>Date:</strong> {timestamp}</p>
                    <p><strong>Scanner:</strong> {root.get('scanner', 'nmap')} {root.get('version', '')}</p>
                </div>
        """
        
        # Analyse des hôtes
        hosts = root.findall('.//host')
        total_ports = 0
        open_ports = 0
        
        html_content += f"""
                <div class="summary">
                    <h2>📊 Résumé</h2>
                    <p><strong>Nombre d'hôtes scannés:</strong> {len(hosts)}</p>
        """
        
        for i, host in enumerate(hosts):
            # Statut de l'hôte
            status_elem = host.find('status')
            host_status = status_elem.get('state') if status_elem is not None else 'unknown'
            
            # Adresses IP
            addresses = []
            for addr in host.findall('.//address'):
                addresses.append(f"{addr.get('addr')} ({addr.get('addrtype')})")
            
            primary_ip = addresses[0].split()[0] if addresses else "Inconnu"
            
            # Noms d'hôte
            hostnames = []
            for hostname in host.findall('.//hostname'):
                hostnames.append(hostname.get('name'))
            
            hostname_str = hostnames[0] if hostnames else ""
            
            html_content += f"""
                <div class="host">
                    <div class="host-header">
                        <h3>🖥️ Hôte {i+1}: {primary_ip}</h3>
                        {'<p>Nom: ' + hostname_str + '</p>' if hostname_str else ''}
                        <p>Statut: <span class="{host_status}">{host_status.upper()}</span></p>
                    </div>
                    <div class="host-content">
            """
            
            # Ports
            ports = host.findall('.//port')
            if ports:
                html_content += """
                        <h4>🔌 Ports et Services:</h4>
                        <table class="ports-table">
                            <tr>
                                <th>Port</th>
                                <th>Protocole</th>
                                <th>État</th>
                                <th>Service</th>
                                <th>Version</th>
                            </tr>
                """
                
                for port in ports:
                    port_id = port.get('portid')
                    protocol = port.get('protocol')
                    
                    state_elem = port.find('state')
                    state = state_elem.get('state') if state_elem is not None else 'unknown'
                    
                    service_elem = port.find('service')
                    service_name = service_elem.get('name', 'unknown') if service_elem is not None else 'unknown'
                    service_product = service_elem.get('product', '') if service_elem is not None else ''
                    service_version = service_elem.get('version', '') if service_elem is not None else ''
                    
                    version_info = f"{service_product} {service_version}".strip()
                    
                    total_ports += 1
                    if state == 'open':
                        open_ports += 1
                    
                    html_content += f"""
                            <tr>
                                <td>{port_id}</td>
                                <td>{protocol}</td>
                                <td class="{state}">{state.upper()}</td>
                                <td>{service_name}</td>
                                <td>{version_info if version_info else 'N/A'}</td>
                            </tr>
                    """
                
                html_content += "</table>"
            
            html_content += "</div></div>"
        
        # Mise à jour du résumé
        summary_update = f"""
                    <p><strong>Total des ports testés:</strong> {total_ports}</p>
                    <p><strong>Ports ouverts:</strong> {open_ports}</p>
                </div>
        """
        
        html_content = html_content.replace('</p>\n        """', f'</p>{summary_update}')
        
        html_content += """
                <div style="margin-top: 30px; text-align: center; color: #7f8c8d;">
                    <p>Rapport généré par Pacha Toolbox</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_content
        
    except Exception as e:
        logger.error(f"Erreur génération rapport HTML: {str(e)}")
        return f"<html><body><h1>Erreur génération rapport</h1><p>{str(e)}</p></body></html>"