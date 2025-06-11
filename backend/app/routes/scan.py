from flask import Blueprint, request, jsonify
import nmap
import os
import uuid
from datetime import datetime
import logging
import json
import threading

scan_bp = Blueprint("scan", __name__)
logger = logging.getLogger(__name__)

# Stockage des scans actifs avec progression
active_scans = {}

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    """Scan Nmap avec python-nmap - Plus propre et efficace"""
    try:
        data = request.get_json()
        target = data.get("target", "").strip()
        args = data.get("args", "-sV")
        async_scan = data.get("async", False)
        
        if not target:
            return jsonify({"error": "La cible est requise"}), 400
        
        logger.info(f"🔍 Scan Nmap: {target} avec args: {args}")
        
        scan_id = str(uuid.uuid4())
        
        if async_scan:
            # Scan asynchrone avec suivi
            thread = threading.Thread(
                target=run_nmap_async,
                args=(scan_id, target, args)
            )
            thread.daemon = True
            thread.start()
            
            active_scans[scan_id] = {
                "status": "running",
                "target": target,
                "args": args,
                "started_at": datetime.now(),
                "progress": 0,
                "current_phase": "Initialisation"
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

def run_nmap_sync(scan_id, target, args):
    """Exécution synchrone avec python-nmap"""
    try:
        # Initialisation du scanner Nmap
        nm = nmap.PortScanner()
        
        # Parsing des arguments pour python-nmap
        nmap_args = parse_nmap_args(args)
        
        logger.info(f"Exécution Nmap: nmap {nmap_args} {target}")
        
        # Lancement du scan
        scan_result = nm.scan(target, arguments=nmap_args)
        
        # Génération des fichiers de rapport
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_files = generate_reports(nm, scan_id, timestamp, target)
        
        # Analyse des résultats
        analysis = analyze_nmap_results(nm, scan_result)
        
        return {
            "scan_id": scan_id,
            "target": target,
            "status": "completed",
            "scan_info": scan_result.get('nmap', {}),
            "results": analysis,
            "report_files": report_files,
            "timestamp": timestamp,
            "command_line": nm.command_line(),
            "scan_stats": nm.scanstats()
        }
        
    except Exception as e:
        logger.error(f"Erreur scan Nmap sync: {str(e)}")
        return {"error": str(e), "scan_id": scan_id}

def run_nmap_async(scan_id, target, args):
    """Exécution asynchrone avec suivi de progression"""
    try:
        # Mise à jour du statut
        active_scans[scan_id]["status"] = "running"
        active_scans[scan_id]["progress"] = 10
        active_scans[scan_id]["current_phase"] = "Initialisation du scanner"
        
        # Initialisation
        nm = nmap.PortScanner()
        nmap_args = parse_nmap_args(args)
        
        active_scans[scan_id]["progress"] = 20
        active_scans[scan_id]["current_phase"] = "Démarrage du scan"
        
        # Callback pour suivi de progression (si disponible)
        def scan_progress_callback(host, scan_data):
            if scan_id in active_scans:
                active_scans[scan_id]["progress"] = min(90, active_scans[scan_id]["progress"] + 10)
                active_scans[scan_id]["current_phase"] = f"Scan en cours: {host}"
        
        # Lancement du scan
        scan_result = nm.scan(target, arguments=nmap_args)
        
        # Progression finale
        active_scans[scan_id]["progress"] = 95
        active_scans[scan_id]["current_phase"] = "Génération des rapports"
        
        # Génération des fichiers
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_files = generate_reports(nm, scan_id, timestamp, target)
        
        # Analyse des résultats
        analysis = analyze_nmap_results(nm, scan_result)
        
        # Finalisation
        active_scans[scan_id].update({
            "status": "completed",
            "progress": 100,
            "current_phase": "Terminé",
            "results": analysis,
            "report_files": report_files,
            "command_line": nm.command_line(),
            "scan_stats": nm.scanstats(),
            "completed_at": datetime.now()
        })
        
        logger.info(f"✅ Scan async {scan_id} terminé")
        
    except Exception as e:
        logger.error(f"Erreur scan async {scan_id}: {str(e)}")
        if scan_id in active_scans:
            active_scans[scan_id].update({
                "status": "failed",
                "progress": 0,
                "current_phase": "Erreur",
                "error": str(e)
            })

def parse_nmap_args(args_string):
    """Conversion des arguments string en format python-nmap"""
    # Arguments courants et leur équivalent
    args_map = {
        "-sV": "-sV",  # Version detection
        "-sS": "-sS",  # SYN scan
        "-sU": "-sU",  # UDP scan
        "-sn": "-sn",  # Ping scan
        "-A": "-A",    # Aggressive scan
        "-O": "-O",    # OS detection
        "-sC": "-sC",  # Script scan
        "-T4": "-T4",  # Timing template
        "-p-": "-p-",  # All ports
    }
    
    # Si c'est un argument simple connu, le retourner
    if args_string in args_map:
        return args_map[args_string]
    
    # Sinon, retourner tel quel (python-nmap gère la plupart des arguments)
    return args_string

def analyze_nmap_results(nm, scan_result):
    """Analyse détaillée des résultats avec python-nmap"""
    analysis = {
        "hosts_scanned": len(nm.all_hosts()),
        "hosts_up": 0,
        "hosts_down": 0,
        "total_ports": 0,
        "open_ports": 0,
        "closed_ports": 0,
        "filtered_ports": 0,
        "services": {},
        "os_info": {},
        "hosts_details": []
    }
    
    for host in nm.all_hosts():
        host_info = {
            "ip": host,
            "hostname": nm[host].hostname(),
            "status": nm[host].state(),
            "protocols": list(nm[host].all_protocols()),
            "ports": {},
            "os": {}
        }
        
        # Comptage des états d'hôtes
        if nm[host].state() == 'up':
            analysis["hosts_up"] += 1
        else:
            analysis["hosts_down"] += 1
        
        # Analyse des ports par protocole
        for protocol in nm[host].all_protocols():
            ports = nm[host][protocol].keys()
            host_info["ports"][protocol] = {}
            
            for port in ports:
                port_info = nm[host][protocol][port]
                state = port_info['state']
                service = port_info.get('name', 'unknown')
                product = port_info.get('product', '')
                version = port_info.get('version', '')
                
                host_info["ports"][protocol][port] = {
                    "state": state,
                    "service": service,
                    "product": product,
                    "version": version,
                    "extrainfo": port_info.get('extrainfo', '')
                }
                
                # Comptage global
                analysis["total_ports"] += 1
                if state == 'open':
                    analysis["open_ports"] += 1
                elif state == 'closed':
                    analysis["closed_ports"] += 1
                elif state == 'filtered':
                    analysis["filtered_ports"] += 1
                
                # Comptage des services
                if state == 'open':
                    if service in analysis["services"]:
                        analysis["services"][service] += 1
                    else:
                        analysis["services"][service] = 1
        
        # Détection OS si disponible
        if 'osmatch' in nm[host]:
            for os_match in nm[host]['osmatch']:
                host_info["os"] = {
                    "name": os_match.get('name', 'Unknown'),
                    "accuracy": os_match.get('accuracy', '0'),
                    "line": os_match.get('line', 0)
                }
                break  # Prendre le premier match
        
        analysis["hosts_details"].append(host_info)
    
    return analysis

def generate_reports(nm, scan_id, timestamp, target):
    """Génération des fichiers de rapport avec python-nmap"""
    report_files = []
    
    try:
        # Rapport XML (standard Nmap)
        xml_content = nm.get_nmap_last_output()
        if xml_content:
            xml_file = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
            with open(xml_file, 'w', encoding='utf-8') as f:
                f.write(xml_content)
            
            report_files.append({
                "filename": os.path.basename(xml_file),
                "size": os.path.getsize(xml_file),
                "format": "xml",
                "download_url": f"/api/download/{os.path.basename(xml_file)}",
                "description": "Rapport XML Nmap standard"
            })
        
        # Rapport JSON (données structurées)
        json_file = f"/app/reports/nmap_{scan_id}_{timestamp}.json"
        json_data = {
            "scan_info": nm.scaninfo(),
            "command_line": nm.command_line(),
            "scan_stats": nm.scanstats(),
            "hosts": {}
        }
        
        for host in nm.all_hosts():
            json_data["hosts"][host] = {
                "hostname": nm[host].hostname(),
                "status": nm[host].state(),
                "protocols": {}
            }
            
            for protocol in nm[host].all_protocols():
                json_data["hosts"][host]["protocols"][protocol] = dict(nm[host][protocol])
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        report_files.append({
            "filename": os.path.basename(json_file),
            "size": os.path.getsize(json_file),
            "format": "json",
            "download_url": f"/api/download/{os.path.basename(json_file)}",
            "description": "Données structurées JSON"
        })
        
        # Rapport HTML (lisible)
        html_content = generate_html_report(nm, scan_id, timestamp, target)
        html_file = f"/app/reports/nmap_{scan_id}_{timestamp}.html"
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        report_files.append({
            "filename": os.path.basename(html_file),
            "size": os.path.getsize(html_file),
            "format": "html",
            "download_url": f"/api/download/{os.path.basename(html_file)}",
            "description": "Rapport HTML interactif"
        })
        
    except Exception as e:
        logger.error(f"Erreur génération rapports: {str(e)}")
    
    return report_files

def generate_html_report(nm, scan_id, timestamp, target):
    """Génération d'un rapport HTML avec les données python-nmap"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Rapport Nmap - {target}</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; 
                     box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                   padding: 30px; text-align: center; }}
        .summary {{ background: #f8f9fa; padding: 25px; }}
        .host {{ background: white; margin: 20px; border-radius: 10px; border: 1px solid #e9ecef; }}
        .host-header {{ background: #28a745; color: white; padding: 20px; }}
        .host-content {{ padding: 25px; }}
        .ports-table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        .ports-table th, .ports-table td {{ border: 1px solid #dee2e6; padding: 12px; text-align: left; }}
        .ports-table th {{ background: #343a40; color: white; }}
        .open {{ color: #28a745; font-weight: bold; }}
        .closed {{ color: #dc3545; font-weight: bold; }}
        .filtered {{ color: #ffc107; font-weight: bold; }}
        .service-badge {{ background: #17a2b8; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Rapport Nmap - Python Integration</h1>
            <p><strong>Cible:</strong> {target}</p>
            <p><strong>Commande:</strong> {nm.command_line()}</p>
            <p><strong>Scan ID:</strong> {scan_id}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="summary">
            <h2>📊 Résumé du Scan</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; color: #667eea;">{len(nm.all_hosts())}</div>
                    <div>Hôtes scannés</div>
                </div>
            </div>
            <p><strong>Statistiques:</strong> {nm.scanstats()}</p>
        </div>
"""
    
    # Détails par hôte
    for host in nm.all_hosts():
        hostname = nm[host].hostname()
        status = nm[host].state()
        
        html_content += f"""
        <div class="host">
            <div class="host-header">
                <h3>🖥️ Hôte: {host}</h3>
                {'<p>Nom: ' + hostname + '</p>' if hostname else ''}
                <p>Statut: <span class="{status}">{status.upper()}</span></p>
            </div>
            <div class="host-content">
"""
        
        # Ports par protocole
        for protocol in nm[host].all_protocols():
            ports = nm[host][protocol].keys()
            
            if ports:
                html_content += f"""
                <h4>🔌 Ports {protocol.upper()}</h4>
                <table class="ports-table">
                    <tr>
                        <th>Port</th>
                        <th>État</th>
                        <th>Service</th>
                        <th>Version</th>
                        <th>Info</th>
                    </tr>
"""
                
                for port in sorted(ports):
                    port_info = nm[host][protocol][port]
                    state = port_info['state']
                    service = port_info.get('name', 'unknown')
                    product = port_info.get('product', '')
                    version = port_info.get('version', '')
                    extrainfo = port_info.get('extrainfo', '')
                    
                    version_str = f"{product} {version}".strip() or "N/A"
                    
                    html_content += f"""
                    <tr>
                        <td><strong>{port}</strong></td>
                        <td><span class="{state}">{state.upper()}</span></td>
                        <td><span class="service-badge">{service}</span></td>
                        <td>{version_str}</td>
                        <td>{extrainfo}</td>
                    </tr>
"""
                
                html_content += "</table>"
        
        html_content += "</div></div>"
    
    html_content += """
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d;">
            <p><strong>Rapport généré par Pacha Toolbox avec python-nmap</strong></p>
        </div>
    </div>
</body>
</html>
"""
    
    return html_content

@scan_bp.route("/status/<scan_id>", methods=["GET"])
def get_scan_status(scan_id):
    """Récupération du statut d'un scan avec progression"""
    try:
        if scan_id not in active_scans:
            return jsonify({"error": "Scan non trouvé"}), 404
        
        scan_info = active_scans[scan_id]
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
        
        if scan_info.get("results"):
            response["results"] = scan_info["results"]
        
        if scan_info.get("report_files"):
            response["report_files"] = scan_info["report_files"]
        
        if scan_info.get("error"):
            response["error"] = scan_info["error"]
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scan_bp.route("/test", methods=["GET"])
def test_scan_route():
    """Test de la route scan avec python-nmap"""
    try:
        nm = nmap.PortScanner()
        nmap_version = nm.nmap_version()
        
        return jsonify({
            "message": "Route scan fonctionnelle avec python-nmap",
            "nmap_version": f"{nmap_version[0]}.{nmap_version[1]}",
            "python_nmap": "OK",
            "available_endpoints": ["/nmap", "/status/<scan_id>", "/test"]
        })
        
    except Exception as e:
        return jsonify({
            "message": "Erreur python-nmap",
            "error": str(e),
            "fallback": "Utilisation subprocess disponible"
        }), 500