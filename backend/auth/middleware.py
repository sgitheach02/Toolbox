# backend/auth/middleware.py - Middleware d'authentification PostgreSQL
from functools import wraps
from flask import request, jsonify, current_app, g
import logging
from .database import db_manager

logger = logging.getLogger(__name__)

def get_client_ip():
    """Obtenir l'adresse IP du client"""
    # Vérifier les headers de proxy
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
    # Vérifier dans les headers Authorization (Bearer token)
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    
    # Vérifier dans les cookies de session
    token = request.cookies.get('session_token')
    if token:
        return token
    
    # Vérifier dans le body JSON pour les requêtes POST
    if request.is_json and request.content_type == 'application/json':
        try:
            data = request.get_json()
            if data and 'session_token' in data:
                return data['session_token']
        except Exception:
            pass
    
    # Vérifier dans les paramètres de requête (moins sécurisé)
    token = request.args.get('token')
    if token:
        return token
    
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
                    'code': 'MISSING_TOKEN',
                    'message': 'Veuillez vous connecter pour accéder à cette ressource'
                }), 401
            
            # Valider le token avec la base de données
            session_data = db_manager.validate_session(token)
            
            if not session_data:
                return jsonify({
                    'error': 'Token invalide ou expiré',
                    'code': 'INVALID_TOKEN',
                    'message': 'Votre session a expiré, veuillez vous reconnecter'
                }), 401
            
            if not session_data['is_active']:
                return jsonify({
                    'error': 'Compte désactivé',
                    'code': 'ACCOUNT_DISABLED',
                    'message': 'Votre compte a été désactivé'
                }), 403
            
            # Stocker les informations utilisateur dans g pour la requête courante
            g.current_user = {
                'id': session_data['user_id'],
                'username': session_data['username'],
                'email': session_data['email'],
                'role': session_data['role'],
                'session_token': token,
                'session_id': session_data['id'],
                'ip_address': session_data['ip_address']
            }
            
            # Log de l'accès pour audit
            logger.debug(f"Accès autorisé pour {session_data['username']} sur {request.endpoint}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Erreur middleware authentification: {e}")
            return jsonify({
                'error': 'Erreur d\'authentification',
                'code': 'AUTH_ERROR',
                'message': 'Erreur interne lors de la vérification de l\'authentification'
            }), 500
    
    return decorated_function

def admin_required(f):
    """Décorateur pour protéger les routes administrateur"""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        current_user = getattr(g, 'current_user', None)
        
        if not current_user or current_user.get('role') != 'admin':
            logger.warning(f"Tentative d'accès admin refusée pour {current_user.get('username', 'Anonymous')}")
            return jsonify({
                'error': 'Droits administrateur requis',
                'code': 'ADMIN_REQUIRED',
                'message': 'Vous devez être administrateur pour accéder à cette ressource'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def optional_auth(f):
    """Décorateur pour les routes avec authentification optionnelle"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = extract_token()
            
            if token:
                session_data = db_manager.validate_session(token)
                if session_data and session_data['is_active']:
                    g.current_user = {
                        'id': session_data['user_id'],
                        'username': session_data['username'],
                        'email': session_data['email'],
                        'role': session_data['role'],
                        'session_token': token
                    }
                else:
                    g.current_user = None
            else:
                g.current_user = None
                
        except Exception as e:
            logger.warning(f"Erreur auth optionnelle: {e}")
            g.current_user = None
        
        return f(*args, **kwargs)
    
    return decorated_function

def rate_limit_check(max_requests=100, window_minutes=60, per_user=True):
    """Décorateur simple pour le rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implémenter un vrai rate limiting avec Redis
            # Pour l'instant, on laisse passer toutes les requêtes
            # En production, il faudrait utiliser Redis ou une autre solution
            
            # Exemple d'implémentation basique (en mémoire, non persistante)
            # key = f"rate_limit:{get_client_ip()}" if not per_user else f"rate_limit:user:{g.current_user.get('id', 'anonymous')}"
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class AuthMiddleware:
    """Classe middleware pour l'authentification et la sécurité"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialiser le middleware avec l'application Flask"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        app.teardown_appcontext(self.teardown_request)
    
    def before_request(self):
        """Exécuté avant chaque requête"""
        # Logging des requêtes pour debug et audit
        client_ip = get_client_ip()
        user_agent = get_user_agent()
        
        logger.debug(f"📥 {request.method} {request.path} - IP: {client_ip}")
        
        # Initialiser g.current_user à None
        g.current_user = None
        
        # Headers de sécurité préventifs
        if request.method == 'OPTIONS':
            return
        
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
                        'session_token': token,
                        'ip_address': client_ip
                    }
                    logger.debug(f"Auto-auth réussie pour {session_data['username']}")
            except Exception as e:
                logger.warning(f"Erreur auto-authentification: {e}")
    
    def after_request(self, response):
        """Exécuté après chaque requête"""
        # Headers de sécurité obligatoires
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # CORS si configuré
        if current_app.config.get('ENABLE_CORS', True):
            origins = current_app.config.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
            origin = request.headers.get('Origin')
            
            if origin in origins:
                response.headers['Access-Control-Allow-Origin'] = origin
            elif len(origins) == 1 and origins[0] == '*':
                response.headers['Access-Control-Allow-Origin'] = '*'
            
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '86400'  # 24 heures
        
        # Logging de la réponse pour debug
        if current_app.debug:
            logger.debug(f"📤 Response {response.status_code} pour {request.path}")
        
        return response
    
    def teardown_request(self, exception):
        """Nettoyage après la requête"""
        if exception:
            logger.error(f"Exception dans la requête {request.path}: {exception}")

# Fonctions utilitaires pour les vues

def get_current_user():
    """Obtenir l'utilisateur actuel (peut être None)"""
    return getattr(g, 'current_user', None)

def is_authenticated():
    """Vérifier si l'utilisateur est authentifié"""
    user = get_current_user()
    return user is not None

def has_role(role):
    """Vérifier si l'utilisateur a un rôle spécifique"""
    user = get_current_user()
    return user and user.get('role') == role

def is_admin():
    """Vérifier si l'utilisateur est administrateur"""
    return has_role('admin')

def can_access_scan(scan_user_id):
    """Vérifier si l'utilisateur peut accéder à un scan"""
    user = get_current_user()
    if not user:
        return False
    
    # Admin peut tout voir
    if user.get('role') == 'admin':
        return True
    
    # Utilisateur peut voir ses propres scans
    return user.get('id') == scan_user_id

def get_user_permissions():
    """Obtenir les permissions de l'utilisateur actuel"""
    user = get_current_user()
    if not user:
        return []
    
    permissions = ['scan:read', 'scan:create']
    
    if user.get('role') == 'admin':
        permissions.extend([
            'users:read', 'users:write', 'users:delete',
            'scans:read_all', 'system:admin'
        ])
    
    return permissions

def require_permission(permission):
    """Décorateur pour vérifier une permission spécifique"""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            user_permissions = get_user_permissions()
            if permission not in user_permissions:
                return jsonify({
                    'error': 'Permission insuffisante',
                    'code': 'INSUFFICIENT_PERMISSION',
                    'required_permission': permission
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Validation des données

def validate_json_input(required_fields=None, optional_fields=None):
    """Décorateur pour valider les entrées JSON"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Content-Type doit être application/json',
                    'code': 'INVALID_CONTENT_TYPE'
                }), 400
            
            try:
                data = request.get_json()
                if data is None:
                    return jsonify({
                        'error': 'JSON invalide ou vide',
                        'code': 'INVALID_JSON'
                    }), 400
                
                # Vérifier les champs requis
                if required_fields:
                    missing_fields = [field for field in required_fields if field not in data]
                    if missing_fields:
                        return jsonify({
                            'error': f'Champs requis manquants: {", ".join(missing_fields)}',
                            'code': 'MISSING_REQUIRED_FIELDS',
                            'missing_fields': missing_fields
                        }), 400
                
                # Filtrer les champs autorisés
                if required_fields or optional_fields:
                    allowed_fields = (required_fields or []) + (optional_fields or [])
                    filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
                    g.validated_json = filtered_data
                else:
                    g.validated_json = data
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Erreur validation JSON: {e}")
                return jsonify({
                    'error': 'Erreur de validation des données',
                    'code': 'VALIDATION_ERROR'
                }), 400
        
        return decorated_function
    return decorator

def get_validated_json():
    """Obtenir les données JSON validées"""
    return getattr(g, 'validated_json', {})