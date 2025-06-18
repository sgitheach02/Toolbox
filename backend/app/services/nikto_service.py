# backend/app/services/nikto_service.py
import subprocess
import uuid
import os
import re
from datetime import datetime
from app.utils.task_manager import update_task_status
import logging

logger = logging.getLogger(__name__)

class NiktoService:
    def __init__(self):
        self.reports_path = "/app/reports"
    
    def run_scan_async(self, target, scan_type, task_id):
        """Exécution asynchrone d'un scan Nikto"""
        try:
            update_task_status(task_id, "running")
            
            scan_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Fichiers de sortie
            txt_file = f"{self.reports_path}/nikto_{scan_id}_{timestamp}.txt"
            xml_file = f"{self.reports_path}/nikto_{scan_id}_{timestamp}.xml"
            
            # Configuration des scans selon le type
            scan_configs = {
                'quick': ['-maxtime', '120', '-Tuning', '1,2,3,4'],
                'basic': ['-maxtime', '300', '-Tuning', '1,2,3,4,5,6,7'],
                'comprehensive': ['-maxtime', '600', '-Tuning', 'x']
            }
            
            # Commande Nikto
            cmd = [
                "nikto",
                "-h", target,
                "-Format", "txt",
                "-output", txt_file
            ]
            
            # Ajouter les options selon le type de scan
            if scan_type in scan_configs:
                cmd.extend(scan_configs[scan_type])
            
            # Ajouter le scan XML en parallèle
            cmd_xml = cmd.copy()
            cmd_xml[-3] = "xml"  # Changer le format
            cmd_xml[-1] = xml_file  # Changer le fichier de sortie
            
            logger.info(f"Exécution Nikto: {' '.join(cmd)}")
            
            # Exécuter le scan principal
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=700  # Timeout légèrement supérieur au maxtime
            )
            
            # Exécuter le scan XML si le premier a réussi
            if result.returncode == 0:
                subprocess.run(cmd_xml, capture_output=True, text=True, timeout=700)
            
            # Analyser les résultats
            if result.returncode == 0:
                analysis = self._analyze_nikto_output(txt_file, xml_file)
                
                update_task_status(task_id, "completed", {
                    "scan_id": scan_id,
                    "files": {
                        "txt": os.path.basename(txt_file),
                        "xml": os.path.basename(xml_file) if os.path.exists(xml_file) else None
                    },
                    "vulnerabilities": analysis["vulnerabilities"],
                    "summary": analysis["summary"],
                    "target": target,
                    "scan_type": scan_type
                })
            else:
                error_msg = result.stderr or "Erreur inconnue lors du scan Nikto"
                update_task_status(task_id, "failed", {"error": error_msg})
                
        except subprocess.TimeoutExpired:
            update_task_status(task_id, "failed", {"error": "Timeout du scan Nikto"})
        except Exception as e:
            logger.error(f"Erreur scan Nikto: {str(e)}")
            update_task_status(task_id, "failed", {"error": str(e)})
    
    def _analyze_nikto_output(self, txt_file, xml_file):
        """Analyse des résultats Nikto"""
        analysis = {
            "vulnerabilities": [],
            "summary": {
                "total_checks": 0,
                "total_vulnerabilities": 0,
                "high_severity": 0,
                "medium_severity": 0,
                "low_severity": 0,
                "scan_time": "Unknown"
            }
        }
        
        try:
            # Analyse du fichier texte
            if os.path.exists(txt_file):
                with open(txt_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Extraction des vulnérabilités
                vulnerabilities = self._extract_vulnerabilities_from_text(content)
                analysis["vulnerabilities"] = vulnerabilities
                
                # Extraction du résumé
                summary = self._extract_summary_from_text(content)
                analysis["summary"].update(summary)
            
            # Analyse complémentaire du fichier XML si disponible
            if os.path.exists(xml_file):
                xml_analysis = self._analyze_xml_output(xml_file)
                # Compléter l'analyse avec les données XML
                if xml_analysis:
                    analysis["summary"].update(xml_analysis.get("summary", {}))
            
            return analysis
            
        except Exception as e:
            logger.error(f"Erreur analyse résultats Nikto: {e}")
            return {
                "vulnerabilities": [],
                "summary": {"error": str(e)},
                "error": str(e)
            }
    
    def _extract_vulnerabilities_from_text(self, content):
        """Extraction des vulnérabilités depuis le fichier texte"""
        vulnerabilities = []
        
        # Regex pour identifier les vulnérabilités
        vuln_patterns = [
            r'^\+ ([^:]+): (.+)$',  # Format standard Nikto
            r'^\+ OSVDB-(\d+): (.+)$',  # Références OSVDB
            r'^\+ CVE-(\d+)-(\d+): (.+)$'  # Références CVE
        ]
        
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            
            # Ignorer les lignes de status et d'info
            if not line or line.startswith('-') or 'Nikto v' in line:
                continue
            
            # Détecter les vulnérabilités
            if line.startswith('+ '):
                vuln_data = self._parse_vulnerability_line(line)
                if vuln_data:
                    vulnerabilities.append(vuln_data)
        
        return vulnerabilities
    
    def _parse_vulnerability_line(self, line):
        """Parser une ligne de vulnérabilité"""
        try:
            # Nettoyer la ligne
            line = line.replace('+ ', '', 1)
            
            # Séparer l'URI et la description
            if ': ' in line:
                parts = line.split(': ', 1)
                uri = parts[0]
                description = parts[1]
            else:
                uri = "/"
                description = line
            
            # Déterminer la sévérité basée sur des mots-clés
            severity = self._determine_severity(description)
            
            # Extraire les références (OSVDB, CVE, etc.)
            references = self._extract_references(description)
            
            return {
                "uri": uri,
                "description": description,
                "severity": severity,
                "references": references,
                "category": self._categorize_vulnerability(description)
            }
            
        except Exception as e:
            logger.warning(f"Erreur parsing ligne vulnérabilité: {e}")
            return None
    
    def _determine_severity(self, description):
        """Déterminer la sévérité d'une vulnérabilité"""
        desc_lower = description.lower()
        
        high_keywords = [
            'remote code execution', 'rce', 'sql injection', 'sqli',
            'file upload', 'arbitrary file', 'command injection',
            'directory traversal', 'path traversal', 'admin access'
        ]
        
        medium_keywords = [
            'cross-site scripting', 'xss', 'csrf', 'session',
            'authentication bypass', 'privilege escalation',
            'information disclosure', 'file inclusion'
        ]
        
        low_keywords = [
            'version disclosure', 'banner grabbing', 'robots.txt',
            'backup file', 'test file', 'debug'
        ]
        
        for keyword in high_keywords:
            if keyword in desc_lower:
                return "HIGH"
        
        for keyword in medium_keywords:
            if keyword in desc_lower:
                return "MEDIUM"
        
        for keyword in low_keywords:
            if keyword in desc_lower:
                return "LOW"
        
        return "MEDIUM"  # Par défaut
    
    def _extract_references(self, description):
        """Extraire les références (OSVDB, CVE, etc.)"""
        references = []
        
        # OSVDB
        osvdb_matches = re.findall(r'OSVDB-(\d+)', description)
        for match in osvdb_matches:
            references.append(f"OSVDB-{match}")
        
        # CVE
        cve_matches = re.findall(r'CVE-(\d{4})-(\d+)', description)
        for match in cve_matches:
            references.append(f"CVE-{match[0]}-{match[1]}")
        
        # BID
        bid_matches = re.findall(r'BID-(\d+)', description)
        for match in bid_matches:
            references.append(f"BID-{match}")
        
        return references
    
    def _categorize_vulnerability(self, description):
        """Catégoriser la vulnérabilité"""
        desc_lower = description.lower()
        
        categories = {
            "Code Execution": ["code execution", "rce", "command injection"],
            "Injection": ["sql injection", "sqli", "xss", "script injection"],
            "Information Disclosure": ["information disclosure", "version disclosure", "banner"],
            "Access Control": ["authentication", "authorization", "admin", "login"],
            "File System": ["file upload", "directory traversal", "path traversal"],
            "Configuration": ["misconfiguration", "default", "backup", "test file"],
            "Session Management": ["session", "cookie", "csrf"]
        }
        
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    return category
        
        return "Other"
    
    def _extract_summary_from_text(self, content):
        """Extraire le résumé depuis le fichier texte"""
        summary = {}
        
        # Chercher le temps de scan
        time_match = re.search(r'(\d+) second\(s\)', content)
        if time_match:
            summary["scan_time"] = f"{time_match.group(1)} seconds"
        
        # Compter les vulnérabilités par sévérité
        vulnerabilities = self._extract_vulnerabilities_from_text(content)
        summary["total_vulnerabilities"] = len(vulnerabilities)
        
        severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for vuln in vulnerabilities:
            severity = vuln.get("severity", "MEDIUM")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        summary.update({
            "high_severity": severity_counts["HIGH"],
            "medium_severity": severity_counts["MEDIUM"],
            "low_severity": severity_counts["LOW"]
        })
        
        return summary
    
    def _analyze_xml_output(self, xml_file):
        """Analyse du fichier XML Nikto"""
        try:
            import xml.etree.ElementTree as ET
            
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            analysis = {
                "summary": {}
            }
            
            # Extraire les informations du scan
            scan_details = root.find('.//scandetails')
            if scan_details is not None:
                analysis["summary"]["target"] = scan_details.get('targetip')
                analysis["summary"]["hostname"] = scan_details.get('targethostname')
                analysis["summary"]["port"] = scan_details.get('targetport')
            
            return analysis
            
        except Exception as e:
            logger.warning(f"Erreur analyse XML Nikto: {e}")
            return None