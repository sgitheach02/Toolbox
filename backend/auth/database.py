# backend/auth/database.py
import os
import sqlite3
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Union
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gestionnaire de base de données sécurisé pour l'authentification"""
    
    def __init__(self, db_path: str = "data/toolbox.db"):
        self.db_path = db_path
        self.secret_key = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
        self._ensure_db_directory()
        self._init_database()
    
    def _ensure_db_directory(self):
        """Créer le répertoire de base de données s'il n'existe pas"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
    
    def _init_database(self):
        """Initialiser la base de données avec toutes les tables nécessaires"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("PRAGMA foreign_keys = ON")
                cursor = conn.cursor()
                
                # Table des utilisateurs
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT 1,
                    is_verified BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP,
                    two_factor_secret VARCHAR(32),
                    two_factor_enabled BOOLEAN DEFAULT 0,
                    profile_data TEXT
                )''')
                
                # Table des sessions
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )''')
                
                # Table des scans liés aux utilisateurs
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_scans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    scan_id VARCHAR(50) NOT NULL,
                    tool VARCHAR(20) NOT NULL,
                    target VARCHAR(255) NOT NULL,
                    scan_type VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    results TEXT,
                    report_path VARCHAR(255),
                    is_private BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )''')
                
                # Table des logs d'activité
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action VARCHAR(100) NOT NULL,
                    resource VARCHAR(100),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    success BOOLEAN DEFAULT 1,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
                )''')
                
                # Table des tokens de réinitialisation
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )''')
                
                # Index pour les performances
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_scans_user ON user_scans(user_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id)')
                
                conn.commit()
                logger.info("✅ Base de données initialisée avec succès")
                
        except Exception as e:
            logger.error(f"❌ Erreur initialisation base de données: {e}")
            raise
    
    def create_user(self, username: str, email: str, password: str, role: str = 'user') -> Optional[int]:
        """Créer un nouvel utilisateur"""
        try:
            # Validation des données
            if len(username) < 3 or len(username) > 50:
                raise ValueError("Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
            
            if len(password) < 8:
                raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
            
            # Hash sécurisé du mot de passe
            password_hash = generate_password_hash(password, method='pbkdf2:sha256')
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Vérifier si l'utilisateur existe déjà
                cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
                if cursor.fetchone():
                    raise ValueError("Nom d'utilisateur ou email déjà utilisé")
                
                # Créer l'utilisateur
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash, role)
                    VALUES (?, ?, ?, ?)
                ''', (username, email, password_hash, role))
                
                user_id = cursor.lastrowid
                conn.commit()
                
                logger.info(f"✅ Utilisateur créé: {username} (ID: {user_id})")
                return user_id
                
        except Exception as e:
            logger.error(f"❌ Erreur création utilisateur: {e}")
            raise
    
    def authenticate_user(self, username: str, password: str, ip_address: str = None) -> Optional[Dict]:
        """Authentifier un utilisateur"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Récupérer l'utilisateur
                cursor.execute('''
                    SELECT * FROM users 
                    WHERE (username = ? OR email = ?) AND is_active = 1
                ''', (username, username))
                
                user = cursor.fetchone()
                if not user:
                    self._log_activity(None, 'login_failed', 'authentication', ip_address, False, 
                                     f'Tentative de connexion avec nom d\'utilisateur inexistant: {username}')
                    return None
                
                # Vérifier si le compte est verrouillé
                if user['locked_until'] and datetime.fromisoformat(user['locked_until']) > datetime.now():
                    self._log_activity(user['id'], 'login_blocked', 'authentication', ip_address, False, 
                                     'Tentative de connexion sur compte verrouillé')
                    raise ValueError("Compte temporairement verrouillé")
                
                # Vérifier le mot de passe
                if not check_password_hash(user['password_hash'], password):
                    # Incrémenter les tentatives de connexion
                    attempts = user['login_attempts'] + 1
                    locked_until = None
                    
                    if attempts >= 5:  # Verrouiller après 5 tentatives
                        locked_until = (datetime.now() + timedelta(minutes=15)).isoformat()
                    
                    cursor.execute('''
                        UPDATE users 
                        SET login_attempts = ?, locked_until = ?
                        WHERE id = ?
                    ''', (attempts, locked_until, user['id']))
                    
                    self._log_activity(user['id'], 'login_failed', 'authentication', ip_address, False, 
                                     f'Mot de passe incorrect (tentative {attempts}/5)')
                    conn.commit()
                    return None
                
                # Réinitialiser les tentatives de connexion
                cursor.execute('''
                    UPDATE users 
                    SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (user['id'],))
                
                conn.commit()
                
                # Convertir en dictionnaire
                user_dict = dict(user)
                user_dict.pop('password_hash', None)  # Ne pas retourner le hash
                
                self._log_activity(user['id'], 'login_success', 'authentication', ip_address, True, 
                                 'Connexion réussie')
                
                logger.info(f"✅ Authentification réussie pour: {username}")
                return user_dict
                
        except Exception as e:
            logger.error(f"❌ Erreur authentification: {e}")
            raise
    
    def create_session(self, user_id: int, ip_address: str = None, user_agent: str = None) -> str:
        """Créer une session utilisateur"""
        try:
            session_token = secrets.token_urlsafe(32)
            expires_at = (datetime.now() + timedelta(days=7)).isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, session_token, ip_address, user_agent, expires_at))
                
                conn.commit()
                
            logger.info(f"✅ Session créée pour utilisateur {user_id}")
            return session_token
            
        except Exception as e:
            logger.error(f"❌ Erreur création session: {e}")
            raise
    
    def validate_session(self, session_token: str) -> Optional[Dict]:
        """Valider une session"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT s.*, u.username, u.email, u.role, u.is_active
                    FROM user_sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.session_token = ? AND s.is_active = 1 AND s.expires_at > datetime('now')
                ''', (session_token,))
                
                session = cursor.fetchone()
                if session:
                    return dict(session)
                
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur validation session: {e}")
            return None
    
    def revoke_session(self, session_token: str) -> bool:
        """Révoquer une session"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE user_sessions 
                    SET is_active = 0 
                    WHERE session_token = ?
                ''', (session_token,))
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"❌ Erreur révocation session: {e}")
            return False
    
    def save_scan_result(self, user_id: int, scan_data: Dict) -> bool:
        """Sauvegarder un résultat de scan pour un utilisateur"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO user_scans 
                    (user_id, scan_id, tool, target, scan_type, status, results, report_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    scan_data.get('scan_id'),
                    scan_data.get('tool'),
                    scan_data.get('target'),
                    scan_data.get('scan_type'),
                    scan_data.get('status', 'completed'),
                    str(scan_data.get('results', {})),
                    scan_data.get('report_filename')
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde scan: {e}")
            return False
    
    def get_user_scans(self, user_id: int, limit: int = 50) -> List[Dict]:
        """Récupérer les scans d'un utilisateur"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM user_scans 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                ''', (user_id, limit))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"❌ Erreur récupération scans: {e}")
            return []
    
    def _log_activity(self, user_id: Optional[int], action: str, resource: str = None, 
                     ip_address: str = None, success: bool = True, details: str = None):
        """Enregistrer une activité dans les logs"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO activity_logs 
                    (user_id, action, resource, ip_address, success, details)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user_id, action, resource, ip_address, success, details))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"❌ Erreur log activité: {e}")
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Récupérer un utilisateur par son ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
                user = cursor.fetchone()
                
                if user:
                    user_dict = dict(user)
                    user_dict.pop('password_hash', None)
                    return user_dict
                
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur récupération utilisateur: {e}")
            return None
    
    def create_admin_user(self):
        """Créer un utilisateur admin par défaut"""
        try:
            admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin123!')
            
            # Vérifier si admin existe déjà
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE username = 'admin'")
                if cursor.fetchone():
                    logger.info("👤 Utilisateur admin existe déjà")
                    return
            
            # Créer l'admin
            admin_id = self.create_user('admin', 'admin@pacha-toolbox.local', admin_password, 'admin')
            
            # Marquer comme vérifié et actif
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE users 
                    SET is_active = 1, is_verified = 1 
                    WHERE id = ?
                ''', (admin_id,))
                conn.commit()
            
            logger.info(f"✅ Utilisateur admin créé avec le mot de passe: {admin_password}")
            
        except Exception as e:
            logger.error(f"❌ Erreur création admin: {e}")

# Instance globale
db_manager = DatabaseManager()