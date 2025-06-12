# backend/main.py - Version Ultra-Esthétique avec rapports colorés
import os
import sys
import logging
import json
import uuid
import subprocess
import base64
from datetime import datetime
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS
import xml.etree.ElementTree as ET

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'application Flask
app = Flask(__name__)

# Configuration CORS permissive pour le développement
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://frontend:3000"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Création des répertoires nécessaires
directories = ['/app/reports', '/app/logs', '/app/data', '/app/temp', '/app/reports/pdf']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Configuration des types de scans (identique)
SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Scan Basique",
            "description": "Détection d'hôtes actifs",
            "args": "-sn",
            "icon": "🔍",
            "color": "#3b82f6"
        },
        "ports": {
            "name": "Scan de Ports",
            "description": "Scan des ports les plus courants",
            "args": "-sS --top-ports 1000",
            "icon": "🔌",
            "color": "#10b981"
        },
        "services": {
            "name": "Détection de Services",
            "description": "Identification des services et versions",
            "args": "-sV",
            "icon": "🛠️",
            "color": "#f59e0b"
        },
        "stealth": {
            "name": "Scan Furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2",
            "icon": "🥷",
            "color": "#8b5cf6"
        },
        "aggressive": {
            "name": "Scan Agressif",
            "description": "Scan complet avec détection OS",
            "args": "-A -T4",
            "icon": "💥",
            "color": "#ef4444"
        },
        "vulnerability": {
            "name": "Détection Vulnérabilités",
            "description": "Scan avec scripts de vulnérabilités",
            "args": "--script vuln",
            "icon": "🛡️",
            "color": "#dc2626"
        }
    },
    "nikto": {
        "basic": {
            "name": "Scan Web Basique",
            "description": "Scan de vulnérabilités web standard",
            "args": "-h {target}",
            "icon": "🌐",
            "color": "#06b6d4"
        },
        "comprehensive": {
            "name": "Scan Complet",
            "description": "Analyse approfondie avec tous les tests",
            "args": "-h {target} -C all",
            "icon": "🔬",
            "color": "#8b5cf6"
        },
        "fast": {
            "name": "Scan Rapide",
            "description": "Tests essentiels uniquement",
            "args": "-h {target} -T 2",
            "icon": "⚡",
            "color": "#f59e0b"
        }
    }
}

# Stockage des scans
scans_history = []

def generate_ultra_aesthetic_html_template():
    """Template HTML ultra-esthétique avec couleurs vives et design moderne"""
    return """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛡️ Pacha Toolbox - Rapport {tool_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{ 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }}
        
        :root {{
            --primary: #667eea;
            --primary-dark: #764ba2;
            --success: #10b981;
            --success-light: #34d399;
            --danger: #ef4444;
            --danger-light: #f87171;
            --warning: #f59e0b;
            --warning-light: #fbbf24;
            --info: #06b6d4;
            --info-light: #22d3ee;
            --purple: #8b5cf6;
            --purple-light: #a78bfa;
            --pink: #ec4899;
            --pink-light: #f472b6;
            --indigo: #6366f1;
            --indigo-light: #818cf8;
            --scan-color: {scan_color};
        }}
        
        body {{ 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            color: white;
            line-height: 1.6;
            font-size: 14px;
            min-height: 100vh;
        }}
        
        .container {{ 
            max-width: 1400px; 
            margin: 0 auto; 
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 
                0 25px 50px rgba(0,0,0,0.3),
                inset 0 1px 0 rgba(255,255,255,0.1);
            margin: 2rem auto;
        }}
        
        .banner {{
            background: linear-gradient(135deg, var(--scan-color), var(--primary-dark));
            padding: 4rem 3rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .banner::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%);
            animation: float 20s ease-in-out infinite;
        }}
        
        @keyframes float {{
            0%, 100% {{ transform: translate(-25%, -25%) rotate(0deg); }}
            50% {{ transform: translate(-25%, -25%) rotate(180deg); }}
        }}
        
        .banner-content {{
            position: relative;
            z-index: 2;
        }}
        
        .banner h1 {{
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 1rem;
            text-shadow: 
                0 2px 10px rgba(0,0,0,0.3),
                0 0 30px rgba(255,255,255,0.2);
            background: linear-gradient(45deg, #fff, rgba(255,255,255,0.8));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .banner .subtitle {{
            font-size: 1.5rem;
            font-weight: 300;
            opacity: 0.9;
            margin-bottom: 2rem;
        }}
        
        .security-badge {{
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 0.8rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }}
        
        .report-header {{ 
            background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%);
            padding: 3rem;
            border-bottom: 3px solid var(--scan-color);
            position: relative;
        }}
        
        .scan-type-badge {{
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            background: linear-gradient(135deg, var(--scan-color), var(--primary));
            padding: 1rem 2rem;
            border-radius: 25px;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .report-title {{
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, var(--scan-color), var(--info-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }}
        
        .info-card {{
            background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            padding: 2rem;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(15px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}
        
        .info-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }}
        
        .info-card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--scan-color), var(--primary));
        }}
        
        .info-card-title {{
            font-size: 0.9rem;
            text-transform: uppercase;
            margin-bottom: 1rem;
            opacity: 0.7;
            letter-spacing: 1px;
            font-weight: 600;
        }}
        
        .info-card-value {{
            font-size: 1.3rem;
            font-weight: 700;
            word-break: break-word;
            color: var(--scan-color);
        }}
        
        .results-section {{
            padding: 3rem;
            background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%);
        }}
        
        .section-title {{
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            background: linear-gradient(45deg, var(--success), var(--success-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .result-item {{
            background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            padding: 2rem;
            margin: 1.5rem 0;
            border-radius: 15px;
            border-left: 5px solid var(--scan-color);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        
        .result-item strong {{
            color: var(--scan-color);
            font-weight: 700;
            font-size: 1.1rem;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }}
        
        .stat-card {{
            background: linear-gradient(135deg, var(--scan-color), var(--primary));
            padding: 2rem;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }}
        
        .stat-card:hover {{
            transform: scale(1.05);
        }}
        
        .stat-number {{
            font-size: 3rem;
            font-weight: 900;
            display: block;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }}
        
        .stat-label {{
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            font-weight: 600;
        }}
        
        .ports-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }}
        
        .port-badge {{
            background: linear-gradient(135deg, var(--success), var(--success-light));
            padding: 1rem;
            border-radius: 12px;
            text-align: center;
            font-weight: 700;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }}
        
        .port-badge:hover {{
            transform: translateY(-3px);
        }}
        
        .vulnerability-item {{
            background: linear-gradient(135deg, var(--danger), var(--danger-light));
            padding: 1.5rem;
            margin: 1rem 0;
            border-radius: 12px;
            border-left: 4px solid #fff;
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            font-weight: 600;
        }}
        
        .risk-badge {{
            display: inline-block;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-size: 0.8rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }}
        
        .risk-high {{ 
            background: linear-gradient(135deg, var(--danger), var(--danger-light));
        }}
        .risk-medium {{ 
            background: linear-gradient(135deg, var(--warning), var(--warning-light));
        }}
        .risk-low {{ 
            background: linear-gradient(135deg, var(--success), var(--success-light));
        }}
        
        .download-info {{
            background: linear-gradient(135deg, var(--info), var(--info-light));
            padding: 2rem;
            border-radius: 20px;
            margin: 2rem 0;
            box-shadow: 0 15px 35px rgba(6, 182, 212, 0.3);
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        .footer {{
            background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%);
            padding: 3rem;
            text-align: center;
            border-top: 3px solid var(--scan-color);
        }}
        
        .footer-logo {{
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }}
        
        .footer-text {{
            font-size: 1rem;
            line-height: 2;
            opacity: 0.9;
        }}
        
        .timestamp {{
            background: rgba(255,255,255,0.1);
            padding: 1rem 2rem;
            border-radius: 25px;
            font-size: 0.9rem;
            display: inline-block;
            margin-top: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        /* Animations */
        @keyframes gradient {{
            0% {{ background-position: 0% 50%; }}
            50% {{ background-position: 100% 50%; }}
            100% {{ background-position: 0% 50%; }}
        }}
        
        .animated-bg {{
            background-size: 200% 200%;
            animation: gradient 8s ease infinite;
        }}
        
        /* Styles pour impression PDF */
        @media print {{
            body {{ 
                background: white !important; 
                color: black !important; 
                font-size: 11px;
            }}
            .container {{ 
                box-shadow: none; 
                border: 1px solid #ddd;
                background: white !important;
            }}
            .banner, .report-header, .results-section, .footer {{ 
                background: white !important;
                color: black !important;
            }}
            .result-item, .info-card {{
                background: #f9f9f9 !important;
                color: black !important;
                break-inside: avoid;
                page-break-inside: avoid;
            }}
        }}
        
        /* Responsive */
        @media (max-width: 768px) {{
            .banner {{ padding: 2rem 1rem; }}
            .banner h1 {{ font-size: 2.5rem; }}
            .info-grid {{ grid-template-columns: 1fr; }}
            .stats-grid {{ grid-template-columns: repeat(2, 1fr); }}
            .ports-grid {{ grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }}
            .container {{ 
                border-radius: 0; 
                margin: 0;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="banner animated-bg">
            <div class="banner-content">
                <h1>🛡️ PACHA TOOLBOX</h1>
                <div class="subtitle">Professional Penetration Testing Suite</div>
                <div class="security-badge">🔒 RAPPORT CONFIDENTIEL</div>
            </div>
        </div>
        
        <div class="report-header">
            <div class="scan-type-badge">
                {scan_icon} {scan_name}
            </div>
            <h2 class="report-title">Rapport de Sécurité - {tool_name}</h2>
            <p style="font-size: 1.2rem; opacity: 0.9;"><strong>Description:</strong> {scan_description}</p>
        </div>
        
        <div class="results-section">
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-title">🎯 Cible Analysée</div>
                    <div class="info-card-value">{target}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-title">🆔 Identifiant de Scan</div>
                    <div class="info-card-value">{scan_id}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-title">⏰ Date d'Exécution</div>
                    <div class="info-card-value">{scan_date}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-title">🔧 Paramètres</div>
                    <div class="info-card-value">{scan_args}</div>
                </div>
            </div>
            
            <h3 class="section-title">📊 Résultats de l'Analyse</h3>
            
            <div class="result-item">
                <strong>📋 Statut d'Exécution:</strong> 
                <span style="color: var(--success); font-weight: 800; font-size: 1.2rem;">{scan_status}</span>
            </div>
            
            <div class="result-item">
                <strong>💬 Résumé:</strong> <span style="font-size: 1.1rem;">{scan_message}</span>
            </div>
            
            {results_content}
            
            <div class="download-info">
                <strong style="font-size: 1.3rem;">📥 Informations du Rapport</strong><br>
                <div style="margin-top: 1.5rem; font-size: 1.1rem;">
                    <strong>Nom du fichier:</strong> {report_filename}<br>
                    <strong>Formats disponibles:</strong> HTML / PDF<br>
                    <strong>Taille estimée:</strong> {report_size}<br>
                    <strong>ID Rapport:</strong> <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 0.3rem 0.6rem; border-radius: 6px;">{report_id}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-logo">🛡️</div>
            <div class="footer-text">
                <strong style="font-size: 1.2rem;">Rapport généré par Pacha Toolbox v2.0</strong><br>
                Professional Penetration Testing Suite<br>
                <div class="timestamp">
                    Généré le {generation_date} - Document Confidentiel
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

def generate_enhanced_results_content(scan_data):
    """Génère le contenu des résultats avec couleurs et design amélioré"""
    results = scan_data.get('results', {})
    content = ""
    scan_color = scan_data['scan_type_info'].get('color', '#667eea')
    
    # Statistiques avec couleurs dynamiques
    stats = []
    if results.get('hosts_up'):
        stats.append(f'<div class="stat-card"><span class="stat-number">{results["hosts_up"]}</span><span class="stat-label">Hôtes Actifs</span></div>')
    if results.get('scan_time'):
        stats.append(f'<div class="stat-card"><span class="stat-number">{results["scan_time"]}</span><span class="stat-label">Durée</span></div>')
    if results.get('ports_open'):
        port_count = len(results["ports_open"]) if isinstance(results["ports_open"], list) else 1
        stats.append(f'<div class="stat-card"><span class="stat-number">{port_count}</span><span class="stat-label">Ports Ouverts</span></div>')
    if results.get('vulnerabilities'):
        vuln_count = len(results["vulnerabilities"]) if isinstance(results["vulnerabilities"], list) else 1
        stats.append(f'<div class="stat-card"><span class="stat-number">{vuln_count}</span><span class="stat-label">Vulnérabilités</span></div>')
    
    if stats:
        content += f'''
        <div class="result-item">
            <strong>📈 Statistiques Détaillées</strong>
            <div class="stats-grid">
                {''.join(stats)}
            </div>
        </div>'''
    
    # Ports ouverts avec design coloré
    if results.get('ports_open'):
        ports = results['ports_open'] if isinstance(results['ports_open'], list) else [results['ports_open']]
        ports_html = ''.join([f'<div class="port-badge">{port}</div>' for port in ports])
        content += f'''
        <div class="result-item">
            <strong>🔌 Ports Détectés & Services</strong>
            <div class="ports-grid">
                {ports_html}
            </div>
        </div>'''
    
    # Vulnérabilités avec niveaux de risque colorés
    if results.get('vulnerabilities'):
        vulns = results['vulnerabilities'] if isinstance(results['vulnerabilities'], list) else [results['vulnerabilities']]
        risk_level = results.get('risk_level', 'medium')
        risk_badge = f'<span class="risk-badge risk-{risk_level}">{risk_level} RISK</span>'
        
        vulns_html = ''.join([f'<div class="vulnerability-item">🚨 {vuln}</div>' for vuln in vulns])
        content += f'''
        <div class="result-item">
            <strong>🚨 Vulnérabilités Identifiées</strong> {risk_badge}
            <div style="margin-top: 1.5rem;">
                {vulns_html}
            </div>
        </div>'''
    
    return content

def generate_scan_report(scan_data):
    """Génère un rapport de scan HTML ultra-esthétique"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_id = str(uuid.uuid4())[:8]
    
    # Génération du contenu des résultats
    results_content = generate_enhanced_results_content(scan_data)
    
    # Couleur du scan
    scan_color = scan_data['scan_type_info'].get('color', '#667eea')
    
    # Template data
    template_data = {
        'tool_name': scan_data['tool'].upper(),
        'target': scan_data['target'],
        'scan_icon': scan_data['scan_type_info']['icon'],
        'scan_name': scan_data['scan_type_info']['name'],
        'scan_description': scan_data['scan_type_info']['description'],
        'scan_color': scan_color,
        'scan_id': scan_data['scan_id'],
        'scan_date': datetime.fromisoformat(scan_data['timestamp'].replace('Z', '+00:00')).strftime('%d/%m/%Y %H:%M:%S'),
        'scan_args': scan_data['args'],
        'scan_status': scan_data['status'].upper(),
        'scan_message': scan_data['message'],
        'results_content': results_content,
        'report_filename': f"rapport_{scan_data['tool']}_{report_id}_{timestamp}.html",
        'report_size': "~80-150 KB",
        'report_id': report_id,
        'generation_date': datetime.now().strftime('%d/%m/%Y à %H:%M:%S')
    }
    
    # Génération du HTML
    html_template = generate_ultra_aesthetic_html_template()
    html_content = html_template.format(**template_data)
    
    # Sauvegarde du rapport HTML
    report_filename = template_data['report_filename']
    report_path = os.path.join('/app/reports', report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_filename, report_path

def generate_pdf_from_html(html_path, output_path):
    """Convertit un fichier HTML en PDF en utilisant wkhtmltopdf"""
    try:
        # Installation de wkhtmltopdf si nécessaire
        subprocess.run(['which', 'wkhtmltopdf'], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        logger.warning("wkhtmltopdf non installé, tentative d'installation...")
        try:
            subprocess.run(['apt-get', 'update'], check=True, capture_output=True)
            subprocess.run(['apt-get', 'install', '-y', 'wkhtmltopdf'], check=True, capture_output=True)
        except Exception as e:
            logger.error(f"Impossible d'installer wkhtmltopdf: {e}")
            return False
    
    try:
        # Commande wkhtmltopdf avec options pour un PDF professionnel
        cmd = [
            'wkhtmltopdf',
            '--page-size', 'A4',
            '--margin-top', '0.75in',
            '--margin-right', '0.75in',
            '--margin-bottom', '0.75in',
            '--margin-left', '0.75in',
            '--encoding', 'UTF-8',
            '--print-media-type',
            '--enable-local-file-access',
            '--no-stop-slow-scripts',
            '--javascript-delay', '1000',
            '--load-error-handling', 'ignore',
            html_path,
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(output_path):
            logger.info(f"PDF généré avec succès: {output_path}")
            return True
        else:
            logger.error(f"Erreur génération PDF: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Erreur lors de la conversion PDF: {e}")
        return False

# Routes de base
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0 Ultra-Aesthetic',
        'status': 'running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    logger.info("💚 Health check appelé")
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox Ultra-Aesthetic fonctionnelle',
        'method': request.method,
        'cors_enabled': True,
        'version': '2.0.0-Ultra',
        'features': ['PDF_Export', 'HTML_Preview', 'Ultra_Aesthetic_Reports', 'New_Tab_Preview'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_endpoint():
    logger.info(f"🧪 Test endpoint - {request.method}")
    data = {
        'message': 'Test endpoint fonctionnel',
        'method': request.method,
        'timestamp': datetime.now().isoformat(),
        'success': True
    }
    if request.method == 'POST' and request.get_json():
        data['received_data'] = request.get_json()
    return jsonify(data)

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    """Retourne la liste des types de scans disponibles avec couleurs"""
    return jsonify({
        'scan_types': SCAN_TYPES,
        'message': 'Types de scans disponibles avec couleurs'
    })

@app.route('/api/scan/<tool>', methods=['POST', 'OPTIONS'])
def run_scan(tool):
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    target = data.get('target', '127.0.0.1')
    scan_type = data.get('scan_type', 'basic')
    custom_args = data.get('args')
    
    logger.info(f"🔍 Scan Ultra-Aesthetic {tool} type {scan_type}: {target}")
    
    # Vérification du type de scan
    if tool not in SCAN_TYPES:
        return jsonify({'error': f'Outil {tool} non supporté'}), 400
    
    if scan_type not in SCAN_TYPES[tool]:
        return jsonify({'error': f'Type de scan {scan_type} non disponible pour {tool}'}), 400
    
    scan_config = SCAN_TYPES[tool][scan_type]
    args = custom_args if custom_args else scan_config['args']
    
    # Génération des IDs
    scan_id = f"{tool}_{scan_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Simulation de résultats variés selon le type
    if tool == 'nmap':
        if scan_type == 'basic':
            results = {'hosts_up': 1, 'scan_time': '1.2s'}
        elif scan_type == 'ports':
            results = {
                'hosts_up': 1, 
                'ports_open': ['22/tcp SSH', '80/tcp HTTP', '443/tcp HTTPS', '8080/tcp HTTP-Proxy', '3000/tcp Node.js'], 
                'scan_time': '3.5s'
            }
        elif scan_type == 'services':
            results = {
                'hosts_up': 1, 
                'ports_open': ['22/tcp OpenSSH 8.2p1', '80/tcp nginx/1.18.0', '443/tcp nginx/1.18.0 (SSL)', '3306/tcp MySQL 8.0.25'], 
                'scan_time': '8.2s'
            }
        elif scan_type == 'vulnerability':
            results = {
                'hosts_up': 1, 
                'vulnerabilities': [
                    'CVE-2021-44228 (Log4Shell) - Apache Log4j RCE',
                    'CVE-2022-0778 - OpenSSL infinite loop DoS', 
                    'Weak SSL/TLS ciphers detected',
                    'HTTP security headers missing (HSTS, CSP)',
                    'Directory listing enabled on /admin/'
                ], 
                'risk_level': 'high', 
                'scan_time': '45.1s'
            }
        elif scan_type == 'stealth':
            results = {'hosts_up': 1, 'ports_open': ['22/tcp', '80/tcp'], 'scan_time': '12.3s'}
        elif scan_type == 'aggressive':
            results = {
                'hosts_up': 1, 
                'ports_open': ['22/tcp SSH', '80/tcp HTTP', '443/tcp HTTPS', '25/tcp SMTP'],
                'vulnerabilities': ['OS fingerprint: Linux 3.X|4.X', 'Traceroute completed'],
                'scan_time': '25.7s'
            }
        else:
            results = {'hosts_up': 1, 'ports_open': ['22/tcp', '80/tcp', '443/tcp'], 'scan_time': '2.5s'}
    
    elif tool == 'nikto':
        if scan_type == 'comprehensive':
            results = {
                'vulnerabilities': [
                    'Server version disclosure (nginx/1.18.0)', 
                    'Missing security headers (X-Frame-Options, X-Content-Type-Options, CSP)', 
                    'Directory traversal potential in /admin/ endpoint', 
                    'XSS vulnerability in search parameter',
                    'Weak authentication mechanism detected',
                    'Backup files found (.bak, .old extensions)',
                    'Information disclosure in HTTP headers',
                    'Insecure HTTP methods enabled (PUT, DELETE)'
                ], 
                'risk_level': 'high'
            }
        elif scan_type == 'fast':
            results = {
                'vulnerabilities': ['Server version disclosure', 'Missing X-Frame-Options header'], 
                'risk_level': 'low'
            }
        else:
            results = {
                'vulnerabilities': [
                    'Server version disclosure (nginx/1.18.0)', 
                    'Missing security headers (X-Frame-Options, CSP)',
                    'Cookie security flags missing'
                ], 
                'risk_level': 'medium'
            }
    
    # Données du scan avec couleur
    scan_data = {
        'scan_id': scan_id,
        'tool': tool,
        'scan_type': scan_type,
        'scan_type_info': scan_config,
        'target': target,
        'args': args,
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'message': f'Scan {scan_config["name"]} de {target} terminé avec succès - Rapport ultra-esthétique généré',
        'results': results
    }
    
    # Génération du rapport HTML ultra-esthétique
    report_filename, report_path = generate_scan_report(scan_data)
    
    # Génération du PDF
    pdf_filename = report_filename.replace('.html', '.pdf')
    pdf_path = os.path.join('/app/reports/pdf', pdf_filename)
    
    pdf_generated = generate_pdf_from_html(report_path, pdf_path)
    
    # Ajout des informations de rapport
    scan_data['report_filename'] = report_filename
    scan_data['report_html_url'] = f'/api/reports/download/{report_filename}'
    scan_data['report_preview_url'] = f'/api/reports/view/{report_filename}'  # Nouvelle URL pour nouvel onglet
    
    if pdf_generated:
        scan_data['report_pdf_filename'] = pdf_filename
        scan_data['report_pdf_url'] = f'/api/reports/download/pdf/{pdf_filename}'
        scan_data['formats_available'] = ['HTML', 'PDF']
    else:
        scan_data['formats_available'] = ['HTML']
    
    # Sauvegarde dans l'historique
    scans_history.insert(0, scan_data)
    
    # Limitation de l'historique à 50 scans
    if len(scans_history) > 50:
        scans_history.pop()
    
    return jsonify(scan_data)

@app.route('/api/scans/history', methods=['GET'])
def get_scans_history():
    """Retourne l'historique des scans"""
    return jsonify({
        'total': len(scans_history),
        'scans': scans_history,
        'message': 'Historique des scans ultra-esthétiques'
    })

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste tous les rapports disponibles avec support HTML et PDF"""
    reports = []
    reports_dir = '/app/reports'
    pdf_dir = '/app/reports/pdf'
    
    try:
        # Scan des rapports HTML
        html_reports = {}
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                if filename.endswith('.html') and filename.startswith('rapport_'):
                    file_path = os.path.join(reports_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    base_name = filename.replace('.html', '')
                    html_reports[base_name] = {
                        'html_filename': filename,
                        'html_size': file_stats.st_size,
                        'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'html_download_url': f'/api/reports/download/{filename}',
                        'preview_url': f'/api/reports/view/{filename}'  # Nouvelle URL pour nouvel onglet
                    }
        
        # Scan des rapports PDF
        if os.path.exists(pdf_dir):
            for filename in os.listdir(pdf_dir):
                if filename.endswith('.pdf') and filename.startswith('rapport_'):
                    file_path = os.path.join(pdf_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    base_name = filename.replace('.pdf', '')
                    if base_name in html_reports:
                        html_reports[base_name]['pdf_filename'] = filename
                        html_reports[base_name]['pdf_size'] = file_stats.st_size
                        html_reports[base_name]['pdf_download_url'] = f'/api/reports/download/pdf/{filename}'
                        html_reports[base_name]['formats'] = ['HTML', 'PDF']
                    else:
                        # PDF orphelin
                        html_reports[base_name] = {
                            'pdf_filename': filename,
                            'pdf_size': file_stats.st_size,
                            'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                            'pdf_download_url': f'/api/reports/download/pdf/{filename}',
                            'formats': ['PDF']
                        }
        
        # Construction de la liste finale
        for base_name, report_info in html_reports.items():
            if 'formats' not in report_info:
                report_info['formats'] = ['HTML']
            
            # ID et nom principal
            report_info['report_id'] = base_name
            report_info['main_filename'] = report_info.get('html_filename', report_info.get('pdf_filename'))
            
            reports.append(report_info)
        
        # Tri par date de création (plus récent d'abord)
        reports.sort(key=lambda x: x['created'], reverse=True)
        
    except Exception as e:
        logger.error(f"Erreur liste rapports: {e}")
        return jsonify({'error': 'Erreur lors de la récupération des rapports'}), 500
    
    return jsonify({
        'total': len(reports),
        'reports': reports,
        'message': f'{len(reports)} rapports ultra-esthétiques disponibles'
    })

@app.route('/api/reports/download/<filename>', methods=['GET'])
def download_report(filename):
    """Télécharge un rapport HTML"""
    try:
        safe_filename = os.path.basename(filename)
        reports_dir = '/app/reports'
        file_path = os.path.join(reports_dir, safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport non trouvé'}), 404
        
        if not safe_filename.endswith('.html'):
            return jsonify({'error': 'Type de fichier non autorisé'}), 400
            
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='text/html'
        )
        
    except Exception as e:
        logger.error(f"Erreur téléchargement HTML: {e}")
        return jsonify({'error': 'Erreur lors du téléchargement'}), 500

@app.route('/api/reports/download/pdf/<filename>', methods=['GET'])
def download_pdf_report(filename):
    """Télécharge un rapport PDF"""
    try:
        safe_filename = os.path.basename(filename)
        pdf_dir = '/app/reports/pdf'
        file_path = os.path.join(pdf_dir, safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport PDF non trouvé'}), 404
        
        if not safe_filename.endswith('.pdf'):
            return jsonify({'error': 'Type de fichier non autorisé'}), 400
            
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Erreur téléchargement PDF: {e}")
        return jsonify({'error': 'Erreur lors du téléchargement PDF'}), 500

@app.route('/api/reports/view/<filename>', methods=['GET'])
def view_report_new_tab(filename):
    """Affiche un rapport HTML dans un nouvel onglet (remplace preview)"""
    try:
        safe_filename = os.path.basename(filename)
        reports_dir = '/app/reports'
        file_path = os.path.join(reports_dir, safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport non trouvé'}), 404
        
        if not safe_filename.endswith('.html'):
            return jsonify({'error': 'Type de fichier non autorisé'}), 400
        
        # Lecture et retour du contenu HTML pour affichage en nouvel onglet
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        return Response(html_content, mimetype='text/html')
        
    except Exception as e:
        logger.error(f"Erreur affichage rapport: {e}")
        return jsonify({'error': 'Erreur lors de l\'affichage du rapport'}), 500

@app.route('/api/reports/convert-to-pdf', methods=['POST'])
def convert_report_to_pdf():
    """Convertit un rapport HTML existant en PDF"""
    try:
        data = request.get_json()
        html_filename = data.get('html_filename')
        
        if not html_filename:
            return jsonify({'error': 'Nom de fichier HTML requis'}), 400
        
        safe_filename = os.path.basename(html_filename)
        html_path = os.path.join('/app/reports', safe_filename)
        
        if not os.path.exists(html_path):
            return jsonify({'error': 'Fichier HTML non trouvé'}), 404
        
        # Génération du nom PDF
        pdf_filename = safe_filename.replace('.html', '.pdf')
        pdf_path = os.path.join('/app/reports/pdf', pdf_filename)
        
        # Conversion
        if generate_pdf_from_html(html_path, pdf_path):
            return jsonify({
                'success': True,
                'pdf_filename': pdf_filename,
                'pdf_download_url': f'/api/reports/download/pdf/{pdf_filename}',
                'message': 'Conversion PDF ultra-esthétique réussie'
            })
        else:
            return jsonify({'error': 'Échec de la conversion PDF'}), 500
            
    except Exception as e:
        logger.error(f"Erreur conversion PDF: {e}")
        return jsonify({'error': 'Erreur lors de la conversion PDF'}), 500

@app.route('/api/reports/bulk-convert', methods=['POST'])
def bulk_convert_to_pdf():
    """Conversion en lot de rapports HTML vers PDF"""
    try:
        data = request.get_json()
        html_files = data.get('html_files', [])
        
        if not html_files:
            return jsonify({'error': 'Liste de fichiers requis'}), 400
        
        results = []
        success_count = 0
        
        for html_filename in html_files:
            try:
                safe_filename = os.path.basename(html_filename)
                html_path = os.path.join('/app/reports', safe_filename)
                
                if os.path.exists(html_path):
                    pdf_filename = safe_filename.replace('.html', '.pdf')
                    pdf_path = os.path.join('/app/reports/pdf', pdf_filename)
                    
                    if generate_pdf_from_html(html_path, pdf_path):
                        results.append({
                            'html_filename': html_filename,
                            'pdf_filename': pdf_filename,
                            'status': 'success'
                        })
                        success_count += 1
                    else:
                        results.append({
                            'html_filename': html_filename,
                            'status': 'failed',
                            'error': 'Conversion échouée'
                        })
                else:
                    results.append({
                        'html_filename': html_filename,
                        'status': 'failed',
                        'error': 'Fichier non trouvé'
                    })
            except Exception as e:
                results.append({
                    'html_filename': html_filename,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'total_files': len(html_files),
            'success_count': success_count,
            'failed_count': len(html_files) - success_count,
            'results': results,
            'message': f'{success_count}/{len(html_files)} conversions ultra-esthétiques réussies'
        })
        
    except Exception as e:
        logger.error(f"Erreur conversion en lot: {e}")
        return jsonify({'error': 'Erreur lors de la conversion en lot'}), 500

# Gestion d'erreurs
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint non trouvé'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur 500: {error}")
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == "__main__":
    logger.info("🚀 Démarrage Pacha Toolbox Backend v2.0 Ultra-Aesthetic")
    logger.info("🌐 CORS configuré pour localhost:3000")
    logger.info(f"📊 Types de scans chargés: {len(SCAN_TYPES)} outils avec couleurs")
    logger.info("🎨 Rapports ultra-esthétiques activés")
    logger.info("📄 Support PDF activé")
    logger.info("🔗 Prévisualisation en nouvel onglet activée")
    
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)