from flask import Blueprint, request, jsonify
import os
import psutil
import docker
from datetime import datetime, timedelta
import logging
from app.utils.task_manager import get_task_status
import json

dashboard_bp = Blueprint("dashboard", __name__)
logger = logging.getLogger(__name__)

@dashboard_bp.route("/status", methods=["GET"])
def get_system_status():
    """Statut général du système"""
    try:
        # Informations système
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Informations réseau
        network = psutil.net_io_counters()
        
        # Processus actifs
        processes = len(psutil.pids())
        
        # Statut des services Docker
        docker_status = get_docker_services_status()
        
        # Répertoires et fichiers
        reports_count = count_files_in_directory("/app/reports")
        data_size = get_directory_size("/app/data")
        reports_size = get_directory_size("/app/reports")
        
        return jsonify({
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "used": disk.used,
                    "percent": (disk.used / disk.total) * 100
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                },
                "processes": processes
            },
            "services": docker_status,
            "storage": {
                "reports_count": reports_count,
                "data_size": data_size,
                "reports_size": reports_size
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur statut système: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_docker_services_status():
    """Statut des services Docker"""
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        
        services = {}
        
        for container in containers:
            # Filtrer les conteneurs de Pacha Toolbox
            if 'pacha-toolbox' in container.name or any(name in container.name.lower() for name in ['openvas', 'metasploit', 'postgres', 'redis']):
                services[container.name] = {
                    "status": container.status,
                    "id": container.id[:12],
                    "image": container.image.tags[0] if container.image.tags else "unknown",
                    "created": container.attrs.get("Created", ""),
                    "ports": container.ports if hasattr(container, 'ports') else {}
                }
        
        return services
        
    except Exception as e:
        logger.error(f"Erreur statut Docker: {str(e)}")
        return {"error": "Docker non disponible"}

def count_files_in_directory(directory):
    """Compte les fichiers dans un répertoire"""
    try:
        if not os.path.exists(directory):
            return 0
        return len([f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))])
    except:
        return 0

def get_directory_size(directory):
    """Taille d'un répertoire en bytes"""
    try:
        if not os.path.exists(directory):
            return 0
        
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
        return total_size
    except:
        return 0

@dashboard_bp.route("/activity", methods=["GET"])
def get_recent_activity():
    """Activité récente du système"""
    try:
        days = int(request.args.get('days', 7))
        
        # Analyse des fichiers de rapports récents
        reports_activity = analyze_reports_activity(days)
        
        # Analyse des logs récents
        logs_activity = analyze_logs_activity(days)
        
        # Statistiques des scans
        scan_stats = get_scan_statistics(days)
        
        return jsonify({
            "period_days": days,
            "reports": reports_activity,
            "logs": logs_activity,
            "scans": scan_stats,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur activité récente: {str(e)}")
        return jsonify({"error": str(e)}), 500

def analyze_reports_activity(days):
    """Analyse l'activité des rapports"""
    try:
        reports_dir = "/app/reports"
        if not os.path.exists(reports_dir):
            return {"total": 0, "by_day": {}, "by_type": {}}
        
        cutoff_time = datetime.now() - timedelta(days=days)
        activity = {"total": 0, "by_day": {}, "by_type": {}}
        
        for filename in os.listdir(reports_dir):
            filepath = os.path.join(reports_dir, filename)
            if os.path.isfile(filepath):
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                
                if mtime >= cutoff_time:
                    activity["total"] += 1
                    
                    # Par jour
                    day_key = mtime.strftime('%Y-%m-%d')
                    activity["by_day"][day_key] = activity["by_day"].get(day_key, 0) + 1
                    
                    # Par type
                    file_type = determine_file_type(filename)
                    activity["by_type"][file_type] = activity["by_type"].get(file_type, 0) + 1
        
        return activity
        
    except Exception as e:
        logger.error(f"Erreur analyse activité rapports: {str(e)}")
        return {"total": 0, "by_day": {}, "by_type": {}}

def determine_file_type(filename):
    """Détermine le type de fichier basé sur son nom"""
    filename_lower = filename.lower()
    
    if "nmap" in filename_lower:
        return "nmap"
    elif "openvas" in filename_lower:
        return "openvas"
    elif "wireshark" in filename_lower or "pcap" in filename_lower:
        return "wireshark"
    elif "metasploit" in filename_lower:
        return "metasploit"
    elif "masscan" in filename_lower:
        return "masscan"
    else:
        return "other"

def analyze_logs_activity(days):
    """Analyse l'activité des logs"""
    try:
        log_file = "/app/logs/pacha-toolbox.log"
        if not os.path.exists(log_file):
            return {"total_lines": 0, "errors": 0, "warnings": 0, "info": 0}
        
        cutoff_time = datetime.now() - timedelta(days=days)
        activity = {"total_lines": 0, "errors": 0, "warnings": 0, "info": 0}
        
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                try:
                    # Extraction basique de la date (format: YYYY-MM-DD HH:MM:SS)
                    if len(line) > 19:
                        date_str = line[:19]
                        log_time = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                        
                        if log_time >= cutoff_time:
                            activity["total_lines"] += 1
                            
                            if "ERROR" in line:
                                activity["errors"] += 1
                            elif "WARNING" in line:
                                activity["warnings"] += 1
                            elif "INFO" in line:
                                activity["info"] += 1
                except:
                    continue
        
        return activity
        
    except Exception as e:
        logger.error(f"Erreur analyse logs: {str(e)}")
        return {"total_lines": 0, "errors": 0, "warnings": 0, "info": 0}

def get_scan_statistics(days):
    """Statistiques des scans"""
    try:
        # Cette fonction pourrait être étendue pour analyser les tâches Redis
        # Pour l'instant, on retourne des statistiques basiques
        
        # Analyse des fichiers de configuration s'ils existent
        config_file = "/app/config.json"
        scan_stats = {
            "total_scans": 0,
            "successful_scans": 0,
            "failed_scans": 0,
            "average_duration": 0,
            "popular_targets": {},
            "scan_types": {}
        }
        
        # Ici on pourrait analyser les logs ou une base de données pour des stats réelles
        # Pour l'instant, on simule avec les fichiers de rapports
        reports_dir = "/app/reports"
        if os.path.exists(reports_dir):
            cutoff_time = datetime.now() - timedelta(days=days)
            
            for filename in os.listdir(reports_dir):
                filepath = os.path.join(reports_dir, filename)
                if os.path.isfile(filepath):
                    mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                    
                    if mtime >= cutoff_time:
                        scan_stats["total_scans"] += 1
                        
                        # Supposer que la présence du fichier indique un scan réussi
                        if os.path.getsize(filepath) > 0:
                            scan_stats["successful_scans"] += 1
                        else:
                            scan_stats["failed_scans"] += 1
                        
                        # Type de scan
                        scan_type = determine_file_type(filename)
                        scan_stats["scan_types"][scan_type] = scan_stats["scan_types"].get(scan_type, 0) + 1
        
        return scan_stats
        
    except Exception as e:
        logger.error(f"Erreur statistiques scans: {str(e)}")
        return {"total_scans": 0, "successful_scans": 0, "failed_scans": 0}

@dashboard_bp.route("/health", methods=["GET"])
def health_check():
    """Vérification de santé complète du système"""
    try:
        health_status = {
            "overall": "healthy",
            "components": {},
            "timestamp": datetime.now().isoformat()
        }
        
        issues = []
        
        # Vérification CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > 90:
            health_status["components"]["cpu"] = {"status": "warning", "value": cpu_percent, "message": "CPU élevé"}
            issues.append("CPU usage high")
        else:
            health_status["components"]["cpu"] = {"status": "healthy", "value": cpu_percent}
        
        # Vérification mémoire
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            health_status["components"]["memory"] = {"status": "critical", "value": memory.percent, "message": "Mémoire critique"}
            issues.append("Memory usage critical")
        elif memory.percent > 80:
            health_status["components"]["memory"] = {"status": "warning", "value": memory.percent, "message": "Mémoire élevée"}
            issues.append("Memory usage high")
        else:
            health_status["components"]["memory"] = {"status": "healthy", "value": memory.percent}
        
        # Vérification disque
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100
        if disk_percent > 95:
            health_status["components"]["disk"] = {"status": "critical", "value": disk_percent, "message": "Disque plein"}
            issues.append("Disk space critical")
        elif disk_percent > 85:
            health_status["components"]["disk"] = {"status": "warning", "value": disk_percent, "message": "Disque élevé"}
            issues.append("Disk space high")
        else:
            health_status["components"]["disk"] = {"status": "healthy", "value": disk_percent}
        
        # Vérification des services Docker
        docker_status = get_docker_services_status()
        if "error" in docker_status:
            health_status["components"]["docker"] = {"status": "error", "message": "Docker non disponible"}
            issues.append("Docker unavailable")
        else:
            down_services = [name for name, info in docker_status.items() if info.get("status") != "running"]
            if down_services:
                health_status["components"]["docker"] = {
                    "status": "warning", 
                    "message": f"Services arrêtés: {', '.join(down_services)}"
                }
                issues.append(f"Services down: {', '.join(down_services)}")
            else:
                health_status["components"]["docker"] = {"status": "healthy", "services": len(docker_status)}
        
        # Vérification des répertoires critiques
        critical_dirs = ["/app/data", "/app/reports", "/app/logs"]
        for directory in critical_dirs:
            if not os.path.exists(directory):
                health_status["components"][f"dir_{os.path.basename(directory)}"] = {
                    "status": "error", 
                    "message": f"Répertoire manquant: {directory}"
                }
                issues.append(f"Missing directory: {directory}")
            else:
                health_status["components"][f"dir_{os.path.basename(directory)}"] = {"status": "healthy"}
        
        # Statut global
        if any(comp.get("status") == "critical" for comp in health_status["components"].values()):
            health_status["overall"] = "critical"
        elif any(comp.get("status") in ["warning", "error"] for comp in health_status["components"].values()):
            health_status["overall"] = "warning"
        
        health_status["issues"] = issues
        health_status["issues_count"] = len(issues)
        
        return jsonify(health_status)
        
    except Exception as e:
        logger.error(f"Erreur health check: {str(e)}")
        return jsonify({
            "overall": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@dashboard_bp.route("/metrics", methods=["GET"])
def get_metrics():
    """Métriques détaillées pour monitoring"""
    try:
        # Métriques système étendues
        metrics = {
            "system": {
                "cpu": {
                    "percent": psutil.cpu_percent(interval=1),
                    "count": psutil.cpu_count(),
                    "load_avg": os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
                },
                "memory": dict(psutil.virtual_memory()._asdict()),
                "disk": dict(psutil.disk_usage('/')._asdict()),
                "network": dict(psutil.net_io_counters()._asdict()),
                "uptime": datetime.now() - datetime.fromtimestamp(psutil.boot_time())
            },
            "application": {
                "reports_count": count_files_in_directory("/app/reports"),
                "data_size": get_directory_size("/app/data"),
                "reports_size": get_directory_size("/app/reports"),
                "log_size": os.path.getsize("/app/logs/pacha-toolbox.log") if os.path.exists("/app/logs/pacha-toolbox.log") else 0
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Ajout des métriques Docker si disponible
        try:
            docker_metrics = get_docker_metrics()
            metrics["docker"] = docker_metrics
        except:
            metrics["docker"] = {"error": "Docker metrics unavailable"}
        
        return jsonify(metrics)
        
    except Exception as e:
        logger.error(f"Erreur métriques: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_docker_metrics():
    """Métriques Docker détaillées"""
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        
        metrics = {
            "total_containers": len(containers),
            "running_containers": len([c for c in containers if c.status == 'running']),
            "stopped_containers": len([c for c in containers if c.status == 'exited']),
            "containers": {}
        }
        
        for container in containers:
            if 'pacha-toolbox' in container.name or any(name in container.name.lower() for name in ['openvas', 'metasploit', 'postgres', 'redis']):
                try:
                    stats = container.stats(stream=False)
                    
                    # Calcul CPU
                    cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
                    system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
                    cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpu_usage']['percpu_usage']) * 100.0 if system_delta > 0 else 0
                    
                    # Mémoire
                    memory_usage = stats['memory_stats']['usage']
                    memory_limit = stats['memory_stats']['limit']
                    memory_percent = (memory_usage / memory_limit) * 100.0 if memory_limit > 0 else 0
                    
                    metrics["containers"][container.name] = {
                        "status": container.status,
                        "cpu_percent": round(cpu_percent, 2),
                        "memory_usage": memory_usage,
                        "memory_limit": memory_limit,
                        "memory_percent": round(memory_percent, 2),
                        "network_rx": stats['networks']['eth0']['rx_bytes'] if 'networks' in stats and 'eth0' in stats['networks'] else 0,
                        "network_tx": stats['networks']['eth0']['tx_bytes'] if 'networks' in stats and 'eth0' in stats['networks'] else 0
                    }
                except:
                    metrics["containers"][container.name] = {
                        "status": container.status,
                        "error": "Stats unavailable"
                    }
        
        return metrics
        
    except Exception as e:
        return {"error": f"Docker metrics error: {str(e)}"}

@dashboard_bp.route("/tools", methods=["GET"])
def get_tools_status():
    """Statut des outils de sécurité"""
    try:
        tools = {
            "nmap": check_tool_availability("nmap"),
            "masscan": check_tool_availability("masscan"),
            "tshark": check_tool_availability("tshark"),
            "wireshark": check_tool_availability("wireshark"),
            "hydra": check_tool_availability("hydra"),
            "nikto": check_tool_availability("nikto"),
            "dirb": check_tool_availability("dirb"),
            "gobuster": check_tool_availability("gobuster"),
            "sqlmap": check_tool_availability("sqlmap")
        }
        
        # Vérification spéciale pour Metasploit
        tools["metasploit"] = check_metasploit_availability()
        
        # Vérification OpenVAS
        tools["openvas"] = check_openvas_availability()
        
        available_count = sum(1 for tool in tools.values() if tool.get("available", False))
        
        return jsonify({
            "tools": tools,
            "summary": {
                "total": len(tools),
                "available": available_count,
                "unavailable": len(tools) - available_count
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur statut outils: {str(e)}")
        return jsonify({"error": str(e)}), 500

def check_tool_availability(tool_name):
    """Vérification de la disponibilité d'un outil"""
    import subprocess
    
    try:
        result = subprocess.run(
            ["which", tool_name],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            path = result.stdout.strip()
            
            # Test de version si possible
            version_info = "unknown"
            try:
                if tool_name == "nmap":
                    version_result = subprocess.run(
                        ["nmap", "--version"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if version_result.returncode == 0:
                        lines = version_result.stdout.split('\n')
                        version_info = lines[0] if lines else "unknown"
                
                elif tool_name == "tshark":
                    version_result = subprocess.run(
                        ["tshark", "--version"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if version_result.returncode == 0:
                        lines = version_result.stdout.split('\n')
                        version_info = lines[0] if lines else "unknown"
                
                elif tool_name in ["masscan", "hydra", "nikto"]:
                    version_result = subprocess.run(
                        [tool_name, "--help"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    # Pour ces outils, juste confirmer qu'ils répondent
                    version_info = "available"
                    
            except:
                version_info = "available"
            
            return {
                "available": True,
                "path": path,
                "version": version_info
            }
        else:
            return {
                "available": False,
                "error": "Tool not found in PATH"
            }
            
    except subprocess.TimeoutExpired:
        return {
            "available": False,
            "error": "Timeout checking tool"
        }
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }

def check_metasploit_availability():
    """Vérification spéciale pour Metasploit"""
    try:
        # Vérification via Docker
        client = docker.from_env()
        containers = client.containers.list(all=True)
        
        metasploit_container = None
        for container in containers:
            if 'metasploit' in container.name.lower():
                metasploit_container = container
                break
        
        if metasploit_container:
            return {
                "available": True,
                "method": "docker",
                "container_status": metasploit_container.status,
                "container_name": metasploit_container.name
            }
        else:
            # Vérification locale
            import subprocess
            result = subprocess.run(
                ["which", "msfconsole"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                return {
                    "available": True,
                    "method": "local",
                    "path": result.stdout.strip()
                }
            else:
                return {
                    "available": False,
                    "error": "Metasploit not found"
                }
                
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }

def check_openvas_availability():
    """Vérification de la disponibilité d'OpenVAS"""
    try:
        # Vérification via Docker
        client = docker.from_env()
        containers = client.containers.list(all=True)
        
        openvas_container = None
        for container in containers:
            if 'openvas' in container.name.lower():
                openvas_container = container
                break
        
        if openvas_container:
            # Test de connectivité
            import requests
            try:
                response = requests.get(
                    "http://openvas:9392",
                    timeout=5
                )
                service_available = True
            except:
                service_available = False
            
            return {
                "available": True,
                "method": "docker",
                "container_status": openvas_container.status,
                "container_name": openvas_container.name,
                "service_reachable": service_available
            }
        else:
            return {
                "available": False,
                "error": "OpenVAS container not found"
            }
            
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }