# backend/auth/middleware.py
from functools import wraps
from flask import request, jsonify, current_app, g
import logging
from .database import db_manager

logger = logging.getLogger(__name__)

def get_client_ip():
    """Obtenir l'adresse IP du client"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def get_user_agent():
    """Obtenir le User-Agent du client"""
    return request.headers.get('User-Agent', '')

def extract_token():
    """Extraire le token d'authentification de la requête"""
    # Vérifier dans les headers Authorization
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    
    # Vérifier dans les cookies
    token = request.cookies.get('session_token')
    if token:
        return token
    
    # Vérifier dans le body JSON pour les requêtes POST
    if request.is_json:
        data = request.get_json()
        if data and 'session_token' in data:
            return data['session_token']
    
    return None

def login_required(f):
    """Décorateur pour protéger les routes nécessitant une authentification"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = extract_token()
            
            if not token:
                return jsonify({
                    'error': 'Token d\'authentification requis',
                    'code': 'MISSING_TOKEN'
                }), 401
            
            # Valider le token
            session_data = db_manager.validate_session(token)
            
            if not session_data:
                return jsonify({
                    'error': 'Token invalide ou expiré',
                    'code': 'INVALID_TOKEN'
                }), 401
            
            if not session_data['is_active']:
                return jsonify({
                    'error': 'Compte désactivé',
                    'code': 'ACCOUNT_DISABLED'
                }), 403
            
            # Stocker les informations utilisateur dans g
            g.current_user = {
                'id': session_data['user_id'],
                'username': session_data['username'],
                'email': session_data['email'],
                'role': session_data['role'],
                'session_token': token
            }
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Erreur middleware authentification: {e}")
            return jsonify({
                'error': 'Erreur d\'authentification',
                'code': 'AUTH_ERROR'
            }), 500
    
    return decorated_function

def admin_required(f):
    """Décorateur pour protéger les routes administrateur"""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if g.current_user['role'] != 'admin':
            return jsonify({
                'error': 'Droits administrateur requis',
                'code': 'ADMIN_REQUIRED'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def rate_limit_check(max_requests=100, window_minutes=60):
    """Vérification simple du rate limiting par IP"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implémenter un vrai rate limiting avec Redis ou cache
            # Pour l'instant, on laisse passer toutes les requêtes
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class AuthMiddleware:
    """Classe middleware pour l'authentification"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialiser le middleware avec l'application Flask"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Exécuté avant chaque requête"""
        # Logging des requêtes
        logger.debug(f"📥 {request.method} {request.path} - IP: {get_client_ip()}")
        
        # Initialiser g.current_user
        g.current_user = None
        
        # Essayer d'authentifier automatiquement si token présent
        token = extract_token()
        if token:
            try:
                session_data = db_manager.validate_session(token)
                if session_data and session_data['is_active']:
                    g.current_user = {
                        'id': session_data['user_id'],
                        'username': session_data['username'],
                        'email': session_data['email'],
                        'role': session_data['role'],
                        'session_token': token
                    }
            except Exception as e:
                logger.error(f"❌ Erreur authentification automatique: {e}")
    
    def after_request(self, response):
        """Exécuté après chaque requête"""
        # Ajouter des headers de sécurité
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # CORS si nécessaire
        if current_app.config.get('ENABLE_CORS', False):
            response.headers['Access-Control-Allow-Origin'] = current_app.config.get('CORS_ORIGIN', '*')
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

def get_current_user():
    """Obtenir l'utilisateur actuel"""
    return getattr(g, 'current_user', None)

def is_authenticated():
    """Vérifier si l'utilisateur est authentifié"""
    return get_current_user() is not None

def has_role(role):
    """Vérifier si l'utilisateur a un rôle spécifique"""
    user = get_current_user()
    return user and user.get('role') == role

def can_access_scan(scan_user_id):
    """Vérifier si l'utilisateur peut accéder à un scan"""
    user = get_current_user()
    if not user:
        return False
    
    # Admin peut tout voir
    if user['role'] == 'admin':
        return True
    
    # Utilisateur peut voir ses propres scans
    return user['id'] == scan_user_id