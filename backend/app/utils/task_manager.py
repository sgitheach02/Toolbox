import json
import uuid
from datetime import datetime
import redis
import logging

logger = logging.getLogger(__name__)

# Configuration Redis
try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
except:
    redis_client = None
    logger.warning("Redis non disponible, utilisation du stockage en mémoire")

# Stockage en mémoire comme fallback
memory_tasks = {}

def create_task(task_type, task_data):
    """Création d'une nouvelle tâche"""
    task_id = str(uuid.uuid4())
    task = {
        "id": task_id,
        "type": task_type,
        "data": task_data,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "result": None,
        "error": None
    }
    
    if redis_client:
        try:
            redis_client.setex(f"task:{task_id}", 3600, json.dumps(task))  # Expire après 1h
        except:
            memory_tasks[task_id] = task
    else:
        memory_tasks[task_id] = task
    
    return task_id

def update_task_status(task_id, status, result=None, error=None):
    """Mise à jour du statut d'une tâche"""
    if redis_client:
        try:
            task_data = redis_client.get(f"task:{task_id}")
            if task_data:
                task = json.loads(task_data)
                task["status"] = status
                task["updated_at"] = datetime.now().isoformat()
                if result is not None:
                    task["result"] = result
                if error is not None:
                    task["error"] = error
                redis_client.setex(f"task:{task_id}", 3600, json.dumps(task))
        except:
            if task_id in memory_tasks:
                memory_tasks[task_id]["status"] = status
                memory_tasks[task_id]["updated_at"] = datetime.now().isoformat()
                if result is not None:
                    memory_tasks[task_id]["result"] = result
                if error is not None:
                    memory_tasks[task_id]["error"] = error
    else:
        if task_id in memory_tasks:
            memory_tasks[task_id]["status"] = status
            memory_tasks[task_id]["updated_at"] = datetime.now().isoformat()
            if result is not None:
                memory_tasks[task_id]["result"] = result
            if error is not None:
                memory_tasks[task_id]["error"] = error

def get_task_status(task_id):
    """Récupération du statut d'une tâche"""
    if redis_client:
        try:
            task_data = redis_client.get(f"task:{task_id}")
            if task_data:
                return json.loads(task_data)
        except:
            pass
    
    return memory_tasks.get(task_id, {"error": "Tâche non trouvée"})