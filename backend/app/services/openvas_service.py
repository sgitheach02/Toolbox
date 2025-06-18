# backend/app/services/openvas_service.py
import requests
import xml.etree.ElementTree as ET
import time
import os
from datetime import datetime
from app.utils.task_manager import update_task_status

class OpenVASService:
    def __init__(self):
        self.base_url = "http://openvas:9392"
        self.username = "admin"
        self.password = "SecurePass123!"
        self.token = None
        self.reports_path = "/app/reports"
    
    def authenticate(self):
        """Authentification OpenVAS"""
        try:
            auth_xml = f"""<authenticate>
                <credentials>
                    <username>{self.username}</username>
                    <password>{self.password}</password>
                </credentials>
            </authenticate>"""
            
            response = requests.post(
                f"{self.base_url}/omp",
                data=auth_xml,
                headers={'Content-Type': 'application/xml'},
                timeout=30
            )
            
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                self.token = root.get('token')
                return True
            return False
            
        except Exception as e:
            return False
    
    def run_scan_async(self, target, task_id):
        """Lancement scan OpenVAS asynchrone"""
        try:
            update_task_status(task_id, "running")
            
            if not self.authenticate():
                update_task_status(task_id, "failed", {"error": "Échec authentification OpenVAS"})
                return
            
            # Création de la cible
            target_id = self._create_target(target)
            if not target_id:
                update_task_status(task_id, "failed", {"error": "Échec création cible"})
                return
            
            # Création de la tâche
            scan_task_id = self._create_task(target_id, target)
            if not scan_task_id:
                update_task_status(task_id, "failed", {"error": "Échec création tâche"})
                return
            
            # Démarrage du scan
            if not self._start_task(scan_task_id):
                update_task_status(task_id, "failed", {"error": "Échec démarrage scan"})
                return
            
            # Monitoring du scan
            self._monitor_scan(scan_task_id, task_id, target)
            
        except Exception as e:
            update_task_status(task_id, "failed", {"error": str(e)})
    
    def _create_target(self, target_ip):
        """Création d'une cible OpenVAS"""
        target_xml = f"""<create_target>
            <name>Target_{target_ip}_{int(time.time())}</name>
            <hosts>{target_ip}</hosts>
        </create_target>"""
        
        response = requests.post(
            f"{self.base_url}/omp?token={self.token}",
            data=target_xml,
            headers={'Content-Type': 'application/xml'}
        )
        
        if response.status_code == 201:
            root = ET.fromstring(response.text)
            return root.get('id')
        return None
    
    def _create_task(self, target_id, target_name):
        """Création d'une tâche de scan"""
        task_xml = f"""<create_task>
            <name>Scan_{target_name}_{int(time.time())}</name>
            <config id="daba56c8-73ec-11df-a475-002264764cea"/>
            <target id="{target_id}"/>
            <scanner id="08b69003-5fc2-4037-a479-93b440211c73"/>
        </create_task>"""
        
        response = requests.post(
            f"{self.base_url}/omp?token={self.token}",
            data=task_xml,
            headers={'Content-Type': 'application/xml'}
        )
        
        if response.status_code == 201:
            root = ET.fromstring(response.text)
            return root.get('id')
        return None
    
    def _start_task(self, task_id):
        """Démarrage d'une tâche"""
        start_xml = f'<start_task task_id="{task_id}"/>'
        
        response = requests.post(
            f"{self.base_url}/omp?token={self.token}",
            data=start_xml,
            headers={'Content-Type': 'application/xml'}
        )
        
        return response.status_code == 202
    
    def _monitor_scan(self, scan_task_id, task_id, target):
        """Monitoring du scan jusqu'à completion"""
        while True:
            status_xml = f'<get_tasks task_id="{scan_task_id}"/>'
            
            response = requests.post(
                f"{self.base_url}/omp?token={self.token}",
                data=status_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                task = root.find('task')
                
                if task is not None:
                    status = task.find('status').text
                    progress = task.find('progress').text if task.find('progress') is not None else "0"
                    
                    # Mise à jour du statut
                    update_task_status(task_id, "running", {
                        "scan_status": status,
                        "progress": progress + "%"
                    })
                    
                    if status == "Done":
                        # Téléchargement du rapport
                        report_data = self._get_report(scan_task_id)
                        
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        report_file = f"{self.reports_path}/openvas_{target}_{timestamp}.xml"
                        
                        with open(report_file, 'w', encoding='utf-8') as f:
                            f.write(report_data)
                        
                        # Analyse du rapport
                        analysis = self._analyze_report(report_data)
                        
                        update_task_status(task_id, "completed", {
                            "report_file": os.path.basename(report_file),
                            "vulnerabilities": analysis["vulnerabilities"],
                            "severity_summary": analysis["severity_summary"]
                        })
                        break
                    
                    elif status in ["Stopped", "Interrupted"]:
                        update_task_status(task_id, "failed", {"error": f"Scan {status}"})
                        break
            
            time.sleep(30)  # Vérification toutes les 30 secondes
    
    def _get_report(self, task_id):
        """Récupération du rapport de scan"""
        reports_xml = f'<get_reports task_id="{task_id}"/>'
        
        response = requests.post(
            f"{self.base_url}/omp?token={self.token}",
            data=reports_xml,
            headers={'Content-Type': 'application/xml'}
        )
        
        if response.status_code == 200:
            root = ET.fromstring(response.text)
            report = root.find('report')
            
            if report is not None:
                report_id = report.get('id')
                
                # Téléchargement du rapport complet
                full_report_xml = f'<get_reports report_id="{report_id}" format_id="a994b278-1f62-11e1-96ac-406186ea4fc5"/>'
                
                response = requests.post(
                    f"{self.base_url}/omp?token={self.token}",
                    data=full_report_xml,
                    headers={'Content-Type': 'application/xml'}
                )
                
                return response.text
        
        return ""
    
    def _analyze_report(self, report_data):
        """Analyse du rapport OpenVAS"""
        analysis = {
            "vulnerabilities": [],
            "severity_summary": {"High": 0, "Medium": 0, "Low": 0, "Log": 0}
        }
        
        try:
            root = ET.fromstring(report_data)
            
            for result in root.findall(".//result"):
                vuln = {
                    "name": "",
                    "severity": "Log",
                    "host": "",
                    "port": "",
                    "description": ""
                }
                
                name_elem = result.find(".//name")
                if name_elem is not None:
                    vuln["name"] = name_elem.text or ""
                
                threat_elem = result.find(".//threat")
                if threat_elem is not None:
                    vuln["severity"] = threat_elem.text or "Log"
                
                host_elem = result.find(".//host")
                if host_elem is not None:
                    vuln["host"] = host_elem.text or ""
                
                port_elem = result.find(".//port")
                if port_elem is not None:
                    vuln["port"] = port_elem.text or ""
                
                desc_elem = result.find(".//description")
                if desc_elem is not None:
                    vuln["description"] = (desc_elem.text or "")[:200] + "..."
                
                analysis["vulnerabilities"].append(vuln)
                
                # Comptage par sévérité
                severity = vuln["severity"]
                if severity in analysis["severity_summary"]:
                    analysis["severity_summary"][severity] += 1
            
            return analysis
            
        except Exception as e:
            return {"error": str(e)}