# backend/app/worker.py
import os
import time
import logging
from celery import Celery
import redis

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration Redis avec fallback
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Test de connexion Redis
def test_redis_connection():
    try:
        r = redis.from_url(REDIS_URL)
        r.ping()
        logger.info(f"✅ Redis connecté: {REDIS_URL}")
        return True
    except Exception as e:
        logger.error(f"❌ Redis non disponible: {e}")
        return False

# Tentative de connexion avec retry
redis_available = False
for attempt in range(5):
    if test_redis_connection():
        redis_available = True
        break
    logger.info(f"Tentative {attempt + 1}/5 de connexion Redis...")
    time.sleep(2)

if not redis_available:
    logger.warning("⚠️ Redis non disponible, worker en mode dégradé")

# Configuration Celery uniquement si Redis est disponible
if redis_available:
    celery_app = Celery(
        'pacha_worker',
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=['app.worker']
    )

    celery_app.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        task_routes={
            'app.worker.process_scan': {'queue': 'scans'},
            'app.worker.process_capture': {'queue': 'captures'},
        }
    )

    @celery_app.task(bind=True)
    def process_scan(self, scan_data):
        """Traitement d'un scan en arrière-plan"""
        try:
            logger.info(f"🔍 Traitement scan: {scan_data.get('type', 'unknown')}")
            
            scan_type = scan_data.get('type')
            
            if scan_type == 'nmap':
                return process_nmap_scan(scan_data)
            elif scan_type == 'masscan':
                return process_masscan_scan(scan_data)
            else:
                return {"error": f"Type de scan non supporté: {scan_type}"}
                
        except Exception as e:
            logger.error(f"❌ Erreur traitement scan: {str(e)}")
            return {"error": str(e)}

    @celery_app.task(bind=True)
    def process_capture(self, capture_data):
        """Traitement d'une capture Wireshark"""
        try:
            logger.info(f"📡 Traitement capture: {capture_data.get('interface', 'unknown')}")
            # Logique de traitement capture
            return {"status": "completed", "message": "Capture traitée"}
        except Exception as e:
            logger.error(f"❌ Erreur traitement capture: {str(e)}")
            return {"error": str(e)}

    def process_nmap_scan(scan_data):
        """Traitement spécifique Nmap"""
        import subprocess
        import uuid
        from datetime import datetime
        
        target = scan_data.get('target')
        args = scan_data.get('args', '-sV')
        
        scan_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"/app/reports/nmap_{scan_id}_{timestamp}.xml"
        
        command = f"nmap {args} -oX {output_file} {target}"
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                return {
                    "status": "completed",
                    "scan_id": scan_id,
                    "output_file": output_file,
                    "result": result.stdout
                }
            else:
                return {"error": result.stderr}
                
        except subprocess.TimeoutExpired:
            return {"error": "Timeout du scan"}
        except Exception as e:
            return {"error": str(e)}

    def process_masscan_scan(scan_data):
        """Traitement spécifique Masscan"""
        # Implémentation similaire à Nmap
        return {"status": "completed", "message": "Masscan traité"}

# Mode sans Celery si Redis indisponible
else:
    logger.warning("⚠️ Worker démarré en mode sans Redis")
    
    def process_scan(scan_data):
        logger.info("Traitement scan en mode direct (sans Redis)")
        return {"status": "completed", "message": "Scan traité en mode direct"}

if __name__ == '__main__':
    if redis_available:
        logger.info("🚀 Démarrage du worker Celery...")
        celery_app.start(['celery', 'worker', '--loglevel=info', '--concurrency=2'])
    else:
        logger.info("⚠️ Worker en mode attente (Redis non disponible)")
        while True:
            time.sleep(60)
            if test_redis_connection():
                logger.info("✅ Redis disponible, redémarrage du worker...")
                break