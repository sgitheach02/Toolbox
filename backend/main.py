#!/usr/bin/env python3
"""
Pacha Toolbox Backend v2.0 - Interface IT Cyber Professionnelle
Execution réelle avec aperçu console live et PDFs récapitulatifs
"""

import os
import sys
import json
import uuid
import signal
import math
import subprocess
import threading
import time
import queue
import re
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# ==================== CONFIGURATION ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

DIRECTORIES = {
    'reports': os.path.join(PROJECT_ROOT, 'data', 'reports'),
    'reports_pdf': os.path.join(PROJECT_ROOT, 'data', 'reports', 'pdf'),
    'logs': os.path.join(PROJECT_ROOT, 'data', 'logs'),
    'temp': os.path.join(PROJECT_ROOT, 'data', 'temp'),
    'scans': os.path.join(PROJECT_ROOT, 'data', 'scans')
}

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

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

SCAN_TYPES = {
    "nmap": {
        "basic": {
            "name": "Découverte d'hôtes",
            "description": "Scan ping pour découvrir les hôtes actifs",
            "args": "-sn -v",
            "estimated_time": "30s"
        },
        "ports": {
            "name": "Scan de ports",
            "description": "Scan des 1000 ports les plus courants",
            "args": "-sS --top-ports 1000 -v",
            "estimated_time": "2-5min"
        },
        "services": {
            "name": "Détection de services",
            "description": "Identification des services et versions",
            "args": "-sV -v",
            "estimated_time": "3-8min"
        },
        "full": {
            "name": "Scan complet",
            "description": "Scan complet avec détection OS et scripts",
            "args": "-A -v",
            "estimated_time": "5-15min"
        },
        "stealth": {
            "name": "Scan furtif",
            "description": "Scan discret pour éviter la détection",
            "args": "-sS -f -T2 -v",
            "estimated_time": "10-30min"
        }
    },
    "nikto": {
        "basic": {
            "name": "Scan web basique",
            "description": "Scan de vulnérabilités web essentielles",
            "args": "-h {target} -Display V",
            "estimated_time": "1-3min"
        },
        "comprehensive": {
            "name": "Scan complet",
            "description": "Analyse complète avec tous les plugins",
            "args": "-h {target} -Plugins @@ALL -Display V",
            "estimated_time": "10-30min"
        },
        "ssl": {
            "name": "Scan SSL/TLS",
            "description": "Focus sur les vulnérabilités SSL/TLS",
            "args": "-h {target} -ssl -Display V",
            "estimated_time": "2-5min"
        }
    }
}

# Stockage des tâches actives avec queues pour les outputs en temps réel
active_scans = {}
scan_history = []

# ==================== FONCTIONS UTILITAIRES ====================

def ensure_directories():
    for name, path in DIRECTORIES.items():
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            logger.info(f"📁 Répertoire créé: {path}")

def check_tool_availability():
    tools_status = {}
    for tool in ['nmap', 'nikto']:
        try:
            result = subprocess.run(['which', tool], capture_output=True, text=True)
            tools_status[tool] = result.returncode == 0
            if tools_status[tool]:
                logger.info(f"✅ {tool} disponible")
            else:
                logger.warning(f"❌ {tool} non disponible")
        except:
            tools_status[tool] = False
            logger.warning(f"❌ {tool} non disponible")
    return tools_status

def format_file_size(size_bytes):
    if size_bytes == 0:
        return "0 B"
    size_names = ["B", "KB", "MB", "GB"]
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def parse_nmap_output(output):
    """Parse la sortie nmap pour extraire les informations essentielles"""
    results = {
        'hosts_discovered': 0,
        'hosts_up': [],
        'ports_open': [],
        'services_detected': [],
        'os_detection': '',
        'vulnerabilities': [],
        'summary': ''
    }
    
    lines = output.split('\n')
    current_host = None
    
    for line in lines:
        line = line.strip()
        
        # Hôtes découverts
        if 'Nmap scan report for' in line:
            host = line.split('for ')[-1]
            current_host = host
            results['hosts_up'].append(host)
            results['hosts_discovered'] += 1
        
        # Ports ouverts
        if '/tcp' in line and 'open' in line:
            port_info = line.split()
            if len(port_info) >= 3:
                port = port_info[0]
                service = port_info[2] if len(port_info) > 2 else 'unknown'
                version = ' '.join(port_info[3:]) if len(port_info) > 3 else ''
                
                port_entry = f"{port} ({service})"
                if version:
                    port_entry += f" - {version}"
                    results['services_detected'].append(f"{service}: {version}")
                
                results['ports_open'].append(port_entry)
        
        # Détection OS
        if 'OS details:' in line or 'Running:' in line:
            results['os_detection'] = line
        
        # Scripts de vulnérabilité
        if '|' in line and any(vuln in line.lower() for vuln in ['vuln', 'cve', 'exploit', 'vulnerable']):
            results['vulnerabilities'].append(line.strip('| '))
    
    # Résumé
    if results['hosts_discovered'] > 0:
        results['summary'] = f"{results['hosts_discovered']} hôte(s) découvert(s), {len(results['ports_open'])} port(s) ouvert(s)"
    else:
        results['summary'] = "Aucun hôte actif détecté"
    
    return results

def parse_nikto_output(output):
    """Parse la sortie nikto pour extraire les vulnérabilités"""
    results = {
        'target_info': '',
        'vulnerabilities': [],
        'findings': [],
        'summary': '',
        'risk_level': 'low',
        'total_findings': 0
    }
    
    lines = output.split('\n')
    vulnerabilities = []
    high_risk_count = 0
    medium_risk_count = 0
    
    for line in lines:
        line = line.strip()
        
        # Informations de la cible
        if 'Target IP:' in line or 'Target Hostname:' in line:
            results['target_info'] = line
        
        # Vulnérabilités trouvées (lignes commençant par +)
        if line.startswith('+') and len(line) > 5:
            vuln = line[1:].strip()
            vulnerabilities.append(vuln)
            
            # Analyse du niveau de risque
            if any(keyword in vuln.lower() for keyword in ['xss', 'sql', 'injection', 'rce', 'lfi', 'rfi']):
                high_risk_count += 1
            elif any(keyword in vuln.lower() for keyword in ['disclosure', 'version', 'banner', 'header']):
                medium_risk_count += 1
        
        # Résultats OSVDB
        if 'OSVDB-' in line:
            results['findings'].append(line)
    
    results['vulnerabilities'] = vulnerabilities
    results['total_findings'] = len(vulnerabilities)
    
    # Déterminer le niveau de risque
    if high_risk_count > 0:
        results['risk_level'] = 'high'
    elif medium_risk_count > 2:
        results['risk_level'] = 'medium'
    else:
        results['risk_level'] = 'low'
    
    # Résumé
    results['summary'] = f"{results['total_findings']} vulnérabilité(s) détectée(s) - Niveau: {results['risk_level']}"
    
    return results

def generate_pdf_report(scan_data, parsed_results):
    """Génère un rapport PDF professionnel avec résumé des points essentiels"""
    ensure_directories()
    
    tool = scan_data['tool']
    scan_id = scan_data['scan_id']
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"rapport_{tool}_{timestamp}_{scan_id}.pdf"
    file_path = os.path.join(DIRECTORIES['reports_pdf'], filename)
    
    # Création du document PDF
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=20,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d'),
        alignment=1  # Centré
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.HexColor('#2d3748'),
        borderWidth=1,
        borderColor=colors.HexColor('#e2e8f0'),
        borderPadding=8,
        backColor=colors.HexColor('#f7fafc')
    )
    
    # En-tête du rapport
    story.append(Paragraph(f"RAPPORT D'ANALYSE {tool.upper()}", title_style))
    story.append(Spacer(1, 20))
    
    # Informations générales
    info_data = [
        ['Outil', tool.upper()],
        ['Cible', scan_data.get('target', 'N/A')],
        ['Type de scan', scan_data.get('scan_type', 'N/A')],
        ['Date d\'exécution', datetime.now().strftime('%d/%m/%Y à %H:%M:%S')],
        ['Durée', scan_data.get('duration', 'N/A')],
        ['Statut', scan_data.get('status', 'N/A')]
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(Paragraph("INFORMATIONS GÉNÉRALES", heading_style))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    # Résumé exécutif
    story.append(Paragraph("RÉSUMÉ EXÉCUTIF", heading_style))
    if tool == 'nmap':
        summary_text = f"""
        <b>Résultats de l'analyse réseau :</b><br/>
        • {parsed_results.get('summary', 'Aucun résultat')}<br/>
        • Hôtes actifs découverts : {parsed_results.get('hosts_discovered', 0)}<br/>
        • Ports ouverts identifiés : {len(parsed_results.get('ports_open', []))}<br/>
        • Services détectés : {len(parsed_results.get('services_detected', []))}
        """
    else:  # nikto
        risk_colors = {'high': '#e53e3e', 'medium': '#d69e2e', 'low': '#38a169'}
        risk_color = risk_colors.get(parsed_results.get('risk_level', 'low'), '#38a169')
        summary_text = f"""
        <b>Résultats de l'analyse web :</b><br/>
        • {parsed_results.get('summary', 'Aucun résultat')}<br/>
        • Vulnérabilités trouvées : {parsed_results.get('total_findings', 0)}<br/>
        • <font color="{risk_color}">Niveau de risque : {parsed_results.get('risk_level', 'low').upper()}</font>
        """
    
    story.append(Paragraph(summary_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Détails spécifiques à l'outil
    if tool == 'nmap':
        # Hôtes découverts
        if parsed_results.get('hosts_up'):
            story.append(Paragraph("HÔTES DÉCOUVERTS", heading_style))
            hosts_data = [['Adresse IP/Hostname']]
            for host in parsed_results['hosts_up']:
                hosts_data.append([host])
            
            hosts_table = Table(hosts_data, colWidths=[4*inch])
            hosts_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ]))
            story.append(hosts_table)
            story.append(Spacer(1, 15))
        
        # Ports ouverts
        if parsed_results.get('ports_open'):
            story.append(Paragraph("PORTS OUVERTS", heading_style))
            ports_data = [['Port', 'Service']]
            for port in parsed_results['ports_open'][:20]:  # Limiter à 20 pour le PDF
                port_parts = port.split(' (')
                port_num = port_parts[0]
                service = port_parts[1].replace(')', '') if len(port_parts) > 1 else 'Unknown'
                ports_data.append([port_num, service])
            
            ports_table = Table(ports_data, colWidths=[1.5*inch, 3*inch])
            ports_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ]))
            story.append(ports_table)
            story.append(Spacer(1, 15))
    
    else:  # nikto
        # Vulnérabilités détectées
        if parsed_results.get('vulnerabilities'):
            story.append(Paragraph("VULNÉRABILITÉS DÉTECTÉES", heading_style))
            vuln_data = [['Priorité', 'Description']]
            
            for i, vuln in enumerate(parsed_results['vulnerabilities'][:15]):  # Limiter à 15
                priority = "HAUTE" if any(keyword in vuln.lower() for keyword in ['xss', 'sql', 'injection']) else "MOYENNE"
                priority_color = colors.HexColor('#e53e3e') if priority == "HAUTE" else colors.HexColor('#d69e2e')
                vuln_data.append([priority, vuln[:80] + "..." if len(vuln) > 80 else vuln])
            
            vuln_table = Table(vuln_data, colWidths=[1*inch, 4*inch])
            vuln_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(vuln_table)
            story.append(Spacer(1, 15))
    
    # Recommandations
    story.append(Paragraph("RECOMMANDATIONS", heading_style))
    if tool == 'nmap':
        recommendations = """
        <b>Recommandations de sécurité :</b><br/>
        • Fermer les ports non nécessaires<br/>
        • Mettre à jour les services détectés<br/>
        • Configurer un firewall restrictif<br/>
        • Surveiller les connexions entrantes<br/>
        • Effectuer des scans réguliers
        """
    else:  # nikto
        risk_level = parsed_results.get('risk_level', 'low')
        if risk_level == 'high':
            recommendations = """
            <b>Actions urgentes requises :</b><br/>
            • Corriger immédiatement les vulnérabilités critiques<br/>
            • Mettre à jour le serveur web et ses composants<br/>
            • Configurer les en-têtes de sécurité<br/>
            • Restreindre l'accès aux répertoires sensibles<br/>
            • Effectuer un audit de sécurité complet
            """
        else:
            recommendations = """
            <b>Améliorations recommandées :</b><br/>
            • Masquer les informations de version du serveur<br/>
            • Configurer les en-têtes de sécurité HTTP<br/>
            • Effectuer des scans de vulnérabilités réguliers<br/>
            • Maintenir le serveur web à jour<br/>
            • Surveiller les logs d'accès
            """
    
    story.append(Paragraph(recommendations, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Pied de page
    footer_text = f"""
    <br/><br/>
    <i>Rapport généré par Pacha Toolbox v2.0 - {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}</i><br/>
    <i>Plateforme professionnelle d'évaluation de sécurité</i>
    """
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Génération du PDF
    doc.build(story)
    logger.info(f"📄 Rapport PDF généré: {filename}")
    return filename

def execute_scan_with_live_output(tool, target, scan_type, scan_id):
    """Exécute un scan avec sortie live dans une queue"""
    try:
        if tool == 'nmap':
            if scan_type not in SCAN_TYPES['nmap']:
                raise ValueError(f"Type de scan invalide: {scan_type}")
            scan_config = SCAN_TYPES['nmap'][scan_type]
            args = scan_config['args'].split()
            cmd = ['nmap'] + args + [target]
        
        elif tool == 'nikto':
            if scan_type not in SCAN_TYPES['nikto']:
                raise ValueError(f"Type de scan invalide: {scan_type}")
            scan_config = SCAN_TYPES['nikto'][scan_type]
            args = scan_config['args'].format(target=target).split()
            cmd = ['nikto'] + args
        
        else:
            raise ValueError(f"Outil non supporté: {tool}")
        
        logger.info(f"🚀 Exécution {tool}: {' '.join(cmd)}")
        
        # Marquer le scan comme en cours
        active_scans[scan_id]['status'] = 'running'
        active_scans[scan_id]['command'] = ' '.join(cmd)
        active_scans[scan_id]['output_queue'] = queue.Queue()
        
        # Lancer le processus
        start_time = time.time()
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        active_scans[scan_id]['process'] = process
        
        # Lire la sortie en temps réel
        output_lines = []
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                output_lines.append(output.strip())
                # Ajouter à la queue pour l'affichage live
                active_scans[scan_id]['output_queue'].put(output.strip())
                active_scans[scan_id]['last_output'] = output.strip()
        
        end_time = time.time()
        duration = f"{end_time - start_time:.1f}s"
        
        # Résultats finaux
        return_code = process.poll()
        full_output = '\n'.join(output_lines)
        
        # Parser les résultats
        if tool == 'nmap':
            parsed_results = parse_nmap_output(full_output)
        else:  # nikto
            parsed_results = parse_nikto_output(full_output)
        
        # Déterminer le statut
        status = 'completed' if return_code == 0 else 'error'
        
        # Mettre à jour les données du scan
        scan_data = active_scans[scan_id]
        scan_data.update({
            'status': status,
            'duration': duration,
            'return_code': return_code,
            'output': full_output,
            'parsed_results': parsed_results,
            'end_time': datetime.now().isoformat()
        })
        
        # Générer le rapport PDF avec résumé
        try:
            pdf_filename = generate_pdf_report(scan_data, parsed_results)
            scan_data['pdf_filename'] = pdf_filename
            scan_data['pdf_url'] = f'/api/reports/download/pdf/{pdf_filename}'
        except Exception as e:
            logger.error(f"❌ Erreur génération PDF: {e}")
        
        # Ajouter à l'historique
        scan_history.insert(0, scan_data.copy())
        if len(scan_history) > 100:
            scan_history.pop()
        
        # Nettoyer les références de processus
        if 'process' in active_scans[scan_id]:
            del active_scans[scan_id]['process']
        if 'output_queue' in active_scans[scan_id]:
            del active_scans[scan_id]['output_queue']
        
        # Retirer des scans actifs
        del active_scans[scan_id]
        
        logger.info(f"✅ Scan {tool} terminé: {scan_id} ({status})")
        
    except subprocess.TimeoutExpired:
        active_scans[scan_id]['status'] = 'timeout'
        active_scans[scan_id]['error'] = 'Scan interrompu (timeout)'
        logger.error(f"❌ Timeout scan {tool}: {scan_id}")
    except Exception as e:
        active_scans[scan_id]['status'] = 'error'
        active_scans[scan_id]['error'] = str(e)
        logger.error(f"❌ Erreur scan {tool}: {scan_id} - {e}")

# Initialisation
ensure_directories()
tools_status = check_tool_availability()

# ==================== ROUTES DE BASE ====================

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Pacha Toolbox API v2.0 - Interface IT Cyber Professionnelle',
        'status': 'running',
        'tools': tools_status,
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET', 'POST', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'status': 'healthy',
        'message': 'API Pacha Toolbox opérationnelle',
        'tools_available': tools_status,
        'active_scans': len(active_scans),
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

# ==================== ROUTES DE SCAN ====================

@app.route('/api/scan/types', methods=['GET'])
def get_scan_types():
    return jsonify({
        'scan_types': SCAN_TYPES,
        'tools_status': tools_status
    })

@app.route('/api/scan/nmap', methods=['POST', 'OPTIONS'])
def scan_nmap():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json() or {}
        target = data.get('target', '').strip()
        scan_type = data.get('scan_type', 'basic')
        
        if not target:
            return jsonify({'error': 'Cible requise'}), 400
        
        if scan_type not in SCAN_TYPES['nmap']:
            return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
        
        if not tools_status.get('nmap', False):
            return jsonify({'error': 'Nmap non disponible sur ce système'}), 503
        
        scan_id = f"nmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        scan_data = {
            'scan_id': scan_id,
            'tool': 'nmap',
            'target': target,
            'scan_type': scan_type,
            'scan_config': SCAN_TYPES['nmap'][scan_type],
            'status': 'starting',
            'start_time': datetime.now().isoformat(),
            'user_ip': request.remote_addr,
            'live_output': []
        }
        
        active_scans[scan_id] = scan_data
        
        # Lancer le scan en arrière-plan
        thread = threading.Thread(
            target=execute_scan_with_live_output,
            args=('nmap', target, scan_type, scan_id),
            daemon=True
        )
        thread.start()
        
        logger.info(f"🚀 Scan nmap lancé: {scan_id} - {target}")
        
        return jsonify({
            'scan_id': scan_id,
            'message': f'Scan nmap lancé sur {target}',
            'status': 'starting',
            'estimated_time': SCAN_TYPES['nmap'][scan_type]['estimated_time'],
            'live_output_url': f'/api/scan/live/{scan_id}'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage scan nmap: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/nikto', methods=['POST', 'OPTIONS'])
def scan_nikto():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json() or {}
        target = data.get('target', '').strip()
        scan_type = data.get('scan_type', 'basic')
        
        if not target:
            return jsonify({'error': 'Cible requise'}), 400
        
        if scan_type not in SCAN_TYPES['nikto']:
            return jsonify({'error': f'Type de scan invalide: {scan_type}'}), 400
        
        if not tools_status.get('nikto', False):
            return jsonify({'error': 'Nikto non disponible sur ce système'}), 503
        
        # Ajouter http:// si pas de protocole
        if not target.startswith(('http://', 'https://')):
            target = f'http://{target}'
        
        scan_id = f"nikto_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        scan_data = {
            'scan_id': scan_id,
            'tool': 'nikto',
            'target': target,
            'scan_type': scan_type,
            'scan_config': SCAN_TYPES['nikto'][scan_type],
            'status': 'starting',
            'start_time': datetime.now().isoformat(),
            'user_ip': request.remote_addr,
            'live_output': []
        }
        
        active_scans[scan_id] = scan_data
        
        # Lancer le scan en arrière-plan
        thread = threading.Thread(
            target=execute_scan_with_live_output,
            args=('nikto', target, scan_type, scan_id),
            daemon=True
        )
        thread.start()
        
        logger.info(f"🚀 Scan nikto lancé: {scan_id} - {target}")
        
        return jsonify({
            'scan_id': scan_id,
            'message': f'Scan nikto lancé sur {target}',
            'status': 'starting',
            'estimated_time': SCAN_TYPES['nikto'][scan_type]['estimated_time'],
            'live_output_url': f'/api/scan/live/{scan_id}'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage scan nikto: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/live/<scan_id>', methods=['GET'])
def get_live_output(scan_id):
    """Récupère la sortie live d'un scan en cours"""
    if scan_id not in active_scans:
        return jsonify({'error': 'Scan non trouvé'}), 404
    
    scan_data = active_scans[scan_id]
    output_lines = []
    
    # Récupérer toutes les lignes disponibles dans la queue
    if 'output_queue' in scan_data:
        try:
            while True:
                line = scan_data['output_queue'].get_nowait()
                output_lines.append(line)
        except queue.Empty:
            pass
    
    return jsonify({
        'scan_id': scan_id,
        'status': scan_data['status'],
        'new_lines': output_lines,
        'last_output': scan_data.get('last_output', ''),
        'is_running': scan_data['status'] in ['starting', 'running']
    })

@app.route('/api/scan/status/<scan_id>', methods=['GET'])
def get_scan_status(scan_id):
    """Statut détaillé d'un scan"""
    if scan_id in active_scans:
        scan_data = active_scans[scan_id].copy()
        # Nettoyer les données pour la réponse
        for key in ['output', 'output_queue', 'process']:
            if key in scan_data:
                del scan_data[key]
        return jsonify(scan_data)
    
    # Chercher dans l'historique
    for scan in scan_history:
        if scan['scan_id'] == scan_id:
            # Nettoyer les données
            clean_scan = scan.copy()
            for key in ['output', 'output_queue', 'process']:
                if key in clean_scan:
                    del clean_scan[key]
            return jsonify(clean_scan)
    
    return jsonify({'error': 'Scan non trouvé'}), 404

@app.route('/api/scans/active', methods=['GET'])
def get_active_scans():
    """Liste des scans actifs"""
    active_list = []
    for scan_id, scan_data in active_scans.items():
        clean_data = scan_data.copy()
        # Nettoyer les données sensibles
        for key in ['output', 'output_queue', 'process']:
            if key in clean_data:
                del clean_data[key]
        active_list.append(clean_data)
    
    return jsonify({
        'active_scans': active_list,
        'total': len(active_list)
    })

@app.route('/api/scans/history', methods=['GET'])
def get_scan_history():
    """Historique des scans"""
    limit = request.args.get('limit', 50, type=int)
    tool_filter = request.args.get('tool')
    
    filtered_history = scan_history
    if tool_filter:
        filtered_history = [s for s in scan_history if s['tool'] == tool_filter]
    
    # Nettoyer les données pour la réponse
    clean_history = []
    for scan in filtered_history[:limit]:
        clean_scan = scan.copy()
        # Garder seulement les métadonnées essentielles
        for key in ['output', 'output_queue', 'process']:
            if key in clean_scan:
                del clean_scan[key]
        clean_history.append(clean_scan)
    
    return jsonify({
        'scans': clean_history,
        'total': len(filtered_history),
        'limit': limit
    })

@app.route('/api/scan/stop/<scan_id>', methods=['POST'])
def stop_scan(scan_id):
    """Arrête un scan en cours"""
    if scan_id not in active_scans:
        return jsonify({'error': 'Scan non trouvé ou déjà terminé'}), 404
    
    try:
        scan_data = active_scans[scan_id]
        
        # Tuer le processus si il existe
        if 'process' in scan_data:
            process = scan_data['process']
            process.terminate()
            # Attendre un peu puis forcer l'arrêt si nécessaire
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        
        # Marquer comme arrêté
        scan_data['status'] = 'stopped'
        scan_data['stopped_at'] = datetime.now().isoformat()
        
        logger.info(f"🛑 Scan arrêté: {scan_id}")
        
        return jsonify({
            'message': f'Scan {scan_id} arrêté',
            'status': 'stopped'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur arrêt scan: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES RAPPORTS ====================

@app.route('/api/reports/list', methods=['GET'])
def list_reports():
    """Liste des rapports PDF disponibles"""
    try:
        ensure_directories()
        reports = []
        reports_dir = DIRECTORIES['reports_pdf']
        
        if os.path.exists(reports_dir):
            for filename in os.listdir(reports_dir):
                if filename.endswith('.pdf') and filename.startswith('rapport_'):
                    file_path = os.path.join(reports_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    # Extraire les informations du nom de fichier
                    parts = filename.replace('.pdf', '').split('_')
                    tool_type = parts[1] if len(parts) > 1 else 'unknown'
                    
                    reports.append({
                        'filename': filename,
                        'tool': tool_type,
                        'size': format_file_size(file_stats.st_size),
                        'size_bytes': file_stats.st_size,
                        'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        'download_url': f'/api/reports/download/pdf/{filename}',
                        'name': f'Rapport {tool_type.upper()} - {datetime.fromtimestamp(file_stats.st_ctime).strftime("%d/%m/%Y %H:%M")}'
                    })
        
        # Tri par date de création (plus récent d'abord)
        reports.sort(key=lambda x: x['created'], reverse=True)
        
        # Statistiques
        stats = {
            'total': len(reports),
            'by_tool': {},
            'total_size_bytes': sum(r['size_bytes'] for r in reports)
        }
        
        for report in reports:
            tool = report['tool']
            stats['by_tool'][tool] = stats['by_tool'].get(tool, 0) + 1
        
        stats['total_size'] = format_file_size(stats['total_size_bytes'])
        
        return jsonify({
            'reports': reports,
            'stats': stats,
            'total': len(reports)
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste rapports: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/download/pdf/<filename>', methods=['GET'])
def download_pdf_report(filename):
    """Télécharge un rapport PDF"""
    try:
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(DIRECTORIES['reports_pdf'], safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport non trouvé'}), 404
        
        if not safe_filename.endswith('.pdf'):
            return jsonify({'error': 'Type de fichier non autorisé'}), 400
        
        logger.info(f"📥 Téléchargement rapport PDF: {safe_filename}")
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/preview/pdf/<filename>', methods=['GET'])
def preview_pdf_report(filename):
    """Prévisualise un rapport PDF"""
    try:
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(DIRECTORIES['reports_pdf'], safe_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Rapport non trouvé'}), 404
        
        if not safe_filename.endswith('.pdf'):
            return jsonify({'error': 'Seuls les rapports PDF peuvent être prévisualisés'}), 400
        
        logger.info(f"👁️ Prévisualisation rapport PDF: {safe_filename}")
        
        return send_file(file_path, mimetype='application/pdf', as_attachment=False)
        
    except Exception as e:
        logger.error(f"❌ Erreur prévisualisation: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== ROUTES DE TEST ====================

@app.route('/api/test/tools', methods=['GET'])
def test_tools():
    """Test de disponibilité des outils"""
    global tools_status
    tools_status = check_tool_availability()
    
    tests = {}
    for tool, available in tools_status.items():
        if available:
            try:
                if tool == 'nmap':
                    result = subprocess.run(['nmap', '--version'], capture_output=True, text=True, timeout=10)
                    tests[tool] = {
                        'available': True,
                        'version': result.stdout.split('\n')[0] if result.returncode == 0 else 'Unknown',
                        'status': 'OK'
                    }
                elif tool == 'nikto':
                    result = subprocess.run(['nikto', '-Version'], capture_output=True, text=True, timeout=10)
                    tests[tool] = {
                        'available': True,
                        'version': result.stdout.strip() if result.returncode == 0 else 'Unknown',
                        'status': 'OK'
                    }
            except Exception as e:
                tests[tool] = {
                    'available': False,
                    'error': str(e),
                    'status': 'ERROR'
                }
        else:
            tests[tool] = {
                'available': False,
                'status': 'NOT_FOUND'
            }
    
    return jsonify({
        'tools_tests': tests,
        'overall_status': 'OK' if all(t.get('available', False) for t in tests.values()) else 'PARTIAL'
    })

# ==================== GESTIONNAIRES D'ERREURS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'message': 'Vérifiez l\'URL de l\'API'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur interne: {error}")
    return jsonify({
        'error': 'Erreur interne du serveur'
    }), 500

# ==================== NETTOYAGE ET DÉMARRAGE ====================

def cleanup_on_exit():
    """Nettoyage lors de l'arrêt"""
    logger.info("🔄 Arrêt en cours...")
    
    # Arrêter tous les processus actifs
    for scan_id, scan_data in active_scans.items():
        if 'process' in scan_data:
            try:
                scan_data['process'].terminate()
                scan_data['process'].wait(timeout=5)
            except:
                try:
                    scan_data['process'].kill()
                except:
                    pass
        scan_data['status'] = 'interrupted'
        scan_data['interrupted_at'] = datetime.now().isoformat()
    
    logger.info("✅ Arrêt terminé")

def signal_handler(sig, frame):
    cleanup_on_exit()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ==================== DÉMARRAGE ====================

if __name__ == '__main__':
    # Vérifier la disponibilité de reportlab
    try:
        import reportlab
        logger.info("✅ ReportLab disponible pour génération PDF")
    except ImportError:
        logger.warning("❌ ReportLab non disponible - installation: pip install reportlab")
    
    logger.info("🚀 Démarrage Pacha Toolbox v2.0 - Interface IT Cyber")
    logger.info(f"📁 Répertoires: {list(DIRECTORIES.keys())}")
    logger.info(f"🛠️ Outils disponibles: {[k for k, v in tools_status.items() if v]}")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        cleanup_on_exit()
    except Exception as e:
        logger.error(f"❌ Erreur critique: {e}")
        cleanup_on_exit()
        sys.exit(1)