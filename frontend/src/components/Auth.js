// frontend/src/components/Auth.js
import React, { useState, useEffect } from 'react';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Réinitialiser les messages d'erreur/succès lors de la saisie
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.username || formData.username.length < 3) {
        setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
        return false;
      }
      
      if (!formData.email || !formData.email.includes('@')) {
        setError('Email invalide');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
    }
    
    if (!formData.username || !formData.password) {
      setError('Nom d\'utilisateur et mot de passe requis');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' 
        ? { username: formData.username, password: formData.password }
        : { 
            username: formData.username, 
            email: formData.email, 
            password: formData.password 
          };
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (mode === 'login') {
          // Stocker le token et les infos utilisateur
          if (data.session_token) {
            localStorage.setItem('session_token', data.session_token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          
          setSuccess('Connexion réussie !');
          setTimeout(() => {
            onLogin(data.user, data.session_token);
          }, 1000);
        } else {
          setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setTimeout(() => {
            setMode('login');
            setFormData({ username: formData.username, email: '', password: '', confirmPassword: '' });
          }, 2000);
        }
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur authentification:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="cyber-grid"></div>
        <div className="floating-elements">
          <div className="floating-element">🛡️</div>
          <div className="floating-element">🔐</div>
          <div className="floating-element">🔍</div>
          <div className="floating-element">⚡</div>
        </div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1>🛡️ PACHA TOOLBOX</h1>
          <div className="auth-subtitle">
            {mode === 'login' ? 'Connexion Sécurisée' : 'Créer un Compte'}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">👤 Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Votre nom d'utilisateur"
              required
              disabled={isLoading}
            />
          </div>
          
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="email">📧 Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">🔒 Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>
          
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">🔒 Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirmez votre mot de passe"
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          {error && (
            <div className="message error-message">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="message success-message">
              ✅ {success}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                {mode === 'login' ? 'Connexion...' : 'Création...'}
              </>
            ) : (
              mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte'
            )}
          </button>
        </form>
        
        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button type="button" onClick={switchMode} className="switch-button">
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button type="button" onClick={switchMode} className="switch-button">
                Se connecter
              </button>
            </>
          )}
        </div>
        
        {mode === 'login' && (
          <div className="demo-credentials">
            <div className="demo-title">🧪 Compte de démonstration</div>
            <div className="demo-info">
              <strong>Admin:</strong> admin / Admin123!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;