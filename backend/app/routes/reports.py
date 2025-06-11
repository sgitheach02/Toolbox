from flask import Blueprint, request, jsonify, send_file
import os
import json
from datetime import datetime
import logging
from pathlib import Path

reports_bp = Blueprint("reports", __name__)
logger = logging.getLogger(__name__)

REPORTS_DIR = "/app/reports"

@reports_bp.route("/list", methods=["GET"])
def list_reports():
    """Liste tous les rapports disponibles"""
    try:
        reports = []
        reports_path = Path(REPORTS_DIR)
        
        if not reports_path.exists():
            os.makedirs(REPORTS_DIR, exist_ok=True)
            return jsonify({"reports": []})
        
        for file_path in reports_path.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                
                # Détermination du type de rapport basé sur le nom du fichier
                report_type = "unknown"
                if "nmap" in file_path.name:
                    report_type = "nmap"
                elif "openvas" in file_path.name:
                    report_type = "openvas"
                elif "wireshark" in file_path.name:
                    report_type = "wireshark"
                elif "metasploit" in file_path.name:
                    report_type = "metasploit"
                elif "masscan" in file_path.name:
                    report_type = "masscan"
                
                reports.append({
                    "filename": file_path.name,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "type": report_type,
                    "download_url": f"/api/download/{file_path.name}"
                })
        
        # Tri par date de création (plus récent en premier)
        reports.sort(key=lambda x: x["created"], reverse=True)
        
        return jsonify({
            "reports": reports,
            "total": len(reports),
            "total_size": sum(r["size"] for r in reports)
        })
        
    except Exception as e:
        logger.error(f"Erreur liste rapports: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/delete/<filename>", methods=["DELETE"])
def delete_report(filename):
    """Suppression d'un rapport"""
    try:
        file_path = os.path.join(REPORTS_DIR, filename)
        
        # Vérification de sécurité pour éviter les path traversal
        if not os.path.commonpath([REPORTS_DIR, file_path]) == REPORTS_DIR:
            return jsonify({"error": "Nom de fichier invalide"}), 400
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Fichier non trouvé"}), 404
        
        os.remove(file_path)
        
        return jsonify({
            "message": f"Rapport {filename} supprimé avec succès",
            "filename": filename
        })
        
    except Exception as e:
        logger.error(f"Erreur suppression rapport: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/analyze/<filename>", methods=["GET"])
def analyze_report(filename):
    """Analyse d'un rapport existant"""
    try:
        file_path = os.path.join(REPORTS_DIR, filename)
        
        # Vérification de sécurité
        if not os.path.commonpath([REPORTS_DIR, file_path]) == REPORTS_DIR:
            return jsonify({"error": "Nom de fichier invalide"}), 400
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Fichier non trouvé"}), 404
        
        # Analyse basée sur le type de fichier
        analysis = {}
        
        if filename.endswith('.xml'):
            analysis = analyze_xml_report(file_path)
        elif filename.endswith('.pcap'):
            analysis = analyze_pcap_report(file_path)
        elif filename.endswith('.txt'):
            analysis = analyze_text_report(file_path)
        else:
            return jsonify({"error": "Type de fichier non supporté pour l'analyse"}), 400
        
        return jsonify({
            "filename": filename,
            "analysis": analysis,
            "analyzed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur analyse rapport: {str(e)}")
        return jsonify({"error": str(e)}), 500

def analyze_xml_report(file_path):
    """Analyse d'un rapport XML (Nmap/OpenVAS)"""
    try:
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        analysis = {
            "file_type": "xml",
            "root_element": root.tag,
            "total_elements": len(list(root.iter())),
            "attributes": dict(root.attrib)
        }
        
        # Analyse spécifique Nmap
        if root.tag == "nmaprun":
            analysis.update(analyze_nmap_xml(root))
        
        # Analyse spécifique OpenVAS
        elif "report" in root.tag.lower():
            analysis.update(analyze_openvas_xml(root))
        
        return analysis
        
    except Exception as e:
        return {"error": f"Erreur analyse XML: {str(e)}"}

def analyze_nmap_xml(root):
    """Analyse spécifique d'un rapport Nmap XML"""
    analysis = {
        "scan_type": "nmap",
        "hosts": [],
        "total_hosts": 0,
        "hosts_up": 0,
        "total_ports": 0,
        "open_ports": 0,
        "services": {},
        "os_info": []
    }
    
    try:
        # Informations générales du scan
        analysis["scanner"] = root.get("scanner", "nmap")
        analysis["version"] = root.get("version", "unknown")
        analysis["start_time"] = root.get("startstr", "unknown")
        
        # Analyse des hôtes
        for host in root.findall(".//host"):
            host_info = {"addresses": [], "ports": [], "status": "unknown"}
            
            # Statut de l'hôte
            status = host.find("status")
            if status is not None:
                host_info["status"] = status.get("state", "unknown")
                if host_info["status"] == "up":
                    analysis["hosts_up"] += 1
            
            # Adresses IP
            for address in host.findall(".//address"):
                host_info["addresses"].append({
                    "addr": address.get("addr"),
                    "addrtype": address.get("addrtype")
                })
            
            # Ports
            for port in host.findall(".//port"):
                port_info = {
                    "portid": port.get("portid"),
                    "protocol": port.get("protocol"),
                    "state": "unknown",
                    "service": {}
                }
                
                # État du port
                state = port.find("state")
                if state is not None:
                    port_info["state"] = state.get("state")
                    if port_info["state"] == "open":
                        analysis["open_ports"] += 1
                
                # Service
                service = port.find("service")
                if service is not None:
                    service_name = service.get("name", "unknown")
                    port_info["service"] = {
                        "name": service_name,
                        "product": service.get("product", ""),
                        "version": service.get("version", "")
                    }
                    
                    # Comptage des services
                    if service_name in analysis["services"]:
                        analysis["services"][service_name] += 1
                    else:
                        analysis["services"][service_name] = 1
                
                host_info["ports"].append(port_info)
                analysis["total_ports"] += 1
            
            # Détection d'OS
            for osmatch in host.findall(".//osmatch"):
                analysis["os_info"].append({
                    "name": osmatch.get("name", "unknown"),
                    "accuracy": osmatch.get("accuracy", "0")
                })
            
            analysis["hosts"].append(host_info)
            analysis["total_hosts"] += 1
        
        return analysis
        
    except Exception as e:
        return {"error": f"Erreur analyse Nmap: {str(e)}"}

def analyze_openvas_xml(root):
    """Analyse spécifique d'un rapport OpenVAS XML"""
    analysis = {
        "scan_type": "openvas",
        "vulnerabilities": [],
        "severity_counts": {"High": 0, "Medium": 0, "Low": 0, "Log": 0},
        "total_vulnerabilities": 0,
        "hosts_scanned": [],
        "scan_info": {}
    }
    
    try:
        # Recherche des résultats de vulnérabilités
        for result in root.findall(".//result"):
            vuln = {
                "name": "",
                "description": "",
                "severity": "Log",
                "host": "",
                "port": "",
                "threat": "Log"
            }
            
            # Nom de la vulnérabilité
            name_elem = result.find(".//name")
            if name_elem is not None:
                vuln["name"] = name_elem.text or ""
            
            # Description
            desc_elem = result.find(".//description")
            if desc_elem is not None:
                vuln["description"] = desc_elem.text or ""
            
            # Sévérité/Threat
            threat_elem = result.find(".//threat")
            if threat_elem is not None:
                vuln["threat"] = threat_elem.text or "Log"
                vuln["severity"] = vuln["threat"]
            
            # Hôte
            host_elem = result.find(".//host")
            if host_elem is not None:
                vuln["host"] = host_elem.text or ""
                if vuln["host"] and vuln["host"] not in analysis["hosts_scanned"]:
                    analysis["hosts_scanned"].append(vuln["host"])
            
            # Port
            port_elem = result.find(".//port")
            if port_elem is not None:
                vuln["port"] = port_elem.text or ""
            
            analysis["vulnerabilities"].append(vuln)
            analysis["total_vulnerabilities"] += 1
            
            # Comptage par sévérité
            severity = vuln["severity"]
            if severity in analysis["severity_counts"]:
                analysis["severity_counts"][severity] += 1
        
        return analysis
        
    except Exception as e:
        return {"error": f"Erreur analyse OpenVAS: {str(e)}"}

def analyze_pcap_report(file_path):
    """Analyse d'un fichier PCAP"""
    try:
        import subprocess
        
        analysis = {
            "file_type": "pcap",
            "packet_count": 0,
            "file_size": os.path.getsize(file_path),
            "protocols": {},
            "conversations": [],
            "duration": "unknown"
        }
        
        # Utilisation de capinfos pour les statistiques de base
        try:
            result = subprocess.run(
                ["capinfos", file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if "Number of packets" in line:
                        analysis["packet_count"] = int(line.split(':')[1].strip())
                    elif "Capture duration" in line:
                        analysis["duration"] = line.split(':')[1].strip()
        except:
            pass
        
        # Utilisation de tshark pour l'analyse des protocoles
        try:
            result = subprocess.run(
                ["tshark", "-r", file_path, "-q", "-z", "io,phs"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                # Parsing simple de la hiérarchie des protocoles
                for line in result.stdout.split('\n'):
                    if 'frames:' in line or 'bytes:' in line:
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            protocol = parts[0]
                            if protocol not in ['Protocol', '===']:
                                analysis["protocols"][protocol] = line.strip()
        except:
            pass
        
        return analysis
        
    except Exception as e:
        return {"error": f"Erreur analyse PCAP: {str(e)}"}

def analyze_text_report(file_path):
    """Analyse d'un rapport texte"""
    try:
        analysis = {
            "file_type": "text",
            "line_count": 0,
            "word_count": 0,
            "character_count": 0,
            "keywords": {},
            "summary": ""
        }
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
            words = content.split()
            
            analysis["line_count"] = len(lines)
            analysis["word_count"] = len(words)
            analysis["character_count"] = len(content)
            
            # Recherche de mots-clés courants dans les rapports de sécurité
            security_keywords = [
                'vulnerability', 'exploit', 'attack', 'malware', 'threat',
                'security', 'risk', 'critical', 'high', 'medium', 'low',
                'port', 'service', 'open', 'closed', 'filtered',
                'scan', 'target', 'host', 'network'
            ]
            
            content_lower = content.lower()
            for keyword in security_keywords:
                count = content_lower.count(keyword)
                if count > 0:
                    analysis["keywords"][keyword] = count
            
            # Résumé basique (premières lignes non vides)
            summary_lines = []
            for line in lines[:10]:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('='):
                    summary_lines.append(line)
                    if len(summary_lines) >= 3:
                        break
            
            analysis["summary"] = ' '.join(summary_lines)[:200] + "..." if summary_lines else "Aucun résumé disponible"
        
        return analysis
        
    except Exception as e:
        return {"error": f"Erreur analyse texte: {str(e)}"}

@reports_bp.route("/cleanup", methods=["POST"])
def cleanup_old_reports():
    """Nettoyage des anciens rapports"""
    try:
        data = request.get_json() or {}
        days_old = data.get("days_old", 30)  # Par défaut, supprimer les fichiers de plus de 30 jours
        
        if days_old < 1:
            return jsonify({"error": "La période doit être d'au moins 1 jour"}), 400
        
        reports_path = Path(REPORTS_DIR)
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
        
        deleted_files = []
        total_size_freed = 0
        
        for file_path in reports_path.iterdir():
            if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                file_size = file_path.stat().st_size
                file_path.unlink()
                deleted_files.append({
                    "filename": file_path.name,
                    "size": file_size
                })
                total_size_freed += file_size
        
        return jsonify({
            "message": f"Nettoyage terminé: {len(deleted_files)} fichiers supprimés",
            "deleted_files": deleted_files,
            "total_files_deleted": len(deleted_files),
            "total_size_freed": total_size_freed,
            "days_old": days_old
        })
        
    except Exception as e:
        logger.error(f"Erreur nettoyage rapports: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/export", methods=["POST"])
def export_reports():
    """Export de plusieurs rapports dans une archive"""
    try:
        data = request.get_json()
        filenames = data.get("filenames", [])
        
        if not filenames:
            return jsonify({"error": "Aucun fichier spécifié pour l'export"}), 400
        
        import zipfile
        import tempfile
        
        # Création d'un fichier ZIP temporaire
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"pacha_reports_export_{timestamp}.zip"
        zip_path = os.path.join(REPORTS_DIR, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for filename in filenames:
                file_path = os.path.join(REPORTS_DIR, filename)
                
                # Vérification de sécurité
                if not os.path.commonpath([REPORTS_DIR, file_path]) == REPORTS_DIR:
                    continue
                
                if os.path.exists(file_path):
                    zipf.write(file_path, filename)
        
        if os.path.exists(zip_path):
            return jsonify({
                "export_file": {
                    "filename": zip_filename,
                    "size": os.path.getsize(zip_path),
                    "download_url": f"/api/download/{zip_filename}"
                },
                "exported_files": filenames,
                "created_at": datetime.now().isoformat()
            })
        else:
            return jsonify({"error": "Échec de la création de l'archive"}), 500
        
    except Exception as e:
        logger.error(f"Erreur export rapports: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/stats", methods=["GET"])
def get_reports_stats():
    """Statistiques globales des rapports"""
    try:
        reports_path = Path(REPORTS_DIR)
        
        if not reports_path.exists():
            return jsonify({
                "total_reports": 0,
                "total_size": 0,
                "by_type": {},
                "recent_activity": []
            })
        
        stats = {
            "total_reports": 0,
            "total_size": 0,
            "by_type": {},
            "recent_activity": [],
            "oldest_report": None,
            "newest_report": None
        }
        
        files_info = []
        
        for file_path in reports_path.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                file_info = {
                    "name": file_path.name,
                    "size": stat.st_size,
                    "created": stat.st_ctime,
                    "modified": stat.st_mtime
                }
                
                # Détermination du type
                file_type = "other"
                name_lower = file_path.name.lower()
                if "nmap" in name_lower:
                    file_type = "nmap"
                elif "openvas" in name_lower:
                    file_type = "openvas"
                elif "wireshark" in name_lower or "pcap" in name_lower:
                    file_type = "wireshark"
                elif "metasploit" in name_lower:
                    file_type = "metasploit"
                elif "masscan" in name_lower:
                    file_type = "masscan"
                
                file_info["type"] = file_type
                files_info.append(file_info)
                
                # Mise à jour des statistiques
                stats["total_reports"] += 1
                stats["total_size"] += stat.st_size
                
                if file_type in stats["by_type"]:
                    stats["by_type"][file_type]["count"] += 1
                    stats["by_type"][file_type]["size"] += stat.st_size
                else:
                    stats["by_type"][file_type] = {"count": 1, "size": stat.st_size}
        
        # Tri par date de création
        files_info.sort(key=lambda x: x["created"], reverse=True)
        
        # Activité récente (derniers 5 fichiers)
        stats["recent_activity"] = [
            {
                "filename": f["name"],
                "type": f["type"],
                "size": f["size"],
                "created": datetime.fromtimestamp(f["created"]).isoformat()
            }
            for f in files_info[:5]
        ]
        
        # Plus ancien et plus récent
        if files_info:
            stats["newest_report"] = {
                "filename": files_info[0]["name"],
                "created": datetime.fromtimestamp(files_info[0]["created"]).isoformat()
            }
            stats["oldest_report"] = {
                "filename": files_info[-1]["name"],
                "created": datetime.fromtimestamp(files_info[-1]["created"]).isoformat()
            }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Erreur statistiques rapports: {str(e)}")
        return jsonify({"error": str(e)}), 500