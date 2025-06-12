#!/usr/bin/env python3
"""
Pacha Toolbox Backend v2.0 - Version finale corrigée sans duplication de routes
"""

import os
import sys
import json
import uuid
import signal
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# Obtenir le répertoire de base du projet
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Configuration des répertoires relatifs
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

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max

# Logger simple
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

# Créer les répertoires nécessaires
def ensure_directories():
    """Créer tous les répertoires nécessaires"""
    for name, path in DIRECTORIES.items():
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            logger.info(f"📁 Répertoire créé: {path}")

ensure_directories()

# Historique des scans (en mémoire pour les tests)
scan_history = []

# Configuration des rapports
REPORTS_CONFIG = {
    'reports_dir': DIRECTORIES['reports'],
    'reports_pdf_dir': DIRECTORIES['reports_pdf'],
    'formats': ['html', 'pdf', 'json', 'txt'],
    'retention_days': 30,
    'max_file_size': 100 * 1024 * 1024  # 100MB
}

# ==================== FONCTIONS UTILITAIRES ====================

def format_file_size(size_bytes):
    """Formater la taille de fichier"""
    if size_bytes == 0:
        return "0 B"
    elif size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024**2:
        return f"{size_bytes/1024:.1f} KB"
    elif size_bytes < 1024**3:
        return f"{size_bytes/(1024**2):.1f} MB"
    else:
        return f"{size_bytes/(1024**3):.1f} GB"

def get_all_tasks():
    """Récupérer toutes les tâches (simulation pour les tests)"""
    try:
        return [
            {
                'task_id': f'task_{i}',
                'tool': 'nmap' if i % 2 == 0 else 'nikto',
                'target': f'192.168.1.{i+1}',
                'status': 'completed' if i < 8 else 'failed',
                'created_at': (datetime.now() - timedelta(days=i)).isoformat(),
                'timestamp': (datetime.now() - timedelta(days=i)).isoformat(),
                'vulnerabilities': [f'vuln_{j}' for j in range(i % 5)]
            }
            for i in range(10)
        ]
    except Exception as e:
        logger.error(f"Erreur récupération tâches: {e}")
        return []

def create_report_data(tasks, report_type='comprehensive', period='7_days'):
    """Créer les données structurées du rapport - VERSION CORRIGÉE"""
    report_id = str(uuid.uuid4())[:8]
    
    # Filtrer les tâches par période
    now = datetime.now()
    if period == '24h':
        cutoff = now - timedelta(hours=24)
    elif period == '7_days':
        cutoff = now - timedelta(days=7)
    elif period == '30_days':
        cutoff = now - timedelta(days=30)
    else:
        cutoff = now - timedelta(days=365)  # all
    
    filtered_tasks = []
    for task in tasks:
        try:
            # Gérer différents formats de date possibles
            task_date = None
            if 'created_at' in task and task['created_at']:
                date_str = task['created_at']
                # Nettoyer la chaîne de date
                if 'Z' in date_str:
                    date_str = date_str.replace('Z', '+00:00')
                
                try:
                    task_date = datetime.fromisoformat(date_str.replace('Z', ''))
                except ValueError:
                    try:
                        # Essayer un autre format
                        task_date = datetime.strptime(date_str.split('+')[0], '%Y-%m-%dT%H:%M:%S')
                    except ValueError:
                        logger.warning(f"Format de date non reconnu: {date_str}")
                        task_date = now  # Date par défaut
            
            elif 'timestamp' in task and task['timestamp']:
                try:
                    task_date = datetime.fromisoformat(task['timestamp'].replace('Z', ''))
                except ValueError:
                    task_date = now  # Date par défaut
            else:
                task_date = now  # Date par défaut si aucune date
            
            # Vérifier si la tâche est dans la période
            if task_date and task_date >= cutoff:
                # S'assurer que la tâche a toutes les clés nécessaires
                cleaned_task = {
                    'task_id': task.get('task_id', task.get('scan_id', f'task_{len(filtered_tasks)}')),
                    'tool': task.get('tool', 'unknown'),
                    'target': task.get('target', 'unknown'),
                    'status': task.get('status', 'completed'),
                    'created_at': task_date.isoformat(),
                    'vulnerabilities': task.get('vulnerabilities', [])
                }
                filtered_tasks.append(cleaned_task)
                
        except Exception as e:
            logger.error(f"Erreur traitement tâche: {e}")
            # Ajouter la tâche avec des valeurs par défaut
            default_task = {
                'task_id': f'task_{len(filtered_tasks)}',
                'tool': task.get('tool', 'unknown'),
                'target': task.get('target', 'unknown'),
                'status': task.get('status', 'completed'),
                'created_at': now.isoformat(),
                'vulnerabilities': task.get('vulnerabilities', [])
            }
            filtered_tasks.append(default_task)
    
    # Analyser les données
    total_tasks = len(filtered_tasks)
    completed_tasks = len([t for t in filtered_tasks if t['status'] == 'completed'])
    failed_tasks = len([t for t in filtered_tasks if t['status'] == 'failed'])
    
    all_vulnerabilities = []
    for task in filtered_tasks:
        vulns = task.get('vulnerabilities', [])
        if isinstance(vulns, list):
            all_vulnerabilities.extend(vulns)
        elif isinstance(vulns, str):
            all_vulnerabilities.append(vulns)
    
    # Simuler des niveaux de sévérité
    vuln_high = len([v for v in all_vulnerabilities if any(word in str(v).lower() for word in ['critical', 'high', 'severe'])])
    vuln_medium = len([v for v in all_vulnerabilities if any(word in str(v).lower() for word in ['medium', 'moderate'])])
    vuln_low = len(all_vulnerabilities) - vuln_high - vuln_medium
    
    risk_score = min(100, (vuln_high * 10 + vuln_medium * 5 + vuln_low * 1))
    
    return {
        'metadata': {
            'report_id': report_id,
            'version': '2.0'
        },
        'title': f'Rapport de Sécurité - {period.replace("_", " ").title()}',
        'generated_at': now.isoformat(),
        'period': period,
        'type': report_type,
        'summary': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'failed_tasks': failed_tasks,
            'total_vulnerabilities': len(all_vulnerabilities),
            'vulnerabilities_by_severity': {
                'high': vuln_high,
                'medium': vuln_medium,
                'low': vuln_low
            },
            'risk_score': risk_score
        },
        'tasks': filtered_tasks,
        'recommendations': [
            {
                'title': 'Corriger les vulnérabilités critiques',
                'priority': 'high',
                'description': 'Traiter immédiatement les vulnérabilités de sévérité élevée'
            },
            {
                'title': 'Améliorer la configuration sécurisée',
                'priority': 'medium',
                'description': 'Réviser les configurations et durcir les services'
            }
        ]
    }

def generate_html_report(report_data):
    """Générer un rapport HTML stylisé"""
    ensure_directories()
    
    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{report_data['title']}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .header {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }}
        
        .title {{
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }}
        
        .subtitle {{
            color: #7f8c8d;
            font-size: 1.2em;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .stat-card {{
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }}
        
        .stat-card:hover {{
            transform: translateY(-5px);
        }}
        
        .stat-number {{
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .stat-label {{
            color: #7f8c8d;
            font-size: 1.1em;
        }}
        
        .high {{ color: #e74c3c; }}
        .medium {{ color: #f39c12; }}
        .low {{ color: #27ae60; }}
        .primary {{ color: #3498db; }}
        
        .section {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }}
        
        .section-title {{
            color: #2c3e50;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        
        .task-item {{
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 8px 8px 0;
        }}
        
        .task-status {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .status-completed {{
            background: #d4edda;
            color: #155724;
        }}
        
        .status-failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .recommendations {{
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            border-radius: 12px;
            padding: 25px;
        }}
        
        .recommendation {{
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }}
        
        .footer {{
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 30px;
        }}
        
        @media (max-width: 768px) {{
            .stats-grid {{
                grid-template-columns: 1fr;
            }}
            
            .title {{
                font-size: 2em;
            }}
            
            .container {{
                padding: 10px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🛡️ {report_data['title']}</h1>
            <p class="subtitle">Généré le {datetime.fromisoformat(report_data['generated_at']).strftime('%d/%m/%Y à %H:%M')}</p>
            <p class="subtitle">Rapport ID: {report_data['metadata']['report_id']}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number primary">{report_data['summary']['total_tasks']}</div>
                <div class="stat-label">Tâches Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number high">{report_data['summary']['vulnerabilities_by_severity']['high']}</div>
                <div class="stat-label">Vulnérabilités Critiques</div>
            </div>
            <div class="stat-card">
                <div class="stat-number medium">{report_data['summary']['vulnerabilities_by_severity']['medium']}</div>
                <div class="stat-label">Vulnérabilités Moyennes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number low">{report_data['summary']['vulnerabilities_by_severity']['low']}</div>
                <div class="stat-label">Vulnérabilités Basses</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📊 Résumé Exécutif</h2>
            <p><strong>Score de Risque:</strong> <span class="{'high' if report_data['summary']['risk_score'] > 70 else 'medium' if report_data['summary']['risk_score'] > 30 else 'low'}">{report_data['summary']['risk_score']}/100</span></p>
            <p><strong>Tâches Complétées:</strong> {report_data['summary']['completed_tasks']}/{report_data['summary']['total_tasks']}</p>
            <p><strong>Vulnérabilités Totales:</strong> {report_data['summary']['total_vulnerabilities']}</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">🔍 Détails des Tâches</h2>"""
    
    for task in report_data['tasks'][:10]:  # Limiter à 10 tâches pour l'affichage
        status_class = 'status-completed' if task['status'] == 'completed' else 'status-failed'
        html_content += f"""
            <div class="task-item">
                <span class="task-status {status_class}">{task['status'].upper()}</span>
                <h4>{task['tool'].upper()} - {task['target']}</h4>
                <p><strong>Date:</strong> {datetime.fromisoformat(task['created_at'].replace('Z', '')).strftime('%d/%m/%Y %H:%M')}</p>
                <p><strong>Vulnérabilités:</strong> {len(task.get('vulnerabilities', []))}</p>
            </div>"""
    
    html_content += f"""
        </div>
        
        <div class="recommendations">
            <h2 class="section-title" style="color: white; border-color: rgba(255,255,255,0.3);">💡 Recommandations</h2>"""
    
    for rec in report_data['recommendations']:
        priority_color = 'high' if rec['priority'] == 'high' else 'medium'
        html_content += f"""
            <div class="recommendation">
                <h4>🎯 {rec['title']} <span class="{priority_color}">({rec['priority'].upper()})</span></h4>
                <p>{rec['description']}</p>
            </div>"""
    
    html_content += f"""
        </div>
        
        <div class="footer">
            <p>📄 Rapport généré par Pacha Toolbox v2.0</p>
            <p>🕒 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>"""
    
    report_filename = f"report_{report_data['metadata']['report_id']}.html"
    report_path = os.path.join(REPORTS_CONFIG['reports_dir'], report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    logger.info(f"📄 Rapport HTML généré: {report_filename}")
    return report_path, report_filename

def generate_json_report(report_data):
    """Générer un rapport JSON"""
    ensure_directories()
    
    report_filename = f"report_{report_data['metadata']['report_id']}.json"
    report_path = os.path.join(REPORTS_CONFIG['reports_dir'], report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    return report_path, report_filename

# ==================== ROUTES DE BASE ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0',
        'message': 'Pacha Toolbox Backend opérationnel',
        'directories': {name: os.path.exists(path) for name, path in DIRECTORIES.items()}
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Status détaillé du système"""
    return jsonify({
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0',
        'uptime': '24h',
        'modules': {
            'reports': True,
            'scans': True,
            'network': True
        },
        'directories': {name: os.path.exists(path) for name, path in DIRECTORIES.items()}
    })

# ==================== ROUTES SCANS (UNIQUES) ====================

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    """Types de scans disponibles"""
    return jsonify({
        'scan_types': {
            'nmap': {
                'name': 'Nmap Network Scanner',
                'description': 'Scanner réseau pour découverte d\'hôtes et ports',
                'options': ['basic', 'comprehensive', 'stealth']
            },
            'nikto': {
                'name': 'Nikto Web Scanner',
                'description': 'Scanner de vulnérabilités web',
                'options': ['fast', 'comprehensive']
            }
        }
    })

@app.route('/api/scan/nmap', methods=['POST'])
def scan_nmap():
    """Scan Nmap simulé - VERSION CORRIGÉE UNIQUE"""
    try:
        data = request.get_json() or {}
        target = data.get('target', '127.0.0.1')
        scan_type = data.get('scan_type', 'basic')
        
        # Simuler un scan avec données cohérentes
        current_time = datetime.now()
        scan_result = {
            'scan_id': str(uuid.uuid4())[:8],
            'tool': 'nmap',
            'target': target,
            'scan_type': scan_type,
            'status': 'completed',
            'timestamp': current_time.isoformat(),
            'created_at': current_time.isoformat(),  # Important : ajouter created_at
            'duration': '3.7s',
            'results': {
                'hosts_discovered': 1 if target == '127.0.0.1' else 0,
                'ports_open': [22, 80, 443] if scan_type == 'comprehensive' else [80],
                'services': ['ssh', 'http', 'https'] if scan_type == 'comprehensive' else ['http'],
                'os_detection': 'Linux 5.x' if scan_type == 'comprehensive' else 'Unknown',
                'vulnerabilities': [
                    'SSH version disclosure',
                    'HTTP server headers exposed',
                    'Missing security headers'
                ] if scan_type == 'comprehensive' else ['HTTP server headers exposed']
            }
        }
        
        # Générer un rapport automatiquement avec gestion d'erreur améliorée
        try:
            # Utiliser la fonction corrigée
            report_data = create_report_data([scan_result], 'scan_report', '24h')
            report_path, report_filename = generate_html_report(report_data)
            
            scan_result['report_generated'] = True
            scan_result['report_filename'] = report_filename
            scan_result['report_url'] = f'/api/reports/download/{report_filename}'
            scan_result['report_preview_url'] = f'/api/reports/preview/{report_filename}'
            
            logger.info(f"✅ Rapport généré avec succès: {report_filename}")
            
        except Exception as e:
            logger.error(f"❌ Erreur génération rapport: {e}")
            scan_result['report_generated'] = False
            scan_result['report_error'] = str(e)
        
        # Ajouter à l'historique
        scan_history.insert(0, scan_result)
        if len(scan_history) > 100:
            scan_history.pop()
        
        return jsonify(scan_result)
        
    except Exception as e:
        logger.error(f"❌ Erreur scan nmap: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/nikto', methods=['POST'])
def scan_nikto():
    """Scan Nikto simulé - VERSION CORRIGÉE UNIQUE"""
    try:
        data = request.get_json() or {}
        target = data.get('target', 'http://127.0.0.1')
        scan_type = data.get('scan_type', 'fast')
        
        # Simuler des vulnérabilités selon le type de scan
        current_time = datetime.now()
        
        if scan_type == 'comprehensive':
            vulnerabilities = [
                'Server version disclosure (nginx/1.18.0)',
                'Missing security headers (X-Frame-Options, CSP)',
                'Directory traversal potential in /admin/',
                'XSS vulnerability in search parameter',
                'Backup files found (.bak, .old extensions)',
                'Information disclosure in HTTP headers',
                'Weak authentication mechanism detected'
            ]
            risk_level = 'high'
        else:
            vulnerabilities = [
                'Server version disclosure',
                'Missing X-Frame-Options header'
            ]
            risk_level = 'low'
        
        scan_result = {
            'scan_id': str(uuid.uuid4())[:8],
            'tool': 'nikto',
            'target': target,
            'scan_type': scan_type,
            'status': 'completed',
            'timestamp': current_time.isoformat(),
            'created_at': current_time.isoformat(),  # Important : ajouter created_at
            'duration': '12.8s',
            'results': {
                'vulnerabilities_found': len(vulnerabilities),
                'vulnerabilities': vulnerabilities,
                'risk_level': risk_level,
                'pages_tested': 156 if scan_type == 'comprehensive' else 45,
                'plugins_used': 23 if scan_type == 'comprehensive' else 8
            }
        }
        
        # Générer un rapport automatiquement avec gestion d'erreur améliorée
        try:
            report_data = create_report_data([scan_result], 'vulnerability_report', '24h')
            report_path, report_filename = generate_html_report(report_data)
            
            scan_result['report_generated'] = True
            scan_result['report_filename'] = report_filename
            scan_result['report_url'] = f'/api/reports/download/{report_filename}'
            scan_result['report_preview_url'] = f'/api/reports/preview/{report_filename}'
            
            logger.info(f"✅ Rapport généré avec succès: {report_filename}")
            
        except Exception as e:
            logger.error(f"❌ Erreur génération rapport: {e}")
            scan_result['report_generated'] = False
            scan_result['report_error'] = str(e)
        
        # Ajouter à l'historique
        scan_history.insert(0, scan_result)
        if len(scan_history) > 100:
            scan_history.pop()
        
        return jsonify(scan_result)
        
    except Exception as e:
        logger.error(f"❌ Erreur scan nikto: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scans/history', methods=['GET'])
def get_scan_history():
    """Historique des scans"""
    try:
        limit = request.args.get('limit', 50, type=int)
        tool_filter = request.args.get('tool')
        
        filtered_history = scan_history
        if tool_filter:
            filtered_history = [s for s in scan_history if s.get('tool') == tool_filter]
        
        return jsonify({
            'scans': filtered_history[:limit],
            'total': len(filtered_history),
            'limit': limit,
            'filters': {'tool': tool_filter} if tool_filter else {}
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur historique scans: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES RAPPORTS (UNIQUES) ====================

@app.route('/api/reports/test', methods=['GET'])
def test_reports():
    """Test du module de rapports"""
    ensure_directories()
    
    return jsonify({
        "message": "Module rapports fonctionnel !",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0",
        "status": "operational",
        "directories": {
            "reports": os.path.exists(REPORTS_CONFIG['reports_dir']),
            "reports_pdf": os.path.exists(REPORTS_CONFIG['reports_pdf_dir'])
        },
        "available_endpoints": [
            "/api/reports/test",
            "/api/reports/generate",
            "/api/reports/list",
            "/api/reports/download/<filename>",
            "/api/reports/preview/<filename>",
            "/api/reports/stats",
            "/api/reports/cleanup"
        ],
        "supported_formats": REPORTS_CONFIG['formats']
    })

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """Génération d'un nouveau rapport"""
    try:
        data = request.get_json() or {}
        
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
                "size_formatted": format_file_size(file_size),
                "download_url": f"/api/reports/download/{filename}",
                "preview_url": f"/api/reports/preview/{filename}",
                "report_id": report_data['metadata']['report_id'],
                "generated_at": report_data['generated_at']
            },
            "summary": report_data['summary']
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur génération rapport: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste des rapports disponibles"""
    try:
        ensure_directories()
        reports = []
        
        for directory, format_name in [(REPORTS_CONFIG['reports_dir'], 'HTML'), 
                                       (REPORTS_CONFIG['reports_pdf_dir'], 'PDF')]:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    if filename.startswith('report_') and any(filename.endswith(f'.{fmt}') for fmt in REPORTS_CONFIG['formats']):
                        file_path = os.path.join(directory, filename)
                        file_stats = os.stat(file_path)
                        
                        reports.append({
                            'filename': filename,
                            'size': file_stats.st_size,
                            'size_formatted': format_file_size(file_stats.st_size),
                            'created_at': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                            'modified_at': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                            'format': filename.split('.')[-1].upper(),
                            'download_url': f"/api/reports/download/{filename}",
                            'preview_url': f"/api/reports/preview/{filename}"
                        })
        
        # Tri par date de création (plus récent en premier)
        reports.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Statistiques
        stats = {
            'total': len(reports),
            'by_format': {},
            'total_size': sum(r['size'] for r in reports),
            'total_size_formatted': format_file_size(sum(r['size'] for r in reports))
        }
        
        for fmt in ['HTML', 'PDF', 'JSON', 'TXT']:
            stats['by_format'][fmt] = len([r for r in reports if r['format'] == fmt])
        
        return jsonify({
            "total": len(reports),
            "reports": reports,
            "stats": stats,
            "message": f"{len(reports)} rapports disponibles"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste rapports: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/download/<filename>', methods=['GET'])
def download_report(filename):
    """Téléchargement d'un rapport"""
    try:
        ensure_directories()
        safe_filename = os.path.basename(filename)
        
        # Chercher dans les deux répertoires
        for directory in [REPORTS_CONFIG['reports_dir'], REPORTS_CONFIG['reports_pdf_dir']]:
            file_path = os.path.join(directory, safe_filename)
            if os.path.exists(file_path):
                logger.info(f"📥 Téléchargement: {safe_filename}")
                return send_file(file_path, as_attachment=True, download_name=safe_filename)
        
        return jsonify({"error": "Rapport non trouvé"}), 404
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement rapport: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/preview/<filename>', methods=['GET'])
def preview_report(filename):
    """Prévisualisation d'un rapport"""
    try:
        ensure_directories()
        safe_filename = os.path.basename(filename)
        
        # Chercher dans les répertoires
        for directory in [REPORTS_CONFIG['reports_dir'], REPORTS_CONFIG['reports_pdf_dir']]:
            file_path = os.path.join(directory, safe_filename)
            if os.path.exists(file_path):
                if safe_filename.endswith('.html'):
                    logger.info(f"👁️ Prévisualisation HTML: {safe_filename}")
                    return send_file(file_path, mimetype='text/html')
                elif safe_filename.endswith('.json'):
                    logger.info(f"👁️ Prévisualisation JSON: {safe_filename}")
                    return send_file(file_path, mimetype='application/json')
                else:
                    return jsonify({"error": "Type de fichier non prévisualisable"}), 400
        
        return jsonify({"error": "Rapport non trouvé"}), 404
        
    except Exception as e:
        logger.error(f"❌ Erreur prévisualisation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/stats', methods=['GET'])
def get_reports_stats():
    """Statistiques des rapports"""
    try:
        ensure_directories()
        
        stats = {
            'total_files': 0,
            'total_size': 0,
            'total_size_formatted': '0 B',
            'by_format': {'HTML': 0, 'PDF': 0, 'JSON': 0, 'TXT': 0},
            'by_date': {},
            'oldest_report': None,
            'newest_report': None
        }
        
        all_files = []
        
        # Analyser tous les fichiers
        for directory in [REPORTS_CONFIG['reports_dir'], REPORTS_CONFIG['reports_pdf_dir']]:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    if filename.startswith('report_'):
                        file_path = os.path.join(directory, filename)
                        file_stats = os.stat(file_path)
                        
                        file_info = {
                            'filename': filename,
                            'size': file_stats.st_size,
                            'created': datetime.fromtimestamp(file_stats.st_ctime),
                            'format': filename.split('.')[-1].upper()
                        }
                        all_files.append(file_info)
        
        if all_files:
            stats['total_files'] = len(all_files)
            stats['total_size'] = sum(f['size'] for f in all_files)
            stats['total_size_formatted'] = format_file_size(stats['total_size'])
            
            # Par format
            for file_info in all_files:
                fmt = file_info['format']
                if fmt in stats['by_format']:
                    stats['by_format'][fmt] += 1
            
            # Dates
            sorted_files = sorted(all_files, key=lambda x: x['created'])
            stats['oldest_report'] = sorted_files[0]['created'].isoformat()
            stats['newest_report'] = sorted_files[-1]['created'].isoformat()
            
            # Par date
            for file_info in all_files:
                date_key = file_info['created'].strftime('%Y-%m-%d')
                stats['by_date'][date_key] = stats['by_date'].get(date_key, 0) + 1
        
        return jsonify({
            "stats": stats,
            "message": f"Statistiques pour {stats['total_files']} rapports"
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur statistiques rapports: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/cleanup', methods=['POST'])
def cleanup_old_reports():
    """Nettoyage des anciens rapports"""
    try:
        ensure_directories()
        data = request.get_json() or {}
        
        retention_days = data.get('retention_days', REPORTS_CONFIG['retention_days'])
        dry_run = data.get('dry_run', False)
        
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        deleted_files = []
        total_size_freed = 0
        
        for directory in [REPORTS_CONFIG['reports_dir'], REPORTS_CONFIG['reports_pdf_dir']]:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    if filename.startswith('report_'):
                        file_path = os.path.join(directory, filename)
                        if os.path.isfile(file_path):
                            file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                            if file_time < cutoff_date:
                                file_size = os.path.getsize(file_path)
                                total_size_freed += file_size
                                
                                if not dry_run:
                                    os.remove(file_path)
                                    logger.info(f"🗑️ Fichier supprimé: {filename}")
                                
                                deleted_files.append({
                                    'filename': filename,
                                    'size': file_size,
                                    'size_formatted': format_file_size(file_size),
                                    'created': file_time.isoformat()
                                })
        
        return jsonify({
            "message": f"Nettoyage {'simulé' if dry_run else 'terminé'}",
            "deleted_files_count": len(deleted_files),
            "deleted_files": deleted_files,
            "total_size_freed": total_size_freed,
            "total_size_freed_formatted": format_file_size(total_size_freed),
            "retention_days": retention_days,
            "dry_run": dry_run
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur nettoyage rapports: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== ROUTES RÉSEAU ====================

@app.route('/api/network/interfaces', methods=['GET'])
def get_network_interfaces():
    """Interfaces réseau disponibles"""
    return jsonify({
        'interfaces': [
            {'name': 'eth0', 'ip': '192.168.1.100', 'status': 'up'},
            {'name': 'lo', 'ip': '127.0.0.1', 'status': 'up'}
        ]
    })

@app.route('/api/network/captures/active', methods=['GET'])
def get_active_captures():
    """Captures réseau actives"""
    return jsonify({
        'active_captures': [],
        'total_active': 0,
        'message': 'Aucune capture active'
    })

@app.route('/api/network/captures/history', methods=['GET'])
def get_captures_history():
    """Historique des captures réseau"""
    limit = request.args.get('limit', 10, type=int)
    return jsonify({
        'captures': [],
        'total': 0,
        'limit': limit,
        'message': 'Aucune capture dans l\'historique'
    })

# ==================== GESTIONNAIRES D'ERREURS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'message': 'Vérifiez l\'URL de l\'API',
        'available_endpoints': [
            '/api/health',
            '/api/status',
            '/api/scan/types',
            '/api/scan/nmap',
            '/api/scan/nikto',
            '/api/scans/history',
            '/api/reports/test',
            '/api/reports/list',
            '/api/reports/generate',
            '/api/reports/stats',
            '/api/reports/cleanup',
            '/api/network/interfaces',
            '/api/network/captures/active',
            '/api/network/captures/history'
        ]
    }), 404

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        'error': 'Fichier trop volumineux',
        'message': 'La taille du fichier dépasse la limite autorisée'
    }), 413

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur interne du serveur: {error}")
    return jsonify({
        'error': 'Erreur interne du serveur',
        'message': 'Une erreur inattendue s\'est produite'
    }), 500

# ==================== CRÉATION DE RAPPORTS DE TEST ====================

def create_test_reports():
    """Créer quelques rapports de test au démarrage - VERSION CORRIGÉE"""
    try:
        ensure_directories()
        
        # Données de tâches simulées avec created_at cohérent
        test_tasks = []
        for i in range(15):
            task_date = datetime.now() - timedelta(hours=i*2)
            task = {
                'task_id': f'test_task_{i}',
                'scan_id': f'scan_{i}',
                'tool': 'nmap' if i % 2 == 0 else 'nikto',
                'target': f'192.168.1.{i+10}',
                'status': 'completed' if i < 12 else 'failed',
                'created_at': task_date.isoformat(),
                'timestamp': task_date.isoformat(),
                'vulnerabilities': [f'vuln_{j}' for j in range((i % 4) + 1)]
            }
            test_tasks.append(task)
        
        # Créer plusieurs rapports avec différentes périodes
        periods = ['24h', '7_days', '30_days']
        types = ['comprehensive', 'security_focus', 'network_scan']
        
        created_reports = []
        
        for i, (period, report_type) in enumerate(zip(periods, types)):
            try:
                report_data = create_report_data(test_tasks, report_type, period)
                report_path, filename = generate_html_report(report_data)
                
                created_reports.append({
                    'filename': filename,
                    'path': report_path,
                    'period': period,
                    'type': report_type
                })
                
                logger.info(f"✅ Rapport de test créé: {filename}")
            except Exception as e:
                logger.error(f"❌ Erreur création rapport {i}: {e}")
        
        if created_reports:
            logger.info(f"🎉 {len(created_reports)} rapports de test créés avec succès!")
        
        return created_reports
        
    except Exception as e:
        logger.error(f"❌ Erreur création rapports de test: {e}")
        return []

# ==================== GESTIONNAIRE DE SIGNAUX ====================

def signal_handler(sig, frame):
    logger.info("🛑 Arrêt du serveur demandé")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ==================== DÉMARRAGE ====================

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend v2.0")
    logger.info("🌐 CORS configuré pour localhost:3000")
    logger.info("📁 Répertoires initialisés")
    
    # Créer des rapports de test au démarrage
    create_test_reports()
    
    try:
        app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
    except Exception as e:
        logger.error(f"❌ Erreur démarrage serveur: {e}")
        sys.exit(1)