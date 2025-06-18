# backend/auth/routes.py - Routes d'authentification PostgreSQL
from flask import Blueprint, request, jsonify, make_response
import logging
import re
from datetime import datetime, timedelta
from .database import db_manager
from .middleware import (
    get_client_ip, get_user_agent, login_required, admin_required, 
    get_current_user, validate_json_input, get_validated_json
)

logger = logging.getLogger(__name__)

# Créer le blueprint pour les routes d'authentification
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Valider le format d'email avec regex robuste"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Valider le nom d'utilisateur"""
    if not username or len(username) < 3 or len(username) > 50:
        return False, "Le nom d'utilisateur doit contenir entre 3 et 50 caractères"
    
    # Seuls lettres, chiffres, underscore et tiret autorisés
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, _ et -"
    
    return True, "Nom d'utilisateur valide"

def validate_password(password):
    """Valider la force du mot de passe"""
    if not password:
        return False, "Mot de passe requis"
    
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    
    if len(password) > 128:
        return False, "Le mot de passe ne peut pas dépasser 128 caractères"
    
    # Vérifications de complexité
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    
    if not has_upper:
        return False, "Le mot de passe doit contenir au moins une majuscule"
    
    if not has_lower:
        return False, "Le mot de passe doit contenir au moins une minuscule"
    
    if not has_digit:
        return False, "Le mot de passe doit contenir au moins un chiffre"
    
    if not has_special:
        return False, "Le mot de passe doit contenir au moins un caractère spécial"
    
    return True, "Mot de passe valide"

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
@validate_json_input(required_fields=['username', 'email', 'password'], 
                    optional_fields=['confirm_password'])
def register():
    """Inscription d'un nouvel utilisateur"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = get_validated_json()
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validation du nom d'utilisateur
        is_valid_username, username_message = validate_username(username)
        if not is_valid_username:
            return jsonify({'error': username_message, 'code': 'INVALID_USERNAME'}), 400
        
        # Validation de l'email
        if not validate_email(email):
            return jsonify({'error': 'Format d\'email invalide', 'code': 'INVALID_EMAIL'}), 400
        
        # Validation du mot de passe
        is_valid_password, password_message = validate_password(password)
        if not is_valid_password:
            return jsonify({'error': password_message, 'code': 'INVALID_PASSWORD'}), 400
        
        # Vérification de la confirmation du mot de passe
        if confirm_password and password != confirm_password:
            return jsonify({'error': 'Les mots de passe ne correspondent pas', 'code': 'PASSWORD_MISMATCH'}), 400
        
        # Créer l'utilisateur
        user_id = db_manager.create_user(username, email, password)
        
        if user_id:
            # Log de l'inscription
            db_manager._log_activity(
                user_id, 'user_registered', 'registration', 
                get_client_ip(), True, f'Nouvel utilisateur: {username}'
            )
            
            logger.info(f"✅ Nouvel utilisateur inscrit: {username} (ID: {user_id})")
            
            return jsonify({
                'success': True,
                'message': 'Compte créé avec succès',
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email
                }
            }), 201
        else:
            return jsonify({'error': 'Erreur lors de la création du compte', 'code': 'CREATION_FAILED'}), 500
            
    except ValueError as e:
        logger.warning(f"Erreur validation inscription: {e}")
        return jsonify({'error': str(e), 'code': 'VALIDATION_ERROR'}), 400
    
    except Exception as e:
        logger.error(f"❌ Erreur inscription: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
@validate_json_input(required_fields=['username', 'password'], 
                    optional_fields=['remember_me'])
def login():
    """Connexion utilisateur"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = get_validated_json()
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember_me = data.get('remember_me', False)
        
        if not username or not password:
            return jsonify({
                'error': 'Nom d\'utilisateur et mot de passe requis',
                'code': 'MISSING_CREDENTIALS'
            }), 400
        
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
                'last_login': user['last_login'],
                'created_at': user['created_at']
            },
            'session_token': session_token,
            'expires_in': 7 * 24 * 60 * 60  # 7 jours en secondes
        }
        
        # Créer la réponse avec cookie sécurisé
        response = make_response(jsonify(response_data))
        
        # Configuration du cookie de session
        max_age = (30 * 24 * 60 * 60) if remember_me else (7 * 24 * 60 * 60)  # 30 jours si "remember me"
        
        response.set_cookie(
            'session_token', 
            session_token,
            max_age=max_age,
            httponly=True,
            secure=False,  # True en production avec HTTPS
            samesite='Lax',
            path='/'
        )
        
        logger.info(f"✅ Connexion réussie pour: {username} depuis {get_client_ip()}")
        return response
        
    except ValueError as e:
        logger.warning(f"Erreur authentification: {e}")
        return jsonify({'error': str(e), 'code': 'AUTH_ERROR'}), 400
    
    except Exception as e:
        logger.error(f"❌ Erreur connexion: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/logout', methods=['POST', 'OPTIONS'])
@login_required
def logout():
    """Déconnexion utilisateur"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        user = get_current_user()
        session_token = user['session_token']
        
        # Révoquer la session
        success = db_manager.revoke_session(session_token)
        
        if success:
            # Log de la déconnexion
            db_manager._log_activity(
                user['id'], 'user_logout', 'authentication', 
                get_client_ip(), True, 'Déconnexion normale'
            )
        
        # Créer la réponse
        response = make_response(jsonify({
            'success': True,
            'message': 'Déconnexion réussie'
        }))
        
        # Supprimer le cookie
        response.set_cookie(
            'session_token', 
            '', 
            expires=0,
            httponly=True,
            secure=False,
            samesite='Lax',
            path='/'
        )
        
        logger.info(f"✅ Déconnexion pour: {user['username']}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur déconnexion: {e}")
        return jsonify({'error': 'Erreur lors de la déconnexion', 'code': 'LOGOUT_ERROR'}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user_info():
    """Obtenir les informations de l'utilisateur actuel"""
    try:
        user = get_current_user()
        
        # Récupérer les informations complètes depuis la base
        full_user = db_manager.get_user_by_id(user['id'])
        
        if not full_user:
            return jsonify({'error': 'Utilisateur introuvable', 'code': 'USER_NOT_FOUND'}), 404
        
        # Récupérer les statistiques des scans
        user_scans = db_manager.get_user_scans(user['id'], limit=1000)
        
        # Calculer les statistiques
        stats = {
            'total_scans': len(user_scans),
            'tools_used': len(set(scan.get('tool', '') for scan in user_scans)),
            'last_scan': None,
            'scans_by_tool': {},
            'recent_activity': len([s for s in user_scans if s.get('created_at') and 
                                   (datetime.now() - datetime.fromisoformat(s['created_at'].replace('Z', ''))).days <= 7])
        }
        
        if user_scans:
            # Dernière activité de scan
            latest_scan = max(user_scans, key=lambda x: x.get('created_at', ''))
            stats['last_scan'] = latest_scan.get('created_at')
            
            # Répartition par outil
            for scan in user_scans:
                tool = scan.get('tool', 'unknown')
                stats['scans_by_tool'][tool] = stats['scans_by_tool'].get(tool, 0) + 1
        
        response_data = {
            'user': {
                'id': full_user['id'],
                'username': full_user['username'],
                'email': full_user['email'],
                'role': full_user['role'],
                'created_at': full_user['created_at'],
                'last_login': full_user['last_login'],
                'is_verified': full_user['is_verified'],
                'is_active': full_user['is_active']
            },
            'stats': stats,
            'permissions': ['scan:read', 'scan:create'] + (['admin:*'] if full_user['role'] == 'admin' else [])
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/change-password', methods=['POST', 'OPTIONS'])
@login_required
@validate_json_input(required_fields=['current_password', 'new_password'],
                    optional_fields=['confirm_password'])
def change_password():
    """Changer le mot de passe de l'utilisateur"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = get_validated_json()
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        user = get_current_user()
        
        # Vérifier le mot de passe actuel
        auth_user = db_manager.authenticate_user(user['username'], current_password, get_client_ip())
        if not auth_user:
            return jsonify({'error': 'Mot de passe actuel incorrect', 'code': 'INVALID_CURRENT_PASSWORD'}), 400
        
        # Valider le nouveau mot de passe
        is_valid, password_message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': password_message, 'code': 'INVALID_NEW_PASSWORD'}), 400
        
        # Vérifier la confirmation
        if confirm_password and new_password != confirm_password:
            return jsonify({'error': 'Les nouveaux mots de passe ne correspondent pas', 'code': 'PASSWORD_MISMATCH'}), 400
        
        # Mettre à jour le mot de passe
        from werkzeug.security import generate_password_hash
        
        password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        with db_manager._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s',
                (password_hash, user['id'])
            )
        
        # Log de l'activité
        db_manager._log_activity(
            user['id'], 'password_changed', 'account', 
            get_client_ip(), True, 'Mot de passe modifié avec succès'
        )
        
        logger.info(f"✅ Mot de passe changé pour: {user['username']}")
        return jsonify({
            'success': True,
            'message': 'Mot de passe mis à jour avec succès'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur changement mot de passe: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Lister tous les utilisateurs (admin seulement)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Maximum 100 par page
        search = request.args.get('search', '').strip()
        
        offset = (page - 1) * per_page
        
        with db_manager._get_connection() as conn:
            cursor = conn.cursor()
            
            # Construire la requête avec recherche optionnelle
            where_clause = ""
            params = []
            
            if search:
                where_clause = "WHERE username ILIKE %s OR email ILIKE %s"
                search_pattern = f"%{search}%"
                params = [search_pattern, search_pattern]
            
            # Compter le total
            count_query = f"SELECT COUNT(*) FROM users {where_clause}"
            cursor.execute(count_query, params)
            total_users = cursor.fetchone()[0]
            
            # Récupérer les utilisateurs avec pagination
            users_query = f'''
                SELECT id, username, email, role, is_active, is_verified, 
                       created_at, last_login, login_attempts, locked_until
                FROM users 
                {where_clause}
                ORDER BY created_at DESC 
                LIMIT %s OFFSET %s
            '''
            
            cursor.execute(users_query, params + [per_page, offset])
            users = []
            
            for row in cursor.fetchall():
                users.append({
                    'id': row[0],
                    'username': row[1],
                    'email': row[2],
                    'role': row[3],
                    'is_active': row[4],
                    'is_verified': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'last_login': row[7].isoformat() if row[7] else None,
                    'login_attempts': row[8],
                    'is_locked': row[9] and row[9] > datetime.now() if row[9] else False
                })
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_users,
                'pages': (total_users + per_page - 1) // per_page
            },
            'search': search
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste utilisateurs: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(user_id):
    """Activer/désactiver un utilisateur (admin seulement)"""
    try:
        admin_user = get_current_user()
        
        # Empêcher l'admin de se désactiver lui-même
        if user_id == admin_user['id']:
            return jsonify({'error': 'Vous ne pouvez pas désactiver votre propre compte', 'code': 'SELF_DEACTIVATION'}), 400
        
        with db_manager._get_connection() as conn:
            cursor = conn.cursor()
            
            # Récupérer le statut actuel
            cursor.execute('SELECT is_active, username, role FROM users WHERE id = %s', (user_id,))
            user_data = cursor.fetchone()
            
            if not user_data:
                return jsonify({'error': 'Utilisateur introuvable', 'code': 'USER_NOT_FOUND'}), 404
            
            is_active, username, role = user_data
            
            # Empêcher de désactiver un autre admin
            if role == 'admin' and is_active:
                return jsonify({'error': 'Impossible de désactiver un autre administrateur', 'code': 'ADMIN_PROTECTION'}), 403
            
            # Inverser le statut
            new_status = not is_active
            cursor.execute(
                'UPDATE users SET is_active = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s',
                (new_status, user_id)
            )
            
            # Révoquer toutes les sessions si désactivation
            if not new_status:
                cursor.execute('UPDATE user_sessions SET is_active = FALSE WHERE user_id = %s', (user_id,))
        
        # Log de l'activité
        action = 'user_activated' if new_status else 'user_deactivated'
        db_manager._log_activity(
            admin_user['id'], action, 'user_management', 
            get_client_ip(), True, f'Utilisateur {username} {"activé" if new_status else "désactivé"}'
        )
        
        action_text = 'activé' if new_status else 'désactivé'
        logger.info(f"✅ Utilisateur {username} {action_text} par admin {admin_user['username']}")
        
        return jsonify({
            'success': True,
            'message': f'Utilisateur {action_text} avec succès',
            'user': {
                'id': user_id,
                'username': username,
                'is_active': new_status
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur toggle utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/sessions', methods=['GET'])
@login_required
def list_user_sessions():
    """Lister les sessions de l'utilisateur actuel"""
    try:
        user = get_current_user()
        
        with db_manager._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT session_token, ip_address, user_agent, created_at, 
                       expires_at, is_active
                FROM user_sessions 
                WHERE user_id = %s AND is_active = TRUE
                ORDER BY created_at DESC
            ''', (user['id'],))
            
            sessions = []
            current_token = user.get('session_token', '')
            
            for row in cursor.fetchall():
                session_token, ip_address, user_agent, created_at, expires_at, is_active = row
                
                # Masquer partiellement le token pour la sécurité
                masked_token = f"{session_token[:8]}...{session_token[-8:]}" if len(session_token) > 16 else session_token
                
                sessions.append({
                    'session_token': masked_token,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'created_at': created_at.isoformat() if created_at else None,
                    'expires_at': expires_at.isoformat() if expires_at else None,
                    'is_active': is_active,
                    'is_current': session_token == current_token
                })
        
        return jsonify({
            'sessions': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur liste sessions: {e}")
        return jsonify({'error': 'Erreur interne du serveur', 'code': 'INTERNAL_ERROR'}), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Vérifier le statut d'authentification sans middleware obligatoire"""
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
                    'email': session_data['email'],
                    'role': session_data['role']
                },
                'session': {
                    'expires_at': session_data['expires_at'].isoformat() if session_data.get('expires_at') else None
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
            'message': 'Erreur de vérification',
            'error': str(e)
        }), 500

# Route de test pour vérifier que l'authentification fonctionne
@auth_bp.route('/test', methods=['GET'])
@login_required
def test_auth():
    """Route de test pour l'authentification"""
    user = get_current_user()
    return jsonify({
        'message': 'Authentification fonctionnelle !',
        'user': user,
        'timestamp': datetime.now().isoformat()
    })