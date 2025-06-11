from flask import Blueprint, request, jsonify
import requests
import xml.etree.ElementTree as ET
import uuid
import time
import logging
from datetime import datetime
import os

openvas_bp = Blueprint("openvas", __name__)
logger = logging.getLogger(__name__)

OPENVAS_URL = "http://openvas:9392"
OPENVAS_USER = "admin"
OPENVAS_PASS = "admin123"

class OpenVASClient:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
    
    def authenticate(self):
        """Authentification auprès d'OpenVAS"""
        try:
            auth_data = f'<authenticate><credentials><username>{OPENVAS_USER}</username><password>{OPENVAS_PASS}</password></credentials></authenticate>'
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp",
                data=auth_data,
                headers={'Content-Type': 'application/xml'},
                timeout=30
            )
            
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                self.token = root.get('token')
                return True
            return False
            
        except Exception as e:
            logger.error(f"Erreur authentification OpenVAS: {str(e)}")
            return False
    
    def create_target(self, target_ip, target_name):
        """Création d'une cible dans OpenVAS"""
        try:
            target_xml = f'''
            <create_target>
                <name>{target_name}</name>
                <hosts>{target_ip}</hosts>
            </create_target>
            '''
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp?token={self.token}",
                data=target_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            if response.status_code == 201:
                root = ET.fromstring(response.text)
                return root.get('id')
            return None
            
        except Exception as e:
            logger.error(f"Erreur création cible OpenVAS: {str(e)}")
            return None
    
    def create_task(self, task_name, target_id, config_id="daba56c8-73ec-11df-a475-002264764cea"):
        """Création d'une tâche de scan"""
        try:
            task_xml = f'''
            <create_task>
                <name>{task_name}</name>
                <config id="{config_id}"/>
                <target id="{target_id}"/>
                <scanner id="08b69003-5fc2-4037-a479-93b440211c73"/>
            </create_task>
            '''
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp?token={self.token}",
                data=task_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            if response.status_code == 201:
                root = ET.fromstring(response.text)
                return root.get('id')
            return None
            
        except Exception as e:
            logger.error(f"Erreur création tâche OpenVAS: {str(e)}")
            return None
    
    def start_task(self, task_id):
        """Démarrage d'une tâche de scan"""
        try:
            start_xml = f'<start_task task_id="{task_id}"/>'
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp?token={self.token}",
                data=start_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            return response.status_code == 202
            
        except Exception as e:
            logger.error(f"Erreur démarrage tâche OpenVAS: {str(e)}")
            return False
    
    def get_task_status(self, task_id):
        """Récupération du statut d'une tâche"""
        try:
            status_xml = f'<get_tasks task_id="{task_id}"/>'
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp?token={self.token}",
                data=status_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                task = root.find('task')
                if task is not None:
                    status = task.find('status').text
                    progress = task.find('progress').text if task.find('progress') is not None else "0"
                    return {"status": status, "progress": progress}
            return None
            
        except Exception as e:
            logger.error(f"Erreur statut tâche OpenVAS: {str(e)}")
            return None
    
    def get_report(self, task_id, report_format="xml"):
        """Récupération du rapport de scan"""
        try:
            # Récupération de l'ID du rapport
            reports_xml = f'<get_reports task_id="{task_id}"/>'
            
            response = self.session.post(
                f"{OPENVAS_URL}/omp?token={self.token}",
                data=reports_xml,
                headers={'Content-Type': 'application/xml'}
            )
            
            if response.status_code == 200:
                root = ET.fromstring(response.text)
                report = root.find('report')
                if report is not None:
                    report_id = report.get('id')
                    
                    # Téléchargement du rapport
                    format_id = "a994b278-1f62-11e1-96ac-406186ea4fc5" if report_format == "xml" else "c402cc3e-b531-11e1-9163-406186ea4fc5"
                    
                    report_xml = f'''
                    <get_reports report_id="{report_id}" format_id="{format_id}"/>
                    '''
                    
                    response = self.session.post(
                        f"{OPENVAS_URL}/omp?token={self.token}",
                        data=report_xml,
                        headers={'Content-Type': 'application/xml'}
                    )
                    
                    return response.text
            return None
            
        except Exception as e:
            logger.error(f"Erreur récupération rapport OpenVAS: {str(e)}")
            return None

@openvas_bp.route("/scan", methods=["POST"])
def start_vulnerability_scan():
    """Lancement d'un scan de vulnérabilités avec OpenVAS"""
    try:
        data = request.get_json()
        target = data.get("target")
        scan_name = data.get("scan_name", f"Scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        if not target:
            return jsonify({"error": "La cible est requise"}), 400
        
        # Initialisation du client OpenVAS
        client = OpenVASClient()
        if not client.authenticate():
            return jsonify({"error": "Échec de l'authentification OpenVAS"}), 500
        
        # Création de la cible
        target_id = client.create_target(target, f"Target_{scan_name}")
        if not target_id:
            return jsonify({"error": "Échec de la création de la cible"}), 500
        
        # Création de la tâche
        task_id = client.create_task(scan_name, target_id)
        if not task_id:
            return jsonify({"error": "Échec de la création de la tâche"}), 500
        
        # Démarrage du scan
        if not client.start_task(task_id):
            return jsonify({"error": "Échec du démarrage du scan"}), 500
        
        scan_id = str(uuid.uuid4())
        
        return jsonify({
            "scan_id": scan_id,
            "task_id": task_id,
            "target_id": target_id,
            "target": target,
            "scan_name": scan_name,
            "status": "started",
            "message": "Scan de vulnérabilités démarré"
        })
        
    except Exception as e:
        logger.error(f"Erreur scan OpenVAS: {str(e)}")
        return jsonify({"error": str(e)}), 500

@openvas_bp.route("/status/<task_id>", methods=["GET"])
def get_scan_status(task_id):
    """Récupération du statut d'un scan OpenVAS"""
    try:
        client = OpenVASClient()
        if not client.authenticate():
            return jsonify({"error": "Échec de l'authentification OpenVAS"}), 500
        
        status = client.get_task_status(task_id)
        if status:
            return jsonify(status)
        else:
            return jsonify({"error": "Tâche non trouvée"}), 404
            
    except Exception as e:
        logger.error(f"Erreur statut OpenVAS: {str(e)}")
        return jsonify({"error": str(e)}), 500

@openvas_bp.route("/report/<task_id>", methods=["GET"])
def get_scan_report(task_id):
    """Récupération du rapport d'un scan OpenVAS"""
    try:
        report_format = request.args.get("format", "xml")
        
        client = OpenVASClient()
        if not client.authenticate():
            return jsonify({"error": "Échec de l'authentification OpenVAS"}), 500
        
        # Vérification que le scan est terminé
        status = client.get_task_status(task_id)
        if not status or status["status"] != "Done":
            return jsonify({"error": "Le scan n'est pas terminé"}), 400
        
        # Récupération du rapport
        report_content = client.get_report(task_id, report_format)
        if not report_content:
            return jsonify({"error": "Échec de la récupération du rapport"}), 500
        
        # Sauvegarde du rapport
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"openvas_report_{task_id}_{timestamp}.{report_format}"
        filepath = f"/app/reports/{filename}"
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
        
        return jsonify({
            "task_id": task_id,
            "report_file": {
                "filename": filename,
                "size": os.path.getsize(filepath),
                "format": report_format,
                "download_url": f"/api/download/{filename}"
            },
            "status": "completed"
        })
        
    except Exception as e:
        logger.error(f"Erreur rapport OpenVAS: {str(e)}")
        return jsonify({"error": str(e)}), 500

@openvas_bp.route("/configs", methods=["GET"])
def get_scan_configs():
    """Récupération des configurations de scan disponibles"""
    try:
        client = OpenVASClient()
        if not client.authenticate():
            return jsonify({"error": "Échec de l'authentification OpenVAS"}), 500
        
        configs_xml = '<get_configs/>'
        
        response = client.session.post(
            f"{OPENVAS_URL}/omp?token={client.token}",
            data=configs_xml,
            headers={'Content-Type': 'application/xml'}
        )
        
        configs = []
        if response.status_code == 200:
            root = ET.fromstring(response.text)
            for config in root.findall('config'):
                configs.append({
                    "id": config.get('id'),
                    "name": config.find('name').text,
                    "comment": config.find('comment').text if config.find('comment') is not None else ""
                })
        
        return jsonify({"configs": configs})
        
    except Exception as e:
        logger.error(f"Erreur récupération configs OpenVAS: {str(e)}")
        return jsonify({"error": str(e)}), 500