# backend/app/routes/reports.py
from flask import Blueprint, request, jsonify, send_file
import os
import json
import uuid
from datetime import datetime, timedelta
import logging
from jinja2 import Template
import base64

reports_bp = Blueprint("reports", __name__)
logger = logging.getLogger(__name__)

# Configuration des rapports
REPORTS_CONFIG = {
    'formats': ['json', 'html', 'txt', 'csv'],
    'templates_dir': '/app/templates',
    'reports_dir': '/app/reports',
    'retention_days': 30
}

# Créer le répertoire des templates s'il n'existe pas
os.makedirs(REPORTS_CONFIG['templates_dir'], exist_ok=True)

def create_html_template():
    """Création du template HTML pour les rapports"""
    html_template = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Pacha Toolbox - {{ report_data.title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .section {
            background: white;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        
        .summary-card h3 {
            color: #4a5568;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        
        .summary-card .number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .task-item {
            background: #f8fafc;
            border-left: 4px solid #e2e8f0;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0 8px 8px 0;
        }
        
        .task-item.completed {
            border-left-color: #10b981;
        }
        
        .task-item.failed {
            border-left-color: #ef4444;
        }
        
        .task-item.running {
            border-left-color: #3b82f6;
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .task-type {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }
        
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .status-completed {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        }
        
        .status-failed {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        }
        
        .status-running {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
        }
        
        .vulnerabilities {
            margin-top: 1rem;
        }
        
        .vuln-item {
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-radius: 5px;
        }
        
        .vuln-high {
            border-left: 4px solid #dc2626;
        }
        
        .vuln-medium {
            border-left: 4px solid #f59e0b;
        }
        
        .vuln-low {
            border-left: 4px solid #10b981;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            margin-top: 2rem;
        }
        
        .metadata {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 5px;
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        @media print {
            body { background: white; }
            .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ {{ report_data.title }}</h1>
            <div class="subtitle">{{ report_data.description }}</div>
            <div class="metadata">
                <strong>Généré le:</strong> {{ report_data.generated_at }}<br>
                <strong>Période:</strong> {{ report_data.period }}<br>
                <strong>Type:</strong> {{ report_data.type }}
            </div>
        </div>

        <!-- Résumé exécutif -->
        <div class="section">
            <h2>📊 Résumé Exécutif</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Tâches Totales</h3>
                    <div class="number">{{ report_data.summary.total_tasks }}</div>
                </div>
                <div class="task-details">
                    <p><strong>Cible:</strong> {{ task.target }}</p>
                    <p><strong>Créé:</strong> {{ task.created_at }}</p>
                    {% if task.completed_at %}
                    <p><strong>Terminé:</strong> {{ task.completed_at }}</p>
                    {% endif %}
                    {% if task.error %}
                    <p><strong>Erreur:</strong> <span style="color: #dc2626;">{{ task.error }}</span></p>
                    {% endif %}
                    {% if task.vulnerabilities %}
                    <div class="vulnerabilities">
                        <h4>Vulnérabilités trouvées:</h4>
                        {% for vuln in task.vulnerabilities %}
                        <div class="vuln-item vuln-{{ vuln.severity }}">
                            <strong>{{ vuln.title }}</strong><br>
                            {{ vuln.description }}
                        </div>
                        {% endfor %}
                    </div>
                    {% endif %}
                </div>
            </div>
            {% endfor %}
        </div>

        <!-- Recommandations -->
        <div class="section">
            <h2>💡 Recommandations</h2>
            {% for recommendation in report_data.recommendations %}
            <div class="vuln-item vuln-{{ recommendation.priority }}">
                <strong>{{ recommendation.title }}</strong><br>
                {{ recommendation.description }}
            </div>
            {% endfor %}
        </div>

        <div class="footer">
            <p>Rapport généré par Pacha Toolbox v2.0</p>
            <p>© 2025 - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
    """
    
    template_path = os.path.join(REPORTS_CONFIG['templates_dir'], 'report_template.html')
    with open(template_path, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    return template_path

def get_all_tasks():
    """Récupération de toutes les tâches depuis les différents modules"""
    all_tasks = []
    
    # Import des tâches des différents modules
    try:
        from app.routes.scan import active_tasks as scan_tasks
        all_tasks.extend(scan_tasks.values())
    except ImportError:
        logger.warning("Module scan non disponible pour les rapports")
    
    try:
        from app.routes.reconnaissance import recon_tasks
        all_tasks.extend(recon_tasks.values())
    except ImportError:
        logger.warning("Module reconnaissance non disponible pour les rapports")
    
    try:
        from app.routes.exploitation import exploit_tasks
        all_tasks.extend(exploit_tasks.values())
    except ImportError:
        logger.warning("Module exploitation non disponible pour les rapports")
    
    return all_tasks

def analyze_tasks_for_report(tasks):
    """Analyse des tâches pour génération de rapport"""
    analysis = {
        'total_tasks': len(tasks),
        'completed_tasks': 0,
        'failed_tasks': 0,
        'running_tasks': 0,
        'total_vulnerabilities': 0,
        'risk_score': 0,
        'task_types': {},
        'vulnerabilities_by_severity': {'high': 0, 'medium': 0, 'low': 0}
    }
    
    for task in tasks:
        # Comptage par statut
        if task['status'] == 'completed':
            analysis['completed_tasks'] += 1
        elif task['status'] == 'failed':
            analysis['failed_tasks'] += 1
        elif task['status'] == 'running':
            analysis['running_tasks'] += 1
        
        # Comptage par type
        task_type = task.get('type', 'unknown')
        analysis['task_types'][task_type] = analysis['task_types'].get(task_type, 0) + 1
        
        # Analyse des vulnérabilités
        if task.get('result'):
            result = task['result']
            
            # Scan de vulnérabilités
            if 'vulnerabilities_found' in result:
                analysis['total_vulnerabilities'] += result['vulnerabilities_found']
                analysis['risk_score'] += result['vulnerabilities_found'] * 2
            
            # Ports ouverts
            if 'open_ports' in result:
                open_ports_count = len(result['open_ports']) if isinstance(result['open_ports'], list) else result.get('open_count', 0)
                analysis['risk_score'] += open_ports_count
            
            # Analyse des risques spécifiques
            if 'risk_analysis' in result:
                risk_analysis = result['risk_analysis']
                if isinstance(risk_analysis, dict):
                    analysis['vulnerabilities_by_severity']['high'] += len(risk_analysis.get('high_risk', []))
                    analysis['vulnerabilities_by_severity']['medium'] += len(risk_analysis.get('medium_risk', []))
                    analysis['vulnerabilities_by_severity']['low'] += len(risk_analysis.get('low_risk', []))
    
    return analysis

def generate_recommendations(analysis, tasks):
    """Génération de recommandations basées sur l'analyse"""
    recommendations = []
    
    # Recommandations basées sur les vulnérabilités
    if analysis['vulnerabilities_by_severity']['high'] > 0:
        recommendations.append({
            'title': 'Vulnérabilités Critiques Détectées',
            'description': f"Corrigez immédiatement les {analysis['vulnerabilities_by_severity']['high']} vulnérabilités à haut risque identifiées.",
            'priority': 'high'
        })
    
    if analysis['total_vulnerabilities'] > 10:
        recommendations.append({
            'title': 'Révision de la Sécurité Globale',
            'description': f"Avec {analysis['total_vulnerabilities']} vulnérabilités détectées, une révision complète de la sécurité est recommandée.",
            'priority': 'high'
        })
    
    # Recommandations basées sur les ports ouverts
    open_ports_total = sum(len(task.get('result', {}).get('open_ports', [])) for task in tasks if task.get('result'))
    if open_ports_total > 20:
        recommendations.append({
            'title': 'Réduction de la Surface d\'Attaque',
            'description': f"Fermez les ports non essentiels parmi les {open_ports_total} ports ouverts détectés.",
            'priority': 'medium'
        })
    
    # Recommandations basées sur les échecs
    if analysis['failed_tasks'] > analysis['completed_tasks'] * 0.3:
        recommendations.append({
            'title': 'Amélioration de la Configuration',
            'description': "Taux d'échec élevé détecté. Vérifiez la configuration des outils et la connectivité réseau.",
            'priority': 'medium'
        })
    
    # Recommandations générales
    recommendations.append({
        'title': 'Tests Réguliers',
        'description': "Programmez des tests d'intrusion réguliers pour maintenir un niveau de sécurité optimal.",
        'priority': 'low'
    })
    
    return recommendations

def create_report_data(tasks, report_type="comprehensive", period="7_days"):
    """Création des données structurées pour le rapport"""
    analysis = analyze_tasks_for_report(tasks)
    recommendations = generate_recommendations(analysis, tasks)
    
    # Filtrage des tâches par période
    if period == "24_hours":
        cutoff_date = datetime.now() - timedelta(hours=24)
        period_label = "Dernières 24 heures"
    elif period == "7_days":
        cutoff_date = datetime.now() - timedelta(days=7)
        period_label = "7 derniers jours"
    elif period == "30_days":
        cutoff_date = datetime.now() - timedelta(days=30)
        period_label = "30 derniers jours"
    else:
        cutoff_date = datetime.now() - timedelta(days=365)
        period_label = "Toutes les données"
    
    # Filtrage des tâches
    filtered_tasks = []
    for task in tasks:
        try:
            task_date = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
            if task_date >= cutoff_date:
                # Préparation des données de vulnérabilités pour le template
                task_copy = task.copy()
                task_copy['vulnerabilities'] = []
                
                if task.get('result') and 'risk_analysis' in task['result']:
                    risk_analysis = task['result']['risk_analysis']
                    if isinstance(risk_analysis, dict):
                        for vuln in risk_analysis.get('high_risk', []):
                            task_copy['vulnerabilities'].append({
                                'title': 'Vulnérabilité Haute',
                                'description': vuln,
                                'severity': 'high'
                            })
                        for vuln in risk_analysis.get('medium_risk', []):
                            task_copy['vulnerabilities'].append({
                                'title': 'Vulnérabilité Moyenne',
                                'description': vuln,
                                'severity': 'medium'
                            })
                
                # Ajout de la cible formatée
                task_copy['target'] = task.get('data', {}).get('target', 'N/A')
                task_copy['completed_at'] = task.get('updated_at', '')
                
                filtered_tasks.append(task_copy)
        except:
            # Si la date n'est pas parsable, on inclut la tâche
            filtered_tasks.append(task)
    
    # Recalcul de l'analyse pour les tâches filtrées
    filtered_analysis = analyze_tasks_for_report(filtered_tasks)
    
    report_data = {
        'title': f'Rapport de Tests d\'Intrusion - {report_type.title()}',
        'description': f'Analyse complète des tests d\'intrusion effectués',
        'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'period': period_label,
        'type': report_type,
        'summary': filtered_analysis,
        'tasks': filtered_tasks,
        'recommendations': recommendations,
        'metadata': {
            'total_tasks_analyzed': len(filtered_tasks),
            'report_id': str(uuid.uuid4()),
            'version': '2.0'
        }
    }
    
    return report_data

def generate_html_report(report_data):
    """Génération d'un rapport HTML"""
    template_path = create_html_template()
    
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    template = Template(template_content)
    html_content = template.render(report_data=report_data)
    
    # Sauvegarde du rapport
    report_filename = f"report_{report_data['metadata']['report_id']}.html"
    report_path = os.path.join(REPORTS_CONFIG['reports_dir'], report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_path, report_filename

def generate_json_report(report_data):
    """Génération d'un rapport JSON"""
    report_filename = f"report_{report_data['metadata']['report_id']}.json"
    report_path = os.path.join(REPORTS_CONFIG['reports_dir'], report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
    
    return report_path, report_filename

def generate_txt_report(report_data):
    """Génération d'un rapport texte"""
    report_content = f"""
RAPPORT DE TESTS D'INTRUSION - PACHA TOOLBOX
============================================

Titre: {report_data['title']}
Généré le: {report_data['generated_at']}
Période: {report_data['period']}
Type: {report_data['type']}

RÉSUMÉ EXÉCUTIF
===============
- Tâches totales: {report_data['summary']['total_tasks']}
- Tâches complétées: {report_data['summary']['completed_tasks']}
- Tâches échouées: {report_data['summary']['failed_tasks']}
- Vulnérabilités détectées: {report_data['summary']['total_vulnerabilities']}
- Score de risque: {report_data['summary']['risk_score']}

RÉPARTITION PAR SÉVÉRITÉ
========================
- Vulnérabilités hautes: {report_data['summary']['vulnerabilities_by_severity']['high']}
- Vulnérabilités moyennes: {report_data['summary']['vulnerabilities_by_severity']['medium']}
- Vulnérabilités basses: {report_data['summary']['vulnerabilities_by_severity']['low']}

DÉTAILS DES TÂCHES
==================
"""
    
    for i, task in enumerate(report_data['tasks'], 1):
        report_content += f"""
Tâche {i}: {task['type']}
-------------------------
- Statut: {task['status']}
- Cible: {task.get('target', 'N/A')}
- Créé: {task['created_at']}
"""
        if task.get('error'):
            report_content += f"- Erreur: {task['error']}\n"
        
        if task.get('vulnerabilities'):
            report_content += f"- Vulnérabilités trouvées: {len(task['vulnerabilities'])}\n"
    
    report_content += f"""

RECOMMANDATIONS
===============
"""
    
    for i, rec in enumerate(report_data['recommendations'], 1):
        report_content += f"""
{i}. {rec['title']} (Priorité: {rec['priority']})
   {rec['description']}
"""
    
    report_content += f"""

---
Rapport généré par Pacha Toolbox v2.0
ID du rapport: {report_data['metadata']['report_id']}
"""
    
    report_filename = f"report_{report_data['metadata']['report_id']}.txt"
    report_path = os.path.join(REPORTS_CONFIG['reports_dir'], report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    return report_path, report_filename

# Routes de l'API des rapports
@reports_bp.route("/test", methods=["GET"])
def test_reports():
    """Test du module de rapports"""
    return jsonify({
        "message": "Module rapports fonctionnel !",
        "version": "1.0",
        "available_endpoints": [
            "/api/reports/generate",
            "/api/reports/list",
            "/api/reports/download/<filename>",
            "/api/reports/summary",
            "/api/reports/cleanup"
        ],
        "supported_formats": REPORTS_CONFIG['formats']
    })

@reports_bp.route("/generate", methods=["POST"])
def generate_report():
    """Génération d'un nouveau rapport"""
    try:
        data = request.get_json() or {}
        
        # Paramètres du rapport
        report_format = data.get('format', 'html').lower()
        report_type = data.get('type', 'comprehensive')
        period = data.get('period', '7_days')
        
        if report_format not in REPORTS_CONFIG['formats']:
            return jsonify({
                "error": f"Format non supporté. Formats disponibles: {REPORTS_CONFIG['formats']}"
            }), 400
        
        # Récupération des tâches
        all_tasks = get_all_tasks()
        
        if not all_tasks:
            return jsonify({
                "warning": "Aucune tâche trouvée pour générer le rapport",
                "message": "Exécutez quelques scans avant de générer un rapport"
            }), 200
        
        # Création des données du rapport
        report_data = create_report_data(all_tasks, report_type, period)
        
        # Génération selon le format
        if report_format == 'html':
            report_path, filename = generate_html_report(report_data)
        elif report_format == 'json':
            report_path, filename = generate_json_report(report_data)
        elif report_format == 'txt':
            report_path, filename = generate_txt_report(report_data)
        else:
            return jsonify({"error": f"Format {report_format} pas encore implémenté"}), 400
        
        # Informations sur le fichier généré
        file_size = os.path.getsize(report_path)
        
        return jsonify({
            "message": "Rapport généré avec succès",
            "report": {
                "filename": filename,
                "format": report_format,
                "size": file_size,
                "download_url": f"/api/reports/download/{filename}",
                "report_id": report_data['metadata']['report_id'],
                "generated_at": report_data['generated_at']
            },
            "summary": report_data['summary']
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur génération rapport: {e}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/list", methods=["GET"])
def list_reports():
    """Liste des rapports disponibles"""
    try:
        reports = []
        reports_dir = REPORTS_CONFIG['reports_dir']
        
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                if filename.startswith('report_') and any(filename.endswith(f'.{fmt}') for fmt in REPORTS_CONFIG['formats']):
                    file_path = os.path.join(reports_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    reports.append({
                        'filename': filename,
                        'size': file_stats.st_size,
                        'created_at': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'modified_at': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        'format': filename.split('.')[-1],
                        'download_url': f"/api/reports/download/{filename}"
                    })
        
        # Tri par date de création (plus récent en premier)
        reports.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "total_reports": len(reports),
            "reports": reports
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste rapports: {e}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/download/<filename>", methods=["GET"])
def download_report(filename):
    """Téléchargement d'un rapport"""
    try:
        # Sécurisation du nom de fichier
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(REPORTS_CONFIG['reports_dir'], safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Rapport non trouvé"}), 404
        
        return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement rapport: {e}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/summary", methods=["GET"])
def get_reports_summary():
    """Résumé des activités pour tableau de bord"""
    try:
        all_tasks = get_all_tasks()
        analysis = analyze_tasks_for_report(all_tasks)
        
        # Statistiques par période
        now = datetime.now()
        stats_24h = len([t for t in all_tasks if datetime.fromisoformat(t['created_at'].replace('Z', '+00:00')) >= now - timedelta(hours=24)])
        stats_7d = len([t for t in all_tasks if datetime.fromisoformat(t['created_at'].replace('Z', '+00:00')) >= now - timedelta(days=7)])
        stats_30d = len([t for t in all_tasks if datetime.fromisoformat(t['created_at'].replace('Z', '+00:00')) >= now - timedelta(days=30)])
        
        return jsonify({
            "global_analysis": analysis,
            "period_stats": {
                "last_24h": stats_24h,
                "last_7d": stats_7d,
                "last_30d": stats_30d
            },
            "recent_activity": all_tasks[-5:] if all_tasks else []
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur résumé rapports: {e}")
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/cleanup", methods=["POST"])
def cleanup_old_reports():
    """Nettoyage des anciens rapports"""
    try:
        data = request.get_json() or {}
        retention_days = data.get('retention_days', REPORTS_CONFIG['retention_days'])
        
        reports_dir = REPORTS_CONFIG['reports_dir']
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        deleted_files = []
        
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                file_path = os.path.join(reports_dir, filename)
                if os.path.isfile(file_path):
                    file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                    if file_time < cutoff_date:
                        os.remove(file_path)
                        deleted_files.append(filename)
        
        return jsonify({
            "message": f"Nettoyage terminé",
            "deleted_files": len(deleted_files),
            "files": deleted_files,
            "retention_days": retention_days
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur nettoyage rapports: {e}")
        return jsonify({"error": str(e)}), 500