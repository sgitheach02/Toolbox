import React, { useState, useEffect, useCallback } from 'react';

// ================================
// CONFIGURATION API
// ================================

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Service API
const apiService = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('pacha_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  async healthCheck() {
    return this.request('/health');
  },

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  async startNmapScan(target, scanType) {
    return this.request('/scan/nmap', {
      method: 'POST',
      body: JSON.stringify({ target, scanType })
    });
  },

  async startNiktoScan(target, scanType) {
    return this.request('/scan/nikto', {
      method: 'POST',
      body: JSON.stringify({ target, scanType })
    });
  },

  async getTaskStatus(taskId) {
    return this.request(`/scan/status/${taskId}`);
  },

  async getScanHistory() {
    return this.request('/scan/history');
  }
};

// ================================
// ICÔNES SVG COMPLÈTES
// ================================

const Shield = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const Target = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const Spider = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 2L12 6"></path>
    <path d="M12 18L12 22"></path>
    <path d="M4.93 4.93L7.76 7.76"></path>
    <path d="M16.24 16.24L19.07 19.07"></path>
    <path d="M2 12L6 12"></path>
    <path d="M18 12L22 12"></path>
    <path d="M4.93 19.07L7.76 16.24"></path>
    <path d="M16.24 7.76L19.07 4.93"></path>
  </svg>
);

const Network = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="16" y="16" width="6" height="6" rx="1"></rect>
    <rect x="2" y="16" width="6" height="6" rx="1"></rect>
    <rect x="9" y="2" width="6" height="6" rx="1"></rect>
    <path d="m5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
    <path d="m12 12v4"></path>
  </svg>
);

const Key = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

const Crosshairs = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="22" y1="12" x2="18" y2="12"></line>
    <line x1="6" y1="12" x2="2" y2="12"></line>
    <line x1="12" y1="6" x2="12" y2="2"></line>
    <line x1="12" y1="22" x2="12" y2="18"></line>
  </svg>
);

const Play = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="5,3 19,12 5,21 5,3"></polygon>
  </svg>
);

const User = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogOut = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16,17 21,12 16,7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const History = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
    <path d="M12 7v5l4 2"></path>
  </svg>
);

const Loader = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="1s"
        from="0 12 12"
        to="360 12 12"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

// ================================
// SYSTÈME DE PERSISTENCE
// ================================

const persistenceService = {
  save(key, data) {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });
      localStorage.setItem(`pacha_${key}`, serializedData);
      console.log(`💾 État sauvegardé: ${key}`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde ${key}:`, error);
    }
  },

  load(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(`pacha_${key}`);
      if (!stored) return defaultValue;
      
      const parsed = JSON.parse(stored);
      const age = Date.now() - parsed.timestamp;
      const maxAge = key.includes('results') ? 24 * 60 * 60 * 1000 : Infinity;
      
      if (age > maxAge) {
        console.log(`⏰ Données expirées pour ${key}, suppression`);
        this.remove(key);
        return defaultValue;
      }
      
      console.log(`📂 État chargé: ${key}`);
      return parsed.data;
    } catch (error) {
      console.error(`❌ Erreur chargement ${key}:`, error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`pacha_${key}`);
      console.log(`🗑️ État supprimé: ${key}`);
    } catch (error) {
      console.error(`❌ Erreur suppression ${key}:`, error);
    }
  },

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('pacha_'))
      .forEach(k => localStorage.removeItem(k));
    console.log('🧹 Tous les états supprimés');
  }
};

// ================================
// THÈME ET COMPOSANTS UI
// ================================

const theme = {
  colors: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      accent: '#3a3a3a'
    },
    text: {
      primary: '#e5e5e5',
      secondary: '#b5b5b5',
      muted: '#888888'
    },
    status: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#dc2626',
      info: '#3b82f6'
    },
    accent: {
      primary: '#00ff88',
      secondary: '#00d4ff'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
};

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.tertiary}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    ...style
  }}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, disabled = false, onClick, fullWidth = false, style = {} }) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
      color: '#000000',
      border: 'none'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.accent.primary,
      border: `1px solid ${theme.colors.accent.primary}`
    },
    danger: {
      backgroundColor: theme.colors.status.error,
      color: theme.colors.text.primary,
      border: 'none'
    },
    success: {
      backgroundColor: theme.colors.status.success,
      color: '#000000',
      border: 'none'
    }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' }
  };

  return (
    <button
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: theme.borderRadius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        fontWeight: '600',
        transition: 'all 0.3s ease',
        width: fullWidth ? '100%' : 'auto',
        ...style
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Input = ({ type = 'text', placeholder, value, onChange, style = {}, disabled = false, name }) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    style={{
      width: '100%',
      backgroundColor: theme.colors.bg.tertiary,
      border: `1px solid ${theme.colors.bg.accent}`,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s ease',
      ...style
    }}
  />
);

const Select = ({ options, value, onChange, placeholder = "Sélectionnez..." }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: '100%',
      backgroundColor: theme.colors.bg.tertiary,
      border: `1px solid ${theme.colors.bg.accent}`,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer'
    }}
  >
    <option value="">{placeholder}</option>
    {options.map((option, index) => (
      <option key={index} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const Badge = ({ children, variant = 'default', style = {} }) => {
  const variants = {
    default: { bg: theme.colors.bg.tertiary, color: theme.colors.text.secondary },
    success: { bg: theme.colors.status.success, color: '#000000' },
    warning: { bg: theme.colors.status.warning, color: '#000000' },
    error: { bg: theme.colors.status.error, color: theme.colors.text.primary },
    info: { bg: theme.colors.status.info, color: theme.colors.text.primary }
  };

  return (
    <span style={{
      backgroundColor: variants[variant].bg,
      color: variants[variant].color,
      padding: '3px 8px',
      borderRadius: theme.borderRadius.sm,
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      ...style
    }}>
      {children}
    </span>
  );
};

// ================================
// HOOK POUR LE POLLING DES TÂCHES
// ================================

const useTaskPolling = (taskId, onComplete) => {
  const [taskStatus, setTaskStatus] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    console.log(`🔄 Démarrage polling pour task: ${taskId}`);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiService.getTaskStatus(taskId);
        setTaskStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`✅ Task ${taskId} terminée: ${status.status}`);
          clearInterval(pollInterval);
          if (onComplete) {
            onComplete(status);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur polling ${taskId}:`, error);
        clearInterval(pollInterval);
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [taskId, onComplete]);

  return taskStatus;
};

// ================================
// COMPOSANT AUTHENTIFICATION
// ================================

const AuthForm = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
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
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Nom d\'utilisateur et mot de passe requis');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (mode === 'login') {
        const response = await apiService.login(formData.username, formData.password);
        localStorage.setItem('pacha_token', response.token);
        setSuccess('Connexion réussie !');
        setTimeout(() => {
          onLogin(response.user, response.token);
        }, 1000);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }
        
        await apiService.register(formData.username, formData.email, formData.password);
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          setMode('login');
          setFormData({ username: formData.username, email: '', password: '', confirmPassword: '' });
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg
    }}>
      <Card style={{ 
        maxWidth: '450px', 
        width: '100%',
        border: `2px solid ${theme.colors.accent.primary}`,
        boxShadow: `0 20px 40px rgba(0, 255, 136, 0.3)`
      }}>
        <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
          <Shield size={48} color={theme.colors.accent.primary} />
          <h1 style={{ 
            color: theme.colors.accent.primary,
            fontSize: '2rem',
            fontWeight: '800',
            margin: `${theme.spacing.md} 0`,
            textShadow: `0 0 20px rgba(0, 255, 136, 0.5)`
          }}>
            PACHA TOOLBOX
          </h1>
          <p style={{ color: theme.colors.text.secondary, margin: 0 }}>
            {mode === 'login' ? 'Connexion Sécurisée' : 'Créer un Compte'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.accent.primary,
              fontWeight: '600'
            }}>
              👤 Nom d'utilisateur
            </label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Votre nom d'utilisateur"
              disabled={isLoading}
            />
          </div>
          
          {mode === 'register' && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: theme.spacing.sm, 
                color: theme.colors.accent.primary,
                fontWeight: '600'
              }}>
                📧 Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                disabled={isLoading}
              />
            </div>
          )}
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.accent.primary,
              fontWeight: '600'
            }}>
              🔒 Mot de passe
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Votre mot de passe"
              disabled={isLoading}
            />
          </div>
          
          {mode === 'register' && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: theme.spacing.sm, 
                color: theme.colors.accent.primary,
                fontWeight: '600'
              }}>
                🔒 Confirmer le mot de passe
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirmez votre mot de passe"
                disabled={isLoading}
              />
            </div>
          )}
          
          {error && (
            <div style={{
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              background: 'rgba(220, 38, 38, 0.2)',
              border: `1px solid ${theme.colors.status.error}`,
              color: '#ff6b6b',
              textAlign: 'center'
            }}>
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              background: 'rgba(0, 255, 136, 0.2)',
              border: `1px solid ${theme.colors.accent.primary}`,
              color: theme.colors.accent.primary,
              textAlign: 'center'
            }}>
              ✅ {success}
            </div>
          )}
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            fullWidth
            icon={isLoading ? Loader : null}
            style={{ marginTop: theme.spacing.md }}
          >
            {isLoading ? 
              (mode === 'login' ? 'Connexion...' : 'Création...') :
              (mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte')
            }
          </Button>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: theme.spacing.lg }}>
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button 
                onClick={() => setMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.accent.primary,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button 
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.accent.primary,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Se connecter
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

// ================================
// MODULE NMAP
// ================================

const NmapTab = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // 📂 CHARGEMENT INITIAL
  useEffect(() => {
    const savedResults = persistenceService.load('nmap_results', []);
    const savedForm = persistenceService.load('nmap_form', {});
    
    setResults(savedResults);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.scanType) setScanType(savedForm.scanType);
    
    console.log('📂 Nmap: Données restaurées');
  }, []);

  // 💾 SAUVEGARDE AUTO
  useEffect(() => {
    if (target || scanType) {
      persistenceService.save('nmap_form', { target, scanType });
    }
  }, [target, scanType]);

  useEffect(() => {
    if (results.length > 0) {
      persistenceService.save('nmap_results', results.slice(0, 20));
    }
  }, [results]);

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan (-T4 -F)' },
    { value: 'basic', label: 'Basic Scan (-sV -sC)' },
    { value: 'intense', label: 'Intense Scan (-T4 -A -v)' },
    { value: 'comprehensive', label: 'Comprehensive Scan (-sS -sV -sC -A -T4)' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    if (status.status === 'completed') {
      const newResult = {
        id: currentTaskId,
        target: target,
        scanType: scanType,
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        results: status.data.results || {},
        raw_output: status.data.raw_output,
        command: status.data.command
      };
      
      setResults(prev => [newResult, ...prev]);
      setError('');
    } else if (status.status === 'failed') {
      setError(status.data.error || 'Erreur inconnue');
    }
    setCurrentTaskId(null);
  }, [currentTaskId, target, scanType]));

  const startScan = async () => {
    if (!target || !scanType) {
      setError('Veuillez renseigner une cible et un type de scan');
      return;
    }

    setError('');
    try {
      const response = await apiService.startNmapScan(target, scanType);
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  const clearResults = () => {
    setResults([]);
    persistenceService.remove('nmap_results');
  };

  const isScanning = currentTaskId && taskStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Target size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Nmap - Network Discovery & Security Scanning
            </h2>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Badge variant="success">{results.length} sauvés</Badge>
              <Button variant="danger" size="sm" onClick={clearResults}>🧹 Clear</Button>
            </div>
          )}
        </div>

        {isScanning ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <Loader size={32} color={theme.colors.accent.primary} />
            <div style={{ color: theme.colors.text.primary, fontSize: '16px', fontWeight: '600', marginTop: theme.spacing.md }}>
              Scan Nmap en cours...
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '14px', marginTop: theme.spacing.sm }}>
              Scan {scanType} de {target}
            </div>
            <div style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: theme.borderRadius.sm,
              fontSize: '12px',
              color: theme.colors.accent.primary
            }}>
              💾 Résultats sauvegardés automatiquement
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  🎯 Target {target && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Input
                  placeholder="192.168.1.0/24 ou scanme.nmap.org"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  ⚡ Scan Type {scanType && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={scanTypes}
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  placeholder="Type de scan"
                />
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                background: 'rgba(220, 38, 38, 0.2)',
                border: `1px solid ${theme.colors.status.error}`,
                color: '#ff6b6b'
              }}>
                ❌ {error}
              </div>
            )}

            <Button
              onClick={startScan}
              disabled={!target || !scanType}
              variant="primary"
              icon={Play}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
            >
              🚀 Start Nmap Scan
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            📊 Scan Results ({results.length}) - Auto-sauvegardés
          </h3>
          {results.map(result => (
            <div key={result.id} style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              border: `1px solid ${theme.colors.bg.accent}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <Badge variant="success">SAVED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <Badge variant="info">{result.scanType}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🏠 Hosts Up
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.results.hosts_up || 0}
                  </div>
                </div>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🔓 Open Ports
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.results.detailed_ports?.filter(p => p.state === 'open').length || 0}
                  </div>
                </div>
                {result.command && (
                  <div style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.info}`
                  }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                      ⚡ Command
                    </div>
                    <div style={{ 
                      color: theme.colors.text.secondary, 
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}>
                      {result.command}
                    </div>
                  </div>
                )}
              </div>

              {/* Ports détaillés */}
              {result.results.detailed_ports && result.results.detailed_ports.length > 0 && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🔓 Ports Details:
                  </h4>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {result.results.detailed_ports.slice(0, 10).map((port, index) => (
                      <div key={index} style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: port.state === 'open' ? theme.colors.status.success : theme.colors.text.muted,
                        marginBottom: '3px'
                      }}>
                        {port.port}/{port.protocol} {port.state} {port.service} {port.version}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ================================
// MODULE HYDRA
// ================================

const HydraTab = () => {
  const [target, setTarget] = useState('');
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [wordlist, setWordlist] = useState('');
  const [attackMode, setAttackMode] = useState('patterns'); // 'wordlist', 'patterns', 'autoguess', 'combo'
  const [bruteforceMode, setBruteforceMode] = useState('single'); // 'single' ou 'userlist'
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // 📂 CHARGEMENT INITIAL
  useEffect(() => {
    const savedResults = persistenceService.load('hydra_results', []);
    const savedForm = persistenceService.load('hydra_form', {});
    
    setResults(savedResults);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.service) setService(savedForm.service);
    if (savedForm.username) setUsername(savedForm.username);
    if (savedForm.wordlist) setWordlist(savedForm.wordlist);
    if (savedForm.attackMode) setAttackMode(savedForm.attackMode);
    if (savedForm.bruteforceMode) setBruteforceMode(savedForm.bruteforceMode);
    
    console.log('📂 Hydra: Données restaurées');
  }, []);

  // 💾 SAUVEGARDE AUTO
  useEffect(() => {
    if (target || service || username || wordlist || attackMode !== 'patterns' || bruteforceMode !== 'single') {
      persistenceService.save('hydra_form', { target, service, username, wordlist, attackMode, bruteforceMode });
    }
  }, [target, service, username, wordlist, attackMode, bruteforceMode]);

  useEffect(() => {
    if (results.length > 0) {
      persistenceService.save('hydra_results', results.slice(0, 20));
    }
  }, [results]);

  const services = [
    { value: 'ssh', label: 'SSH (22)' },
    { value: 'ftp', label: 'FTP (21)' },
    { value: 'http-get', label: 'HTTP Basic Auth (80)' },
    { value: 'https-get', label: 'HTTPS Basic Auth (443)' },
    { value: 'http-post-form', label: 'HTTP POST Form (80)' },
    { value: 'mysql', label: 'MySQL (3306)' },
    { value: 'rdp', label: 'RDP (3389)' },
    { value: 'smb', label: 'SMB (445)' },
    { value: 'telnet', label: 'Telnet (23)' }
  ];

  const wordlists = [
    { value: 'rockyou', label: 'RockYou (Common Passwords)' },
    { value: 'common', label: 'Common Passwords' },
    { value: 'fasttrack', label: 'FastTrack' },
    { value: 'darkweb2017', label: 'DarkWeb 2017 Top 1000' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    if (status.status === 'completed') {
      const newResult = {
        id: currentTaskId,
        target: target,
        service: service,
        username: username,
        wordlist: wordlist,
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        results: status.data.results || {},
        raw_output: status.data.raw_output,
        command: status.data.command,
        credentials: status.data.results?.credentials_found || []
      };
      
      setResults(prev => [newResult, ...prev]);
      setError('');
    } else if (status.status === 'failed') {
      setError(status.data.error || 'Erreur inconnue');
    }
    setCurrentTaskId(null);
  }, [currentTaskId, target, service, username, wordlist]));

  const startAttack = async () => {
    if (!target || !service) {
      setError('Veuillez renseigner la cible et le service');
      return;
    }

    if (bruteforceMode === 'single' && !username) {
      setError('Veuillez renseigner un nom d\'utilisateur ou choisir le mode "Liste usernames"');
      return;
    }

    if ((attackMode === 'wordlist' || attackMode === 'combo') && !wordlist) {
      setError('Veuillez choisir une wordlist pour ce mode d\'attaque');
      return;
    }

    setError('');
    try {
      const response = await apiService.request('/scan/hydra', {
        method: 'POST',
        body: JSON.stringify({ 
          target, 
          service, 
          username: bruteforceMode === 'single' ? username : null,
          bruteforce_usernames: bruteforceMode === 'userlist',
          attack_mode: attackMode,
          wordlist: (attackMode === 'wordlist' || attackMode === 'combo') ? `/usr/share/wordlists/${wordlist}.txt` : null
        })
      });
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  const clearResults = () => {
    setResults([]);
    persistenceService.remove('hydra_results');
  };

  const isAttacking = currentTaskId && taskStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Key size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Hydra - Password Brute Force Attack
            </h2>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Badge variant="success">{results.length} sauvés</Badge>
              <Button variant="danger" size="sm" onClick={clearResults}>🧹 Clear</Button>
            </div>
          )}
        </div>

        {/* Avertissement de sécurité */}
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: `1px solid ${theme.colors.status.error}`,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.lg
        }}>
          <div style={{ color: theme.colors.status.error, fontWeight: '600', marginBottom: theme.spacing.sm }}>
            ⚠️ AVERTISSEMENT LÉGAL
          </div>
          <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
            Les attaques par force brute ne doivent être utilisées que sur vos propres systèmes ou avec autorisation explicite.
            L'utilisation non autorisée est illégale et peut entraîner des poursuites judiciaires.
          </div>
        </div>

        {isAttacking ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <Loader size={32} color={theme.colors.accent.primary} />
            <div style={{ color: theme.colors.text.primary, fontSize: '16px', fontWeight: '600', marginTop: theme.spacing.md }}>
              🔨 Attaque Hydra en cours...
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '14px', marginTop: theme.spacing.sm }}>
              Brute force {service} sur {target} avec utilisateur {username}
            </div>
            <div style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: theme.borderRadius.sm,
              fontSize: '12px',
              color: theme.colors.accent.primary
            }}>
              💾 Résultats sauvegardés automatiquement
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  🎯 Target {target && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Input
                  placeholder="192.168.1.100 ou example.com"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  💡 <strong>Cibles de test :</strong> scanme.nmap.org, 127.0.0.1, ou votre réseau local
                </div>
                
                {/* Boutons de test rapide */}
                <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
                  <button
                    onClick={() => setTarget('scanme.nmap.org')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(0, 255, 136, 0.1)',
                      border: `1px solid ${theme.colors.accent.primary}`,
                      borderRadius: '4px',
                      color: theme.colors.accent.primary,
                      cursor: 'pointer'
                    }}
                  >
                    🎯 Test Safe
                  </button>
                  <button
                    onClick={() => setTarget('127.0.0.1')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${theme.colors.status.info}`,
                      borderRadius: '4px',
                      color: theme.colors.status.info,
                      cursor: 'pointer'
                    }}
                  >
                    🏠 Local
                  </button>
                  <button
                    onClick={() => setTarget('192.168.6.130')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      border: `1px solid ${theme.colors.status.warning}`,
                      borderRadius: '4px',
                      color: theme.colors.status.warning,
                      cursor: 'pointer'
                    }}
                  >
                    🎯 Votre LAN
                  </button>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  🔧 Service {service && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={services}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Type de service"
                />
              </div>

              {/* NOUVEAU: Mode d'attaque */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  ⚔️ Stratégie d'attaque {attackMode && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={[
                    { value: 'patterns', label: '🎯 Patterns (username variations)' },
                    { value: 'wordlist', label: '📝 Wordlist classique' },
                    { value: 'autoguess', label: '🤖 Auto-guess (Hydra AI)' },
                    { value: 'combo', label: '🚀 Combo (Patterns + Wordlist)' }
                  ]}
                  value={attackMode}
                  onChange={(e) => setAttackMode(e.target.value)}
                  placeholder="Choisir stratégie"
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  {attackMode === 'patterns' && '🎯 Génère kali→kali, kali123, kalikali...'}
                  {attackMode === 'wordlist' && '📝 Utilise une liste de mots de passe'}
                  {attackMode === 'autoguess' && '🤖 Hydra devine automatiquement'}
                  {attackMode === 'combo' && '🚀 Patterns + Wordlist combinés'}
                </div>
              </div>

              {/* Mode de bruteforce */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  🎲 Mode Bruteforce {bruteforceMode && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={[
                    { value: 'single', label: '👤 Username unique' },
                    { value: 'userlist', label: '📝 Liste usernames (auto)' }
                  ]}
                  value={bruteforceMode}
                  onChange={(e) => setBruteforceMode(e.target.value)}
                  placeholder="Mode d'attaque"
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  {bruteforceMode === 'userlist' ? 
                    '🚀 Bruteforce usernames automatique' : 
                    '🎯 Test un username spécifique'
                  }
                </div>
              </div>

              {/* Username field - conditionnel selon le mode */}
              {bruteforceMode === 'single' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: theme.spacing.sm, 
                    color: theme.colors.text.secondary,
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    👤 Username {username && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                  </label>
                  <Input
                    placeholder="admin, root, administrator, kali..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                    💡 <strong>Patterns auto :</strong> {username}:{username}, {username}123, etc.
                  </div>
                  
                  {/* Boutons username rapides */}
                  <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
                    <button
                      onClick={() => setUsername('kali')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        border: `1px solid ${theme.colors.accent.primary}`,
                        borderRadius: '4px',
                        color: theme.colors.accent.primary,
                        cursor: 'pointer'
                      }}
                    >
                      🐉 kali
                    </button>
                    <button
                      onClick={() => setUsername('admin')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        border: `1px solid ${theme.colors.status.warning}`,
                        borderRadius: '4px',
                        color: theme.colors.status.warning,
                        cursor: 'pointer'
                      }}
                    >
                      👑 admin
                    </button>
                    <button
                      onClick={() => setUsername('root')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        border: `1px solid ${theme.colors.status.error}`,
                        borderRadius: '4px',
                        color: theme.colors.status.error,
                        cursor: 'pointer'
                      }}
                    >
                      🔴 root
                    </button>
                  </div>
                </div>
              )}

              {/* Wordlist - affiché seulement si nécessaire */}
              {(attackMode === 'wordlist' || attackMode === 'combo') && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: theme.spacing.sm, 
                    color: theme.colors.text.secondary,
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    📝 Wordlist {wordlist && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                  </label>
                  <Select
                    options={wordlists}
                    value={wordlist}
                    onChange={(e) => setWordlist(e.target.value)}
                    placeholder="Liste de mots de passe"
                  />
                  <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                    {attackMode === 'combo' ? 
                      '🚀 Sera combiné avec les patterns username' : 
                      '📝 Liste de mots de passe uniquement'
                    }
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                background: 'rgba(220, 38, 38, 0.2)',
                border: `1px solid ${theme.colors.status.error}`,
                color: '#ff6b6b'
              }}>
                ❌ {error}
              </div>
            )}

            <Button
              onClick={startAttack}
              disabled={
                !target || !service || 
                (bruteforceMode === 'single' && !username) ||
                ((attackMode === 'wordlist' || attackMode === 'combo') && !wordlist)
              }
              variant="primary"
              icon={Play}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
            >
              🔨 Start Hydra Attack 
              {attackMode === 'patterns' && ' (Patterns)'}
              {attackMode === 'wordlist' && ' (Wordlist)'}
              {attackMode === 'autoguess' && ' (Auto-guess)'}
              {attackMode === 'combo' && ' (Combo)'}
              {bruteforceMode === 'userlist' && ' + Username Bruteforce'}
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            🔨 Hydra Results ({results.length}) - Auto-sauvegardés
          </h3>
          {results.map(result => (
            <div key={result.id} style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              border: `1px solid ${theme.colors.bg.accent}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <Badge variant="success">SAVED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <Badge variant="info">{result.service}</Badge>
                <Badge variant="default">{result.username}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: result.credentials?.length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${result.credentials?.length > 0 ? theme.colors.status.success : theme.colors.status.error}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🔑 Credentials
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.credentials?.length || 0} trouvé(s)
                  </div>
                </div>
                
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.info}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🎯 Attempts
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.results?.attempts || 0}
                  </div>
                </div>

                {result.command && (
                  <div style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.warning}`
                  }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                      ⚡ Command
                    </div>
                    <div style={{ 
                      color: theme.colors.text.secondary, 
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}>
                      hydra -l {result.username} -P {result.wordlist}...
                    </div>
                  </div>
                )}
              </div>

              {/* Credentials trouvés */}
              {result.credentials && result.credentials.length > 0 ? (
                <div>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🔑 Credentials Found ({result.credentials.length})
                  </h4>
                  <div style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.status.success}`
                  }}>
                    {result.credentials.map((cred, index) => (
                      <div key={index} style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: theme.colors.status.success,
                        marginBottom: '4px',
                        fontWeight: '600'
                      }}>
                        ✅ {cred}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.error}`,
                  textAlign: 'center'
                }}>
                  <div style={{ color: theme.colors.status.error, fontWeight: '600', fontSize: '14px' }}>
                    ❌ No Valid Credentials Found
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '11px' }}>
                    Target may be secure or wordlist insufficient
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};


// ================================
// MODULE NIKTO
// ================================

const NiktoTab = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // 📂 CHARGEMENT INITIAL
  useEffect(() => {
    const savedResults = persistenceService.load('nikto_results', []);
    const savedForm = persistenceService.load('nikto_form', {});
    
    setResults(savedResults);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.scanType) setScanType(savedForm.scanType);
    
    console.log('📂 Nikto: Données restaurées');
  }, []);

  // 💾 SAUVEGARDE AUTO
  useEffect(() => {
    if (target || scanType) {
      persistenceService.save('nikto_form', { target, scanType });
    }
  }, [target, scanType]);

  useEffect(() => {
    if (results.length > 0) {
      persistenceService.save('nikto_results', results.slice(0, 20));
    }
  }, [results]);

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan (2 min)' },
    { value: 'basic', label: 'Basic Scan (5 min)' },
    { value: 'comprehensive', label: 'Comprehensive Scan (10 min)' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    if (status.status === 'completed') {
      const newResult = {
        id: currentTaskId,
        target: target,
        scanType: scanType,
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        results: status.data.results || {},
        raw_output: status.data.raw_output,
        vulnerabilities: status.data.results?.vulnerabilities || [],
        total_checks: status.data.results?.total_checks || 0
      };
      
      setResults(prev => [newResult, ...prev]);
      setError('');
    } else if (status.status === 'failed') {
      setError(status.data.error || 'Erreur inconnue');
    }
    setCurrentTaskId(null);
  }, [currentTaskId, target, scanType]));

  const startScan = async () => {
    if (!target || !scanType) {
      setError('Veuillez renseigner une cible et un type de scan');
      return;
    }

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      setError('La cible doit commencer par http:// ou https://');
      return;
    }

    setError('');
    try {
      const response = await apiService.startNiktoScan(target, scanType);
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  const clearResults = () => {
    setResults([]);
    persistenceService.remove('nikto_results');
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': case 'critical': return 'error';
      case 'medium': return 'warning';
      case 'low': case 'info': return 'info';
      default: return 'default';
    }
  };

  const isScanning = currentTaskId && taskStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Spider size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Nikto - Web Application Security Scanner
            </h2>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Badge variant="success">{results.length} sauvés</Badge>
              <Button variant="danger" size="sm" onClick={clearResults}>🧹 Clear</Button>
            </div>
          )}
        </div>

        {isScanning ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <Loader size={32} color={theme.colors.accent.primary} />
            <div style={{ color: theme.colors.text.primary, fontSize: '16px', fontWeight: '600', marginTop: theme.spacing.md }}>
              🕷️ Scan Nikto en cours...
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '14px', marginTop: theme.spacing.sm }}>
              Analyse de sécurité web: {scanType} de {target}
            </div>
            <div style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: theme.borderRadius.sm,
              fontSize: '12px',
              color: theme.colors.accent.primary
            }}>
              💾 Résultats sauvegardés automatiquement
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  🌐 Target URL {target && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Input
                  placeholder="https://example.com"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  ⚠️ Assurez-vous d'avoir l'autorisation de scanner cette cible
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  ⚡ Scan Type {scanType && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={scanTypes}
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  placeholder="Type de scan"
                />
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                background: 'rgba(220, 38, 38, 0.2)',
                border: `1px solid ${theme.colors.status.error}`,
                color: '#ff6b6b'
              }}>
                ❌ {error}
              </div>
            )}

            <Button
              onClick={startScan}
              disabled={!target || !scanType}
              variant="primary"
              icon={Play}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
            >
              🕷️ Start Nikto Scan
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            🕷️ Nikto Results ({results.length})
          </h3>
          {results.map(result => (
            <div key={result.id} style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              border: `1px solid ${theme.colors.bg.accent}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <Badge variant="success">SAVED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <Badge variant="info">{result.scanType}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.warning}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🔍 Checks
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.total_checks || 0}
                  </div>
                </div>
                
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: result.vulnerabilities?.length > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${result.vulnerabilities?.length > 0 ? theme.colors.status.error : theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🚨 Vulns
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.vulnerabilities?.length || 0}
                  </div>
                </div>
              </div>

              {result.vulnerabilities && result.vulnerabilities.length > 0 ? (
                <div>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🚨 Vulnerabilities ({result.vulnerabilities.length})
                  </h4>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm
                  }}>
                    {result.vulnerabilities.slice(0, 10).map((vuln, index) => (
                      <div key={index} style={{
                        marginBottom: theme.spacing.sm,
                        padding: theme.spacing.sm,
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        border: `1px solid ${theme.colors.status.error}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: '4px' }}>
                          <Badge variant={getSeverityBadge(vuln.severity || 'MEDIUM')}>
                            {vuln.severity || 'MEDIUM'}
                          </Badge>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted }}>
                            #{index + 1}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme.colors.text.secondary,
                          lineHeight: '1.4'
                        }}>
                          {vuln.description || vuln}
                        </div>
                      </div>
                    ))}
                    {result.vulnerabilities.length > 10 && (
                      <div style={{ textAlign: 'center', padding: theme.spacing.sm, fontSize: '11px', color: theme.colors.text.muted }}>
                        +{result.vulnerabilities.length - 10} more vulnerabilities...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.success}`,
                  textAlign: 'center'
                }}>
                  <div style={{ color: theme.colors.status.success, fontWeight: '600', fontSize: '14px' }}>
                    ✅ No Critical Vulnerabilities Found
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '11px' }}>
                    Basic security measures appear to be in place
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ================================
// HEADER ET NAVIGATION
// ================================

const Header = ({ currentUser, onLogout }) => {
  const [systemStatus, setSystemStatus] = useState({
    api: 'checking',
    tools: { nmap: false, nikto: false }
  });

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const healthData = await apiService.healthCheck();
        setSystemStatus({
          api: 'online',
          tools: healthData.tools || {}
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemStatus(prev => ({ ...prev, api: 'offline' }));
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return theme.colors.status.success;
      case 'offline': return theme.colors.status.error;
      default: return theme.colors.status.warning;
    }
  };

  return (
    <header style={{
      backgroundColor: theme.colors.bg.secondary,
      borderBottom: `1px solid ${theme.colors.bg.tertiary}`,
      padding: theme.spacing.lg,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Shield size={32} color={theme.colors.accent.primary} />
            <div>
              <h1 style={{ 
                color: theme.colors.text.primary,
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                PACHA Security Platform
              </h1>
              <p style={{
                color: theme.colors.text.muted,
                fontSize: '14px',
                margin: 0
              }}>
                Professional Penetration Testing Suite
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: theme.borderRadius.md,
            border: `1px solid rgba(0, 255, 136, 0.3)`
          }}>
            <User size={20} color={theme.colors.accent.primary} />
            <div>
              <div style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
                {currentUser.username}
              </div>
              <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                {currentUser.role === 'admin' ? '👑 Administrator' : '👤 User'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: theme.spacing.sm,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.sm,
              fontSize: '12px'
            }}>
              <span style={{ color: getStatusColor(systemStatus.api) }}>🔗 API</span>
            </div>
            
            <Badge variant={systemStatus.api === 'online' ? 'success' : 'error'}>
              {systemStatus.api === 'online' ? 'OPERATIONAL' : 'OFFLINE'}
            </Badge>
            
            <Button
              variant="danger"
              size="sm"
              icon={LogOut}
              onClick={onLogout}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'nmap', label: 'Nmap', icon: Target },
    { id: 'nikto', label: 'Nikto', icon: Spider },
    { id: 'metasploit', label: 'Metasploit', icon: Crosshairs },
    { id: 'tcpdump', label: 'tcpdump', icon: Network },
    { id: 'hydra', label: 'Hydra', icon: Key },
    { id: 'history', label: 'Historique', icon: History }
  ];

  return (
    <nav style={{
      backgroundColor: theme.colors.bg.primary,
      borderBottom: `1px solid ${theme.colors.bg.tertiary}`,
      padding: `0 ${theme.spacing.lg}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: theme.spacing.sm, overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  backgroundColor: isActive ? theme.colors.bg.secondary : 'transparent',
                  color: isActive ? theme.colors.accent.primary : theme.colors.text.secondary,
                  border: 'none',
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// ================================
// COMPOSANT PRINCIPAL
// ================================

const PachaPentestSuite = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('nmap');
  const [isLoading, setIsLoading] = useState(true);

  // 📂 CHARGEMENT INITIAL AVEC PERSISTENCE
  useEffect(() => {
    console.log('🔄 Vérification session...');
    
    const savedAuth = persistenceService.load('auth_state');
    const savedTab = persistenceService.load('active_tab', 'nmap');
    
    if (savedAuth && savedAuth.isAuthenticated) {
      apiService.healthCheck()
        .then(() => {
          console.log('✅ Session restaurée');
          setIsAuthenticated(true);
          setCurrentUser(savedAuth.user);
          setActiveTab(savedTab);
        })
        .catch(() => {
          console.log('❌ Session expirée');
          persistenceService.clearAll();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // 💾 SAUVEGARDE AUTO DE L'ONGLET
  useEffect(() => {
    if (isAuthenticated) {
      persistenceService.save('active_tab', activeTab);
    }
  }, [activeTab, isAuthenticated]);

  const handleLogin = (user, token) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    persistenceService.save('auth_state', { isAuthenticated: true, user, token });
    console.log('✅ Connexion sauvegardée');
  };

  const handleLogout = () => {
    persistenceService.clearAll();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('nmap');
    console.log('✅ Déconnexion et nettoyage');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nmap':
        return <NmapTab />;
      case 'nikto':
        return <NiktoTab />;
      case 'history':
        return (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📊</div>
            <div style={{ color: theme.colors.text.primary, fontSize: '18px', marginBottom: theme.spacing.sm }}>
              Historique des Scans
            </div>
            <div style={{ color: theme.colors.text.muted }}>
              Vos scans sont sauvegardés automatiquement
            </div>
          </Card>
        );
      case 'hydra':
        return <HydraTab />;
      default:
        return (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🚧</div>
            <div style={{ color: theme.colors.text.primary, fontSize: '18px', marginBottom: theme.spacing.sm }}>
              Onglet {activeTab}
            </div>
            <div style={{ color: theme.colors.text.muted }}>
              Fonctionnalité en cours de développement
            </div>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Loader size={48} color={theme.colors.accent.primary} />
        <div style={{ color: theme.colors.text.primary, marginTop: theme.spacing.md }}>
          🔄 Restauration de session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.bg.primary,
      color: theme.colors.text.primary
    }}>
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: theme.spacing.lg 
      }}>
        {renderTabContent()}
      </main>
      
      {/* Indicateur de persistence */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 255, 136, 0.9)',
        color: '#000000',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 1000
      }}>
        💾 Auto-Save
      </div>
    </div>
  );
};

export default PachaPentestSuite;