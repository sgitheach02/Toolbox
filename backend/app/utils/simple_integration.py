# backend/app/utils/simple_integration.py
"""
Intégration ultra-simple du multi-threading
Version sans dépendances externes pour maximum de compatibilité
"""

import logging
import threading
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def setup_simple_threading(app, max_workers: int = 8):
    """
    Configuration ultra-simple du multi-threading
    
    Usage dans main.py :
    from app.utils.simple_integration import setup_simple_threading
    setup_simple_threading(app)
    """
    
    try:
        # Import du gestionnaire standalone
        from app.utils.standalone_task_manager import (
            get_standalone_task_manager,
            initialize_standalone_task_manager,
            TaskPriority,
            create_task_standalone,
            get_task_status_standalone
        )
        
        # Initialiser le gestionnaire
        task_manager = initialize_standalone_task_manager(max_workers)
        logger.info(f"🚀 Multi-threading simple activé avec {max_workers} workers")
        
        # Ajouter les routes de monitoring
        @app.route('/api/threading/simple/status', methods=['GET'])
        def simple_threading_status():
            """Statut simple du multi-threading"""
            try:
                stats = task_manager.get_statistics()
                return {
                    'threading_enabled': True,
                    'mode': 'simple_standalone',
                    'stats': stats,
                    'active_threads': threading.active_count(),
                    'max_workers': max_workers
                }
            except Exception as e:
                return {'error': str(e)}, 500
        
        @app.route('/api/threading/simple/tasks', methods=['GET'])
        def simple_threading_tasks():
            """Liste simple des tâches"""
            try:
                active = task_manager.get_active_tasks()
                completed = task_manager.get_completed_tasks()[-10:]  # Dernières 10
                
                return {
                    'active_tasks': active,
                    'completed_tasks': completed,
                    'total_active': len(active),
                    'total_completed': len(completed)
                }
            except Exception as e:
                return {'error': str(e)}, 500
        
        @app.route('/api/threading/simple/task/<task_id>/cancel', methods=['POST'])
        def simple_cancel_task(task_id):
            """Annuler une tâche"""
            try:
                success = task_manager.cancel_task(task_id)
                return {
                    'success': success,
                    'message': f'Tâche {task_id} {"annulée" if success else "non trouvée"}'
                }
            except Exception as e:
                return {'error': str(e)}, 500
        
        @app.route('/api/threading/simple/health', methods=['GET'])
        def simple_threading_health():
            """Santé du système simple"""
            try:
                stats = task_manager.get_statistics()
                return {
                    'status': 'healthy',
                    'active_tasks': stats.get('active_tasks', 0),
                    'completed_tasks': stats.get('completed_tasks', 0),
                    'failed_tasks': stats.get('failed_tasks', 0),
                    'queue_size': stats.get('queue_size', 0),
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                return {'status': 'error', 'error': str(e)}, 500
        
        # Fonctions helper pour l'intégration
        def create_threaded_scan(tool: str, target: str, scan_type: str = 'basic', 
                               priority: str = 'normal') -> str:
            """Créer un scan threadé simple"""
            priority_map = {
                'critical': TaskPriority.CRITICAL,
                'high': TaskPriority.HIGH,
                'normal': TaskPriority.NORMAL,
                'low': TaskPriority.LOW
            }
            
            if tool in ['nmap', 'nikto']:
                return task_manager.create_scan_task(
                    tool=tool,
                    target=target,
                    scan_type=scan_type,
                    priority=priority_map.get(priority, TaskPriority.NORMAL)
                )
            else:
                return create_task_standalone(f"{tool}_scan", {
                    'tool': tool,
                    'target': target,
                    'scan_type': scan_type
                })
        
        def create_threaded_exploit(module: str, target: str, payload: str, **kwargs) -> str:
            """Créer un exploit threadé simple"""
            return task_manager.create_exploit_task(
                module=module,
                target=target,
                payload=payload,
                priority=TaskPriority.HIGH,
                **kwargs
            )
        
        def create_threaded_attack(target: str, service: str, username: str = None, **kwargs) -> str:
            """Créer une attaque threadée simple"""
            return task_manager.create_hydra_task(
                target=target,
                service=service,
                username=username,
                priority=TaskPriority.NORMAL,
                **kwargs
            )
        
        def get_threaded_task_status(task_id: str) -> Optional[dict]:
            """Récupérer le statut d'une tâche threadée"""
            return task_manager.get_task_status(task_id)
        
        # Ajouter au contexte Flask pour accès global
        app.threading_manager = task_manager
        app.create_threaded_scan = create_threaded_scan
        app.create_threaded_exploit = create_threaded_exploit
        app.create_threaded_attack = create_threaded_attack
        app.get_threaded_task_status = get_threaded_task_status
        
        # Fonction de nettoyage
        def cleanup_simple_threading():
            try:
                task_manager.shutdown(wait=True, timeout=10)
                logger.info("🧹 Multi-threading simple nettoyé")
            except Exception as e:
                logger.error(f"Erreur nettoyage: {e}")
        
        import atexit
        atexit.register(cleanup_simple_threading)
        
        return {
            'task_manager': task_manager,
            'create_scan': create_threaded_scan,
            'create_exploit': create_threaded_exploit,
            'create_attack': create_threaded_attack,
            'get_status': get_threaded_task_status,
            'cleanup': cleanup_simple_threading
        }
        
    except ImportError as e:
        logger.error(f"❌ Module standalone non disponible: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Erreur configuration multi-threading simple: {e}")
        return None

def enhance_existing_functions_simple(app, globals_dict):
    """
    Améliorer les fonctions existantes de manière simple
    
    Usage dans main.py après setup_simple_threading:
    enhance_existing_functions_simple(app, globals())
    """
    
    try:
        # Vérifier que le threading est configuré
        if not hasattr(app, 'threading_manager'):
            logger.warning("⚠️ Threading non configuré, améliorations ignorées")
            return False
        
        task_manager = app.threading_manager
        
        # Sauvegarder les fonctions originales
        original_functions = {}
        
        def enhance_execute_scan():
            """Améliorer execute_scan si elle existe"""
            if 'execute_scan' in globals_dict:
                original_functions['execute_scan'] = globals_dict['execute_scan']
                
                def enhanced_execute_scan(command, scan_id, tool, target, scan_type):
                    """Version améliorée avec threading"""
                    try:
                        logger.info(f"🚀 Scan threadé {scan_id}: {tool} -> {target}")
                        
                        # Créer une tâche threadée
                        if tool in ['nmap', 'nikto']:
                            task_id = task_manager.create_scan_task(
                                tool=tool,
                                target=target,
                                scan_type=scan_type
                            )
                            
                            # Synchroniser avec les structures existantes
                            def sync_to_legacy():
                                active_scans = globals_dict.get('active_scans', {})
                                scan_outputs = globals_dict.get('scan_outputs', {})
                                scan_history = globals_dict.get('scan_history', [])
                                
                                while True:
                                    task_data = task_manager.get_task_status(task_id)
                                    if not task_data:
                                        break
                                    
                                    # Mettre à jour active_scans
                                    if scan_id in active_scans:
                                        active_scans[scan_id].update({
                                            'status': task_data.get('status', 'running'),
                                            'progress': task_data.get('progress', 0),
                                            'pid': task_data.get('pid')
                                        })
                                    
                                    # Mettre à jour scan_outputs
                                    if task_data.get('output'):
                                        scan_outputs[scan_id] = task_data['output']
                                    
                                    # Si terminé, déplacer vers historique
                                    if task_data.get('status') in ['completed', 'failed', 'cancelled']:
                                        if scan_id in active_scans:
                                            scan_history.append(active_scans[scan_id].copy())
                                            del active_scans[scan_id]
                                        break
                                    
                                    threading.Event().wait(1)
                            
                            # Démarrer la synchronisation en arrière-plan
                            sync_thread = threading.Thread(target=sync_to_legacy, daemon=True)
                            sync_thread.start()
                            
                            return task_id
                        else:
                            # Fallback vers l'ancienne méthode pour outils non supportés
                            return original_functions['execute_scan'](command, scan_id, tool, target, scan_type)
                            
                    except Exception as e:
                        logger.error(f"❌ Erreur scan threadé: {e}")
                        # Fallback complet
                        return original_functions['execute_scan'](command, scan_id, tool, target, scan_type)
                
                globals_dict['execute_scan'] = enhanced_execute_scan
                logger.info("🔧 Fonction execute_scan améliorée")
                return True
            
            return False
        
        def enhance_exploit_functions():
            """Améliorer les fonctions d'exploit"""
            enhanced = False
            
            if 'simulate_exploit_execution' in globals_dict:
                original_functions['simulate_exploit_execution'] = globals_dict['simulate_exploit_execution']
                
                def enhanced_simulate_exploit_execution(exploit_id, exploit_data):
                    """Version améliorée avec threading"""
                    try:
                        logger.info(f"🎯 Exploit threadé {exploit_id}")
                        
                        task_id = task_manager.create_exploit_task(
                            module=exploit_data.get('module', ''),
                            target=exploit_data.get('target', ''),
                            payload=exploit_data.get('payload', ''),
                            **exploit_data
                        )
                        
                        # Synchronisation simple
                        def sync_exploit():
                            active_exploits = globals_dict.get('active_exploits', {})
                            exploit_outputs = globals_dict.get('exploit_outputs', {})
                            
                            while True:
                                task_data = task_manager.get_task_status(task_id)
                                if not task_data:
                                    break
                                
                                if exploit_id in active_exploits:
                                    active_exploits[exploit_id].update({
                                        'status': task_data.get('status', 'running'),
                                        'progress': task_data.get('progress', 0)
                                    })
                                
                                if task_data.get('output'):
                                    exploit_outputs[exploit_id] = task_data['output']
                                
                                if task_data.get('status') in ['completed', 'failed', 'cancelled']:
                                    break
                                
                                threading.Event().wait(1)
                        
                        sync_thread = threading.Thread(target=sync_exploit, daemon=True)
                        sync_thread.start()
                        
                        return task_id
                        
                    except Exception as e:
                        logger.error(f"❌ Erreur exploit threadé: {e}")
                        return original_functions['simulate_exploit_execution'](exploit_id, exploit_data)
                
                globals_dict['simulate_exploit_execution'] = enhanced_simulate_exploit_execution
                logger.info("🔧 Fonction simulate_exploit_execution améliorée")
                enhanced = True
            
            return enhanced
        
        # Appliquer les améliorations
        scan_enhanced = enhance_execute_scan()
        exploit_enhanced = enhance_exploit_functions()
        
        if scan_enhanced or exploit_enhanced:
            logger.info("✅ Fonctions existantes améliorées avec succès")
            
            # Sauvegarder les fonctions originales pour restauration si nécessaire
            app.original_functions = original_functions
            
            return True
        else:
            logger.warning("⚠️ Aucune fonction compatible trouvée pour amélioration")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erreur améliorations simples: {e}")
        return False

# Classe helper pour l'intégration manuelle
class SimpleThreadingHelper:
    """Helper pour intégrer manuellement le multi-threading"""
    
    def __init__(self, max_workers: int = 8):
        try:
            from app.utils.standalone_task_manager import initialize_standalone_task_manager
            self.task_manager = initialize_standalone_task_manager(max_workers)
            self.available = True
            logger.info(f"🎯 SimpleThreadingHelper initialisé ({max_workers} workers)")
        except Exception as e:
            logger.error(f"❌ SimpleThreadingHelper non disponible: {e}")
            self.available = False
            self.task_manager = None
    
    def create_scan(self, tool: str, target: str, scan_type: str = 'basic') -> Optional[str]:
        """Créer un scan threadé"""
        if not self.available:
            return None
        
        try:
            if tool in ['nmap', 'nikto']:
                return self.task_manager.create_scan_task(tool, target, scan_type)
            else:
                logger.warning(f"⚠️ Outil {tool} non supporté en mode threadé")
                return None
        except Exception as e:
            logger.error(f"❌ Erreur création scan threadé: {e}")
            return None
    
    def create_exploit(self, module: str, target: str, payload: str, **kwargs) -> Optional[str]:
        """Créer un exploit threadé"""
        if not self.available:
            return None
        
        try:
            return self.task_manager.create_exploit_task(module, target, payload, **kwargs)
        except Exception as e:
            logger.error(f"❌ Erreur création exploit threadé: {e}")
            return None
    
    def get_status(self, task_id: str) -> Optional[dict]:
        """Récupérer le statut d'une tâche"""
        if not self.available or not task_id:
            return None
        
        try:
            return self.task_manager.get_task_status(task_id)
        except Exception as e:
            logger.error(f"❌ Erreur récupération statut: {e}")
            return None
    
    def cancel_task(self, task_id: str) -> bool:
        """Annuler une tâche"""
        if not self.available or not task_id:
            return False
        
        try:
            return self.task_manager.cancel_task(task_id)
        except Exception as e:
            logger.error(f"❌ Erreur annulation tâche: {e}")
            return False
    
    def get_statistics(self) -> dict:
        """Récupérer les statistiques"""
        if not self.available:
            return {'available': False, 'error': 'Threading not available'}
        
        try:
            stats = self.task_manager.get_statistics()
            stats['available'] = True
            return stats
        except Exception as e:
            return {'available': False, 'error': str(e)}
    
    def shutdown(self):
        """Arrêter le gestionnaire"""
        if self.available and self.task_manager:
            try:
                self.task_manager.shutdown()
                logger.info("🔌 SimpleThreadingHelper arrêté")
            except Exception as e:
                logger.error(f"❌ Erreur arrêt: {e}")

# Configuration par défaut
DEFAULT_SIMPLE_CONFIG = {
    'max_workers': 8,
    'enable_enhancements': True,
    'enable_routes': True
}

def configure_simple_threading(app, config: dict = None):
    """
    Configuration complète simple du multi-threading
    
    Usage:
    from app.utils.simple_integration import configure_simple_threading
    configure_simple_threading(app, {'max_workers': 12})
    """
    
    final_config = DEFAULT_SIMPLE_CONFIG.copy()
    if config:
        final_config.update(config)
    
    try:
        # Configuration de base
        threading_setup = setup_simple_threading(app, final_config['max_workers'])
        
        if not threading_setup:
            logger.error("❌ Configuration simple échouée")
            return None
        
        logger.info("✅ Multi-threading simple configuré")
        
        # Améliorations optionnelles
        if final_config.get('enable_enhancements', True):
            try:
                enhance_existing_functions_simple(app, globals())
            except Exception as e:
                logger.warning(f"⚠️ Améliorations non appliquées: {e}")
        
        return threading_setup
        
    except Exception as e:
        logger.error(f"❌ Erreur configuration simple: {e}")
        return None