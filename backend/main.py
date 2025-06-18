#!/usr/bin/env python3
"""
Pacha Toolbox Backend v2.1 - Version développement local
Backend unifié avec multi-threading intégré - chemins corrigés
"""

import os
import sys
import json
import uuid
import signal
import time
import threading
import subprocess
import requests
import logging
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# ==================== CONFIGURATION DÉVELOPPEMENT ====================

# Obtenir le répertoire de base du projet
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)  # Dossier parent (pacha-toolbox)

# Configuration des répertoires pour développement local
DIRECTORIES = {
    'reports': os.path.join(PROJECT_ROOT, 'data', 'reports'),
    'reports_pdf': os.path.join(PROJECT_ROOT, 'data', 'reports', 'pdf'),
    'logs': os.path.join(PROJECT_ROOT, 'data', 'logs'),
    'data': os.path.join(PROJECT_ROOT, 'data'),
    'temp': os.path.join(PROJECT_ROOT, 'data', 'temp')
}

# Créer l'application Flask
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max

# ==================== LOGGING ====================

class Logger:
    @staticmethod
    def info(msg):
        print(f"[INFO] {datetime.now().strftime('%H:%M:%S')} {msg}")
    
    @staticmethod
    def error(msg):
        print(f"[ERROR] {datetime.now().strftime('%H:%M:%S')} {msg}")
    
    @staticmethod
    def warning(msg):
        print(f"[WARNING] {datetime.now().strftime('%H:%M:%S')} {msg}")

logger = Logger()

# ==================== MULTI-THREADING INTÉGRÉ ====================

class PachaTaskManager:
    """Gestionnaire de tâches multi-threading intégré"""
    
    def __init__(self, max_workers=8):
        self.max_workers = max_workers
        self.active_tasks = {}
        self.completed_tasks = {}
        self.task_counter = 1
        self._lock = threading.RLock()
        
        logger.info(f"🎯 TaskManager initialisé avec {max_workers} workers")
    
    def create_scan_task(self, tool, target, scan_type='basic', priority='normal'):
        """Créer une tâche de scan"""
        task_id = f"{tool}_{self.task_counter:04d}"
        self.task_counter += 1
        
        task = {
            'id': task_id,
            'tool': tool,
            'target': target,
            'scan_type': scan_type,
            'priority': priority,
            'status': 'queued',
            'created_at': datetime.now().isoformat(),
            'progress': 0,
            'output': [],
            'result': None
        }
        
        with self._lock:
            self.active_tasks[task_id] = task
        
        # Démarrer l'exécution en arrière-plan
        thread = threading.Thread(target=self._execute_scan_task, args=(task,), daemon=True)
        thread.start()
        
        return task_id
    
    def create_exploit_task(self, module, target, payload, **kwargs):
        """Créer une tâche d'exploit"""
        task_id = f"exploit_{self.task_counter:04d}"
        self.task_counter += 1
        
        task = {
            'id': task_id,
            'type': 'exploit',
            'module': module,
            'target': target,
            'payload': payload,
            'status': 'queued',
            'created_at': datetime.now().isoformat(),
            'progress': 0,
            'output': [],
            'metadata': kwargs
        }
        
        with self._lock:
            self.active_tasks[task_id] = task
        
        thread = threading.Thread(target=self._execute_exploit_task, args=(task,), daemon=True)
        thread.start()
        
        return task_id
    
    def create_hydra_task(self, target, service, username=None, **kwargs):
        """Créer une tâche Hydra"""
        task_id = f"hydra_{self.task_counter:04d}"
        self.task_counter += 1
        
        task = {
            'id': task_id,
            'type': 'hydra',
            'target': target,
            'service': service,
            'username': username,
            'status': 'queued',
            'created_at': datetime.now().isoformat(),
            'progress': 0,
            'output': [],
            'credentials': [],
            'metadata': kwargs
        }
        
        with self._lock:
            self.active_tasks[task_id] = task
        
        thread = threading.Thread(target=self._execute_hydra_task, args=(task,), daemon=True)
        thread.start()
        
        return task_id
    
    def _execute_scan_task(self, task):
        """Exécuter une tâche de scan"""
        task['status'] = 'running'
        task['started_at'] = datetime.now().isoformat()
        
        try:
            tool = task['tool']
            target = task['target']
            scan_type = task['scan_type']
            
            logger.info(f"🚀 Démarrage scan {tool}: {target}")
            
            # Phases de simulation réalistes
            phases = self._get_scan_phases(tool)
            
            for i, (phase, progress) in enumerate(phases):
                if task['status'] == 'cancelled':
                    break
                
                task['progress'] = progress
                message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}"
                task['output'].append(message)
                
                # Délai réaliste
                time.sleep(random.uniform(0.5, 2))
            
            # Résultats simulés
            if task['status'] != 'cancelled':
                task['result'] = self._generate_scan_results(tool, target)
                task['status'] = 'completed'
                task['progress'] = 100
            
        except Exception as e:
            task['status'] = 'failed'
            task['error'] = str(e)
            logger.error(f"❌ Erreur scan {task['id']}: {e}")
        
        finally:
            task['completed_at'] = datetime.now().isoformat()
            self._move_to_completed(task['id'])
    
    def _execute_exploit_task(self, task):
        """Exécuter une tâche d'exploit"""
        task['status'] = 'running'
        task['started_at'] = datetime.now().isoformat()
        
        try:
            module = task['module']
            target = task['target']
            
            logger.info(f"🎯 Démarrage exploit {module}: {target}")
            
            phases = [
                ("Loading exploit module", 15),
                ("Setting payload", 30),
                ("Targeting system", 50),
                ("Launching exploit", 75),
                ("Checking for session", 90),
                ("Exploit completed", 100)
            ]
            
            session_created = False
            
            for phase, progress in phases:
                if task['status'] == 'cancelled':
                    break
                
                task['progress'] = progress
                message = f"[{datetime.now().strftime('%H:%M:%S')}] [*] {phase}"
                task['output'].append(message)
                
                # Simulation de succès (60% de chance)
                if "Launching exploit" in phase:
                    if random.random() > 0.4:
                        session_created = True
                        session_msg = f"[{datetime.now().strftime('%H:%M:%S')}] [+] Session opened successfully!"
                        task['output'].append(session_msg)
                        
                        # Créer une session globale
                        global metasploit_sessions
                        session = {
                            'id': len(metasploit_sessions) + 1,
                            'target': target,
                            'type': 'shell',
                            'exploit_used': module,
                            'opened_at': datetime.now().isoformat(),
                            'status': 'active'
                        }
                        metasploit_sessions.append(session)
                        task['session_id'] = session['id']
                
                time.sleep(random.uniform(0.5, 1.5))
            
            if task['status'] != 'cancelled':
                task['result'] = {
                    'success': session_created,
                    'session_created': session_created,
                    'target': target,
                    'module': module
                }
                task['status'] = 'completed'
            
        except Exception as e:
            task['status'] = 'failed'
            task['error'] = str(e)
            logger.error(f"❌ Erreur exploit {task['id']}: {e}")
        
        finally:
            task['completed_at'] = datetime.now().isoformat()
            self._move_to_completed(task['id'])
    
    def _execute_hydra_task(self, task):
        """Exécuter une tâche Hydra"""
        task['status'] = 'running'
        task['started_at'] = datetime.now().isoformat()
        
        try:
            target = task['target']
            service = task['service']
            
            logger.info(f"🔓 Démarrage Hydra {service}: {target}")
            
            phases = [
                ("Starting Hydra", 10),
                ("Loading wordlist", 25),
                ("Testing credentials", 70),
                ("Analyzing results", 90),
                ("Attack completed", 100)
            ]
            
            for phase, progress in phases:
                if task['status'] == 'cancelled':
                    break
                
                task['progress'] = progress
                message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}..."
                task['output'].append(message)
                
                time.sleep(random.uniform(0.5, 1.5))
            
            # Simulation de découverte (25% de chance)
            if task['status'] != 'cancelled' and random.random() > 0.75:
                username = task['username'] or 'admin'
                password = random.choice(['password', '123456', 'admin', 'test'])
                
                credential = {
                    'username': username,
                    'password': password,
                    'service': service,
                    'target': target
                }
                task['credentials'].append(credential)
                
                success_msg = f"[{datetime.now().strftime('%H:%M:%S')}] [+] Found: {username}:{password}"
                task['output'].append(success_msg)
            
            if task['status'] != 'cancelled':
                task['result'] = {
                    'credentials_found': len(task['credentials']) > 0,
                    'credentials': task['credentials'],
                    'target': target,
                    'service': service
                }
                task['status'] = 'completed'
            
        except Exception as e:
            task['status'] = 'failed'
            task['error'] = str(e)
            logger.error(f"❌ Erreur Hydra {task['id']}: {e}")
        
        finally:
            task['completed_at'] = datetime.now().isoformat()
            self._move_to_completed(task['id'])
    
    def _get_scan_phases(self, tool):
        """Récupérer les phases de scan selon l'outil"""
        if tool == 'nmap':
            return [
                ("Initializing Nmap", 10),
                ("Host discovery", 25),
                ("Port scanning", 60),
                ("Service detection", 80),
                ("Script scanning", 95),
                ("Scan completed", 100)
            ]
        elif tool == 'nikto':
            return [
                ("Starting Nikto", 10),
                ("Testing server", 30),
                ("Checking vulnerabilities", 70),
                ("Analyzing results", 90),
                ("Scan completed", 100)
            ]
        else:
            return [
                ("Initializing", 25),
                ("Scanning", 75),
                ("Completed", 100)
            ]
    
    def _generate_scan_results(self, tool, target):
        """Générer des résultats de scan simulés"""
        if tool == 'nmap':
            ports = random.sample([22, 80, 443, 8080, 21, 25, 53, 3389], random.randint(2, 5))
            return {
                'tool': 'nmap',
                'target': target,
                'ports_found': len(ports),
                'open_ports': ports,
                'services': {str(p): f"service-{p}" for p in ports}
            }
        elif tool == 'nikto':
            vulns = random.randint(0, 5)
            return {
                'tool': 'nikto',
                'target': target,
                'vulnerabilities_found': vulns,
                'security_issues': [f"Issue {i+1}" for i in range(vulns)]
            }
        else:
            return {'tool': tool, 'target': target, 'completed': True}
    
    def _move_to_completed(self, task_id):
        """Déplacer une tâche vers completed"""
        with self._lock:
            if task_id in self.active_tasks:
                task = self.active_tasks.pop(task_id)
                self.completed_tasks[task_id] = task
    
    def get_task_status(self, task_id):
        """Récupérer le statut d'une tâche"""
        with self._lock:
            if task_id in self.active_tasks:
                return self.active_tasks[task_id]
            if task_id in self.completed_tasks:
                return self.completed_tasks[task_id]
        return None
    
    def get_active_tasks(self):
        """Récupérer toutes les tâches actives"""
        with self._lock:
            return list(self.active_tasks.values())
    
    def get_completed_tasks(self, limit=10):
        """Récupérer les tâches complétées"""
        with self._lock:
            tasks = list(self.completed_tasks.values())
            tasks.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
            return tasks[:limit]
    
    def cancel_task(self, task_id):
        """Annuler une tâche"""
        with self._lock:
            if task_id in self.active_tasks:
                self.active_tasks[task_id]['status'] = 'cancelled'
                logger.info(f"🚫 Tâche {task_id} annulée")
                return True
        return False
    
    def get_statistics(self):
        """Obtenir les statistiques"""
        with self._lock:
            active_count = len(self.active_tasks)
            completed_count = len(self.completed_tasks)
            failed_count = len([t for t in self.completed_tasks.values() if t.get('status') == 'failed'])
        
        return {
            'active_tasks': active_count,
            'completed_tasks': completed_count,
            'failed_tasks': failed_count,
            'success_rate': ((completed_count - failed_count) / max(completed_count, 1)) * 100,
            'max_workers': self.max_workers
        }

# Initialiser le gestionnaire de tâches
task_manager = PachaTaskManager(max_workers=8)

# Ajouter au contexte Flask
app.task_manager = task_manager
app.create_threaded_scan = task_manager.create_scan_task
app.create_threaded_exploit = task_manager.create_exploit_task
app.create_threaded_attack = task_manager.create_hydra_task
app.get_threaded_task_status = task_manager.get_task_status

logger.info("🔥 Multi-threading intégré activé!")

# ==================== INITIALISATION ====================

def ensure_directories():
    """Créer tous les répertoires nécessaires (version sécurisée)"""
    for name, path in DIRECTORIES.items():
        try:
            if not os.path.exists(path):
                os.makedirs(path, exist_ok=True)
                logger.info(f"📁 Directory created: {path}")
        except PermissionError:
            # Créer dans un dossier temporaire si permission refusée
            temp_path = os.path.join(os.path.expanduser("~"), f"pacha-toolbox-{name}")
            if not os.path.exists(temp_path):
                os.makedirs(temp_path, exist_ok=True)
                DIRECTORIES[name] = temp_path
                logger.warning(f"⚠️ Permission denied for {path}, using {temp_path}")

ensure_directories()

# Variables globales
scan_history = []
active_scans = {}
scan_outputs = {}
metasploit_sessions = []
active_exploits = {}
exploit_outputs = {}
hydra_attacks = {}
hydra_counter = 1

# ==================== BASE DE DONNÉES D'EXPLOITS ====================

METASPLOITABLE_EXPLOITS = [
    {
        'name': 'samba_usermap_script',
        'module': 'exploit/multi/samba/usermap_script',
        'description': 'Samba "username map script" Command Execution',
        'platform': 'Linux',
        'targets': ['Metasploitable', 'Samba 3.0.20-3.0.25rc3'],
        'rank': 'Excellent',
        'defaultPort': 139,
        'category': 'Remote',
        'cve': ['CVE-2007-2447'],
        'difficulty': 'Easy',
        'reliability': 'Excellent',
        'payloads': ['cmd/unix/reverse', 'cmd/unix/reverse_netcat', 'cmd/unix/bind_netcat'],
        'color': '#22c55e'
    },
    {
        'name': 'vsftpd_234_backdoor',
        'module': 'exploit/unix/ftp/vsftpd_234_backdoor',
        'description': 'VSFTPD v2.3.4 Backdoor Command Execution',
        'platform': 'Linux',
        'targets': ['VSFTPD 2.3.4'],
        'rank': 'Excellent',
        'defaultPort': 21,
        'category': 'Remote',
        'cve': ['CVE-2011-2523'],
        'difficulty': 'Easy',
        'reliability': 'Excellent',
        'payloads': ['cmd/unix/interact', 'cmd/unix/reverse', 'cmd/unix/reverse_netcat'],
        'color': '#3b82f6'
    },
    {
        'name': 'unreal_ircd_3281_backdoor',
        'module': 'exploit/unix/irc/unreal_ircd_3281_backdoor',
        'description': 'UnrealIRCd 3.2.8.1 Backdoor Command Execution',
        'platform': 'Linux',
        'targets': ['UnrealIRCd 3.2.8.1'],
        'rank': 'Excellent',
        'defaultPort': 6667,
        'category': 'Remote',
        'cve': ['CVE-2010-2075'],
        'difficulty': 'Easy',
        'reliability': 'Excellent',
        'payloads': ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat'],
        'color': '#8b5cf6'
    },
    {
        'name': 'distcc_exec',
        'module': 'exploit/unix/misc/distcc_exec',
        'description': 'DistCC Daemon Command Execution',
        'platform': 'Linux',
        'targets': ['DistCC Daemon'],
        'rank': 'Excellent',
        'defaultPort': 3632,
        'category': 'Remote',
        'cve': ['CVE-2004-2687'],
        'difficulty': 'Easy',
        'reliability': 'Excellent',
        'payloads': ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat'],
        'color': '#f59e0b'
    }
]

# ==================== ROUTES DE BASE ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'message': 'Pacha Toolbox API operational (Development Mode)',
        'version': '2.1.0-dev',
        'timestamp': datetime.now().isoformat(),
        'active_scans': len(active_scans),
        'threading_enabled': True,
        'threading_stats': task_manager.get_statistics(),
        'directories_ok': all(os.path.exists(path) for path in DIRECTORIES.values()),
        'base_dir': BASE_DIR,
        'project_root': PROJECT_ROOT
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Statut complet de l'API"""
    try:
        threading_stats = task_manager.get_statistics()
        
        return jsonify({
            'api_version': '2.1.0-dev',
            'status': 'operational',
            'mode': 'development',
            'active_scans': len(active_scans),
            'scan_history_count': len(scan_history),
            'active_metasploit_sessions': len(metasploit_sessions),
            'threading_enabled': True,
            'threading_stats': threading_stats,
            'directories': {name: os.path.exists(path) for name, path in DIRECTORIES.items()},
            'available_tools': ['nmap', 'nikto', 'metasploit', 'hydra'],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Error getting status: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES SCAN ====================

@app.route('/api/scan/start', methods=['POST'])
def start_scan():
    """Démarrer un nouveau scan avec multi-threading"""
    try:
        data = request.get_json() or {}
        tool = data.get('tool', 'nmap')
        target = data.get('target', '')
        scan_type = data.get('scanType', data.get('scan_type', 'basic'))
        
        if not target:
            return jsonify({'error': 'Target is required'}), 400
        
        # Validation pour Nikto
        if tool == 'nikto':
            if not (target.startswith('http://') or target.startswith('https://')):
                return jsonify({'error': 'Nikto requires HTTP/HTTPS URL'}), 400
        elif tool == 'nmap':
            if target.startswith(('http://', 'https://')):
                target = target.replace('http://', '').replace('https://', '').split('/')[0]
        
        # Mode threadé (par défaut)
        try:
            task_id = task_manager.create_scan_task(tool, target, scan_type)
            
            return jsonify({
                'scan_id': task_id,
                'task_id': task_id,
                'tool': tool,
                'target': target,
                'scan_type': scan_type,
                'status': 'queued',
                'message': f'{tool} scan started with threading',
                'threaded': True,
                'monitor_url': f'/api/threading/task/{task_id}/status'
            })
        except Exception as e:
            logger.error(f"❌ Threading error: {e}")
            return jsonify({'error': f'Threading failed: {str(e)}'}), 500
        
    except Exception as e:
        logger.error(f"❌ Error starting scan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/status/<scan_id>', methods=['GET'])
def get_scan_status(scan_id):
    """Récupérer le statut d'un scan"""
    # Mode threadé
    task_status = task_manager.get_task_status(scan_id)
    if task_status:
        return jsonify(task_status)
    
    return jsonify({'error': 'Scan not found'}), 404

@app.route('/api/scan/active', methods=['GET'])
def get_active_scans():
    """Récupérer tous les scans actifs"""
    threaded_scans = [task for task in task_manager.get_active_tasks() if task.get('tool')]
    
    return jsonify({
        'threaded_scans': threaded_scans,
        'total_active': len(threaded_scans)
    })

@app.route('/api/scan/history', methods=['GET'])
def get_scan_history():
    """Récupérer l'historique des scans"""
    threaded_history = task_manager.get_completed_tasks(20)
    
    return jsonify({
        'threaded_history': threaded_history,
        'total_completed': len(task_manager.completed_tasks)
    })

# ==================== ROUTES THREADING ====================

@app.route('/api/threading/info', methods=['GET'])
def threading_info():
    """Information sur le multi-threading"""
    stats = task_manager.get_statistics()
    return jsonify({
        'threading_enabled': True,
        'mode': 'integrated',
        'stats': stats,
        'features': [
            'Scans parallèles',
            'Exploits threadés', 
            'Attaques Hydra parallèles',
            'Annulation de tâches',
            'Monitoring en temps réel'
        ]
    })

@app.route('/api/threading/tasks', methods=['GET'])
def get_threading_tasks():
    """Liste des tâches threadées"""
    active = task_manager.get_active_tasks()
    completed = task_manager.get_completed_tasks(10)
    
    return jsonify({
        'active_tasks': active,
        'completed_tasks': completed,
        'total_active': len(active),
        'total_completed': len(task_manager.completed_tasks)
    })

@app.route('/api/threading/task/<task_id>/status', methods=['GET'])
def get_threaded_task_status(task_id):
    """Statut d'une tâche threadée"""
    status = task_manager.get_task_status(task_id)
    if status:
        return jsonify(status)
    else:
        return jsonify({'error': 'Task not found'}), 404

@app.route('/api/threading/task/<task_id>/cancel', methods=['POST'])
def cancel_threaded_task(task_id):
    """Annuler une tâche threadée"""
    if task_manager.cancel_task(task_id):
        return jsonify({'message': f'Task {task_id} cancelled', 'success': True})
    else:
        return jsonify({'error': 'Task not found or already completed'}), 404

@app.route('/api/threading/dashboard', methods=['GET'])
def threading_dashboard():
    """Dashboard du multi-threading"""
    try:
        stats = task_manager.get_statistics()
        active_tasks = task_manager.get_active_tasks()
        completed_tasks = task_manager.get_completed_tasks(5)
        
        return jsonify({
            'threading_enabled': True,
            'stats': stats,
            'active_tasks_count': len(active_tasks),
            'active_tasks_detail': active_tasks,
            'recent_completed': completed_tasks,
            'performance': {
                'total_processed': stats.get('completed_tasks', 0),
                'success_rate': stats.get('success_rate', 0),
                'current_throughput': len(active_tasks)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES METASPLOIT ====================

@app.route('/api/metasploit/exploits', methods=['GET'])
def get_metasploitable_exploits():
    """Liste des exploits Metasploit disponibles"""
    try:
        search = request.args.get('search', '').lower()
        platform = request.args.get('platform', '').lower()
        
        exploits = METASPLOITABLE_EXPLOITS.copy()
        
        if search:
            exploits = [e for e in exploits if 
                       search in e['name'].lower() or 
                       search in e['description'].lower()]
        
        if platform:
            exploits = [e for e in exploits if platform in e['platform'].lower()]
        
        return jsonify({
            'exploits': exploits,
            'total': len(exploits)
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting exploits: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metasploit/exploit', methods=['POST'])
def start_metasploitable_exploit():
    """Lancer un exploit Metasploit"""
    try:
        data = request.get_json() or {}
        
        module = data.get('module', '')
        payload = data.get('payload', '')
        target = data.get('target', '')
        
        if not all([module, payload, target]):
            return jsonify({'error': 'Module, payload et target requis'}), 400
        
        # Mode threadé
        task_id = task_manager.create_exploit_task(
            module=module,
            target=target,
            payload=payload,
            lhost=data.get('lhost', '127.0.0.1'),
            lport=data.get('lport', '4444'),
            port=data.get('port', '445')
        )
        
        return jsonify({
            'exploit_id': task_id,
            'task_id': task_id,
            'status': 'queued',
            'message': f'Exploit {module} queued against {target}',
            'threaded': True,
            'monitor_url': f'/api/threading/task/{task_id}/status'
        })
        
    except Exception as e:
        logger.error(f"❌ Error starting exploit: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metasploit/sessions', methods=['GET'])
def get_metasploit_sessions():
    """Liste des sessions Metasploit actives"""
    try:
        return jsonify({
            'sessions': metasploit_sessions,
            'total_sessions': len(metasploit_sessions)
        })
    except Exception as e:
        logger.error(f"❌ Error getting sessions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metasploit/status', methods=['GET'])
def get_metasploit_status():
    """Statut général de Metasploit"""
    try:
        threaded_exploits = len([t for t in task_manager.get_active_tasks() if t.get('type') == 'exploit'])
        
        return jsonify({
            'metasploit_available': True,
            'active_exploits': threaded_exploits,
            'active_sessions': len(metasploit_sessions),
            'total_exploits_available': len(METASPLOITABLE_EXPLOITS),
            'version': 'Metasploit Framework 6.3.x (Simulation + Threading)',
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting Metasploit status: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES HYDRA ====================

@app.route('/api/hydra/attack', methods=['POST'])
def launch_hydra_attack():
    """Lancer une nouvelle attaque Hydra"""
    try:
        data = request.get_json()
        
        required_fields = ['target', 'service']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'status': 'error',
                    'message': f'Champ requis manquant: {field}'
                }), 400
        
        # Mode threadé
        task_id = task_manager.create_hydra_task(
            target=data['target'],
            service=data['service'],
            username=data.get('username'),
            port=data.get('port', '22'),
            threads=data.get('threads', '4'),
            timeout=data.get('timeout', '30')
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Attaque Hydra threadée lancée',
            'attack_id': task_id,
            'task_id': task_id,
            'target': data['target'],
            'service': data['service'],
            'threaded': True,
            'monitor_url': f'/api/threading/task/{task_id}/status'
        })
        
    except Exception as e:
        logger.error(f"❌ Error launching Hydra attack: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/hydra/status', methods=['GET'])
def get_hydra_status():
    """Statut général de Hydra"""
    try:
        threaded_active = len([t for t in task_manager.get_active_tasks() if t.get('type') == 'hydra'])
        threaded_completed = len([t for t in task_manager.get_completed_tasks() if t.get('type') == 'hydra'])
        
        return jsonify({
            'hydra_available': True,
            'active_attacks': threaded_active,
            'total_attacks': threaded_completed + threaded_active,
            'completed_attacks': threaded_completed,
            'version': 'THC Hydra v9.4 (Simulation + Threading)',
            'last_updated': datetime.now().isoformat(),
            'supported_services': ['ssh', 'ftp', 'telnet', 'http-get', 'rdp', 'smb']
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting Hydra status: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES RAPPORTS ====================

@app.route('/api/reports/test', methods=['GET'])
def test_reports():
    """Test endpoint pour les rapports"""
    try:
        threading_stats = task_manager.get_statistics()
        
        report_content = f"""
        <html>
        <head><title>Pacha Toolbox Report</title></head>
        <body>
            <h1>Pacha Toolbox Development Report</h1>
            <p>Generated at: {datetime.now().isoformat()}</p>
            <p>Version: 2.1.0-dev</p>
            <p>Base Directory: {BASE_DIR}</p>
            
            <h2>Threading Status</h2>
            <ul>
                <li>Active tasks: {threading_stats['active_tasks']}</li>
                <li>Completed tasks: {threading_stats['completed_tasks']}</li>
                <li>Success rate: {threading_stats['success_rate']:.1f}%</li>
                <li>Max workers: {threading_stats['max_workers']}</li>
            </ul>
            
            <h2>Directories</h2>
            <ul>
                {''.join([f"<li>{name}: {path} ({'✓' if os.path.exists(path) else '✗'})</li>" for name, path in DIRECTORIES.items()])}
            </ul>
        </body>
        </html>
        """
        
        filename = f"test_report_{int(time.time())}.html"
        filepath = os.path.join(DIRECTORIES['reports'], filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        return jsonify({
            'status': 'success',
            'message': 'Test report created',
            'filename': filename,
            'path': filepath,
            'download_url': f'/api/reports/download/{filename}'
        })
        
    except Exception as e:
        logger.error(f"❌ Error creating test report: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Reports module error',
            'error': str(e)
        }), 500

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste de tous les rapports disponibles"""
    try:
        reports_dir = DIRECTORIES['reports']
        if not os.path.exists(reports_dir):
            return jsonify({'reports': []})
        
        reports = []
        for filename in os.listdir(reports_dir):
            if filename.endswith(('.html', '.pdf', '.txt')):
                filepath = os.path.join(reports_dir, filename)
                stat = os.stat(filepath)
                reports.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'download_url': f'/api/reports/download/{filename}'
                })
        
        return jsonify({
            'reports': sorted(reports, key=lambda x: x['modified'], reverse=True)
        })
        
    except Exception as e:
        logger.error(f"❌ Error listing reports: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES SYSTÈME ====================

@app.route('/api/system/info', methods=['GET'])
def get_system_info():
    """Informations système"""
    try:
        threading_stats = task_manager.get_statistics()
        
        return jsonify({
            'version': '2.1.0-dev',
            'mode': 'development',
            'threading_enabled': True,
            'threading_stats': threading_stats,
            'python_version': sys.version,
            'base_directory': BASE_DIR,
            'project_root': PROJECT_ROOT,
            'directories': DIRECTORIES,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting system info: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== GESTIONNAIRES D'ERREURS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Check the API URL',
        'mode': 'development',
        'available_endpoints': [
            '/api/health',
            '/api/status',
            '/api/scan/start',
            '/api/scan/status/<scan_id>',
            '/api/scan/active',
            '/api/scan/history',
            '/api/threading/info',
            '/api/threading/tasks',
            '/api/threading/dashboard',
            '/api/metasploit/exploits',
            '/api/metasploit/exploit',
            '/api/metasploit/sessions',
            '/api/hydra/attack',
            '/api/hydra/status',
            '/api/reports/test',
            '/api/reports/list',
            '/api/system/info'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred',
        'mode': 'development'
    }), 500

# ==================== GESTIONNAIRE DE SIGNAUX ====================

def signal_handler(sig, frame):
    logger.info("🛑 Server shutdown requested")
    try:
        for task in task_manager.get_active_tasks():
            task_manager.cancel_task(task['id'])
        logger.info("🧹 Task manager cleaned up")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ==================== DÉMARRAGE ====================

if __name__ == "__main__":
    logger.info("🚀 Starting Pacha Toolbox Backend v2.1 (Development Mode)")
    logger.info("🌐 CORS configured for localhost:3000")
    logger.info(f"📁 Base directory: {BASE_DIR}")
    logger.info(f"📂 Project root: {PROJECT_ROOT}")
    logger.info(f"🗂️ Data directories: {DIRECTORIES}")
    logger.info(f"🔧 Metasploit exploits available: {len(METASPLOITABLE_EXPLOITS)}")
    logger.info("🔥 Multi-threading intégré et opérationnel")
    
    # Afficher les statistiques de démarrage
    threading_stats = task_manager.get_statistics()
    logger.info(f"🎯 Task Manager: {threading_stats['max_workers']} workers prêts")
    
    # Informations importantes pour le développement
    logger.info("✨ Mode développement actif:")
    logger.info("   - Chemins relatifs configurés")
    logger.info("   - Permissions gérées automatiquement")
    logger.info("   - Multi-threading intégré")
    logger.info("   - Simulation complète des outils")
    logger.info("   - API complète disponible")
    
    # Test des dépendances
    try:
        logger.info("🔍 Checking dependencies...")
        logger.info(f"   - Flask: {Flask.__version__}")
        logger.info(f"   - Python: {sys.version.split()[0]}")
        logger.info("   ✅ All dependencies OK")
    except Exception as e:
        logger.error(f"   ❌ Dependency check failed: {e}")
    
    try:
        app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
    except Exception as e:
        logger.error(f"❌ Server startup error: {e}")
        sys.exit(1)