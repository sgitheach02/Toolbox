#!/usr/bin/env python3
"""
Pacha Toolbox Backend v2.0 - Version corrigée complète
"""

import os
import sys
import json
import uuid
import signal
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuration
DIRECTORIES = {
    'reports': '/app/reports',
    'reports_pdf': '/app/reports/pdf',
    'logs': '/app/logs',
    'data': '/app/data'
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

# Données simulées pour les tests
def create_test_scan_data():
    """Créer des données de scan pour les tests"""
    return {
        'scan_id': str(uuid.uuid4())[:8],
        'tool': 'nmap',
        'target': '127.0.0.1',
        'status': 'completed',
        'timestamp': datetime.now().isoformat(),
        'results': {
            'hosts_discovered': 1,
            'ports_open': [22, 80, 443],
            'vulnerabilities': ['SSH version disclosure', 'HTTP server headers'],
            'risk_level': 'medium'
        }
    }

# ==================== ROUTES DE BASE ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0',
        'message': 'Pacha Toolbox Backend opérationnel'
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

# ==================== ROUTES SCANS ====================

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
    """Scan Nmap simulé"""
    try:
        data = request.get_json() or {}
        target = data.get('target', '127.0.0.1')
        scan_type = data.get('scan_type', 'basic')
        
        # Simuler un scan
        scan_result = create_test_scan_data()
        scan_result.update({
            'tool': 'nmap',
            'target': target,
            'scan_type': scan_type,
            'results': {
                'hosts_discovered': 1 if target == '127.0.0.1' else 0,
                'ports_open': [22, 80, 443] if scan_type == 'comprehensive' else [80],
                'services': ['ssh', 'http', 'https'] if scan_type == 'comprehensive' else ['http'],
                'os_detection': 'Linux 5.x' if scan_type == 'comprehensive' else 'Unknown'
            }
        })
        
        # Générer un rapport automatiquement
        try:
            from app.routes.reports import generate_html_report, create_report_data
            report_data = create_report_data([scan_result], 'scan_report', '24h')
            report_path, report_filename = generate_html_report(report_data)
            
            scan_result['report_generated'] = True
            scan_result['report_filename'] = report_filename
            scan_result['report_url'] = f'/api/reports/download/{report_filename}'
            
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
    """Scan Nikto simulé"""
    try:
        data = request.get_json() or {}
        target = data.get('target', 'http://127.0.0.1')
        scan_type = data.get('scan_type', 'fast')
        
        # Simuler des vulnérabilités selon le type de scan
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
        
        scan_result = create_test_scan_data()
        scan_result.update({
            'tool': 'nikto',
            'target': target,
            'scan_type': scan_type,
            'results': {
                'vulnerabilities_found': len(vulnerabilities),
                'vulnerabilities': vulnerabilities,
                'risk_level': risk_level,
                'pages_tested': 156 if scan_type == 'comprehensive' else 45,
                'plugins_used': 23 if scan_type == 'comprehensive' else 8
            }
        })
        
        # Générer un rapport automatiquement
        try:
            from app.routes.reports import generate_html_report, create_report_data
            report_data = create_report_data([scan_result], 'vulnerability_report', '24h')
            report_path, report_filename = generate_html_report(report_data)
            
            scan_result['report_generated'] = True
            scan_result['report_filename'] = report_filename
            scan_result['report_url'] = f'/api/reports/download/{report_filename}'
            
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

# ==================== INTÉGRATION ROUTES RAPPORTS ====================

# Importer et enregistrer les routes rapports
try:
    from app.routes.reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    logger.info("✅ Routes rapports enregistrées")
except ImportError as e:
    logger.error(f"❌ Erreur import routes rapports: {e}")
    
    # Routes rapports de base si l'import échoue
    @app.route('/api/reports/test', methods=['GET'])
    def test_reports_fallback():
        return jsonify({
            'status': 'error',
            'message': 'Module rapports non disponible',
            'error': 'Import failed'
        }), 500

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
    
    try:
        app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
    except Exception as e:
        logger.error(f"❌ Erreur démarrage serveur: {e}")
        sys.exit(1)
