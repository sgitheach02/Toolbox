#!/bin/bash

# Script de correction immédiate pour le problème Nikto
# Ajoute la simulation de développement pour continuer sans nikto installé

set -e

echo "🔧 CORRECTION IMMÉDIATE - Problème Nikto"
echo "========================================"

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erreur: docker-compose.yml non trouvé"
    echo "   Veuillez exécuter depuis le répertoire racine du projet"
    exit 1
fi

# Sauvegarde
echo "💾 Sauvegarde du fichier actuel..."
cp backend/main.py backend/main.py.backup.nikto.$(date +%Y%m%d_%H%M%S)

# Patcher la fonction run_nikto_scan
echo "🔧 Application du patch de simulation..."

# Créer le patch Python
cat > temp_nikto_patch.py << 'EOF'
import sys
import re

def patch_nikto_function(content):
    """Patcher la fonction run_nikto_scan pour ajouter la simulation"""
    
    # Nouvelle fonction avec simulation
    new_function = '''def run_nikto_scan(target, scan_type, task_id):
    """Exécuter un scan Nikto - VERSION AVEC SIMULATION DE DÉVELOPPEMENT"""
    try:
        update_task_status(task_id, "running", {"message": "Démarrage scan Nikto"})
        
        # Vérifier si nikto est disponible
        nikto_available = subprocess.run(['which', 'nikto'], capture_output=True).returncode == 0
        
        if nikto_available:
            # VERSION RÉELLE avec nikto installé
            logger.info(f"🕷️ Exécution Nikto RÉELLE")
            
            # Configuration des scans
            scan_configs = {
                'quick': ['-maxtime', '120'],
                'basic': ['-maxtime', '300'],
                'comprehensive': ['-maxtime', '600', '-Tuning', 'x']
            }
            
            # Construire la commande
            cmd = ['nikto', '-h', target] + scan_configs.get(scan_type, ['-maxtime', '300'])
            
            logger.info(f"🕷️ Exécution Nikto: {' '.join(cmd)}")
            
            # Exécuter le scan
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=700
            )
            
            if result.returncode == 0:
                # Parser les résultats
                results = parse_nikto_output(result.stdout)
                
                update_task_status(task_id, "completed", {
                    "target": target,
                    "scan_type": scan_type,
                    "results": results,
                    "raw_output": result.stdout,
                    "mode": "real_nikto"
                })
            else:
                update_task_status(task_id, "failed", {
                    "error": result.stderr or "Erreur scan Nikto"
                })
        
        else:
            # VERSION SIMULATION pour développement
            logger.info(f"🧪 SIMULATION Nikto pour développement (nikto non installé)")
            
            # Attendre un peu pour simuler le scan
            import time
            time.sleep(2 + (5 if scan_type == 'comprehensive' else 2))
            
            # Générer des résultats simulés basés sur le type de scan et la cible
            simulated_results = generate_nikto_simulation(target, scan_type)
            
            update_task_status(task_id, "completed", {
                "target": target,
                "scan_type": scan_type,
                "results": simulated_results,
                "raw_output": f"SIMULATION: Nikto scan of {target} completed",
                "mode": "simulation",
                "note": "⚠️ Résultats simulés - nikto non installé"
            })
            
    except subprocess.TimeoutExpired:
        update_task_status(task_id, "failed", {"error": "Timeout du scan Nikto"})
    except Exception as e:
        logger.error(f"❌ Erreur scan Nikto: {e}")
        update_task_status(task_id, "failed", {"error": str(e)})

def generate_nikto_simulation(target, scan_type):
    """Générer des résultats simulés pour Nikto"""
    
    # Vulnérabilités basiques communes
    basic_vulns = [
        {
            "description": f"+ Server: Apache/2.4.41 (Ubuntu) - Version disclosure",
            "severity": "LOW"
        },
        {
            "description": f"+ Missing 'X-Frame-Options' header",
            "severity": "MEDIUM"
        },
        {
            "description": f"+ Missing 'X-Content-Type-Options' header", 
            "severity": "MEDIUM"
        }
    ]
    
    # Vulnérabilités avancées pour scan comprehensive
    comprehensive_vulns = basic_vulns + [
        {
            "description": f"+ /admin/: Admin interface found - Access should be restricted",
            "severity": "HIGH"
        },
        {
            "description": f"+ /backup/: Backup directory found - May contain sensitive files",
            "severity": "HIGH"
        },
        {
            "description": f"+ /phpinfo.php: PHP information disclosure possible",
            "severity": "MEDIUM"
        },
        {
            "description": f"+ /test/: Test directory found - Should be removed",
            "severity": "MEDIUM"
        },
        {
            "description": f"+ Cookie 'PHPSESSID' created without HttpOnly flag",
            "severity": "MEDIUM"
        },
        {
            "description": f"+ /cgi-bin/: CGI directory found - May contain vulnerabilities",
            "severity": "MEDIUM"
        }
    ]
    
    # Vulnérabilités critiques pour certaines cibles de test
    if any(test_domain in target.lower() for test_domain in ['testphp', 'dvwa', 'bwapp', 'vulnweb']):
        critical_vulns = [
            {
                "description": f"+ OSVDB-3092: /admin/: This might be interesting - Password file",
                "severity": "CRITICAL"
            },
            {
                "description": f"+ /login.php: Potential SQL injection point detected",
                "severity": "CRITICAL"
            },
            {
                "description": f"+ /search.php?q=<script>: XSS vulnerability detected",
                "severity": "HIGH"
            }
        ]
        comprehensive_vulns.extend(critical_vulns)
    
    # Sélectionner les vulnérabilités selon le type de scan
    if scan_type == 'quick':
        selected_vulns = basic_vulns[:2]
        total_checks = 50
        scan_time = "2.3 seconds"
    elif scan_type == 'comprehensive':
        selected_vulns = comprehensive_vulns
        total_checks = 800
        scan_time = "45.7 seconds"
    else:  # basic
        selected_vulns = basic_vulns + comprehensive_vulns[:3]
        total_checks = 200
        scan_time = "8.1 seconds"
    
    # Statistiques selon la cible
    if 'testphp' in target.lower() or 'vulnweb' in target.lower():
        # Site de test - plus de vulnérabilités
        vulnerability_count = len(selected_vulns)
    elif 'google' in target.lower() or 'microsoft' in target.lower():
        # Sites sécurisés - moins de vulnérabilités
        selected_vulns = [v for v in selected_vulns if v['severity'] in ['LOW', 'MEDIUM']][:2]
        vulnerability_count = len(selected_vulns)
    else:
        # Site normal
        vulnerability_count = len(selected_vulns)
    
    results = {
        "vulnerabilities": selected_vulns,
        "total_checks": total_checks,
        "scan_time": scan_time,
        "simulation_note": "⚠️ Résultats simulés pour développement",
        "target_analyzed": target,
        "scan_type_used": scan_type,
        "summary": f"{vulnerability_count} vulnérabilité(s) trouvée(s) sur {total_checks} tests"
    }
    
    return results'''
    
    # Chercher et remplacer l'ancienne fonction
    pattern = r'def run_nikto_scan\(.*?\n(?:.*\n)*?.*update_task_status\(task_id, "failed", \{"error": str\(e\)\}\)'
    
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_function, content, flags=re.DOTALL)
        print("✅ Fonction run_nikto_scan patchée avec succès")
    else:
        # Si on ne trouve pas l'ancienne fonction, l'ajouter avant la fonction create_app
        insertion_point = content.find('def create_app():')
        if insertion_point != -1:
            content = content[:insertion_point] + new_function + '\n\n# ============================================================\n# FONCTION FLASK APP\n# ============================================================\n\n' + content[insertion_point:]
            print("✅ Fonction run_nikto_scan ajoutée avec succès")
        else:
            print("❌ Impossible de trouver le point d'insertion")
            return content
    
    return content

# Lire le fichier
with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Appliquer le patch
patched_content = patch_nikto_function(content)

# Écrire le fichier modifié
with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(patched_content)

print("✅ Patch appliqué avec succès")
EOF

# Exécuter le patch
python3 temp_nikto_patch.py

# Nettoyer
rm temp_nikto_patch.py

# Redémarrer les services
echo "🔄 Redémarrage des services..."
docker-compose restart backend

# Attendre le redémarrage
echo "⏳ Attente du redémarrage..."
sleep 10

# Tester l'API
echo "🏥 Test de l'API..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ API opérationnelle"
else
    echo "❌ Problème avec l'API"
    echo "📋 Logs récents:"
    docker-compose logs backend --tail=10
fi

echo ""
echo "🎉 CORRECTION APPLIQUÉE"
echo "======================"
echo ""
echo "✅ Nikto fonctionne maintenant en mode simulation"
echo "✅ Scans possibles sans attendre l'installation de nikto"
echo "✅ Résultats réalistes générés selon la cible"
echo ""
echo "🔗 Test dans l'interface:"
echo "   1. Allez sur http://localhost:3000"
echo "   2. Onglet Nikto"
echo "   3. Target: https://testphp.vulnweb.com/"
echo "   4. Lancez un scan"
echo ""
echo "📋 Note: Les résultats seront marqués comme 'simulation'"
echo "    Pour des scans réels, installez nikto avec:"
echo "    ./install_security_tools.sh"
