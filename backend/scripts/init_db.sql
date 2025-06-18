-- backend/scripts/init_db.sql
-- Script d'initialisation PostgreSQL pour Pacha Toolbox
-- Ce script est exécuté automatiquement lors de la création du conteneur PostgreSQL

-- Configuration initiale
SET timezone = 'UTC';
SET client_encoding = 'UTF8';

-- Extensions utiles pour Pacha Toolbox
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Création de la base de données (déjà fait par POSTGRES_DB)
-- CREATE DATABASE pacha_toolbox;

-- Configuration de la base de données
\c pacha_toolbox;

-- Configuration des paramètres de session
SET search_path TO public;

-- Commentaires sur la base de données
COMMENT ON DATABASE pacha_toolbox IS 'Base de données pour Pacha Security Toolbox Platform v2.0';

-- =============================================
-- TABLES PRINCIPALES
-- =============================================

-- Table des utilisateurs (sera créée par Python, mais on peut préparer des index)
-- Les tables seront créées par le code Python dans database.py
-- Ici on ne fait que préparer l'environnement

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour générer des UUID v4
CREATE OR REPLACE FUNCTION generate_uuid_v4()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (is_active = FALSE AND created_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO activity_logs (action, resource, success, details, created_at)
    VALUES ('cleanup_expired_sessions', 'maintenance', TRUE, 
            'Supprimé ' || deleted_count || ' sessions expirées', NOW());
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les tokens de réinitialisation expirés
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour les statistiques des utilisateurs actifs
CREATE OR REPLACE VIEW active_users_stats AS
SELECT 
    COUNT(*) as total_active_users,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as users_last_24h,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as users_last_week,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
FROM users 
WHERE is_active = TRUE;

-- Vue pour les statistiques des scans
CREATE OR REPLACE VIEW scan_statistics AS
SELECT 
    tool,
    COUNT(*) as total_scans,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as scans_last_24h,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_scans,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_scans,
    AVG(CASE WHEN completed_at IS NOT NULL AND created_at IS NOT NULL 
             THEN EXTRACT(EPOCH FROM (completed_at - created_at)) END) as avg_duration_seconds
FROM user_scans 
GROUP BY tool;

-- =============================================
-- INDEX DE PERFORMANCE (seront créés par Python aussi)
-- =============================================

-- Ces index seront créés par le code Python, mais on peut les préparer ici aussi
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- =============================================
-- POLITIQUES DE SÉCURITÉ (RLS - Row Level Security)
-- =============================================

-- Activation de RLS sur les tables sensibles (optionnel pour v2.0)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne peuvent voir que leurs propres scans
-- CREATE POLICY user_scans_isolation ON user_scans
--     FOR ALL TO authenticated_user
--     USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- =============================================
-- DONNÉES DE TEST (optionnel)
-- =============================================

-- Insérer des données de test uniquement en développement
DO $$
BEGIN
    -- Vérifier si on est en mode développement
    IF current_setting('server_version_num')::INT >= 120000 THEN
        -- PostgreSQL 12+ seulement
        RAISE NOTICE 'Environnement de développement détecté';
        
        -- Les utilisateurs seront créés par le code Python
        -- Ici on ne fait que préparer l'environnement
        
    END IF;
END $$;

-- =============================================
-- CONFIGURATION DE MAINTENANCE
-- =============================================

-- Configuration pour l'auto-vacuum
ALTER DATABASE pacha_toolbox SET autovacuum = on;
ALTER DATABASE pacha_toolbox SET autovacuum_vacuum_scale_factor = 0.1;
ALTER DATABASE pacha_toolbox SET autovacuum_analyze_scale_factor = 0.05;

-- =============================================
-- JOBS DE MAINTENANCE (via pg_cron si disponible)
-- =============================================

-- Nettoyage automatique des sessions expirées (quotidien à 2h du matin)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Nettoyage automatique des tokens expirés (quotidien à 3h du matin)
-- SELECT cron.schedule('cleanup-tokens', '0 3 * * *', 'SELECT cleanup_expired_tokens();');

-- =============================================
-- CONFIGURATION DES PRIVILÈGES
-- =============================================

-- Donner les privilèges appropriés à l'utilisateur Pacha
GRANT CONNECT ON DATABASE pacha_toolbox TO pacha_user;
GRANT USAGE ON SCHEMA public TO pacha_user;
GRANT CREATE ON SCHEMA public TO pacha_user;

-- Privilèges sur les séquences (pour les SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pacha_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO pacha_user;

-- Privilèges sur les tables (présentes et futures)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pacha_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pacha_user;

-- Privilèges sur les fonctions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pacha_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO pacha_user;

-- =============================================
-- LOGS D'INITIALISATION
-- =============================================

-- Enregistrer l'initialisation
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🛡️  PACHA TOOLBOX DATABASE INITIALIZED';
    RAISE NOTICE '   Version: 2.0';
    RAISE NOTICE '   Date: %', NOW();
    RAISE NOTICE '   Database: %', current_database();
    RAISE NOTICE '   User: %', current_user;
    RAISE NOTICE '==============================================';
    
    -- Si la table existe déjà, on peut logger
    -- Sinon cette partie sera exécutée après la création des tables par Python
    
END $$;

-- Configuration finale
SET search_path TO public;

-- Fin du script d'initialisation
\echo 'Script d''initialisation PostgreSQL pour Pacha Toolbox terminé avec succès !'