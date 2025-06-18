# backend/app/utils/standalone_task_manager.py
"""
Gestionnaire de tâches multi-threading standalone
Version autonome sans dépendances externes pour intégration simple
"""

import uuid
import threading
import time
import logging
import signal
import subprocess
import os
import random
import json
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from queue import Queue, PriorityQueue, Empty
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any, Union

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    """États possibles d'une tâche"""
    PENDING = "pending"
    QUEUED = "queued" 
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"
    RETRYING = "retrying"

class TaskPriority(Enum):
    """Priorités des tâches"""
    CRITICAL = 0
    HIGH = 1
    NORMAL = 2
    LOW = 3

class TaskType(Enum):
    """Types de tâches"""
    NMAP_SCAN = "nmap_scan"
    NIKTO_SCAN = "nikto_scan"
    METASPLOIT_EXPLOIT = "metasploit_exploit"
    HYDRA_ATTACK = "hydra_attack"
    CUSTOM = "custom"

@dataclass
class Task:
    """Tâche autonome"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    task_type: TaskType = TaskType.CUSTOM
    function: Optional[Callable] = None
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    priority: TaskPriority = TaskPriority.NORMAL
    timeout: Optional[float] = 300
    max_retries: int = 2
    retry_count: int = 0
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Any = None
    error: Optional[str] = None
    progress: float = 0.0
    metadata: dict = field(default_factory=dict)
    
    # Champs compatibilité
    tool: Optional[str] = None
    target: Optional[str] = None
    scan_type: Optional[str] = None
    output: List[str] = field(default_factory=list)
    pid: Optional[int] = None
    
    def __lt__(self, other):
        if self.priority.value != other.priority.value:
            return self.priority.value < other.priority.value
        return self.created_at < other.created_at
    
    def to_legacy_format(self) -> dict:
        return {
            'scan_id': self.id,
            'task_id': self.id,
            'tool': self.tool or self.task_type.value,
            'target': self.target,
            'scan_type': self.scan_type,
            'status': self.status.value,
            'start_time': self.started_at.isoformat() if self.started_at else None,
            'end_time': self.completed_at.isoformat() if self.completed_at else None,
            'output': self.output,
            'progress': self.progress,
            'error': self.error,
            'metadata': self.metadata,
            'pid': self.pid
        }

class StandaloneTaskManager:
    """Gestionnaire de tâches autonome et robuste"""
    
    def __init__(self, max_workers: int = 8):
        self.max_workers = min(max_workers, os.cpu_count() or 4)
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers, thread_name_prefix="TaskWorker")
        
        self.task_queue = PriorityQueue()
        self.active_tasks: Dict[str, Task] = {}
        self.completed_tasks: Dict[str, Task] = {}
        self.task_futures: Dict[str, Future] = {}
        
        self._running = True
        self._tasks_lock = threading.RLock()
        
        # Démarrer le dispatcher
        self._dispatcher_thread = threading.Thread(target=self._dispatch_loop, daemon=True)
        self._dispatcher_thread.start()
        
        # Démarrer le nettoyage
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()
        
        logger.info(f"🚀 StandaloneTaskManager initialisé avec {self.max_workers} workers")
    
    def submit_task(self, task: Task) -> str:
        """Soumettre une tâche"""
        if not self._running:
            raise RuntimeError("TaskManager is shutting down")
        
        task.status = TaskStatus.QUEUED
        
        with self._tasks_lock:
            self.active_tasks[task.id] = task
        
        self.task_queue.put(task)
        logger.info(f"📝 Tâche {task.id} ({task.task_type.value}) soumise")
        
        return task.id
    
    def create_scan_task(self, tool: str, target: str, scan_type: str = "basic", 
                        priority: TaskPriority = TaskPriority.NORMAL, **kwargs) -> str:
        """Créer une tâche de scan"""
        task_type_map = {
            'nmap': TaskType.NMAP_SCAN,
            'nikto': TaskType.NIKTO_SCAN
        }
        
        task = Task(
            name=f"{tool} scan of {target}",
            task_type=task_type_map.get(tool, TaskType.CUSTOM),
            tool=tool,
            target=target,
            scan_type=scan_type,
            priority=priority,
            timeout=kwargs.get('timeout', 600),
            metadata={
                'tool': tool,
                'target': target,
                'scan_type': scan_type,
                **kwargs
            }
        )
        
        return self.submit_task(task)
    
    def create_exploit_task(self, module: str, target: str, payload: str,
                          priority: TaskPriority = TaskPriority.HIGH, **kwargs) -> str:
        """Créer une tâche d'exploit"""
        task = Task(
            name=f"Exploit {module} on {target}",
            task_type=TaskType.METASPLOIT_EXPLOIT,
            tool="metasploit",
            target=target,
            priority=priority,
            timeout=kwargs.get('timeout', 300),
            metadata={
                'module': module,
                'payload': payload,
                'target': target,
                **kwargs
            }
        )
        
        return self.submit_task(task)
    
    def create_hydra_task(self, target: str, service: str, username: str = None,
                         priority: TaskPriority = TaskPriority.NORMAL, **kwargs) -> str:
        """Créer une tâche Hydra"""
        task = Task(
            name=f"Hydra attack on {target}:{service}",
            task_type=TaskType.HYDRA_ATTACK,
            tool="hydra",
            target=target,
            priority=priority,
            timeout=kwargs.get('timeout', 600),
            metadata={
                'service': service,
                'username': username,
                'target': target,
                **kwargs
            }
        )
        
        return self.submit_task(task)
    
    def _dispatch_loop(self):
        """Boucle de dispatch des tâches"""
        logger.info("🎯 Task dispatcher started")
        
        while self._running:
            try:
                try:
                    task = self.task_queue.get(timeout=1.0)
                except Empty:
                    continue
                
                # Soumettre la tâche au thread pool
                future = self.executor.submit(self._execute_task, task)
                
                with self._tasks_lock:
                    self.task_futures[task.id] = future
                
                self.task_queue.task_done()
                
            except Exception as e:
                logger.error(f"Erreur dans dispatch loop: {e}")
                time.sleep(1)
    
    def _execute_task(self, task: Task):
        """Exécuter une tâche"""
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        
        logger.info(f"🏃 Exécution tâche {task.id} ({task.task_type.value})")
        
        try:
            # Exécution selon le type de tâche
            if task.task_type == TaskType.NMAP_SCAN:
                result = self._execute_nmap_scan(task)
            elif task.task_type == TaskType.NIKTO_SCAN:
                result = self._execute_nikto_scan(task)
            elif task.task_type == TaskType.METASPLOIT_EXPLOIT:
                result = self._execute_metasploit_exploit(task)
            elif task.task_type == TaskType.HYDRA_ATTACK:
                result = self._execute_hydra_attack(task)
            elif task.function:
                result = task.function(*task.args, **task.kwargs)
            else:
                result = self._simulate_generic_task(task)
            
            task.result = result
            task.status = TaskStatus.COMPLETED
            task.progress = 100.0
            
            logger.info(f"✅ Tâche {task.id} complétée")
            
        except subprocess.TimeoutExpired:
            task.status = TaskStatus.TIMEOUT
            task.error = "Timeout dépassé"
            logger.warning(f"⏰ Timeout tâche {task.id}")
            
        except Exception as e:
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.RETRYING
                logger.warning(f"🔄 Retry {task.retry_count}/{task.max_retries} pour tâche {task.id}")
                
                time.sleep(2 ** task.retry_count)
                self.task_queue.put(task)
                return
            else:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"❌ Tâche {task.id} échouée: {e}")
        
        finally:
            task.completed_at = datetime.now()
            
            with self._tasks_lock:
                if task.id in self.active_tasks:
                    del self.active_tasks[task.id]
                self.completed_tasks[task.id] = task
                
                if task.id in self.task_futures:
                    del self.task_futures[task.id]
    
    def _execute_nmap_scan(self, task: Task) -> dict:
        """Exécution simulée de Nmap"""
        logger.info(f"🎯 Simulation Nmap: {task.target}")
        
        phases = [
            ("Initializing Nmap", 10),
            ("Host discovery", 25),
            ("Port scanning", 60),
            ("Service detection", 80),
            ("Script scanning", 95),
            ("Generating report", 100)
        ]
        
        output_lines = []
        ports_found = []
        
        for phase, progress in phases:
            task.progress = progress
            message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}..."
            output_lines.append(message)
            task.output.append(message)
            time.sleep(random.uniform(0.5, 2))
        
        # Simulation de ports trouvés
        common_ports = [22, 80, 443, 8080, 21, 25, 53, 3389]
        for port in random.sample(common_ports, random.randint(2, 6)):
            service = {22: "ssh", 80: "http", 443: "https", 8080: "http-proxy", 
                      21: "ftp", 25: "smtp", 53: "dns", 3389: "rdp"}.get(port, "unknown")
            ports_found.append({'port': port, 'service': service, 'state': 'open'})
        
        return {
            'success': True,
            'simulation': True,
            'tool': 'nmap',
            'target': task.target,
            'ports_found': ports_found,
            'total_ports': len(ports_found),
            'output': output_lines
        }
    
    def _execute_nikto_scan(self, task: Task) -> dict:
        """Exécution simulée de Nikto"""
        logger.info(f"🌐 Simulation Nikto: {task.target}")
        
        phases = [
            ("Starting Nikto scan", 10),
            ("Testing server headers", 30),
            ("Checking for common files", 50),
            ("Testing for vulnerabilities", 70),
            ("Scanning for misconfigurations", 90),
            ("Generating report", 100)
        ]
        
        output_lines = []
        vulnerabilities = []
        
        for phase, progress in phases:
            task.progress = progress
            message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}..."
            output_lines.append(message)
            task.output.append(message)
            time.sleep(random.uniform(0.8, 1.5))
        
        # Simulation de vulnérabilités
        if random.random() > 0.3:  # 70% chance de trouver des vulnérabilités
            vuln_types = [
                "Server information disclosure",
                "Missing security headers",
                "Directory browsing enabled",
                "Backup files accessible",
                "Default files present"
            ]
            
            for vuln in random.sample(vuln_types, random.randint(1, 3)):
                vulnerabilities.append({
                    'type': vuln,
                    'severity': random.choice(['low', 'medium', 'high']),
                    'description': f"Found: {vuln}"
                })
        
        return {
            'success': True,
            'simulation': True,
            'tool': 'nikto',
            'target': task.target,
            'vulnerabilities': vulnerabilities,
            'vulnerability_count': len(vulnerabilities),
            'output': output_lines
        }
    
    def _execute_metasploit_exploit(self, task: Task) -> dict:
        """Exécution simulée de Metasploit"""
        logger.info(f"🎯 Simulation Metasploit: {task.metadata.get('module', 'unknown')}")
        
        phases = [
            ("Loading exploit module", 15),
            ("Configuring payload", 30),
            ("Validating target", 45),
            ("Launching exploit", 70),
            ("Checking for session", 90),
            ("Exploit completed", 100)
        ]
        
        output_lines = []
        
        for phase, progress in phases:
            task.progress = progress
            message = f"[{datetime.now().strftime('%H:%M:%S')}] [*] {phase}"
            output_lines.append(message)
            task.output.append(message)
            time.sleep(random.uniform(1, 2))
        
        # 60% chance de succès
        success = random.random() > 0.4
        
        if success:
            session_info = {
                'id': random.randint(1, 100),
                'type': 'shell',
                'target': task.target,
                'opened_at': datetime.now().isoformat(),
                'status': 'active'
            }
            
            success_msg = f"[{datetime.now().strftime('%H:%M:%S')}] [+] Session opened successfully!"
            output_lines.append(success_msg)
            task.output.append(success_msg)
            
            return {
                'success': True,
                'simulation': True,
                'session_created': True,
                'session_info': session_info,
                'exploit_module': task.metadata.get('module'),
                'output': output_lines
            }
        else:
            fail_msg = f"[{datetime.now().strftime('%H:%M:%S')}] [-] Exploit failed"
            output_lines.append(fail_msg)
            task.output.append(fail_msg)
            
            return {
                'success': False,
                'simulation': True,
                'session_created': False,
                'error': 'Exploit failed - target may not be vulnerable',
                'output': output_lines
            }
    
    def _execute_hydra_attack(self, task: Task) -> dict:
        """Exécution simulée de Hydra"""
        logger.info(f"🔓 Simulation Hydra: {task.target}")
        
        phases = [
            ("Starting Hydra", 10),
            ("Loading wordlist", 20),
            ("Testing credentials", 60),
            ("Analyzing results", 90),
            ("Attack completed", 100)
        ]
        
        output_lines = []
        credentials_found = []
        
        for phase, progress in phases:
            task.progress = progress
            message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}..."
            output_lines.append(message)
            task.output.append(message)
            time.sleep(random.uniform(1, 2))
        
        # 25% chance de trouver des credentials
        if random.random() > 0.75:
            username = task.metadata.get('username', 'admin')
            password = random.choice(['password', '123456', 'admin', 'test'])
            
            credentials_found.append({
                'username': username,
                'password': password,
                'service': task.metadata.get('service', 'ssh'),
                'target': task.target
            })
            
            success_msg = f"[{datetime.now().strftime('%H:%M:%S')}] [+] Found valid credentials: {username}:{password}"
            output_lines.append(success_msg)
            task.output.append(success_msg)
        
        return {
            'success': True,
            'simulation': True,
            'credentials_found': len(credentials_found) > 0,
            'credentials': credentials_found,
            'total_attempts': random.randint(50, 200),
            'output': output_lines
        }
    
    def _simulate_generic_task(self, task: Task) -> dict:
        """Simulation générique pour tâches personnalisées"""
        logger.info(f"🔧 Simulation tâche générique: {task.name}")
        
        phases = ["Initializing", "Processing", "Analyzing", "Completing"]
        
        for i, phase in enumerate(phases):
            progress = ((i + 1) / len(phases)) * 100
            task.progress = progress
            
            message = f"[{datetime.now().strftime('%H:%M:%S')}] {phase}..."
            task.output.append(message)
            
            time.sleep(random.uniform(0.5, 1.5))
        
        return {
            'success': True,
            'simulation': True,
            'task_type': task.task_type.value,
            'completed_at': datetime.now().isoformat()
        }
    
    def get_task_status(self, task_id: str) -> Optional[dict]:
        """Récupérer le statut d'une tâche"""
        with self._tasks_lock:
            if task_id in self.active_tasks:
                return self.active_tasks[task_id].to_legacy_format()
            if task_id in self.completed_tasks:
                return self.completed_tasks[task_id].to_legacy_format()
        return None
    
    def get_active_tasks(self) -> List[dict]:
        """Récupérer toutes les tâches actives"""
        with self._tasks_lock:
            return [task.to_legacy_format() for task in self.active_tasks.values()]
    
    def get_completed_tasks(self) -> List[dict]:
        """Récupérer les tâches complétées"""
        with self._tasks_lock:
            return [task.to_legacy_format() for task in self.completed_tasks.values()]
    
    def cancel_task(self, task_id: str) -> bool:
        """Annuler une tâche"""
        with self._tasks_lock:
            if task_id in self.active_tasks:
                task = self.active_tasks[task_id]
                task.status = TaskStatus.CANCELLED
                
                if task_id in self.task_futures:
                    future = self.task_futures[task_id]
                    cancelled = future.cancel()
                    
                logger.info(f"🚫 Tâche {task_id} annulée")
                return True
        return False
    
    def get_statistics(self) -> dict:
        """Obtenir les statistiques du gestionnaire"""
        with self._tasks_lock:
            active_count = len(self.active_tasks)
            completed_count = len(self.completed_tasks)
            failed_count = len([t for t in self.completed_tasks.values() if t.status == TaskStatus.FAILED])
        
        return {
            'active_tasks': active_count,
            'completed_tasks': completed_count,
            'failed_tasks': failed_count,
            'max_workers': self.max_workers,
            'queue_size': self.task_queue.qsize(),
            'total_tasks_processed': completed_count,
            'uptime': 'active'
        }
    
    def _cleanup_loop(self):
        """Boucle de nettoyage des tâches anciennes"""
        while self._running:
            try:
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                with self._tasks_lock:
                    old_tasks = [
                        task_id for task_id, task in self.completed_tasks.items()
                        if task.completed_at and task.completed_at < cutoff_time
                    ]
                    
                    for task_id in old_tasks:
                        del self.completed_tasks[task_id]
                    
                    if old_tasks:
                        logger.info(f"🧹 {len(old_tasks)} tâches anciennes nettoyées")
                
                time.sleep(3600)  # Nettoyer toutes les heures
                
            except Exception as e:
                logger.error(f"Erreur dans cleanup loop: {e}")
                time.sleep(300)
    
    def shutdown(self, wait: bool = True, timeout: float = 30.0):
        """Arrêt propre du gestionnaire"""
        logger.info("🔌 Arrêt du StandaloneTaskManager...")
        
        self._running = False
        
        if wait:
            try:
                self.task_queue.join()
            except:
                pass
        
        self.executor.shutdown(wait=wait, timeout=timeout)
        
        with self._tasks_lock:
            for task_id in list(self.active_tasks.keys()):
                self.cancel_task(task_id)
        
        logger.info("✅ StandaloneTaskManager arrêté")

# Instance globale
_standalone_task_manager: Optional[StandaloneTaskManager] = None

def get_standalone_task_manager() -> StandaloneTaskManager:
    """Récupérer l'instance globale standalone"""
    global _standalone_task_manager
    if _standalone_task_manager is None:
        _standalone_task_manager = StandaloneTaskManager()
    return _standalone_task_manager

def initialize_standalone_task_manager(max_workers: int = 8) -> StandaloneTaskManager:
    """Initialiser le gestionnaire standalone"""
    global _standalone_task_manager
    if _standalone_task_manager is not None:
        _standalone_task_manager.shutdown(wait=False)
    
    _standalone_task_manager = StandaloneTaskManager(max_workers)
    return _standalone_task_manager

# Fonctions de compatibilité pour l'intégration facile
def create_task_standalone(task_type: str, metadata: dict) -> str:
    """Créer une tâche de manière standalone"""
    manager = get_standalone_task_manager()
    
    if task_type.startswith('nmap'):
        return manager.create_scan_task(
            tool='nmap',
            target=metadata.get('target', ''),
            scan_type=metadata.get('scan_type', 'basic'),
            **metadata
        )
    elif task_type.startswith('nikto'):
        return manager.create_scan_task(
            tool='nikto', 
            target=metadata.get('target', ''),
            scan_type=metadata.get('scan_type', 'basic'),
            **metadata
        )
    elif task_type == 'metasploit_exploit':
        return manager.create_exploit_task(
            module=metadata.get('module', ''),
            target=metadata.get('target', ''),
            payload=metadata.get('payload', ''),
            **metadata
        )
    elif task_type == 'hydra_attack':
        return manager.create_hydra_task(
            target=metadata.get('target', ''),
            service=metadata.get('service', 'ssh'),
            username=metadata.get('username'),
            **metadata
        )
    else:
        # Tâche générique
        task = Task(
            name=f"Custom task: {task_type}",
            task_type=TaskType.CUSTOM,
            metadata=metadata
        )
        return manager.submit_task(task)

def update_task_status_standalone(task_id: str, status: str, result: Any = None, error: str = None):
    """Mettre à jour le statut d'une tâche de manière standalone"""
    manager = get_standalone_task_manager()
    
    with manager._tasks_lock:
        if task_id in manager.active_tasks:
            task = manager.active_tasks[task_id]
            
            try:
                task.status = TaskStatus(status)
            except ValueError:
                task.status = TaskStatus.RUNNING
            
            if result is not None:
                task.result = result
            if error is not None:
                task.error = error
            
            if status == 'completed':
                task.progress = 100.0
            elif status == 'running':
                task.progress = max(task.progress, 10.0)

def get_task_status_standalone(task_id: str) -> Optional[dict]:
    """Récupérer le statut d'une tâche de manière standalone"""
    manager = get_standalone_task_manager()
    return manager.get_task_status(task_id)