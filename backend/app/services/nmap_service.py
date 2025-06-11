# backend/app/services/nmap_service.py
import subprocess
import uuid
import os
from datetime import datetime
from app.utils.task_manager import update_task_status
import logging

logger = logging.getLogger(__name__)

class NmapService:
    def __init__(self):
        self.reports_path = "/app/reports"
    
    def run_scan_async(self, target, args, task_id):
        """Exécution asynchrone d'un scan Nmap"""
        try:
            update_task_status(task_id, "running")
            
            scan_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Fichiers de sortie
            xml_file = f"{self.reports_path}/nmap_{scan_id}_{timestamp}.xml"
            json_file = f"{self.reports_path}/nmap_{scan_id}_{timestamp}.json"
            
            # Commande Nmap optimisée
            cmd = [
                "nmap", target,
                *args.split(),
                "-oX", xml_file,
                "-oN", f"{self.reports_path}/nmap_{scan_id}_{timestamp}.txt"
            ]
            
            logger.info(f"Exécution Nmap: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode == 0:
                # Conversion XML vers JSON pour analyse
                json_data = self._xml_to_json(xml_file)
                
                with open(json_file, 'w') as f:
                    import json
                    json.dump(json_data, f, indent=2)
                
                update_task_status(task_id, "completed", {
                    "scan_id": scan_id,
                    "files": {
                        "xml": os.path.basename(xml_file),
                        "json": os.path.basename(json_file)
                    },
                    "summary": self._extract_summary(json_data)
                })
            else:
                update_task_status(task_id, "failed", {"error": result.stderr})
                
        except Exception as e:
            logger.error(f"Erreur scan Nmap: {str(e)}")
            update_task_status(task_id, "failed", {"error": str(e)})
    
    def _xml_to_json(self, xml_file):
        """Conversion XML Nmap vers JSON"""
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        data = {
            "scan_info": {
                "scanner": root.get("scanner"),
                "version": root.get("version"),
                "start_time": root.get("startstr")
            },
            "hosts": []
        }
        
        for host in root.findall(".//host"):
            host_data = {
                "status": host.find("status").get("state"),
                "addresses": [],
                "hostnames": [],
                "ports": [],
                "os": []
            }
            
            # Adresses
            for addr in host.findall(".//address"):
                host_data["addresses"].append({
                    "addr": addr.get("addr"),
                    "type": addr.get("addrtype")
                })
            
            # Ports
            for port in host.findall(".//port"):
                port_data = {
                    "portid": port.get("portid"),
                    "protocol": port.get("protocol"),
                    "state": port.find("state").get("state"),
                    "service": {}
                }
                
                service = port.find("service")
                if service is not None:
                    port_data["service"] = {
                        "name": service.get("name", ""),
                        "product": service.get("product", ""),
                        "version": service.get("version", "")
                    }
                
                host_data["ports"].append(port_data)
            
            data["hosts"].append(host_data)
        
        return data
    
    def _extract_summary(self, json_data):
        """Extraction du résumé du scan"""
        total_hosts = len(json_data["hosts"])
        up_hosts = len([h for h in json_data["hosts"] if h["status"] == "up"])
        total_ports = sum(len(h["ports"]) for h in json_data["hosts"])
        open_ports = sum(len([p for p in h["ports"] if p["state"] == "open"]) for h in json_data["hosts"])
        
        services = {}
        for host in json_data["hosts"]:
            for port in host["ports"]:
                if port["state"] == "open":
                    service = port["service"].get("name", "unknown")
                    services[service] = services.get(service, 0) + 1
        
        return {
            "total_hosts": total_hosts,
            "up_hosts": up_hosts,
            "total_ports": total_ports,
            "open_ports": open_ports,
            "top_services": dict(sorted(services.items(), key=lambda x: x[1], reverse=True)[:5])
        }