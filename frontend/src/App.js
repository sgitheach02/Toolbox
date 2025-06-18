import React, { useState, useEffect, useCallback } from 'react';

// ================================
// ICÔNES SVG COMPLÈTES
// ================================

const Shield = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const Terminal = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="4,17 10,11 4,5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

const Target = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const Activity = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
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

const Search = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const Clock = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const AlertTriangle = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const TrendingUp = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"></polyline>
    <polyline points="16,7 22,7 22,13"></polyline>
  </svg>
);

const Database = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M12 2c-4.418 0-8 1.343-8 3v14c0 1.657 3.582 3 8 3s8-1.343 8-3V5c0-1.657-3.582-3-8-3z"></path>
    <path d="M12 12c4.418 0 8-1.343 8-3"></path>
  </svg>
);

const Filter = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
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

const Settings = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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

const Eye = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// ================================
// THÈME
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

// ================================
// COMPOSANTS UI
// ================================

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
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      border: `1px solid ${theme.colors.bg.tertiary}`
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
        transform: disabled ? 'none' : 'translateY(0px)',
        boxShadow: disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.2)',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        }
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Input = ({ type = 'text', placeholder, value, onChange, style = {}, onKeyPress }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
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
    onFocus={(e) => {
      e.target.style.borderColor = theme.colors.accent.primary;
      e.target.style.boxShadow = `0 0 0 2px rgba(0, 255, 136, 0.2)`;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = theme.colors.bg.accent;
      e.target.style.boxShadow = 'none';
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
      // Simulation d'authentification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (mode === 'login') {
        const user = {
          id: 1,
          username: formData.username,
          email: formData.email || 'user@pacha-toolbox.local',
          role: formData.username === 'admin' ? 'admin' : 'user'
        };
        
        setSuccess('Connexion réussie !');
        setTimeout(() => {
          onLogin(user, 'demo-session-token');
        }, 1000);
      } else {
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          setMode('login');
          setFormData({ username: formData.username, email: '', password: '', confirmPassword: '' });
        }, 2000);
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
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
        
        {mode === 'login' && (
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            background: 'rgba(0, 212, 255, 0.1)',
            border: `1px solid rgba(0, 212, 255, 0.3)`,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center'
          }}>
            <div style={{ color: theme.colors.accent.secondary, fontWeight: '600', marginBottom: theme.spacing.sm }}>
              🧪 Compte de démonstration
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
              <strong>Admin:</strong> admin / Admin123!<br />
              <strong>User:</strong> user / password123
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// ================================
// HEADER AVEC AUTHENTIFICATION
// ================================

const Header = ({ currentUser, onLogout }) => {
  const [systemStatus, setSystemStatus] = useState({
    api: 'checking',
    graylog: 'checking',
    tools: { nmap: false, nikto: false, metasploit: false, tcpdump: false, hydra: false }
  });

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        // Simulation du statut API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSystemStatus(prev => ({ 
          ...prev, 
          api: 'online',
          graylog: 'demo',
          tools: {
            nmap: true,
            nikto: true,
            metasploit: true,
            tcpdump: true,
            hydra: true
          }
        }));
      } catch (error) {
        setSystemStatus(prev => ({ ...prev, api: 'offline', graylog: 'offline' }));
      }
    };

    checkAPIStatus();
    const interval = setInterval(checkAPIStatus, 30000);
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
                Professional Penetration Testing Suite + Graylog Forensics
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
              <span style={{ color: getStatusColor(systemStatus.graylog === 'demo' ? 'checking' : systemStatus.graylog) }}>
                📊 {systemStatus.graylog === 'demo' ? 'Graylog Demo' : 'Graylog'}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: theme.spacing.xs,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.sm,
              fontSize: '11px'
            }}>
              {systemStatus.tools.nmap && <span title="Nmap disponible">🗺️</span>}
              {systemStatus.tools.nikto && <span title="Nikto disponible">🕷️</span>}
              {systemStatus.tools.metasploit && <span title="Metasploit disponible">🎯</span>}
              {systemStatus.tools.hydra && <span title="Hydra disponible">🔑</span>}
              {systemStatus.tools.tcpdump && <span title="tcpdump disponible">📡</span>}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
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

// ================================
// ONGLETS DE SCAN
// ================================

const NmapTab = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const scanTypes = [
    { value: '-sS', label: 'SYN Scan (-sS)' },
    { value: '-sT', label: 'TCP Connect (-sT)' },
    { value: '-sU', label: 'UDP Scan (-sU)' },
    { value: '-sV', label: 'Version Detection (-sV)' },
    { value: '-O', label: 'OS Detection (-O)' },
    { value: '-A', label: 'Aggressive (-A)' }
  ];

  const startScan = async () => {
    if (!target || !scanType) {
      alert('Veuillez renseigner une cible et un type de scan');
      return;
    }

    setIsScanning(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          const newResult = {
            id: Date.now(),
            target: target,
            scanType: scanType,
            timestamp: new Date().toLocaleString(),
            status: 'completed',
            ports: [
              { port: '22', state: 'open', service: 'ssh' },
              { port: '80', state: 'open', service: 'http' },
              { port: '443', state: 'open', service: 'https' }
            ]
          };
          setResults(prev => [newResult, ...prev]);
          setIsScanning(false);
          return 0;
        }
        return prev + 10;
      });
    }, 500);
  };

  const LoadingProgress = ({ message, progress, subMessage }) => (
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
        {message}
      </div>
      
      {subMessage && (
        <div style={{ 
          color: theme.colors.text.muted, 
          fontSize: '14px',
          marginBottom: theme.spacing.lg
        }}>
          {subMessage}
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: theme.colors.bg.primary,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        marginBottom: theme.spacing.md
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
          transition: 'width 0.3s ease',
          borderRadius: theme.borderRadius.sm
        }}></div>
      </div>
      
      <div style={{ 
        color: theme.colors.text.muted, 
        fontSize: '12px' 
      }}>
        {progress}% completed
      </div>
    </div>
  );

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
          <LoadingProgress 
            message="Scanning network..." 
            progress={progress}
            subMessage={`Scanning ${target} with ${scanType} options`}
          />
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
                {result.ports.map((port, index) => (
                  <div key={index} style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.success}`
                  }}>
                    <div style={{ marginBottom: theme.spacing.xs }}>
                      <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{port.port}/tcp</span>
                      <Badge variant="success" style={{ marginLeft: theme.spacing.sm }}>
                        {port.state}
                      </Badge>
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                      {port.service}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

const NiktoTab = () => {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const startScan = async () => {
    if (!target) {
      alert('Veuillez renseigner une cible');
      return;
    }

    setIsScanning(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          const newResult = {
            id: Date.now(),
            target: target,
            timestamp: new Date().toLocaleString(),
            vulnerabilities: [
              { severity: 'MEDIUM', description: 'Server may leak inodes via ETags', uri: '/' },
              { severity: 'HIGH', description: 'Directory indexing enabled', uri: '/backup/' }
            ]
          };
          setResults(prev => [newResult, ...prev]);
          setIsScanning(false);
          return 0;
        }
        return prev + 8;
      });
    }, 400);
  };

  const LoadingProgress = ({ message, progress, subMessage }) => (
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
        {message}
      </div>
      
      {subMessage && (
        <div style={{ 
          color: theme.colors.text.muted, 
          fontSize: '14px',
          marginBottom: theme.spacing.lg
        }}>
          {subMessage}
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: theme.colors.bg.primary,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        marginBottom: theme.spacing.md
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
          transition: 'width 0.3s ease',
          borderRadius: theme.borderRadius.sm
        }}></div>
      </div>
      
      <div style={{ 
        color: theme.colors.text.muted, 
        fontSize: '12px' 
      }}>
        {progress}% completed
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Globe size={20} color={theme.colors.status.warning} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Nikto - Web Server Scanner
          </h2>
        </div>

        {isScanning ? (
          <LoadingProgress 
            message="Scanning web server..." 
            progress={progress}
            subMessage={`Scanning ${target} for web vulnerabilities`}
          />
        ) : (
          <>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{ 
                display: 'block', 
                marginBottom: theme.spacing.sm, 
                color: theme.colors.text.secondary,
                fontSize: '13px',
                fontWeight: '500'
              }}>
                🌐 Target URL
              </label>
              <Input
                placeholder="http://example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>

            <Button
              onClick={startScan}
              disabled={!target}
              variant="primary"
              icon={Play}
              fullWidth
            >
              🕷️ Start Nikto Scan
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            🚨 Vulnerabilities Found
          </h3>
          {results.map(result => (
            <div key={result.id} style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <Badge variant="warning">COMPLETED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>

              {result.vulnerabilities.map((vuln, index) => (
                <div key={index} style={{
                  padding: theme.spacing.sm,
                  backgroundColor: vuln.severity === 'HIGH' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  marginBottom: theme.spacing.sm,
                  border: `1px solid ${vuln.severity === 'HIGH' ? theme.colors.status.error : theme.colors.status.warning}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                    <Badge variant={vuln.severity === 'HIGH' ? 'error' : 'warning'}>
                      {vuln.severity}
                    </Badge>
                  </div>
                  <div style={{ color: theme.colors.text.primary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                    {vuln.description}
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                    URI: {vuln.uri}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ================================
// NAVIGATION
// ================================

const Navigation = ({ activeTab, onTabChange, currentUser }) => {
  const tabs = [
    { id: 'nmap', label: 'Nmap', icon: Target },
    { id: 'nikto', label: 'Nikto', icon: Globe },
    { id: 'metasploit', label: 'Metasploit', icon: Crosshairs },
    { id: 'tcpdump', label: 'tcpdump', icon: Network },
    { id: 'hydra', label: 'Hydra', icon: Key },
    { id: 'history', label: 'Historique', icon: History }
  ];

  if (currentUser && currentUser.role === 'admin') {
    tabs.push({ id: 'admin', label: 'Administration', icon: Settings });
  }

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
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = theme.colors.bg.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                  }
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

  const handleLogin = (user, token) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('✅ Connexion réussie:', user.username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('nmap');
    console.log('✅ Déconnexion effectuée');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nmap':
        return <NmapTab />;
      case 'nikto':
        return <NiktoTab />;
      case 'metasploit':
      case 'tcpdump':
      case 'hydra':
        return (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🚧</div>
            <div style={{ color: theme.colors.text.primary, fontSize: '18px', marginBottom: theme.spacing.sm }}>
              Module {activeTab.toUpperCase()} - En développement
            </div>
            <div style={{ color: theme.colors.text.muted }}>
              Cette fonctionnalité sera bientôt disponible dans la version complète
            </div>
          </Card>
        );
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
      case 'admin':
        return (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>⚙️</div>
            <div style={{ color: theme.colors.text.primary, fontSize: '18px', marginBottom: theme.spacing.sm }}>
              Panel d'Administration
            </div>
            <div style={{ color: theme.colors.text.muted }}>
              Gestion des utilisateurs et configuration système
            </div>
          </Card>
        );
      default:
        return <NmapTab />;
    }
  };

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
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} />
      
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
        <>
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
              style={{ marginTop: theme.spacing.md }}
            >
              {isLoading ? (
                <>
                  <Loader size={16} />
                  {mode === 'login' ? 'Connexion...' : 'Création...'}
                </>
              ) : (
                mode === 'login' ? '🚀 Se connecter' : '✨ Créer le compte'
              )}
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
        </>