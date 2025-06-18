# backend/app/routes/pdf_reports.py
"""
Routes Flask pour la génération de rapports PDF par modules
"""

import os
import json
import logging
from datetime import datetime
from flask import Blueprint, jsonify, request, send_file, Response
from werkzeug.exceptions import NotFound
from app.modules.pdf_generator import pdf_generator

logger = logging.getLogger(__name__)

# Blueprint pour les rapports PDF
pdf_bp = Blueprint('pdf_reports', __name__, url_prefix='/api/reports')

@pdf_bp.route('/generate/pdf', methods=['POST'])
def generate_pdf_report():
    """
    Générer un rapport PDF pour un scan spécifique
    
    Body JSON:
    {
        "tool": "nmap|nikto|metasploit|hydra|tcpdump",
        "scan_data": {...}
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        tool = data.get('tool', '').lower()
        scan_data = data.get('scan_data', {})
        
        if not tool:
            return jsonify({'error': 'Paramètre "tool" requis'}), 400
        
        if not scan_data:
            return jsonify({'error': 'Paramètre "scan_data" requis'}), 400
        
        # Validation des outils supportés
        supported_tools = ['nmap', 'nikto', 'metasploit', 'hydra', 'tcpdump']
        if tool not in supported_tools:
            logger.warning(f"Outil non supporté: {tool}, utilisation du générateur générique")
        
        # Génération du rapport PDF
        logger.info(f"🔄 Génération rapport PDF pour {tool}")
        filepath, filename = pdf_generator.generate_report_by_tool(tool, scan_data)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Erreur lors de la génération du PDF'}), 500
        
        # Informations du fichier généré
        file_size = os.path.getsize(filepath)
        
        response_data = {
            'status': 'success',
            'message': f'Rapport PDF {tool.upper()} généré avec succès',
            'pdf_filename': filename,
            'pdf_path': filepath,
            'file_size': file_size,
            'tool': tool,
            'generated_at': datetime.now().isoformat(),
            'download_url': f'/api/reports/download/pdf/{filename}'
        }
        
        logger.info(f"✅ Rapport PDF généré: {filename} ({file_size} bytes)")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur génération PDF: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la génération: {str(e)}'
        }), 500

@pdf_bp.route('/generate/consolidated', methods=['POST'])
def generate_consolidated_pdf():
    """
    Générer un rapport PDF consolidé multi-modules
    
    Body JSON:
    {
        "scans": [
            {"tool": "nmap", "scan_data": {...}},
            {"tool": "nikto", "scan_data": {...}},
            ...
        ],
        "title": "Audit de Sécurité XYZ" (optionnel)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        scans = data.get('scans', [])
        title = data.get('title', 'Rapport Consolidé')
        
        if not scans:
            return jsonify({'error': 'Liste de scans requise'}), 400
        
        # Préparation des données pour le rapport consolidé
        scans_data = []
        for scan in scans:
            tool = scan.get('tool', 'unknown')
            scan_data = scan.get('scan_data', {})
            
            # Enrichissement des données
            enriched_data = {
                'tool': tool,
                'timestamp': datetime.now().isoformat(),
                **scan_data
            }
            scans_data.append(enriched_data)
        
        logger.info(f"🔄 Génération rapport consolidé avec {len(scans_data)} scans")
        
        # Génération du rapport consolidé
        filepath, filename = pdf_generator.generate_consolidated_report(scans_data)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Erreur lors de la génération du PDF consolidé'}), 500
        
        file_size = os.path.getsize(filepath)
        
        response_data = {
            'status': 'success',
            'message': 'Rapport PDF consolidé généré avec succès',
            'pdf_filename': filename,
            'pdf_path': filepath,
            'file_size': file_size,
            'scans_count': len(scans_data),
            'tools_used': list(set(scan['tool'] for scan in scans_data)),
            'generated_at': datetime.now().isoformat(),
            'download_url': f'/api/reports/download/pdf/{filename}'
        }
        
        logger.info(f"✅ Rapport consolidé généré: {filename} ({file_size} bytes)")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur génération PDF consolidé: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la génération: {str(e)}'
        }), 500

@pdf_bp.route('/download/pdf/<filename>', methods=['GET'])
def download_pdf_report(filename):
    """Télécharger un rapport PDF"""
    try:
        # Validation du nom de fichier
        if not filename.endswith('.pdf'):
            return jsonify({'error': 'Format de fichier invalide'}), 400
        
        # Sécurité: éviter les attaques de path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nom de fichier invalide'}), 400
        
        pdf_path = os.path.join('/app/reports/pdf', filename)
        
        if not os.path.exists(pdf_path):
            logger.warning(f"Fichier PDF non trouvé: {filename}")
            return jsonify({'error': 'Rapport PDF non trouvé'}), 404
        
        logger.info(f"📥 Téléchargement PDF: {filename}")
        
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement PDF: {e}")
        return jsonify({
            'error': f'Erreur lors du téléchargement: {str(e)}'
        }), 500

@pdf_bp.route('/list/pdf', methods=['GET'])
def list_pdf_reports():
    """Lister tous les rapports PDF disponibles"""
    try:
        reports = pdf_generator.list_reports()
        stats = pdf_generator.get_reports_stats()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        tool_filter = request.args.get('tool', '')
        
        # Filtrage par outil
        if tool_filter:
            reports = [r for r in reports if r['tool'] == tool_filter.lower()]
        
        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_reports = reports[start_idx:end_idx]
        
        # Enrichissement des données de réponse
        for report in paginated_reports:
            report['download_url'] = f"/api/reports/download/pdf/{report['filename']}"
            report['size_mb'] = round(report['size'] / (1024 * 1024), 2)
            report['age_hours'] = round(
                (datetime.now() - datetime.fromisoformat(report['created'])).total_seconds() / 3600, 1
            )
        
        response_data = {
            'reports': paginated_reports,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': len(reports),
                'pages': (len(reports) + per_page - 1) // per_page
            },
            'stats': stats,
            'filters': {
                'tool': tool_filter if tool_filter else None
            }
        }
        
        logger.info(f"📋 Liste PDF: {len(paginated_reports)} rapports (page {page})")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur listage PDF: {e}")
        return jsonify({
            'error': f'Erreur lors du listage: {str(e)}',
            'reports': [],
            'stats': {}
        }), 500

@pdf_bp.route('/stats/pdf', methods=['GET'])
def get_pdf_stats():
    """Obtenir les statistiques des rapports PDF"""
    try:
        stats = pdf_generator.get_reports_stats()
        
        # Enrichissement avec des métriques supplémentaires
        stats['storage'] = {
            'total_size_mb': round(stats['total_size'] / (1024 * 1024), 2),
            'avg_size_mb': round((stats['total_size'] / stats['total_reports']) / (1024 * 1024), 2) if stats['total_reports'] > 0 else 0
        }
        
        stats['generated_at'] = datetime.now().isoformat()
        
        logger.info(f"📊 Stats PDF: {stats['total_reports']} rapports")
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"❌ Erreur stats PDF: {e}")
        return jsonify({
            'error': f'Erreur lors du calcul des stats: {str(e)}'
        }), 500

@pdf_bp.route('/delete/pdf/<filename>', methods=['DELETE'])
def delete_pdf_report(filename):
    """Supprimer un rapport PDF"""
    try:
        # Validation du nom de fichier
        if not filename.endswith('.pdf'):
            return jsonify({'error': 'Format de fichier invalide'}), 400
        
        # Sécurité
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nom de fichier invalide'}), 400
        
        pdf_path = os.path.join('/app/reports/pdf', filename)
        
        if not os.path.exists(pdf_path):
            return jsonify({'error': 'Rapport PDF non trouvé'}), 404
        
        # Suppression du fichier
        os.remove(pdf_path)
        
        logger.info(f"🗑️ PDF supprimé: {filename}")
        return jsonify({
            'status': 'success',
            'message': f'Rapport {filename} supprimé avec succès'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur suppression PDF: {e}")
        return jsonify({
            'error': f'Erreur lors de la suppression: {str(e)}'
        }), 500

@pdf_bp.route('/bulk/generate', methods=['POST'])
def bulk_generate_pdf():
    """Génération en lot de rapports PDF"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        scans = data.get('scans', [])
        generate_consolidated = data.get('generate_consolidated', True)
        
        if not scans:
            return jsonify({'error': 'Liste de scans requise'}), 400
        
        generated_reports = []
        errors = []
        
        # Génération individuelle pour chaque scan
        for i, scan in enumerate(scans):
            try:
                tool = scan.get('tool', '').lower()
                scan_data = scan.get('scan_data', {})
                
                if not tool or not scan_data:
                    errors.append(f"Scan {i+1}: Données incomplètes")
                    continue
                
                filepath, filename = pdf_generator.generate_report_by_tool(tool, scan_data)
                
                if os.path.exists(filepath):
                    generated_reports.append({
                        'tool': tool,
                        'filename': filename,
                        'size': os.path.getsize(filepath),
                        'download_url': f'/api/reports/download/pdf/{filename}'
                    })
                else:
                    errors.append(f"Scan {i+1} ({tool}): Erreur de génération")
                    
            except Exception as e:
                errors.append(f"Scan {i+1}: {str(e)}")
        
        # Génération du rapport consolidé si demandé
        consolidated_report = None
        if generate_consolidated and generated_reports:
            try:
                scans_data = []
                for scan in scans:
                    enriched_data = {
                        'tool': scan.get('tool', 'unknown'),
                        'timestamp': datetime.now().isoformat(),
                        **scan.get('scan_data', {})
                    }
                    scans_data.append(enriched_data)
                
                filepath, filename = pdf_generator.generate_consolidated_report(scans_data)
                
                if os.path.exists(filepath):
                    consolidated_report = {
                        'filename': filename,
                        'size': os.path.getsize(filepath),
                        'scans_count': len(scans_data),
                        'download_url': f'/api/reports/download/pdf/{filename}'
                    }
                    
            except Exception as e:
                errors.append(f"Rapport consolidé: {str(e)}")
        
        response_data = {
            'status': 'completed',
            'generated_reports': generated_reports,
            'consolidated_report': consolidated_report,
            'total_generated': len(generated_reports),
            'errors': errors,
            'generated_at': datetime.now().isoformat()
        }
        
        if consolidated_report:
            response_data['total_generated'] += 1
        
        logger.info(f"📦 Génération en lot: {response_data['total_generated']} rapports générés")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur génération en lot: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la génération en lot: {str(e)}'
        }), 500

@pdf_bp.route('/bulk/delete', methods=['DELETE'])
def bulk_delete_pdf():
    """Suppression en lot de rapports PDF"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        filenames = data.get('filenames', [])
        delete_all = data.get('delete_all', False)
        
        if delete_all:
            # Supprimer tous les PDF
            pdf_dir = '/app/reports/pdf'
            if os.path.exists(pdf_dir):
                filenames = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
        
        if not filenames:
            return jsonify({'error': 'Aucun fichier à supprimer'}), 400
        
        deleted_files = []
        errors = []
        
        for filename in filenames:
            try:
                # Validation
                if not filename.endswith('.pdf'):
                    errors.append(f"{filename}: Format invalide")
                    continue
                
                if '..' in filename or '/' in filename or '\\' in filename:
                    errors.append(f"{filename}: Nom invalide")
                    continue
                
                pdf_path = os.path.join('/app/reports/pdf', filename)
                
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
                    deleted_files.append(filename)
                else:
                    errors.append(f"{filename}: Fichier non trouvé")
                    
            except Exception as e:
                errors.append(f"{filename}: {str(e)}")
        
        response_data = {
            'status': 'completed',
            'deleted_files': deleted_files,
            'total_deleted': len(deleted_files),
            'errors': errors,
            'deleted_at': datetime.now().isoformat()
        }
        
        logger.info(f"🗑️ Suppression en lot: {len(deleted_files)} fichiers supprimés")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur suppression en lot: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la suppression en lot: {str(e)}'
        }), 500

@pdf_bp.route('/preview/pdf/<filename>', methods=['GET'])
def preview_pdf_info(filename):
    """Aperçu des informations d'un rapport PDF"""
    try:
        # Validation
        if not filename.endswith('.pdf'):
            return jsonify({'error': 'Format de fichier invalide'}), 400
        
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nom de fichier invalide'}), 400
        
        pdf_path = os.path.join('/app/reports/pdf', filename)
        
        if not os.path.exists(pdf_path):
            return jsonify({'error': 'Rapport PDF non trouvé'}), 404
        
        # Informations du fichier
        stat = os.stat(pdf_path)
        
        # Extraction des métadonnées du nom de fichier
        tool = pdf_generator._extract_tool_from_filename(filename)
        
        preview_data = {
            'filename': filename,
            'tool': tool,
            'size': stat.st_size,
            'size_mb': round(stat.st_size / (1024 * 1024), 2),
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'age_hours': round((datetime.now() - datetime.fromtimestamp(stat.st_ctime)).total_seconds() / 3600, 1),
            'download_url': f'/api/reports/download/pdf/{filename}',
            'delete_url': f'/api/reports/delete/pdf/{filename}'
        }
        
        return jsonify(preview_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur aperçu PDF: {e}")
        return jsonify({
            'error': f'Erreur lors de l\'aperçu: {str(e)}'
        }), 500

# Gestionnaire d'erreurs pour le blueprint
@pdf_bp.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'message': 'L\'endpoint de rapport PDF demandé n\'existe pas'
    }), 404

@pdf_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur interne blueprint PDF: {error}")
    return jsonify({
        'error': 'Erreur interne du serveur',
        'message': 'Une erreur inattendue s\'est produite lors du traitement du rapport PDF'
    }), 500