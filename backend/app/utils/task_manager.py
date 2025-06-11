import redis
import json
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    logger.info("✅ Redis connecté")
except:
    REDIS_AVAILABLE = False
    logger.warning("⚠️ Redis non disponible, utilisation mémoire")

# Stockage en mémoire comme fallback
memory_tasks = {}

def create_task(task_type, task_data):
    """Création d'une nouvelle tâche"""
    task_id = str(uuid.uuid4())
    task = {
        "task_id": task_id,
        "type": task_type,
        "data": task_data,
        "status": "created",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "result": None,
        "error": None,
        "progress": 0
    }
    
    if REDIS_AVAILABLE:
        try:
            redis_client.setex(f"task:{task_id}", 3600, json.dumps(task))
        except:
            memory_tasks[task_id] = task
    else:
        memory_tasks[task_id] = task
    
    return task_id

def update_task_status(task_id, status, result=None, error=None, progress=None):
    """Mise à jour du statut d'une tâche"""
    try:
        if REDIS_AVAILABLE:
            task_data = redis_client.get(f"task:{task_id}")
            if task_data:
                task = json.loads(task_data)
            else:
                task = memory_tasks.get(task_id, {})
        else:
            task = memory_tasks.get(task_id, {})
        
        if not task:
            logger.warning(f"Tâche {task_id} non trouvée")
            return
        
        task["status"] = status
        task["updated_at"] = datetime.now().isoformat()
        
        if result is not None:
            task["result"] = result
        if error is not None:
            task["error"] = error
        if progress is not None:
            task["progress"] = progress
        
        if REDIS_AVAILABLE:
            try:
                redis_client.setex(f"task:{task_id}", 3600, json.dumps(task))
            except:
                memory_tasks[task_id] = task
        else:
            memory_tasks[task_id] = task
            
        logger.info(f"Tâche {task_id} mise à jour: {status}")
        
    except Exception as e:
        logger.error(f"Erreur mise à jour tâche {task_id}: {str(e)}")

def get_task_status(task_id):
    """Récupération du statut d'une tâche"""
    try:
        if REDIS_AVAILABLE:
            task_data = redis_client.get(f"task:{task_id}")
            if task_data:
                return json.loads(task_data)
        
        return memory_tasks.get(task_id, {"error": "Tâche non trouvée"})
        
    except Exception as e:
        logger.error(f"Erreur récupération tâche {task_id}: {str(e)}")
        return {"error": str(e)}

def get_all_tasks():
    """Récupération de toutes les tâches actives"""
    tasks = []
    
    try:
        if REDIS_AVAILABLE:
            keys = redis_client.keys("task:*")
            for key in keys:
                task_data = redis_client.get(key)
                if task_data:
                    tasks.append(json.loads(task_data))
        
        # Ajout des tâches en mémoire
        tasks.extend(memory_tasks.values())
        
        return tasks
        
    except Exception as e:
        logger.error(f"Erreur récupération toutes tâches: {str(e)}")
        return list(memory_tasks.values())

def cleanup_old_tasks():
    """Nettoyage des anciennes tâches"""
    try:
        cutoff_time = datetime.now().timestamp() - 3600  # 1 heure
        
        if REDIS_AVAILABLE:
            keys = redis_client.keys("task:*")
            for key in keys:
                task_data = redis_client.get(key)
                if task_data:
                    task = json.loads(task_data)
                    created_time = datetime.fromisoformat(task["created_at"]).timestamp()
                    if created_time < cutoff_time and task["status"] in ["completed", "failed"]:
                        redis_client.delete(key)
        
        # Nettoyage mémoire
        to_remove = []
        for task_id, task in memory_tasks.items():
            created_time = datetime.fromisoformat(task["created_at"]).timestamp()
            if created_time < cutoff_time and task["status"] in ["completed", "failed"]:
                to_remove.append(task_id)
        
        for task_id in to_remove:
            del memory_tasks[task_id]
            
        logger.info(f"Nettoyage: {len(to_remove)} tâches supprimées")
        
    except Exception as e:
        logger.error(f"Erreur nettoyage tâches: {str(e)}")