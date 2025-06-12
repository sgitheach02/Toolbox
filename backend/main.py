# backend/main.py - Pacha Toolbox API v2.0 - Architecture propre et unifiée
import os
import sys
import logging
import json
import uuid
import subprocess
import threading
import signal
import time
import shutil
import math
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS
import xml.etree.ElementTree as ET

# ==================== CONFIGURATION ====================

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'application Flask
app = Flask(__name__)

# Configuration CORS permissive
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://frontend:3000"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Configuration des répertoires
DIRECTORIES = {
    'reports': '/app/reports',
    'reports_pdf': '/app/reports/pdf', 
    'logs': '/app/logs',
    'data': '/app/data',
    'temp': '/app/temp',
    'captures': '/app/captures'
}

# Création des répertoires nécessaires
for directory in DIRECTORIES.values():
    os.makedirs(directory, exist_ok=True)

# Configuration des outils
TOOL_CONFIG = {
    "scan_tools": {
        "nmap": {
            "name": "Network Mapper",
            "description": "Scanner de réseau et de ports",
            "executable": "nmap",
            "available": False,
            "icon": "🔍",
            "color": "#3b82f6"
        },
        "nikto": {
            "name": "Web Vulnerability Scanner", 
            "description": "Scanner de vulnérabilités web",
            "executable": "nikto",
            "available": False,
            "icon": "🌐",
            "color": "#06b6d4"
        }
    },
    "network_tools": {
        "tcpdump": {
            "name": "Packet Capture",
            "description": "Capture de paquets réseau",
            "executable": "tcpdump",
            "available": False,
            "icon": "📡",
            "color": "#10b981"
        },
        "tshark": {
            "name": "Wireshark CLI",
            "description": "Analyse de paquets en ligne de commande",
            "executable": "tshark",
            "available": False,
            "icon": "🔬",
            "color": "#8b5cf6"
        }
    }
}

# Types de scans disponibles
SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Scan Basique",
            "description": "Détection d'hôtes actifs",
            "args": "-sn",
            "icon": "🔍",
            "color": "#3b82f6",
            "duration": "rapide"
        },
        "ports": {
            "name": "Scan de Ports",
            "description": "Scan des ports les plus courants",
            "args": "-sS --top-ports 1000",
            "icon": "🔌",
            "color": "#10b981",
            "duration": "moyen"
        },
        "services": {
            "name": "Détection de Services",
            "description": "Identification des services et versions",
            "args": "-sV",
            "icon": "🛠️",
            "color": "#f59e0b",
            "duration": "long"
        },
        "stealth": {
            "name": "Scan Furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2",
            "icon": "🥷",
            "color": "#8b5cf6",
            "duration": "très long"
        },
        "aggressive": {
            "name": "Scan Agressif",
            "description": "Scan complet avec détection OS",
            "args": "-A -T4",
            "icon": "💥",
            "color": "#ef4444",
            "duration": "long"
        },
        "vulnerability": {
            "name": "Détection Vulnérabilités",
            "description": "Scan avec scripts de vulnérabilités",
            "args": "--script vuln",
            "icon": "🛡️",
            "color": "#dc2626",
            "duration": "très long"
        }
    },
    "nikto": {
        "basic": {
            "name": "Scan Web Basique",
            "description": "Scan de vulnérabilités web standard",
            "args": "-h {target}",
            "icon": "🌐",
            "color": "#06b6d4",
            "duration": "moyen"
        },
        "comprehensive": {
            "name": "Scan Complet",
            "description": "Analyse complète avec tous les plugins",
            "args": "-h {target} -Plugins @@ALL",
            "icon": "🔍",
            "color": "#dc2626",
            "duration": "très long"
        },
        "fast": {
            "name": "Scan Rapide",
            "description": "Scan rapide des vulnérabilités critiques",
            "args": "-h {target} -Fast",
            "icon": "⚡",
            "color": "#10b981",
            "duration": "rapide"
        }
    }
}

# Stockage global des activités
active_scans = {}
active_captures = {}
scan_history = []
capture_history = []

# ==================== UTILITAIRES ====================

class Utils:
    @staticmethod
    def format_file_size(size_bytes):
        """Formatage de la taille des fichiers"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return f"{s} {size_names[i]}"

    @staticmethod
    def check_tool_availability():
        """Vérifie la disponibilité des outils"""
        all_tools = {**TOOL_CONFIG["scan_tools"], **TOOL_CONFIG["network_tools"]}
        
        for tool_name, tool_info in all_tools.items():
            try:
                subprocess.run(['which', tool_info["executable"]], 
                             check=True, capture_output=True)
                tool_info["available"] = True
                logger.info(f"✅ {tool_name} disponible")
            except:
                tool_info["available"] = False
                logger.warning(f"❌ {tool_name} non disponible")

    @staticmethod
    def generate_scan_id(tool):
        """Génère un ID unique pour un scan"""
        return f"{tool}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    @staticmethod
    def generate_capture_id():
        """Génère un ID unique pour une capture"""
        return f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    @staticmethod
    def detect_tool_type_from_filename(filename):
        """Détecte le type d'outil depuis le nom de fichier"""
        filename_lower = filename.lower()
        if 'nmap' in filename_lower:
            return 'nmap'
        elif 'nikto' in filename_lower:
            return 'nikto'
        elif 'tcpdump' in filename_lower:
            return 'tcpdump'
        return 'unknown'

    @staticmethod
    def detect_tool_type_from_content(file_path):
        """Détecte le type d'outil depuis le contenu du fichier"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content_sample = f.read(500).lower()
                if 'nmap' in content_sample:
                    return 'nmap'
                elif 'nikto' in content_sample:
                    return 'nikto'
                elif 'tcpdump' in content_sample or 'packet' in content_sample:
                    return 'tcpdump'
        except:
            pass
        return 'unknown'

# ==================== GÉNÉRATEUR DE RAPPORTS ====================

class ReportGenerator:
    @staticmethod
    def generate_html_report(scan_data):
        """Génère un rapport HTML esthétique"""
        tool = scan_data['tool']
        scan_id = scan_data['scan_id']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"rapport_{tool}_{timestamp}_{scan_id[-8:]}.html"
        file_path = os.path.join(DIRECTORIES['reports'], filename)
        
        # Template HTML moderne
        html_content = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport {tool.upper()} - {scan_data.get('target', 'N/A')}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }}
        .header {{
            background: {TOOL_CONFIG['scan_tools'].get(tool, {}).get('color', '#3b82f6')};
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }}
        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }}
        .header p {{
            font-size: 1.2rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }}
        .icon {{
            font-size: 4rem;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }}
        .content {{
            padding: 40px;
        }}
        .section {{
            margin-bottom: 40px;
            background: #f8fafc;
            border-radius: 15px;
            padding: 30px;
            border-left: 5px solid {TOOL_CONFIG['scan_tools'].get(tool, {}).get('color', '#3b82f6')};
        }}
        .section h2 {{
            color: {TOOL_CONFIG['scan_tools'].get(tool, {}).get('color', '#3b82f6')};
            margin-bottom: 20px;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }}
        .info-item {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }}
        .info-label {{
            font-weight: bold;
            color: #64748b;
            font-size: 0.9rem;
            text-transform: uppercase;
            margin-bottom: 5px;
        }}
        .info-value {{
            font-size: 1.1rem;
            color: #1e293b;
        }}
        .results-list {{
            list-style: none;
        }}
        .results-list li {{
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid {TOOL_CONFIG['scan_tools'].get(tool, {}).get('color', '#3b82f6')};
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }}
        .vuln-critical {{ border-left-color: #ef4444; }}
        .vuln-high {{ border-left-color: #f97316; }}
        .vuln-medium {{ border-left-color: #eab308; }}
        .vuln-low {{ border-left-color: #22c55e; }}
        .footer {{
            background: #1e293b;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .badge-success {{ background: #22c55e; color: white; }}
        .badge-warning {{ background: #eab308; color: white; }}
        .badge-danger {{ background: #ef4444; color: white; }}
        .progress-bar {{
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: {TOOL_CONFIG['scan_tools'].get(tool, {}).get('color', '#3b82f6')};
            transition: width 0.3s ease;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">{TOOL_CONFIG['scan_tools'].get(tool, {}).get('icon', '🔍')}</div>
            <h1>Rapport {tool.upper()}</h1>
            <p>Analyse de sécurité - {scan_data.get('target', 'N/A')}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📋 Informations du Scan</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">ID du Scan</div>
                        <div class="info-value">{scan_id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Cible</div>
                        <div class="info-value">{scan_data.get('target', 'N/A')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Type de Scan</div>
                        <div class="info-value">{scan_data.get('scan_type', 'N/A')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Statut</div>
                        <div class="info-value">
                            <span class="badge badge-success">✅ Terminé</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Durée</div>
                        <div class="info-value">{scan_data.get('duration', 'N/A')}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔍 Résultats d'Analyse</h2>
                {ReportGenerator._generate_results_section(tool, scan_data.get('results', {}))}
            </div>

            <div class="section">
                <h2>📊 Statistiques</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Outil Utilisé</div>
                        <div class="info-value">{tool.upper()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Version du Rapport</div>
                        <div class="info-value">2.0</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Format</div>
                        <div class="info-value">HTML Ultra-Esthétique</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Pacha Toolbox v2.0</strong></p>
            <p>Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}</p>
            <p>Scanner de sécurité professionnel</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Écriture du fichier
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"📄 Rapport HTML généré: {filename}")
        return filename, file_path

    @staticmethod
    def _generate_results_section(tool, results):
        """Génère la section des résultats selon le type d'outil"""
        if tool == 'nmap':
            return ReportGenerator._generate_nmap_results(results)
        elif tool == 'nikto':
            return ReportGenerator._generate_nikto_results(results)
        else:
            return f"<p>Résultats pour {tool}: {json.dumps(results, indent=2)}</p>"

    @staticmethod
    def _generate_nmap_results(results):
        """Génère les résultats spécifiques à Nmap"""
        html = ""
        
        if 'hosts_discovered' in results:
            html += f"""
            <div class="info-item">
                <div class="info-label">Hôtes Découverts</div>
                <div class="info-value">{results['hosts_discovered']}</div>
            </div>
            """
        
        if 'ports_open' in results:
            html += """
            <h3>🔌 Ports Ouverts</h3>
            <ul class="results-list">
            """
            for port in results['ports_open']:
                html += f"<li>✅ {port}</li>"
            html += "</ul>"
        
        if 'services_detected' in results:
            html += """
            <h3>🛠️ Services Détectés</h3>
            <ul class="results-list">
            """
            for service in results['services_detected']:
                html += f"<li>🔧 {service}</li>"
            html += "</ul>"
        
        if 'os_detection' in results:
            html += f"""
            <h3>💻 Détection OS</h3>
            <div class="info-item">
                <div class="info-value">{results['os_detection']}</div>
            </div>
            """
        
        return html

    @staticmethod
    def _generate_nikto_results(results):
        """Génère les résultats spécifiques à Nikto"""
        html = ""
        
        if 'vulnerabilities_found' in results:
            risk_level = results.get('risk_level', 'unknown')
            badge_class = {
                'low': 'badge-success',
                'medium': 'badge-warning', 
                'high': 'badge-danger'
            }.get(risk_level, 'badge-warning')
            
            html += f"""
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Vulnérabilités Trouvées</div>
                    <div class="info-value">{results['vulnerabilities_found']}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Niveau de Risque</div>
                    <div class="info-value">
                        <span class="badge {badge_class}">{risk_level.upper()}</span>
                    </div>
                </div>
            </div>
            """
        
        if 'vulnerabilities' in results:
            html += """
            <h3>⚠️ Vulnérabilités Détectées</h3>
            <ul class="results-list">
            """
            for vuln in results['vulnerabilities']:
                html += f"<li class='vuln-{results.get('risk_level', 'medium')}'>🚨 {vuln}</li>"
            html += "</ul>"
        
        if 'pages_tested' in results:
            html += f"""
            <div class="info-item">
                <div class="info-label">Pages Testées</div>
                <div class="info-value">{results['pages_tested']}</div>
            </div>
            """
        
        return html

# Ajouter la méthode à l'app
app.format_file_size = Utils.format_file_size

# ==================== ROUTES DE BASE ====================

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0 - Scanner & Capture unifié',
        'status': 'running',
        'modules': ['nmap', 'nikto', 'tcpdump', 'reports'],
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
    
    logger.info("💚 Health check appelé")
    
    # Vérification des outils à chaque appel
    Utils.check_tool_availability()
    
    # Compilation du statut
    tools_summary = {}
    for category, tools in TOOL_CONFIG.items():
        tools_summary[category] = {
            name: info["available"] for name, info in tools.items()
        }
    
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0',
        'tools_available': tools_summary,
        'active_scans': len(active_scans),
        'active_captures': len(active_captures),
        'reports_module': 'enabled',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Statut global de l'application"""
    return jsonify({
        'active_scans': len(active_scans),
        'active_captures': len(active_captures),
        'scan_history_count': len(scan_history),
        'capture_history_count': len(capture_history),
        'tools_status': TOOL_CONFIG,
        'directories': DIRECTORIES,
        'uptime': datetime.now().isoformat()
    })

# ==================== ROUTES DE SCAN ====================

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    """Retourne tous les types de scans disponibles"""
    return jsonify({
        'scan_types': SCAN_TYPES,
        'tools_status': TOOL_CONFIG["scan_tools"]
    })

@app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
def nmap_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    custom_args = data.get('args')
    
    # Validation du type de scan
    if scan_type not in SCAN_TYPES['nmap']:
        return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
    
    scan_config = SCAN_TYPES['nmap'][scan_type]
    scan_id = Utils.generate_scan_id('nmap')
    
    # Arguments finaux
    final_args = custom_args if custom_args else scan_config['args']
    
    logger.info(f"🔍 Scan Nmap démarré: {scan_id} - {target} ({scan_type})")
    
    # Simulation de résultats (remplacer par vraie exécution)
    scan_result = {
        'scan_id': scan_id,
        'tool': 'nmap',
        'scan_type': scan_type,
        'scan_config': scan_config,
        'target': target,
        'args': final_args,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'duration': '3.2s',
        'results': {
            'hosts_discovered': 1,
            'ports_open': ['22/tcp (ssh)', '80/tcp (http)', '443/tcp (https)', '3000/tcp (node)', '5000/tcp (flask)'],
            'services_detected': ['OpenSSH 8.0', 'nginx 1.18.0', 'OpenSSL 1.1.1', 'Node.js Express', 'Python Flask'],
            'os_detection': 'Linux 3.2 - 4.9'
        }
    }
    
    # Génération automatique du rapport
    try:
        report_filename, report_path = ReportGenerator.generate_html_report(scan_result)
        scan_result['report_filename'] = report_filename
        scan_result['report_path'] = report_path
        scan_result['report_download_url'] = f'/api/reports/download/{report_filename}'
        scan_result['report_preview_url'] = f'/api/reports/preview/{report_filename}'
        logger.info(f"📄 Rapport généré automatiquement: {report_filename}")
    except Exception as e:
        logger.error(f"❌ Erreur génération rapport: {e}")
        scan_result['report_error'] = str(e)
    
    # Ajout à l'historique
    scan_history.insert(0, scan_result)
    if len(scan_history) > 100:  # Limite de l'historique
        scan_history.pop()
    
    return jsonify(scan_result)

@app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
def nikto_scan():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', 'http://127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    
    # Validation du type de scan
    if scan_type not in SCAN_TYPES['nikto']:
        return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
    
    scan_config = SCAN_TYPES['nikto'][scan_type]
    scan_id = Utils.generate_scan_id('nikto')
    
    logger.info(f"🌐 Scan Nikto démarré: {scan_id} - {target} ({scan_type})")
    
    # Simulation de résultats basés sur le type
    vulnerabilities = []
    risk_level = 'low'
    
    if scan_type == 'comprehensive':
        vulnerabilities = [
            'Server version disclosure (nginx/1.18.0)',
            'Missing security headers (X-Frame-Options, CSP, HSTS)',
            'Directory traversal potential in /admin/ endpoint',
            'XSS vulnerability in search parameter',
            'Backup files found (.bak, .old extensions)',
            'Information disclosure in HTTP headers',
            'Weak authentication mechanism detected',
            'Insecure HTTP methods enabled (PUT, DELETE)'
        ]
        risk_level = 'high'
    elif scan_type == 'fast':
        vulnerabilities = [
            'Server version disclosure',
            'Missing X-Frame-Options header'
        ]
        risk_level = 'low'
    else:  # basic
        vulnerabilities = [
            'Server version disclosure (nginx/1.18.0)',
            'Missing security headers (X-Frame-Options, CSP)',
            'Cookie security flags missing',
            'HTTP Strict Transport Security not implemented'
        ]
        risk_level = 'medium'
    
    scan_result = {
        'scan_id': scan_id,
        'tool': 'nikto',
        'scan_type': scan_type,
        'scan_config': scan_config,
        'target': target,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'duration': '12.8s',
        'results': {
            'vulnerabilities_found': len(vulnerabilities),
            'vulnerabilities': vulnerabilities,
            'risk_level': risk_level,
            'pages_tested': 156,
            'plugins_used': 23
        }
    }
    
    # Génération automatique du rapport
    try:
        report_filename, report_path = ReportGenerator.generate_html_report(scan_result)
        scan_result['report_filename'] = report_filename
        scan_result['report_path'] = report_path
        scan_result['report_download_url'] = f'/api/reports/download/{report_filename}'
        scan_result['report_preview_url'] = f'/api/reports/preview/{report_filename}'
        logger.info(f"📄 Rapport généré automatiquement: {report_filename}")
    except Exception as e:
        logger.error(f"❌ Erreur génération rapport: {e}")
        scan_result['report_error'] = str(e)
    
    # Ajout à l'historique
    scan_history.insert(0, scan_result)
    if len(scan_history) > 100:
        scan_history.pop()
    
    return jsonify(scan_result)

@app.route('/api/scans/history', methods=['GET'])
def get_scan_history():
    """Historique des scans"""
    limit = request.args.get('limit', 50, type=int)
    tool_filter = request.args.get('tool')
    
    filtered_history = scan_history
    if tool_filter:
        filtered_history = [s for s in scan_history if s['tool'] == tool_filter]
    
    return jsonify({
        'scans': filtered_history[:limit],
        'total': len(filtered_history),
        'limit': limit
    })

# ==================== ROUTES RAPPORTS ====================

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste améliorée des rapports avec métadonnées complètes"""
    try:
        reports = []
        reports_dir = DIRECTORIES['reports']
        pdf_dir = DIRECTORIES['reports_pdf']
        
        # Dictionnaire pour grouper HTML et PDF
        html_reports = {}
        
        # Scan des rapports HTML
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                if filename.endswith('.html') and filename.startswith('rapport_'):
                    file_path = os.path.join(reports_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    # Extraction de l'ID du rapport depuis le nom
                    base_name = filename.replace('.html', '')
                    report_id = base_name.replace('rapport_', '')
                    
                    # Détection du type d'outil
                    tool_type = Utils.detect_tool_type_from_filename(filename)
                    if tool_type == 'unknown':
                        tool_type = Utils.detect_tool_type_from_content(file_path)
                    
                    html_reports[base_name] = {
                        'id': report_id,
                        'name': f'Rapport {tool_type.upper()} - {datetime.fromtimestamp(file_stats.st_ctime).strftime("%d/%m/%Y %H:%M")}',
                        'filename': filename,
                        'html_filename': filename,
                        'type': tool_type,
                        'size': Utils.format_file_size(file_stats.st_size),
                        'size_bytes': file_stats.st_size,
                        'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        'status': 'available',
                        'formats': ['HTML'],
                        'html_download_url': f'/api/reports/download/{filename}',
                        'preview_url': f'/api/reports/preview/{filename}'
                    }
        
        # Scan des rapports PDF et association avec HTML
        if os.path.exists(pdf_dir):
            for filename in os.listdir(pdf_dir):
                if filename.endswith('.pdf') and filename.startswith('rapport_'):
                    file_path = os.path.join(pdf_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    base_name = filename.replace('.pdf', '')
                    
                    if base_name in html_reports:
                        # Ajouter PDF au rapport HTML existant
                        html_reports[base_name]['pdf_filename'] = filename
                        html_reports[base_name]['pdf_size'] = Utils.format_file_size(file_stats.st_size)
                        html_reports[base_name]['pdf_size_bytes'] = file_stats.st_size
                        html_reports[base_name]['formats'].append('PDF')
                        html_reports[base_name]['pdf_download_url'] = f'/api/reports/download/pdf/{filename}'
                    else:
                        # PDF orphelin (sans HTML)
                        report_id = base_name.replace('rapport_', '')
                        tool_type = Utils.detect_tool_type_from_filename(filename)
                        
                        html_reports[base_name] = {
                            'id': report_id,
                            'name': f'Rapport {tool_type.upper()} - {datetime.fromtimestamp(file_stats.st_ctime).strftime("%d/%m/%Y %H:%M")}',
                            'filename': filename,
                            'pdf_filename': filename,
                            'type': tool_type,
                            'size': Utils.format_file_size(file_stats.st_size),
                            'size_bytes': file_stats.st_size,
                            'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                            'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                            'status': 'available',
                            'formats': ['PDF'],
                            'pdf_download_url': f'/api/reports/download/pdf/{filename}'
                        }
        
        # Construction de la liste finale
        for base_name, report_info in html_reports.items():
            reports.append(report_info)
        
        # Tri par date de création (plus récent d'abord)
        reports.sort(key=lambda x: x['created'], reverse=True)
        
        # Statistiques
        stats = {
            'total': len(reports),
            'by_type': {},
            'by_format': {'HTML': 0, 'PDF': 0},
            'total_size_bytes': 0
        }
        
        for report in reports:
            # Stats par type
            tool_type = report['type']
            stats['by_type'][tool_type] = stats['by_type'].get(tool_type, 0) + 1
            
            # Stats par format
            for fmt in report['formats']:
                stats['by_format'][fmt] += 1
            
            # Taille totale
            stats['total_size_bytes'] += report.get('size_bytes', 0)
            if 'pdf_size_bytes' in report:
                stats['total_size_bytes'] += report['pdf_size_bytes']
        
        stats['total_size'] = Utils.format_file_size(stats['total_size_bytes'])
        
        logger.info(f"📊 Liste rapports: {len(reports)} rapports trouvés")
        
        return jsonify({
            'total': len(reports),
            'reports': reports,
            'stats': stats,
            'message': f'{len(reports)} rapports disponibles avec {stats["by_format"]["HTML"]} HTML et {stats["by_format"]["PDF"]} PDF'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste rapports: {e}")
        return jsonify({'error': f'Erreur lors de la récupération des rapports: {str(e)}'}), 500

@app.route('/api/reports/download/<filename>', methods=['GET'])
def download_html_report(filename):
    """Téléchargement d'un rapport HTML"""
    try:
        safe_filename = os.path.basename(filename)
        reports_dir = DIRECTORIES['reports']
        file_path = os.path.join(reports_dir, safe_filename)
        
        if not os.path.exists(file_path):
            logger.warning(f"⚠️ Rapport HTML non trouvé: {filename}")
            return jsonify({'error': f'Rapport non trouvé: {filename}'}), 404
        
        if not safe_filename.endswith('.html'):
            return jsonify({'error': 'Type de fichier non autorisé pour ce endpoint'}), 400
        
        logger.info(f"📥 Téléchargement HTML: {safe_filename}")
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='text/html'
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement HTML {filename}: {e}")
        return jsonify({
            'error': f'Erreur lors du téléchargement: {str(e)}',
            'filename': filename
        }), 500

@app.route('/api/reports/download/pdf/<filename>', methods=['GET'])
def download_pdf_report(filename):
    """Téléchargement d'un rapport PDF"""
    try:
        safe_filename = os.path.basename(filename)
        pdf_dir = DIRECTORIES['reports_pdf']
        file_path = os.path.join(pdf_dir, safe_filename)
        
        if not os.path.exists(file_path):
            logger.warning(f"⚠️ Rapport PDF non trouvé: {filename}")
            return jsonify({'error': f'Rapport PDF non trouvé: {filename}'}), 404
        
        if not safe_filename.endswith('.pdf'):
            return jsonify({'error': 'Type de fichier non autorisé pour ce endpoint'}), 400
        
        logger.info(f"📥 Téléchargement PDF: {safe_filename}")
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement PDF {filename}: {e}")
        return jsonify({
            'error': f'Erreur lors du téléchargement PDF: {str(e)}',
            'filename': filename
        }), 500

@app.route('/api/reports/preview/<filename>', methods=['GET'])
def preview_report(filename):
    """Prévisualisation d'un rapport HTML dans un nouvel onglet"""
    try:
        # Sécurisation du nom de fichier
        safe_filename = os.path.basename(filename)
        reports_dir = DIRECTORIES['reports']
        
        # Rechercher le fichier HTML
        file_path = os.path.join(reports_dir, safe_filename)
        
        # Si le fichier n'existe pas tel quel, essayer avec .html
        if not os.path.exists(file_path) and not filename.endswith('.html'):
            safe_filename = f"{safe_filename}.html"
            file_path = os.path.join(reports_dir, safe_filename)
        
        if not os.path.exists(file_path):
            logger.warning(f"⚠️ Rapport non trouvé pour prévisualisation: {filename}")
            return jsonify({'error': f'Rapport non trouvé: {filename}'}), 404
        
        if not safe_filename.endswith('.html'):
            return jsonify({'error': 'Seuls les rapports HTML peuvent être prévisualisés'}), 400
        
        logger.info(f"👁️ Prévisualisation du rapport: {safe_filename}")
        
        # Servir le fichier HTML directement pour affichage
        return send_file(
            file_path,
            mimetype='text/html',
            as_attachment=False
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur prévisualisation {filename}: {e}")
        return jsonify({
            'error': f'Erreur lors de la prévisualisation: {str(e)}',
            'filename': filename
        }), 500

@app.route('/api/reports/delete/<report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Suppression sécurisée d'un rapport (HTML + PDF)"""
    try:
        data = request.get_json() or {}
        filename = data.get('filename')
        confirm = data.get('confirm', False)
        
        if not confirm:
            return jsonify({
                'error': 'Confirmation requise pour la suppression',
                'required_field': 'confirm: true'
            }), 400
        
        logger.info(f"🗑️ Tentative de suppression du rapport: {report_id}")
        
        reports_dir = DIRECTORIES['reports']
        pdf_dir = DIRECTORIES['reports_pdf']
        deleted_files = []
        
        # Suppression basée sur l'ID ou le nom de fichier
        if filename:
            # Suppression par nom de fichier exact
            files_to_check = [
                (reports_dir, filename),
                (reports_dir, filename.replace('.pdf', '.html')),
                (pdf_dir, filename.replace('.html', '.pdf')),
                (pdf_dir, filename)
            ]
        else:
            # Suppression par ID (recherche de fichiers correspondants)
            files_to_check = []
            for directory in [reports_dir, pdf_dir]:
                if os.path.exists(directory):
                    for file in os.listdir(directory):
                        if report_id in file or file.startswith(f'rapport_{report_id}'):
                            files_to_check.append((directory, file))
        
        # Supprimer tous les fichiers trouvés
        for directory, file in files_to_check:
            file_path = os.path.join(directory, file)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    deleted_files.append(file)
                    logger.info(f"✅ Fichier supprimé: {file}")
                except Exception as e:
                    logger.error(f"❌ Erreur suppression {file}: {e}")
        
        if not deleted_files:
            return jsonify({
                'error': f'Aucun fichier trouvé pour le rapport: {report_id}',
                'searched_filename': filename
            }), 404
        
        return jsonify({
            'message': f'Rapport supprimé avec succès: {report_id}',
            'deleted_files': deleted_files,
            'total_deleted': len(deleted_files),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur suppression rapport {report_id}: {e}")
        return jsonify({
            'error': f'Erreur lors de la suppression: {str(e)}',
            'report_id': report_id
        }), 500

@app.route('/api/reports/stats', methods=['GET'])
def get_reports_stats():
    """Statistiques détaillées des rapports"""
    try:
        reports_dir = DIRECTORIES['reports']
        pdf_dir = DIRECTORIES['reports_pdf']
        
        stats = {
            'total_files': 0,
            'total_size_bytes': 0,
            'total_size': '0 B',
            'by_type': {},
            'by_format': {'HTML': 0, 'PDF': 0},
            'by_date': {},
            'oldest_report': None,
            'newest_report': None,
            'average_size': 0
        }
        
        all_files = []
        
        # Analyser tous les fichiers
        for directory, format_type in [(reports_dir, 'HTML'), (pdf_dir, 'PDF')]:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    if filename.startswith('rapport_') and (
                        (format_type == 'HTML' and filename.endswith('.html')) or
                        (format_type == 'PDF' and filename.endswith('.pdf'))
                    ):
                        file_path = os.path.join(directory, filename)
                        file_stats = os.stat(file_path)
                        
                        file_info = {
                            'filename': filename,
                            'format': format_type,
                            'size': file_stats.st_size,
                            'created': datetime.fromtimestamp(file_stats.st_ctime),
                            'path': file_path
                        }
                        
                        all_files.append(file_info)
                        
                        # Stats globales
                        stats['total_files'] += 1
                        stats['total_size_bytes'] += file_stats.st_size
                        stats['by_format'][format_type] += 1
                        
                        # Détection du type d'outil
                        tool_type = Utils.detect_tool_type_from_filename(filename)
                        stats['by_type'][tool_type] = stats['by_type'].get(tool_type, 0) + 1
                        
                        # Stats par date
                        date_key = file_info['created'].strftime('%Y-%m-%d')
                        stats['by_date'][date_key] = stats['by_date'].get(date_key, 0) + 1
        
        # Calculs finaux
        if all_files:
            stats['total_size'] = Utils.format_file_size(stats['total_size_bytes'])
            stats['average_size'] = stats['total_size_bytes'] // len(all_files)
            stats['average_size_formatted'] = Utils.format_file_size(stats['average_size'])
            
            # Rapports le plus ancien et le plus récent
            sorted_files = sorted(all_files, key=lambda x: x['created'])
            stats['oldest_report'] = {
                'filename': sorted_files[0]['filename'],
                'created': sorted_files[0]['created'].isoformat(),
                'age_days': (datetime.now() - sorted_files[0]['created']).days
            }
            stats['newest_report'] = {
                'filename': sorted_files[-1]['filename'],
                'created': sorted_files[-1]['created'].isoformat(),
                'age_days': (datetime.now() - sorted_files[-1]['created']).days
            }
        
        return jsonify({
            'stats': stats,
            'message': f'Statistiques de {stats["total_files"]} rapports analysés'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur stats rapports: {e}")
        return jsonify({'error': f'Erreur lors du calcul des statistiques: {str(e)}'}), 500

# ==================== ROUTES NETWORK/CAPTURE ====================

@app.route('/api/network/interfaces', methods=['GET'])
def get_network_interfaces():
    """Liste des interfaces réseau disponibles"""
    try:
        result = subprocess.run(
            ["tcpdump", "-D"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        interfaces = []
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('.')
                    if len(parts) >= 2:
                        number = parts[0]
                        name = parts[1].split()[0]
                        description = ' '.join(parts[1].split()[1:]) if len(parts[1].split()) > 1 else "Interface réseau"
                        
                        interfaces.append({
                            'id': number,
                            'name': name,
                            'description': description,
                            'full_line': line.strip()
                        })
        
        return jsonify({
            'interfaces': interfaces,
            'total': len(interfaces),
            'tool_available': TOOL_CONFIG["network_tools"]["tcpdump"]["available"]
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des interfaces: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/start', methods=['POST'])
def start_capture():
    """Démarre une capture de paquets"""
    data = request.get_json() or {}
    interface = data.get('interface', 'any')
    filter_expr = data.get('filter', '')
    packet_count = data.get('packet_count', 100)
    
    capture_id = Utils.generate_capture_id()
    capture_file = f"{DIRECTORIES['captures']}/{capture_id}.pcap"
    
    # Construction de la commande tcpdump
    cmd = ['tcpdump', '-i', interface, '-w', capture_file, '-c', str(packet_count)]
    if filter_expr:
        cmd.append(filter_expr)
    
    logger.info(f"📡 Démarrage capture {capture_id} sur {interface}")
    
    try:
        # Démarrage du processus tcpdump
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Stockage de la capture active
        active_captures[capture_id] = {
            'process': process,
            'interface': interface,
            'filter': filter_expr,
            'packet_count': packet_count,
            'capture_file': capture_file,
            'start_time': datetime.now().isoformat(),
            'status': 'running'
        }
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'started',
            'interface': interface,
            'filter': filter_expr,
            'packet_count': packet_count,
            'message': f'Capture démarrée sur {interface}'
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de la capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/capture/<capture_id>/stop', methods=['POST'])
def stop_capture(capture_id):
    """Arrête une capture spécifique"""
    if capture_id not in active_captures:
        return jsonify({'error': 'Capture non trouvée'}), 404
    
    capture_info = active_captures[capture_id]
    process = capture_info['process']
    
    try:
        # Arrêt du processus
        process.terminate()
        process.wait(timeout=5)
        
        # Mise à jour du statut
        capture_info['status'] = 'completed'
        capture_info['end_time'] = datetime.now().isoformat()
        
        # Ajout à l'historique
        capture_history.insert(0, capture_info.copy())
        
        # Suppression des captures actives
        del active_captures[capture_id]
        
        logger.info(f"📡 Capture {capture_id} arrêtée")
        
        return jsonify({
            'capture_id': capture_id,
            'status': 'stopped',
            'message': 'Capture arrêtée avec succès'
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'arrêt de la capture: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/captures/active', methods=['GET'])
def get_active_captures():
    """Liste des captures actives"""
    captures_info = []
    
    for capture_id, info in active_captures.items():
        captures_info.append({
            'capture_id': capture_id,
            'interface': info['interface'],
            'filter': info['filter'],
            'packet_count': info['packet_count'],
            'start_time': info['start_time'],
            'status': info['status']
        })
    
    return jsonify({
        'active_captures': captures_info,
        'total': len(captures_info)
    })

@app.route('/api/network/captures/history', methods=['GET'])
def get_capture_history():
    """Historique des captures"""
    limit = request.args.get('limit', 50, type=int)
    
    history_info = []
    for capture in capture_history[:limit]:
        info = capture.copy()
        # Suppression du processus pour la sérialisation JSON
        if 'process' in info:
            del info['process']
        history_info.append(info)
    
    return jsonify({
        'captures': history_info,
        'total': len(capture_history),
        'limit': limit
    })

# ==================== ROUTES DE TEST ====================

@app.route('/api/reports/test', methods=['GET'])
def test_reports_system():
    """Test complet du système de rapports"""
    try:
        results = {
            'timestamp': datetime.now().isoformat(),
            'tests': {},
            'overall_status': 'success'
        }
        
        # Test 1: Vérification des répertoires
        results['tests']['directories'] = {}
        for name, path in DIRECTORIES.items():
            results['tests']['directories'][name] = {
                'exists': os.path.exists(path),
                'writable': os.access(path, os.W_OK) if os.path.exists(path) else False,
                'path': path
            }
        
        # Test 2: Comptage des fichiers
        html_count = 0
        pdf_count = 0
        
        if os.path.exists(DIRECTORIES['reports']):
            html_count = len([f for f in os.listdir(DIRECTORIES['reports']) if f.endswith('.html')])
        
        if os.path.exists(DIRECTORIES['reports_pdf']):
            pdf_count = len([f for f in os.listdir(DIRECTORIES['reports_pdf']) if f.endswith('.pdf')])
        
        results['tests']['file_counts'] = {
            'html_reports': html_count,
            'pdf_reports': pdf_count,
            'total_reports': html_count + pdf_count
        }
        
        # Test 3: Statut des outils
        Utils.check_tool_availability()
        results['tests']['tools_status'] = TOOL_CONFIG
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"❌ Erreur test système rapports: {e}")
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'error',
            'error': str(e)
        }), 500

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
            '/api/reports/list',
            '/api/network/interfaces'
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

# ==================== INITIALISATION ====================

def initialize_app():
    """Initialisation de l'application"""
    logger.info("🚀 Initialisation de Pacha Toolbox v2.0")
    
    # Vérification des outils
    Utils.check_tool_availability()
    
    # Nettoyage des anciens fichiers temporaires
    for temp_dir in [DIRECTORIES['temp'], DIRECTORIES['captures']]:
        if os.path.exists(temp_dir):
            for file in os.listdir(temp_dir):
                if file.endswith('.pcap') or file.endswith('.tmp'):
                    try:
                        os.remove(os.path.join(temp_dir, file))
                        logger.info(f"🧹 Fichier temporaire supprimé: {file}")
                    except:
                        pass
    
    logger.info("✅ Initialisation terminée")

def cleanup_on_exit():
    """Nettoyage lors de l'arrêt"""
    logger.info("🔄 Nettoyage en cours...")
    
    # Arrêt des captures actives
    for capture_id, capture_info in active_captures.items():
        try:
            process = capture_info['process']
            process.terminate()
            logger.info(f"📡 Capture {capture_id} arrêtée")
        except:
            pass
    
    logger.info("✅ Nettoyage terminé")

# Gestionnaire de signaux pour un arrêt propre
def signal_handler(sig, frame):
    cleanup_on_exit()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ==================== DÉMARRAGE ====================

if __name__ == '__main__':
    initialize_app()
    logger.info("🌐 Démarrage Pacha Toolbox API v2.0")
    logger.info("📊 Modules activés: Scanner, Capture, Rapports")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        cleanup_on_exit()
    except Exception as e:
        logger.error(f"❌ Erreur critique: {e}")
        cleanup_on_exit()
        sys.exit(1)