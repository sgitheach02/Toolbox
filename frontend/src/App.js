import React, { useState, useEffect, useCallback, useRef } from 'react';

// ================================
// ICÔNES SVG
// ================================

const Terminal = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

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

const Download = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Eye = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const FileText = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

// ================================
// CONFIGURATION API CORRIGÉE
// ================================

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// ================================
// SERVICE API CORRIGÉ
// ================================

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
      
      // Pour les téléchargements, retourner la response directement
      if (options.download) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      }

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
    return this.request('/api/health');
  },

  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async startNmapScan(target, scanType) {
    return this.request('/api/scan/nmap', {
      method: 'POST',
      body: JSON.stringify({ target, scanType })
    });
  },

  async startNiktoScan(target, scanType) {
    return this.request('/api/scan/nikto', {
      method: 'POST',
      body: JSON.stringify({ target, scanType })
    });
  },

  async startTcpdumpCapture(iface, capture_mode, duration, packet_count, filter) {
    return this.request('/api/scan/tcpdump', {
      method: 'POST',
      body: JSON.stringify({ interface: iface, capture_mode, duration, packet_count, filter })
    });
  },

  async getTaskStatus(taskId) {
    return this.request(`/api/scan/status/${taskId}`);
  },

  async getScanHistory() {
    return this.request('/api/scan/history');
  },

  async getTaskFiles(taskId) {
    return this.request(`/api/scan/files/${taskId}`);
  },

  async generateReport(taskId, format = 'html') {
    return this.request(`/api/scan/report/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ format })
    });
  },

  async deleteTask(taskId) {
    return this.request(`/api/scan/delete/${taskId}`, {
      method: 'DELETE'
    });
  },

  // FONCTION DE TÉLÉCHARGEMENT CORRIGÉE
  async downloadFile(taskId, fileType = 'report') {
    const endpoint = fileType === 'pcap' 
      ? `/api/scan/download/${taskId}/pcap`
      : `/api/scan/download/${taskId}`;
    
    const response = await this.request(endpoint, { download: true });
    return response;
  },

  // ANALYSE PCAP CORRIGÉE
  async analyzePcap(taskId) {
    return this.request(`/api/scan/pcap/analyze/${taskId}`);
  },

  // URL de téléchargement direct
  getDownloadUrl(taskId, fileType = 'report') {
    return fileType === 'pcap' 
      ? `${API_BASE_URL}/api/scan/download/${taskId}/pcap`
      : `${API_BASE_URL}/api/scan/download/${taskId}`;
  }
};

// ================================
// SYSTÈME DE PERSISTANCE CORRIGÉ
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

const Input = ({ type = 'text', placeholder, value, onChange, onKeyDown, style = {}, disabled = false, name }) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
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
// COMPOSANT DOWNLOAD MANAGER CORRIGÉ
// ================================

const DownloadManager = ({ taskId, taskData, taskStatus }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pcapFrames, setPcapFrames] = useState([]);
  const [showFrames, setShowFrames] = useState(false);

  const loadFiles = async () => {
    if (!taskId || taskStatus !== 'completed') return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getTaskFiles(taskId);
      setFiles(response.files || []);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
      console.error('Erreur chargement fichiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (taskId, fileType, filename) => {
    try {
      setLoading(true);
      const response = await apiService.downloadFile(taskId, fileType);
      
      // Créer un blob et déclencher le téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${taskId}_${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 Téléchargement de ${filename} réussi`);
    } catch (err) {
      setError(`Erreur téléchargement: ${err.message}`);
      console.error('Erreur téléchargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFrames = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.analyzePcap(taskId);
      setPcapFrames(response.frames || []);
      setShowFrames(true);
      console.log(`🔍 Analyse PCAP: ${response.frames?.length || 0} frames`);
    } catch (err) {
      setError(`Erreur analyse: ${err.message}`);
      console.error('Erreur analyse PCAP:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.generateReport(taskId, 'html');
      
      // Télécharger automatiquement le rapport
      if (response.report_url) {
        const reportResponse = await apiService.downloadFile(taskId, 'report');
        const blob = await reportResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${taskId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log(`📄 Rapport HTML généré et téléchargé`);
      }
    } catch (err) {
      setError(`Erreur génération rapport: ${err.message}`);
      console.error('Erreur rapport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [taskId, taskStatus]);

  if (taskStatus !== 'completed') return null;

  return (
    <div style={{ 
      marginTop: '15px', 
      padding: '15px', 
      background: 'rgba(0, 255, 136, 0.1)', 
      borderRadius: '10px',
      border: '1px solid rgba(0, 255, 136, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: '#00ff88', fontSize: '14px', fontWeight: '600' }}>
          📥 Téléchargements & Rapports
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success" style={{ fontSize: '10px' }}>
            {files.length} fichier(s)
          </Badge>
          {loading && <Badge variant="warning" style={{ fontSize: '10px' }}>Chargement...</Badge>}
        </div>
      </div>
      
      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          fontSize: '12px', 
          marginBottom: '10px',
          padding: '8px',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 107, 107, 0.3)'
        }}>
          ❌ {error}
        </div>
      )}
      
      {/* Boutons d'action principaux */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {/* Téléchargement PCAP pour tcpdump */}
        {taskId.startsWith('tcpdump_') && (
          <Button
            size="sm"
            variant="primary"
            icon={Download}
            onClick={() => downloadFile(taskId, 'pcap', `capture_${taskId}.pcap`)}
            disabled={loading}
          >
            📦 PCAP
          </Button>
        )}
        
        {/* Générer rapport HTML */}
        <Button
          size="sm"
          variant="secondary"
          icon={FileText}
          onClick={generateReport}
          disabled={loading}
        >
          📄 Rapport HTML
        </Button>
        
        {/* Analyser trames pour tcpdump */}
        {taskId.startsWith('tcpdump_') && (
          <Button
            size="sm"
            variant="secondary"
            icon={Eye}
            onClick={analyzeFrames}
            disabled={loading}
          >
            🔍 Analyser Trames
          </Button>
        )}
        
        <Button
          size="sm"
          variant="secondary"
          onClick={loadFiles}
          disabled={loading}
        >
          🔄 Actualiser
        </Button>
      </div>

      {/* Liste des fichiers disponibles */}
      {files.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h5 style={{ color: '#00ff88', margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
            📁 Fichiers disponibles:
          </h5>
          {files.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              marginBottom: '6px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
                  {file.type === 'pcap' ? '📦' : '📄'} {file.filename}
                </div>
                <div style={{ color: '#ccc', fontSize: '10px' }}>
                  {file.size_human} • {file.created_at ? new Date(file.created_at).toLocaleString('fr-FR') : 'N/A'}
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={Download}
                onClick={() => downloadFile(taskId, file.type, file.filename)}
                disabled={loading}
              >
                📥
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Affichage des trames PCAP */}
      {showFrames && pcapFrames.length > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 136, 0.5)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h5 style={{ color: '#00ff88', margin: 0, fontSize: '13px', fontWeight: '600' }}>
              🔍 Analyse des trames ({pcapFrames.length} paquets)
            </h5>
            <button
              onClick={() => setShowFrames(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            fontSize: '10px',
            fontFamily: 'monospace'
          }}>
            {pcapFrames.slice(0, 50).map((frame, index) => (
              <div key={index} style={{
                padding: '6px',
                marginBottom: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                borderLeft: `3px solid ${
                  frame.protocol === 'TCP' ? '#3b82f6' :
                  frame.protocol === 'UDP' ? '#eab308' :
                  frame.protocol === 'ICMP' ? '#22c55e' : '#6b7280'
                }`
              }}>
                <div style={{ color: '#00ff88', fontWeight: 'bold' }}>
                  #{index + 1} {frame.timestamp} - {frame.protocol}
                </div>
                <div style={{ color: '#e5e5e5', marginTop: '2px' }}>
                  {frame.src} → {frame.dst} 
                  {frame.length && ` (${frame.length} bytes)`}
                </div>
                {frame.info && (
                  <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>
                    {frame.info}
                  </div>
                )}
              </div>
            ))}
            {pcapFrames.length > 50 && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '10px', padding: '8px' }}>
                ... et {pcapFrames.length - 50} autres paquets
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// COMPOSANT AUTHENTIFICATION SIMPLE
// ================================

const AuthForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    
    if (!formData.username || !formData.password) {
      setError('Nom d\'utilisateur et mot de passe requis');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.login(formData.username, formData.password);
      localStorage.setItem('pacha_token', response.token);
      onLogin(response.user, response.token);
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
        maxWidth: '400px', 
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
            Professional Penetration Testing Suite
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
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin ou user"
              disabled={isLoading}
            />
          </div>
          
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
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin123 ou user123"
              disabled={isLoading}
            />
          </div>
          
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
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            fullWidth
            icon={isLoading ? Loader : null}
            style={{ marginTop: theme.spacing.md }}
          >
            {isLoading ? 'Connexion...' : '🚀 Se connecter'}
          </Button>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          borderRadius: theme.borderRadius.md,
          fontSize: '12px',
          color: theme.colors.text.secondary
        }}>
          <div style={{ fontWeight: '600', color: theme.colors.accent.primary, marginBottom: '4px' }}>
            Comptes de démonstration
          </div>
          <div>admin:admin123 (Administrateur)</div>
          <div>user:user123 (Utilisateur)</div>
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

  useEffect(() => {
    const savedResults = persistenceService.load('nmap_results', []);
    const savedForm = persistenceService.load('nmap_form', {});
    
    setResults(savedResults);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.scanType) setScanType(savedForm.scanType);
  }, []);

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
              </div>

              {/* Gestionnaire de téléchargement */}
              <DownloadManager 
                taskId={result.id} 
                taskData={result} 
                taskStatus={result.status} 
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ================================
// MODULE TCPDUMP CORRIGÉ
// ================================

const TcpdumpTab = () => {
  const [interface_, setInterface_] = useState('');
  const [filter, setFilter] = useState('');
  const [duration, setDuration] = useState('60');
  const [packetCount, setPacketCount] = useState('');
  const [captureMode, setCaptureMode] = useState('time');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedResults = persistenceService.load('tcpdump_results', []);
    const savedForm = persistenceService.load('tcpdump_form', {});
    
    setResults(savedResults);
    if (savedForm.interface_) setInterface_(savedForm.interface_);
    if (savedForm.filter) setFilter(savedForm.filter);
    if (savedForm.duration) setDuration(savedForm.duration);
    if (savedForm.packetCount) setPacketCount(savedForm.packetCount);
    if (savedForm.captureMode) setCaptureMode(savedForm.captureMode);
  }, []);

  useEffect(() => {
    if (interface_ || filter || duration !== '60' || packetCount || captureMode !== 'time') {
      persistenceService.save('tcpdump_form', { 
        interface_, 
        filter, 
        duration, 
        packetCount, 
        captureMode 
      });
    }
  }, [interface_, filter, duration, packetCount, captureMode]);

  useEffect(() => {
    if (results.length > 0) {
      persistenceService.save('tcpdump_results', results.slice(0, 20));
    }
  }, [results]);

  const interfaces = [
    { value: 'eth0', label: 'eth0 - Ethernet primaire' },
    { value: 'wlan0', label: 'wlan0 - Interface WiFi' },
    { value: 'lo', label: 'lo - Loopback' },
    { value: 'any', label: 'any - Toutes interfaces' },
    { value: 'tun0', label: 'tun0 - VPN Interface' }
  ];

  const filterPresets = [
    { value: '', label: 'Aucun filtre (tout capturer)' },
    { value: 'tcp port 80', label: 'HTTP Traffic (port 80)' },
    { value: 'tcp port 443', label: 'HTTPS Traffic (port 443)' },
    { value: 'tcp port 22', label: 'SSH Traffic (port 22)' },
    { value: 'udp port 53', label: 'DNS Queries (port 53)' },
    { value: 'icmp', label: 'ICMP Packets (ping)' },
    { value: 'host 192.168.1.1', label: 'Traffic vers/depuis gateway' },
    { value: 'net 192.168.1.0/24', label: 'Trafic réseau local' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    if (status.status === 'completed' || status.status === 'stopped') {
      const newResult = {
        id: currentTaskId,
        interface: interface_,
        filter: filter,
        duration: duration,
        packetCount: packetCount,
        captureMode: captureMode,
        timestamp: new Date().toLocaleString(),
        status: status.status,
        results: status.data.results || {},
        raw_output: status.data.raw_output,
        packets_captured: status.data.results?.packets_captured || 0,
        protocols: status.data.results?.protocols || {},
        command: status.data.command
      };
      
      setResults(prev => [newResult, ...prev]);
      setError('');
      setCurrentTaskId(null);
    } else if (status.status === 'failed') {
      setError(status.data.error || 'Erreur inconnue');
      setCurrentTaskId(null);
    }
  }, [currentTaskId, interface_, filter, duration, packetCount, captureMode]));

  const startCapture = async () => {
    if (!interface_) {
      setError('Veuillez sélectionner une interface réseau');
      return;
    }

    if (captureMode === 'time' && (!duration || duration < 1)) {
      setError('Veuillez spécifier une durée valide');
      return;
    }

    if (captureMode === 'count' && (!packetCount || packetCount < 1)) {
      setError('Veuillez spécifier un nombre de paquets valide');
      return;
    }

    setError('');
    try {
      const payload = {
        interface: interface_,
        filter: filter || undefined,
        capture_mode: captureMode,
        ...(captureMode === 'time' && duration && { duration: parseInt(duration) }),
        ...(captureMode === 'count' && packetCount && { packet_count: parseInt(packetCount) })
      };

      const response = await apiService.startTcpdumpCapture(
        interface_, 
        captureMode, 
        captureMode === 'time' ? parseInt(duration) : null,
        captureMode === 'count' ? parseInt(packetCount) : null,
        filter
      );
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  const clearResults = () => {
    setResults([]);
    persistenceService.remove('tcpdump_results');
  };

  const isCapturing = currentTaskId && (taskStatus?.status === 'running' || taskStatus?.status === 'starting');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Network size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Tcpdump - Network Packet Capture & Analysis
            </h2>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Badge variant="success">{results.length} sauvés</Badge>
              <Button variant="danger" size="sm" onClick={clearResults}>🧹 Clear</Button>
            </div>
          )}
        </div>

        {isCapturing ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <Loader size={32} color={theme.colors.accent.primary} />
            <div style={{ color: theme.colors.text.primary, fontSize: '16px', fontWeight: '600', marginTop: theme.spacing.md }}>
              📡 Capture Tcpdump en cours...
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '14px', marginTop: theme.spacing.sm }}>
              Interface: {interface_} | Filtre: {filter || 'Aucun'} | Mode: {captureMode}
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
                  🔗 Interface Réseau
                </label>
                <Select
                  options={interfaces}
                  value={interface_}
                  onChange={(e) => setInterface_(e.target.value)}
                  placeholder="Choisir interface"
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
                  🔍 Filtre BPF
                </label>
                <Select
                  options={filterPresets}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtres prédéfinis"
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
                  ⚙️ Mode de Capture
                </label>
                <Select
                  options={[
                    { value: 'time', label: '⏱️ Durée fixe (secondes)' },
                    { value: 'count', label: '📊 Nombre de paquets' },
                    { value: 'continuous', label: '🔄 Continu (manuel stop)' }
                  ]}
                  value={captureMode}
                  onChange={(e) => setCaptureMode(e.target.value)}
                  placeholder="Mode de capture"
                />
              </div>

              {captureMode === 'time' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: theme.spacing.sm, 
                    color: theme.colors.text.secondary,
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    ⏱️ Durée (secondes)
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="3600"
                  />
                </div>
              )}

              {captureMode === 'count' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: theme.spacing.sm, 
                    color: theme.colors.text.secondary,
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    📊 Nombre de Paquets
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={packetCount}
                    onChange={(e) => setPacketCount(e.target.value)}
                    min="1"
                    max="100000"
                  />
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
              onClick={startCapture}
              disabled={
                !interface_ || 
                (captureMode === 'time' && (!duration || duration < 1)) ||
                (captureMode === 'count' && (!packetCount || packetCount < 1))
              }
              variant="primary"
              icon={Play}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
            >
              📡 Start Packet Capture
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            📡 Tcpdump Results ({results.length})
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
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.interface}</span>
                <Badge variant="info">{result.captureMode}</Badge>
                {result.filter && <Badge variant="default">{result.filter}</Badge>}
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.accent.primary}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    📦 Packets
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.packets_captured || 0}
                  </div>
                </div>
                
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.info}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🌐 Protocols
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {Object.keys(result.protocols || {}).length}
                  </div>
                </div>
              </div>

              {/* Gestionnaire de téléchargement avec support PCAP */}
              <DownloadManager 
                taskId={result.id} 
                taskData={result} 
                taskStatus={result.status} 
              />
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

  useEffect(() => {
    const savedResults = persistenceService.load('nikto_results', []);
    const savedForm = persistenceService.load('nikto_form', {});
    
    setResults(savedResults);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.scanType) setScanType(savedForm.scanType);
  }, []);

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
                  🌐 Target URL
                </label>
                <Input
                  placeholder="https://example.com"
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
                <Badge variant="success">COMPLETED</Badge>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.target}</span>
                <Badge variant="info">{result.scanType}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: result.vulnerabilities?.length > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${result.vulnerabilities?.length > 0 ? theme.colors.status.error : theme.colors.status.success}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🚨 Vulnérabilités
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.vulnerabilities?.length || 0}
                  </div>
                </div>
              </div>

              {/* Gestionnaire de téléchargement */}
              <DownloadManager 
                taskId={result.id} 
                taskData={result} 
                taskStatus={result.status} 
              />
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
                Professional Penetration Testing Suite v2.0 - FIXED
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

          <Badge variant={systemStatus.api === 'online' ? 'success' : 'error'}>
            {systemStatus.api === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
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
    </header>
  );
};

const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'nmap', label: 'Nmap', icon: Target },
    { id: 'nikto', label: 'Nikto', icon: Spider },
    { id: 'tcpdump', label: 'tcpdump', icon: Network }
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
      case 'tcpdump':
        return <TcpdumpTab />; 
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
      
      {/* Indicateur de statut */}
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
        ✅ FIXED v2.0
      </div>
    </div>
  );
};

export default PachaPentestSuite;