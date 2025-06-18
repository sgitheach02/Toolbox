import React, { useState, useEffect, useCallback } from 'react';

// ================================
// CONFIGURATION API
// ================================

// Configuration API compatible navigateur
const getApiBaseUrl = () => {
  // Vérifier si on est dans un environnement React avec variables d'environnement
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  
  // Par défaut, utiliser localhost
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

  async startTcpdumpCapture(networkInterface, duration, filter) {
    return this.request('/scan/tcpdump', {
      method: 'POST',
      body: JSON.stringify({ interface: networkInterface, duration, filter })
    });
  },

  async startHydraAttack(target, service, username, wordlist) {
    return this.request('/scan/hydra', {
      method: 'POST',
      body: JSON.stringify({ target, service, username, wordlist })
    });
  },

  async startMetasploitExploit(exploit, target, payload, lhost) {
    return this.request('/scan/metasploit', {
      method: 'POST',
      body: JSON.stringify({ exploit, target, payload, lhost })
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
// ICÔNES SVG
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

const Globe = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
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
    },
    warning: {
      backgroundColor: theme.colors.status.warning,
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
// HOOK POUR LE POLLING DES TÂCHES - VERSION CORRIGÉE
// ================================

const useTaskPolling = (taskId, onComplete) => {
  const [taskStatus, setTaskStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    console.log(`🔄 Démarrage polling pour task: ${taskId}`);
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log(`📊 Polling status pour ${taskId}...`);
        const status = await apiService.getTaskStatus(taskId);
        console.log(`📊 Status reçu:`, status);
        
        setTaskStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`✅ Task ${taskId} terminée: ${status.status}`);
          clearInterval(pollInterval);
          setIsPolling(false);
          if (onComplete) {
            console.log(`🎯 Appel onComplete pour ${taskId}`);
            onComplete(status);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur polling ${taskId}:`, error);
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 1000); // Polling toutes les secondes

    return () => {
      console.log(`🛑 Arrêt polling pour ${taskId}`);
      clearInterval(pollInterval);
      setIsPolling(false);
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
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
            type="submit" 
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
        </form>
        
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
// ONGLET NMAP
// ================================

const NmapTab = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan (-T4 -F)' },
    { value: 'basic', label: 'Basic Scan (-sV -sC)' },
    { value: 'intense', label: 'Intense Scan (-T4 -A -v)' },
    { value: 'comprehensive', label: 'Comprehensive Scan (-sS -sV -sC -A -T4)' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    console.log('🎯 Callback onComplete appelé avec:', status);
    
    if (status.status === 'completed') {
      console.log('✅ Scan terminé avec succès, ajout aux résultats');
      const newResult = {
        id: currentTaskId,
        target: target,
        scanType: scanType,
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        results: status.data.results || {},
        raw_output: status.data.raw_output
      };
      console.log('📊 Nouveau résultat:', newResult);
      setResults(prev => {
        const updated = [newResult, ...prev];
        console.log('📊 Résultats mis à jour:', updated);
        return updated;
      });
      setError(''); // Clear any previous errors
    } else if (status.status === 'failed') {
      console.log('❌ Scan échoué:', status.data.error);
      setError(status.data.error || 'Erreur inconnue');
    }
    setCurrentTaskId(null);
  }, [currentTaskId, target, scanType]));

  const startScan = async () => {
    if (!target || !scanType) {
      setError('Veuillez renseigner une cible et un type de scan');
      return;
    }

    console.log(`🚀 Démarrage scan Nmap: ${target} (${scanType})`);
    setError('');
    
    try {
      const response = await apiService.startNmapScan(target, scanType);
      console.log('✅ Réponse API:', response);
      console.log(`🎯 Task ID créé: ${response.task_id}`);
      setCurrentTaskId(response.task_id);
    } catch (error) {
      console.error('❌ Erreur démarrage scan:', error);
      setError(error.message);
    }
  };

  const isScanning = currentTaskId && taskStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Target size={20} color={theme.colors.accent.primary} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Nmap - Network Discovery & Security Scanning
          </h2>
        </div>

        {isScanning ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Loader size={32} color={theme.colors.accent.primary} />
            </div>
            <div style={{ 
              color: theme.colors.text.primary, 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: theme.spacing.md 
            }}>
              Scan Nmap en cours...
            </div>
            <div style={{ 
              color: theme.colors.text.muted, 
              fontSize: '14px'
            }}>
              Scan {scanType} de {target}
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
                  🎯 Target
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
                  ⚡ Scan Type
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

            <div style={{ marginTop: theme.spacing.lg }}>
              <Button
                onClick={startScan}
                disabled={!target || !scanType}
                variant="primary"
                icon={Play}
                fullWidth
              >
                🚀 Start Nmap Scan
              </Button>
            </div>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            📊 Scan Results ({results.length})
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
                <Badge variant="success">COMPLETED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <Badge variant="info">{result.scanType}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.sm }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', marginBottom: theme.spacing.xs }}>
                    🏠 Hosts Up
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                    {result.results.hosts_up || 0}
                  </div>
                </div>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', marginBottom: theme.spacing.xs }}>
                    🔓 Open Ports
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                    {result.results.detailed_ports?.filter(p => p.state === 'open').length || result.results.ports_open?.length || 0}
                  </div>
                </div>
                {result.results.target_info?.latency && (
                  <div style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.info}`
                  }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: '600', marginBottom: theme.spacing.xs }}>
                      ⚡ Latency
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                      {result.results.target_info.latency}
                    </div>
                  </div>
                )}
                {result.results.service_details?.length > 0 && (
                  <div style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.warning}`
                  }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: '600', marginBottom: theme.spacing.xs }}>
                      🔧 Services
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                      {result.results.services?.length || 0} detected
                    </div>
                  </div>
                )}
              </div>
              
              {/* Target Info */}
              {result.results.target_info?.target && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🎯 Target Information:
                  </h4>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: theme.colors.accent.secondary
                  }}>
                    {result.results.target_info.target}
                    {result.results.target_info.uptime && (
                      <div>Uptime: {result.results.target_info.uptime}</div>
                    )}
                    {result.results.target_info.distance && (
                      <div>Distance: {result.results.target_info.distance}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ports détaillés avec versions */}
              {result.results.detailed_ports && result.results.detailed_ports.length > 0 && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🔓 Detailed Port Analysis:
                  </h4>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm
                  }}>
                    {result.results.detailed_ports.map((port, index) => (
                      <div key={index} style={{
                        marginBottom: theme.spacing.sm,
                        padding: theme.spacing.sm,
                        backgroundColor: port.state === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        border: `1px solid ${port.state === 'open' ? theme.colors.status.success : theme.colors.status.error}`
                      }}>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: theme.colors.text.primary,
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          {port.port}/{port.protocol} {port.state} {port.service}
                        </div>
                        {port.version && (
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '4px'
                          }}>
                            Version: {port.version}
                          </div>
                        )}
                        {port.scripts && port.scripts.length > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            {port.scripts.slice(0, 3).map((script, scriptIndex) => (
                              <div key={scriptIndex} style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: theme.colors.text.muted,
                                marginBottom: '2px'
                              }}>
                                {script.length > 80 ? script.substring(0, 80) + '...' : script}
                              </div>
                            ))}
                            {port.scripts.length > 3 && (
                              <div style={{
                                fontSize: '10px',
                                color: theme.colors.accent.primary,
                                fontStyle: 'italic'
                              }}>
                                +{port.scripts.length - 3} more scripts...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* OS Detection */}
              {result.results.os_detection && result.results.os_detection.length > 0 && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    💻 OS Detection:
                  </h4>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {result.results.os_detection.slice(0, 5).map((os, index) => (
                      <div key={index} style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: theme.colors.text.secondary,
                        marginBottom: '2px'
                      }}>
                        {os}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Services détectés */}
              {result.results.services && result.results.services.length > 0 && (
                <div style={{ marginTop: theme.spacing.sm }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.xs, fontSize: '14px' }}>
                    🔧 Services Detected:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {result.results.services.map((service, index) => (
                      <Badge key={index} variant="info" style={{ fontSize: '10px' }}>
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Scan Statistics */}
              {result.results.scan_stats?.summary && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    📊 Scan Statistics:
                  </h4>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm
                  }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: '2px'
                    }}>
                      {result.results.scan_stats.summary}
                    </div>
                    {result.results.scan_stats.packets && (
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: theme.colors.text.muted
                      }}>
                        {result.results.scan_stats.packets}
                      </div>
                    )}
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
    tools: { nmap: false, nikto: false, metasploit: false, tcpdump: false, hydra: false }
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
    { id: 'nikto', label: 'Nikto', icon: Globe },
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

  useEffect(() => {
    const token = localStorage.getItem('pacha_token');
    if (token) {
      apiService.healthCheck()
        .then(() => {
          setIsAuthenticated(true);
          setCurrentUser({
            username: 'Utilisateur connecté',
            role: 'user'
          });
        })
        .catch(() => {
          localStorage.removeItem('pacha_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (user, token) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('✅ Connexion réussie:', user.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('pacha_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('nmap');
    console.log('✅ Déconnexion effectuée');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nmap':
        return <NmapTab />;
      case 'history':
        return (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📊</div>
            <div style={{ color: theme.colors.text.primary, fontSize: '18px', marginBottom: theme.spacing.sm }}>
              Historique des Scans
            </div>
            <div style={{ color: theme.colors.text.muted }}>
              Vos scans précédents apparaîtront ici
            </div>
          </Card>
        );
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
        justifyContent: 'center'
      }}>
        <Loader size={48} color={theme.colors.accent.primary} />
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
    </div>
  );
};

export default PachaPentestSuite;