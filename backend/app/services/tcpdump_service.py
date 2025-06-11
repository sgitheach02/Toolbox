# backend/app/services/tcpdump_service.py
import subprocess
import uuid
import os
import signal
from datetime import datetime
from app.utils.task_manager import update_task_status

class TCPDumpService:
    def __init__(self):
        self.reports_path = "/app/reports"
        self.active_captures = {}
    
    def start_capture_async(self, interface, duration, filter_expr, task_id):
        """Démarrage capture tcpdump asynchrone"""
        try:
            update_task_status(task_id, "running")
            
            capture_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pcap_file = f"{self.reports_path}/capture_{capture_id}_{timestamp}.pcap"
            
            # Commande tcpdump optimisée
            cmd = [
                "tcpdump",
                "-i", interface,
                "-w", pcap_file,
                "-G", str(duration),  # Durée
                "-W", "1",            # Un seul fichier
                "-s", "65535",        # Capture complète
                filter_expr
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.active_captures[task_id] = {
                "process": process,
                "pcap_file": pcap_file,
                "capture_id": capture_id
            }
            
            # Attendre la fin de la capture
            stdout, stderr = process.communicate(timeout=duration + 30)
            
            if process.returncode == 0:
                # Analyse rapide du fichier
                analysis = self.analyze_pcap(pcap_file)
                
                update_task_status(task_id, "completed", {
                    "capture_id": capture_id,
                    "pcap_file": os.path.basename(pcap_file),
                    "file_size": os.path.getsize(pcap_file),
                    "quick_analysis": analysis
                })
            else:
                update_task_status(task_id, "failed", {"error": stderr.decode()})
                
        except Exception as e:
            update_task_status(task_id, "failed", {"error": str(e)})
        finally:
            if task_id in self.active_captures:
                del self.active_captures[task_id]
    
    def analyze_pcap(self, pcap_file):
        """Analyse d'un fichier PCAP avec tcpdump"""
        try:
            analyses = {}
            
            # Statistiques générales
            cmd = ["tcpdump", "-r", pcap_file, "-n", "-q"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            total_packets = len(result.stdout.strip().split('\n')) if result.stdout else 0
            
            # Top IPs source
            cmd = ["tcpdump", "-r", pcap_file, "-n", "-q", "|", "awk", "'{print $3}'", "|", "sort", "|", "uniq", "-c", "|", "sort", "-nr", "|", "head", "-10"]
            result = subprocess.run(" ".join(cmd), shell=True, capture_output=True, text=True)
            
            # Protocoles
            protocols = {}
            cmd = ["tcpdump", "-r", pcap_file, "-n", "-q"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            for line in result.stdout.split('\n'):
                if 'TCP' in line:
                    protocols['TCP'] = protocols.get('TCP', 0) + 1
                elif 'UDP' in line:
                    protocols['UDP'] = protocols.get('UDP', 0) + 1
                elif 'ICMP' in line:
                    protocols['ICMP'] = protocols.get('ICMP', 0) + 1
            
            return {
                "total_packets": total_packets,
                "protocols": protocols,
                "file_size": os.path.getsize(pcap_file)
            }
            
        except Exception as e:
            return {"error": str(e)}