# backend/test_threading.py
"""
Script de test pour vérifier que le multi-threading fonctionne
"""

import sys
import os

# Ajouter le répertoire backend au path pour que 'app' soit importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

def test_standalone_task_manager():
    """Test du gestionnaire de tâches standalone"""
    print("🧪 Test du StandaloneTaskManager...")
    
    try:
        # Import du module
        from app.utils.standalone_tasks_manager import (
            StandaloneTaskManager, 
            TaskPriority,
            get_standalone_task_manager
        )
        
        print("✅ Import réussi")
        
        # Créer une instance
        manager = StandaloneTaskManager(max_workers=4)
        print("✅ Gestionnaire créé")
        
        # Créer une tâche de scan
        task_id = manager.create_scan_task(
            tool='nmap',
            target='127.0.0.1',
            scan_type='basic'
        )
        print(f"✅ Tâche de scan créée: {task_id}")
        
        # Attendre un peu
        import time
        time.sleep(2)
        
        # Vérifier le statut
        status = manager.get_task_status(task_id)
        if status:
            print(f"✅ Statut récupéré: {status.get('status', 'unknown')}")
        else:
            print("❌ Statut non trouvé")
        
        # Statistiques
        stats = manager.get_statistics()
        print(f"✅ Statistiques: {stats}")
        
        # Arrêter proprement
        manager.shutdown()
        print("✅ Gestionnaire arrêté proprement")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_simple_integration():
    """Test de l'intégration simple"""
    print("\n🧪 Test de l'intégration simple...")
    
    try:
        from flask import Flask
        
        # Créer une app Flask simple
        app = Flask(__name__)
        
        # Importer et tester l'intégration
        from app.utils.simple_integration import setup_simple_threading
        
        print("✅ Import réussi")
        
        # Configurer le threading
        result = setup_simple_threading(app, max_workers=4)
        
        if result:
            print("✅ Threading configuré avec succès")
            
            # Tester les fonctions
            if hasattr(app, 'create_threaded_scan'):
                task_id = app.create_threaded_scan('nmap', '127.0.0.1', 'basic')
                if task_id:
                    print(f"✅ Scan threadé créé: {task_id}")
                else:
                    print("❌ Échec création scan threadé")
            
            # Nettoyer
            if hasattr(app, 'threading_manager'):
                app.threading_manager.shutdown()
                print("✅ Threading nettoyé")
            
            return True
        else:
            print("❌ Configuration threading échouée")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_helper_class():
    """Test de la classe helper"""
    print("\n🧪 Test de SimpleThreadingHelper...")
    
    try:
        from app.utils.simple_integration import SimpleThreadingHelper
        
        print("✅ Import réussi")
        
        # Créer l'instance
        helper = SimpleThreadingHelper(max_workers=4)
        
        if helper.available:
            print("✅ Helper disponible")
            
            # Créer un scan
            task_id = helper.create_scan('nmap', '127.0.0.1', 'basic')
            if task_id:
                print(f"✅ Scan créé: {task_id}")
                
                # Vérifier le statut
                import time
                time.sleep(1)
                
                status = helper.get_status(task_id)
                if status:
                    print(f"✅ Statut: {status.get('status', 'unknown')}")
                
                # Statistiques
                stats = helper.get_statistics()
                print(f"✅ Stats: {stats}")
            
            # Nettoyer
            helper.shutdown()
            print("✅ Helper nettoyé")
            
            return True
        else:
            print("❌ Helper non disponible")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Test principal"""
    print("🚀 Test du système multi-threading Pacha Toolbox")
    print("=" * 60)
    
    tests = [
        ("StandaloneTaskManager", test_standalone_task_manager),
        ("SimpleIntegration", test_simple_integration),
        ("SimpleThreadingHelper", test_helper_class)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Test {test_name} échoué: {e}")
            results.append((test_name, False))
    
    # Résumé
    print("\n" + "="*60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:30} {status}")
        if success:
            passed += 1
    
    print(f"\n🎯 Résultat: {passed}/{len(tests)} tests réussis")
    
    if passed == len(tests):
        print("🎉 Tous les tests sont passés ! Le multi-threading est prêt.")
        print("\n📋 Pour intégrer dans votre main.py, ajoutez ces lignes :")
        print("""
try:
    from app.utils.simple_integration import setup_simple_threading
    threading_result = setup_simple_threading(app, max_workers=8)
    if threading_result:
        logger.info("🔥 Multi-threading activé!")
    else:
        logger.warning("⚠️ Multi-threading non disponible")
except Exception as e:
    logger.info(f"📋 Multi-threading non disponible: {e}")
        """)
    else:
        print("⚠️ Certains tests ont échoué. Vérifiez l'installation.")
        print("\n🔧 Vérifications à faire :")
        print("1. Les fichiers sont dans backend/app/utils/")
        print("2. Le fichier __init__.py existe dans utils/")
        print("3. Les imports Python fonctionnent")
        print("4. Les permissions des fichiers sont correctes")

def test_imports_only():
    """Test uniquement les imports pour diagnostic"""
    print("🔍 Test des imports...")
    
    imports_tests = [
        ("standalone_task_manager", "from app.utils.standalone_task_manager import StandaloneTaskManager"),
        ("simple_integration", "from app.utils.simple_integration import setup_simple_threading"),
        ("utils package", "import app.utils"),
    ]
    
    for name, import_stmt in imports_tests:
        try:
            exec(import_stmt)
            print(f"✅ {name}")
        except Exception as e:
            print(f"❌ {name}: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test du multi-threading Pacha Toolbox")
    parser.add_argument("--imports-only", action="store_true", help="Tester uniquement les imports")
    parser.add_argument("--quick", action="store_true", help="Test rapide sans attentes")
    
    args = parser.parse_args()
    
    if args.imports_only:
        test_imports_only()
    else:
        main()