# backend/app/services/hydra_service.py
import subprocess
import os
from datetime import datetime
from app.utils.task_manager import update_task_status

class HydraService:
    def __init__(self):
        self.reports_path = "/app/reports"
        self.wordlists = {
            "rockyou": "/usr/share/wordlists/rockyou.txt",
            "common": "/usr/share/wordlists/dirb/common.txt",
            "passwords": "/usr/share/wordlists/fasttrack.txt"
        }
    
    def run_attack_async(self, target, service, username, wordlist, task_id):
        """Attaque Hydra asynchrone"""
        try:
            update_task_status(task_id, "running")
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{self.reports_path}/hydra_{service}_{timestamp}.txt"
            
            wordlist_path = self.wordlists.get(wordlist, wordlist)
            
            # Configuration par service
            service_configs = {
                "smb": ["-t", "4", "-l", username, "-P", wordlist_path, f"{target}", "smb"],
                "rdp": ["-t", "4", "-l", username, "-P", wordlist_path, f"rdp://{target}"],
                "ssh": ["-t", "4", "-l", username, "-P", wordlist_path, f"ssh://{target}"],
                "ftp": ["-t", "4", "-l", username, "-P", wordlist_path, f"ftp://{target}"]
            }
            
            if service not in service_configs:
                update_task_status(task_id, "failed", {"error": f"Service {service} non supporté"})
                return
            
            cmd = ["hydra"] + service_configs[service] + ["-o", output_file]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1800  # 30 minutes max
            )
            
            # Parsing des résultats
            results = self._parse_hydra_output(output_file, result.stdout)
            
            if results["found_credentials"]:
                update_task_status(task_id, "completed", {
                    "credentials": results["credentials"],
                    "total_attempts": results["total_attempts"],
                    "output_file": os.path.basename(output_file)
                })
            else:
                update_task_status(task_id, "completed", {
                    "message": "Aucun credential trouvé",
                    "total_attempts": results["total_attempts"],
                    "output_file": os.path.basename(output_file)
                })
                
        except subprocess.TimeoutExpired:
            update_task_status(task_id, "failed", {"error": "Timeout de l'attaque (30 min)"})
        except Exception as e:
            update_task_status(task_id, "failed", {"error": str(e)})
    
    def _parse_hydra_output(self, output_file, stdout):
        """Parsing des résultats Hydra"""
        results = {
            "found_credentials": False,
            "credentials": [],
            "total_attempts": 0
        }
        
        try:
            # Lecture du fichier de sortie
            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    content = f.read()
            else:
                content = stdout
            
            # Extraction des credentials
            for line in content.split('\n'):
                if '[DATA]' in line and 'task' in line:
                    # Extraction du nombre de tentatives
                    if 'task' in line:
                        try:
                            attempts = int(line.split('task')[0].split()[-1])
                            results["total_attempts"] = attempts
                        except:
                            pass
                
                elif 'login:' in line and 'password:' in line:
                    # Credential trouvé
                    parts = line.split()
                    login = ""
                    password = ""
                    
                    for i, part in enumerate(parts):
                        if part == "login:":
                            login = parts[i+1]
                        elif part == "password:":
                            password = parts[i+1]
                    
                    if login and password:
                        results["found_credentials"] = True
                        results["credentials"].append({
                            "username": login,
                            "password": password
                        })
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
