# backend/auth/routes.py
from flask import Blueprint, request, jsonify, make_response
import logging
import re
from .database import db_manager
from .middleware import get_client_ip, get_user_agent, login_required, admin_required, get_current_user

logger = logging.getLogger(__name__)

# Créer le blueprint pour les routes d'authentification
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Valider le format d'email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valider la force du mot de passe"""
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    
    if not re.search(r'[A-Z]', password):
        return False, "Le mot de passe doit contenir au moins une majuscule"
    
    if not re.search(r'[a-z]', password):
        return False, "Le mot de passe doit contenir au moins une minuscule"
    
    if not re.search(r'\d', password):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    
    return True, "Mot de passe valide"

@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation des données
        if not username or not email or not password:
            return jsonify({'error': 'Nom d\'utilisateur, email et mot de passe requis'}), 400
        
        if len(username) < 3 or len(username) > 50:
            return jsonify({'error': 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Format d\'email invalide'}), 400
        
        is_valid, password_message = validate_password(password)
        if not is_valid:
            return jsonify({'error': password_message}), 400
        
        # Créer l'utilisateur
        user_id = db_manager.create_user(username, email, password)
        
        if user_id:
            logger.info(f"✅ Nouvel utilisateur inscrit: {username}")
            return jsonify({
                'success': True,
                'message': 'Compte créé avec succès',
                'user_id': user_id,
                'username': username
            }), 201
        else:
            return jsonify({'error': 'Erreur lors de la création du compte'}), 500
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    
    except Exception as e:
        logger.error(f"❌ Erreur inscription: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Connexion utilisateur"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Nom d\'utilisateur et mot de passe requis'}), 400
        
        # Authentifier l'utilisateur
        user = db_manager.authenticate_user(username, password, get_client_ip())
        
        if not user:
            return jsonify({
                'error': 'Nom d\'utilisateur ou mot de passe incorrect',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        # Créer une session
        session_token = db_manager.create_session(
            user['id'], 
            get_client_ip(), 
            get_user_agent()
        )
        
        # Préparer la réponse
        response_data = {
            'success': True,
            'message': 'Connexion réussie',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'last_login': user['last_login']
            },
            'session_token': session_token
        }
        
        # Créer la réponse avec cookie sécurisé
        response = make_response(jsonify(response_data))
        response.set_cookie(
            'session_token', 
            session_token,
            max_age=7*24*60*60,  # 7 jours
            httponly=True,
            secure=False,  # True en production avec HTTPS
            samesite='Lax'
        )
        
        logger.info(f"✅ Connexion réussie pour: {username}")
        return response
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    
    except Exception as e:
        logger.error(f"❌ Erreur connexion: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Déconnexion utilisateur"""
    try:
        user = get_current_user()
        session_token = user['session_token']
        
        # Révoquer la session
        db_manager.revoke_session(session_token)
        
        # Créer la réponse
        response = make_response(jsonify({
            'success': True,
            'message': 'Déconnexion réussie'
        }))
        
        # Supprimer le cookie
        response.set_cookie('session_token', '', expires=0)
        
        logger.info(f"✅ Déconnexion pour: {user['username']}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur déconnexion: {e}")
        return jsonify({'error': 'Erreur lors de la déconnexion'}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user_info():
    """Obtenir les informations de l'utilisateur actuel"""
    try:
        user = get_current_user()
        
        # Récupérer les informations complètes
        full_user = db_manager.get_user_by_id(user['id'])
        
        if not full_user:
            return jsonify({'error': 'Utilisateur introuvable'}), 404
        
        # Récupérer les statistiques des scans
        user_scans = db_manager.get_user_scans(user['id'], limit=1000)
        
        stats = {
            'total_scans': len(user_scans),
            'tools_used': len(set(scan['tool'] for scan in user_scans)),
            'last_scan': max([scan['created_at'] for scan in user_scans]) if user_scans else None
        }
        
        response_data = {
            'user': {
                'id': full_user['id'],
                'username': full_user['username'],
                'email': full_user['email'],
                'role': full_user['role'],
                'created_at': full_user['created_at'],
                'last_login': full_user['last_login'],
                'is_verified': full_user['is_verified']
            },
            'stats': stats
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Changer le mot de passe de l'utilisateur"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Données JSON requises'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Mot de passe actuel et nouveau mot de passe requis'}), 400
        
        user = get_current_user()
        
        # Vérifier le mot de passe actuel
        auth_user = db_manager.authenticate_user(user['username'], current_password)
        if not auth_user:
            return jsonify({'error': 'Mot de passe actuel incorrect'}), 400
        
        # Valider le nouveau mot de passe
        is_valid, password_message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': password_message}), 400
        
        # Mettre à jour le mot de passe
        from werkzeug.security import generate_password_hash
        import sqlite3
        
        password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        with sqlite3.connect(db_manager.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (password_hash, user['id'])
            )
            conn.commit()
        
        logger.info(f"✅ Mot de passe changé pour: {user['username']}")
        return jsonify({
            'success': True,
            'message': 'Mot de passe mis à jour avec succès'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur changement mot de passe: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Lister tous les utilisateurs (admin seulement)"""
    try:
        import sqlite3
        
        with sqlite3.connect(db_manager.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, role, is_active, is_verified, 
                       created_at, last_login, login_attempts
                FROM users 
                ORDER BY created_at DESC
            ''')
            
            users = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'users': users,
            'total': len(users)
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste utilisateurs: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(user_id):
    """Activer/désactiver un utilisateur (admin seulement)"""
    try:
        import sqlite3
        
        with sqlite3.connect(db_manager.db_path) as conn:
            cursor = conn.cursor()
            
            # Récupérer le statut actuel
            cursor.execute('SELECT is_active, username FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'Utilisateur introuvable'}), 404
            
            # Inverser le statut
            new_status = not user[0]
            cursor.execute(
                'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (new_status, user_id)
            )
            
            conn.commit()
        
        action = 'activé' if new_status else 'désactivé'
        logger.info(f"✅ Utilisateur {user[1]} {action} par admin")
        
        return jsonify({
            'success': True,
            'message': f'Utilisateur {action} avec succès',
            'is_active': new_status
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur toggle utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/sessions', methods=['GET'])
@login_required
def list_user_sessions():
    """Lister les sessions de l'utilisateur actuel"""
    try:
        user = get_current_user()
        import sqlite3
        
        with sqlite3.connect(db_manager.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT session_token, ip_address, user_agent, created_at, 
                       expires_at, is_active
                FROM user_sessions 
                WHERE user_id = ? AND is_active = 1
                ORDER BY created_at DESC
            ''', (user['id'],))
            
            sessions = []
            for row in cursor.fetchall():
                session_data = dict(row)
                # Masquer partiellement le token
                token = session_data['session_token']
                session_data['session_token'] = f"{token[:8]}...{token[-8:]}"
                # Marquer la session actuelle
                session_data['is_current'] = token == user['session_token']
                sessions.append(session_data)
        
        return jsonify({
            'sessions': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste sessions: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/sessions/<session_token>', methods=['DELETE'])
@login_required
def revoke_session(session_token):
    """Révoquer une session spécifique"""
    try:
        user = get_current_user()
        
        # Vérifier que la session appartient à l'utilisateur
        session_data = db_manager.validate_session(session_token)
        if not session_data or session_data['user_id'] != user['id']:
            return jsonify({'error': 'Session introuvable'}), 404
        
        # Révoquer la session
        if db_manager.revoke_session(session_token):
            return jsonify({
                'success': True,
                'message': 'Session révoquée avec succès'
            })
        else:
            return jsonify({'error': 'Erreur lors de la révocation'}), 500
            
    except Exception as e:
        logger.error(f"❌ Erreur révocation session: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Vérifier le statut d'authentification"""
    try:
        from .middleware import extract_token
        
        token = extract_token()
        if not token:
            return jsonify({
                'authenticated': False,
                'message': 'Aucun token fourni'
            })
        
        session_data = db_manager.validate_session(token)
        if session_data and session_data['is_active']:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': session_data['user_id'],
                    'username': session_data['username'],
                    'role': session_data['role']
                }
            })
        else:
            return jsonify({
                'authenticated': False,
                'message': 'Token invalide ou expiré'
            })
            
    except Exception as e:
        logger.error(f"❌ Erreur vérification auth: {e}")
        return jsonify({
            'authenticated': False,
            'message': 'Erreur de vérification'
        }), 500