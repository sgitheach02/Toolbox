import React, { useState, useEffect, useRef } from 'react';

// Configuration API
const API_BASE = 'http://localhost:5000/api';

// Icônes SVG complètes
const Terminal = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="4,17 10,11 4,5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
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

const Activity = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
  </svg>
);

const FileText = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

const Settings = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="m19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const Play = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="5,3 19,12 5,21 5,3"></polygon>
  </svg>
);

const Square = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </svg>
);

const Download = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const RefreshCw = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="23,4 23,10 17,10"></polyline>
    <polyline points="1,20 1,14 7,14"></polyline>
    <path d="m23 10a8.5 8.5 0 0 0-14.5-6"></path>
    <path d="m1 14a8.5 8.5 0 0 0 14.5 6"></path>
  </svg>
);

const Wifi = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="m1 9 2-2c4.97-4.97 13.03-4.97 18 0l2 2"></path>
    <path d="m5 13 2-2c2.76-2.76 7.24-2.76 10 0l2 2"></path>
    <path d="m9 17 1-1c.55-.55 1.45-.55 2 0l1 1"></path>
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

// Thème professionnel
const theme = {
  colors: {
    bg: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      tertiary: '#3a3a3a',
      accent: '#4a4a4a'
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
      primary: '#6b7280',
      secondary: '#9ca3af'
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

// Composants UI
const Card = ({ children }) => (
  <div style={{
    backgroundColor: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.tertiary}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg
  }}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, disabled = false, onClick, type = 'button' }) => {
  const variants = {
    primary: {
      backgroundColor: theme.colors.accent.primary,
      color: theme.colors.text.primary,
      border: 'none'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.accent.primary,
      border: `1px solid ${theme.colors.accent.primary}`
    },
    success: {
      backgroundColor: theme.colors.status.success,
      color: theme.colors.text.primary,
      border: 'none'
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
    }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' }
  };

  return (
    <button
      type={type}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: theme.borderRadius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { bg: theme.colors.bg.tertiary, color: theme.colors.text.secondary },
    success: { bg: theme.colors.status.success, color: theme.colors.text.primary },
    warning: { bg: theme.colors.status.warning, color: theme.colors.bg.primary },
    error: { bg: theme.colors.status.error, color: theme.colors.text.primary },
    info: { bg: theme.colors.status.info, color: theme.colors.text.primary }
  };

  return (
    <span style={{
      backgroundColor: variants[variant].bg,
      color: variants[variant].color,
      padding: '2px 8px',
      borderRadius: theme.borderRadius.sm,
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {children}
    </span>
  );
};

// Header
const PentestHeader = () => (
  <header style={{
    backgroundColor: theme.colors.bg.secondary,
    borderBottom: `1px solid ${theme.colors.bg.tertiary}`,
    padding: theme.spacing.lg
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
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <Badge variant="success">OPERATIONAL</Badge>
        <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
          {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  </header>
);

// Navigation avec onglet Sniffing
const NavigationTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'reconnaissance', label: 'Reconnaissance', icon: Target },
    { id: 'scanning', label: 'Vulnerability Scanning', icon: Activity },
    { id: 'sniffing', label: 'Sniffing Réseau', icon: Network },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Configuration', icon: Settings }
  ];

  return (
    <nav style={{
      backgroundColor: theme.colors.bg.primary,
      borderBottom: `1px solid ${theme.colors.bg.tertiary}`,
      padding: `0 ${theme.spacing.lg}`
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
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
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent'
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

// Formulaire de capture réseau
const NetworkCaptureForm = ({ interfaces, onCaptureStart }) => {
  const [selectedInterface, setSelectedInterface] = useState('eth0');
  const [filter, setFilter] = useState('');
  const [duration, setDuration] = useState(60);
  const [packetCount, setPacketCount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  // Filtres prédéfinis
  const predefinedFilters = {
    'all': { name: 'Tout le trafic', filter: '', description: 'Capture tout le trafic réseau' },
    'http': { name: 'HTTP', filter: 'tcp port 80', description: 'Trafic HTTP uniquement' },
    'https': { name: 'HTTPS', filter: 'tcp port 443', description: 'Trafic HTTPS uniquement' },
    'dns': { name: 'DNS', filter: 'udp port 53', description: 'Requêtes DNS uniquement' },
    'ssh': { name: 'SSH', filter: 'tcp port 22', description: 'Connexions SSH uniquement' },
    'smb': { name: 'SMB', filter: 'port 445 or port 139', description: 'Trafic SMB/CIFS (Print Nightmare)' },
    'rpc': { name: 'RPC', filter: 'port 135', description: 'Remote Procedure Call' },
    'web': { name: 'Web (HTTP/HTTPS)', filter: 'tcp port 80 or tcp port 443', description: 'Trafic web complet' },
    'tcp': { name: 'TCP', filter: 'tcp', description: 'Tout le trafic TCP' },
    'udp': { name: 'UDP', filter: 'udp', description: 'Tout le trafic UDP' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterface) return;

    setIsLoading(true);
    try {
      await onCaptureStart({
        interface: selectedInterface,
        filter: filter,
        duration: parseInt(duration),
        packet_count: parseInt(packetCount)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSelect = (filterKey) => {
    setFilter(predefinedFilters[filterKey].filter);
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Network size={20} color={theme.colors.status.info} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Capture de Trafic Réseau - TCPDUMP
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Interface Réseau
            </label>
            <select
              value={selectedInterface}
              onChange={(e) => setSelectedInterface(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            >
              {Array.isArray(interfaces) && interfaces.map(iface => (
                <option key={iface.name} value={iface.name}>
                  {iface.display}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Filtre BPF (Berkeley Packet Filter)
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="e.g., tcp port 80, host 192.168.1.1"
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Filtres prédéfinis */}
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ 
            display: 'block', 
            marginBottom: theme.spacing.sm, 
            color: theme.colors.text.secondary,
            fontSize: '13px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Filtres Prédéfinis
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {Object.entries(predefinedFilters).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFilterSelect(key)}
                style={{
                  backgroundColor: filter === info.filter ? theme.colors.status.info : theme.colors.bg.tertiary,
                  color: filter === info.filter ? theme.colors.text.primary : theme.colors.text.secondary,
                  border: `1px solid ${filter === info.filter ? theme.colors.status.info : theme.colors.bg.accent}`,
                  borderRadius: theme.borderRadius.sm,
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                title={info.description}
              >
                {info.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: theme.spacing.md, alignItems: 'end' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Durée max (secondes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="10"
              max="600"
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Nb paquets max
            </label>
            <input
              type="number"
              value={packetCount}
              onChange={(e) => setPacketCount(e.target.value)}
              min="10"
              max="10000"
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            />
          </div>

          <Button
            type="submit"
            variant="success"
            icon={Play}
            disabled={isLoading}
          >
            {isLoading ? 'Démarrage...' : 'Démarrer Capture'}
          </Button>
        </div>

        <div style={{
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.bg.primary,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.status.info}33`
        }}>
          <div style={{ color: theme.colors.text.primary, fontSize: '14px', marginBottom: theme.spacing.xs }}>
            <strong>Capture de Trafic Réseau</strong>
          </div>
          <div style={{ color: theme.colors.text.muted, fontSize: '13px' }}>
            • Capture en temps réel du trafic réseau avec tcpdump<br/>
            • Filtrage avancé avec syntaxe BPF (Berkeley Packet Filter)<br/>
            • Analyse des protocoles HTTP, HTTPS, SSH, DNS, SMB et plus<br/>
            • Sauvegarde automatique au format PCAP pour analyse Wireshark
          </div>
        </div>
      </form>
    </Card>
  );
};

// Panneau des captures actives
const ActiveCapturesPanel = ({ activeCaptures, onStopCapture, onSelectCapture, selectedCapture }) => {
  const getSafeActiveCaptures = () => {
    return Array.isArray(activeCaptures) ? activeCaptures : [];
  };

  const safeCaptures = getSafeActiveCaptures();
  
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Wifi size={20} color={theme.colors.status.warning} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Captures Actives ({safeCaptures.length})
          </h2>
        </div>
      </div>

      {safeCaptures.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {safeCaptures.map(capture => (
            <div
              key={capture.capture_id}
              onClick={() => onSelectCapture(capture.capture_id)}
              style={{
                backgroundColor: selectedCapture === capture.capture_id ? 
                  `${theme.colors.status.info}20` : 
                  theme.colors.bg.tertiary,
                border: selectedCapture === capture.capture_id ? 
                  `1px solid ${theme.colors.status.info}` : 
                  `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <span style={{ 
                    color: theme.colors.text.primary,
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {capture.interface || 'Unknown'}
                  </span>
                  <Badge variant={capture.status === 'running' ? 'warning' : capture.status === 'completed' ? 'success' : 'error'}>
                    {capture.status || 'unknown'}
                  </Badge>
                </div>
                {capture.status === 'running' && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Square}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopCapture(capture.capture_id);
                    }}
                  >
                    Stop
                  </Button>
                )}
              </div>
              
              <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                Filtre: {capture.filter || 'Aucun filtre'}
              </div>
              <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                Paquets: {capture.packets_captured || 0} • 
                Démarré: {capture.start_time ? new Date(capture.start_time).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: theme.spacing.xl,
          color: theme.colors.text.muted
        }}>
          <Network size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
          <p>Aucune capture réseau active</p>
          <p style={{ fontSize: '13px' }}>Démarrez une capture pour monitorer le trafic en temps réel</p>
        </div>
      )}
    </Card>
  );
};

// Terminal pour les captures
const CaptureTerminalView = ({ captureId, isActive, title = "Capture Output" }) => {
  const [output, setOutput] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [packetsCount, setPacketsCount] = useState(0);
  const terminalRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive || !captureId) {
      setIsConnected(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsConnected(true);
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/network/capture/live/${captureId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.lines && Array.isArray(data.lines)) {
            setOutput(data.lines);
            setPacketsCount(data.packets_captured || 0);
          }
          if (!data.is_running) {
            setIsConnected(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Capture terminal fetch error:', error);
        setIsConnected(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [captureId, isActive]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Terminal size={20} color={theme.colors.status.info} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {title} {captureId && `- ${captureId}`}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <div style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
            📦 {packetsCount} paquets
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? theme.colors.status.success : theme.colors.text.muted
            }} />
            <span style={{ 
              color: isConnected ? theme.colors.status.success : theme.colors.text.muted,
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {isConnected ? 'Live' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={terminalRef}
        style={{
          backgroundColor: '#000',
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          minHeight: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4',
          border: `1px solid ${theme.colors.bg.accent}`
        }}
      >
        {output.length > 0 ? (
          output.map((line, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#666', marginRight: theme.spacing.sm }}>
                [{new Date().toLocaleTimeString()}]
              </span>
              <span style={{ color: line.includes('TCP') ? '#00ff00' : 
                                  line.includes('UDP') ? '#ffff00' :
                                  line.includes('ARP') ? '#ff6600' :
                                  line.includes('HTTP') ? '#00ffff' : 
                                  line.includes('SMB') ? '#ff0066' :
                                  line.includes('DNS') ? '#66ff00' : '#ffffff' }}>
                {line}
              </span>
            </div>
          ))
        ) : (
          <div style={{ 
            color: theme.colors.text.muted,
            textAlign: 'center',
            padding: theme.spacing.xl
          }}>
            {isActive ? 'Initialisation de la capture...' : `${title} prêt. Démarrez une capture pour voir le trafic en temps réel.`}
          </div>
        )}
      </div>
    </Card>
  );
};

// Historique des captures
const CaptureHistory = ({ captures, onRefresh }) => {
  const getSafeCaptures = () => {
    return Array.isArray(captures) ? captures : [];
  };

  const safeCaptures = getSafeCaptures();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <FileText size={20} color={theme.colors.status.success} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Historique des Captures ({safeCaptures.length})
          </h2>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {safeCaptures.length > 0 ? (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {safeCaptures.map((capture, index) => (
            <div
              key={capture.capture_id || index}
              style={{
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                    <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
                      {capture.interface || 'Unknown'}
                    </span>
                    <Badge variant={
                      capture.status === 'completed' ? 'success' :
                      capture.status === 'error' ? 'error' : 'default'
                    }>
                      {capture.status || 'unknown'}
                    </Badge>
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                    Filtre: {capture.filter || 'Aucun filtre'}
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                    {capture.duration || 'N/A'} • {capture.packets_captured || 0} paquets • {capture.file_size || 'N/A'} • {capture.start_time ? new Date(capture.start_time).toLocaleString() : 'N/A'}
                  </div>
                  {capture.error && (
                    <div style={{ color: theme.colors.status.error, fontSize: '12px', marginTop: theme.spacing.xs }}>
                      Erreur: {capture.error}
                    </div>
                  )}
                </div>
                {capture.filename && (
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => window.open(`${API_BASE}/network/capture/download/${capture.capture_id}`, '_blank')}
                    >
                      PCAP
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: theme.spacing.xl,
          color: theme.colors.text.muted
        }}>
          <FileText size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
          <p>Aucun historique de capture</p>
          <p style={{ fontSize: '13px' }}>Les captures terminées apparaîtront ici</p>
        </div>
      )}
    </Card>
  );
};

// Formulaire de scan existant (simplifié)
const ScanForm = ({ toolsStatus, onScanStart }) => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);

  const scanTypes = {
    basic: { name: 'Basic Port Scan', description: 'Fast TCP port scan (--top-ports 1000)' },
    stealth: { name: 'Stealth SYN Scan', description: 'Stealthy SYN scan (-sS -T2)' },
    comprehensive: { name: 'Comprehensive Scan', description: 'Service detection + OS fingerprinting (-sC -sV -O)' },
    udp: { name: 'UDP Scan', description: 'UDP port discovery (--top-ports 100)' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target.trim()) return;

    setIsLoading(true);
    try {
      await onScanStart({ tool: 'nmap', target, scanType });
      setTarget('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Target size={20} color={theme.colors.accent.primary} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Network Reconnaissance - NMAP
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 200px auto', gap: theme.spacing.md, alignItems: 'end' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Target
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., scanme.nmap.org, 192.168.1.1, 10.0.0.0/24"
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Scan Type
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                fontSize: '14px'
              }}
            >
              {Object.entries(scanTypes).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={Play}
            disabled={isLoading || !toolsStatus.nmap}
          >
            {isLoading ? 'Scanning...' : 'Execute'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// Terminal pour les scans existants (simplifié)
const TerminalView = ({ scanId, isActive, title = "Terminal Output" }) => {
  const [output, setOutput] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive || !scanId) {
      setIsConnected(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsConnected(true);
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/live/${scanId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.lines && Array.isArray(data.lines)) {
            setOutput(data.lines);
          }
          if (!data.is_running) {
            setIsConnected(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Terminal fetch error:', error);
        setIsConnected(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanId, isActive]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Terminal size={20} color={theme.colors.accent.primary} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {title} {scanId && `- ${scanId}`}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? theme.colors.status.success : theme.colors.text.muted
          }} />
          <span style={{ 
            color: isConnected ? theme.colors.status.success : theme.colors.text.muted,
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {isConnected ? 'Live' : 'Standby'}
          </span>
        </div>
      </div>

      <div
        ref={terminalRef}
        style={{
          backgroundColor: '#000',
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          minHeight: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4',
          border: `1px solid ${theme.colors.bg.accent}`
        }}
      >
        {output.length > 0 ? (
          output.map((line, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#666', marginRight: theme.spacing.sm }}>
                [{new Date().toLocaleTimeString()}]
              </span>
              <span style={{ color: '#00ff00' }}>
                {line}
              </span>
            </div>
          ))
        ) : (
          <div style={{ 
            color: theme.colors.text.muted,
            textAlign: 'center',
            padding: theme.spacing.xl
          }}>
            {isActive ? 'Initializing scan...' : `${title} ready. Execute a scan to see live output.`}
          </div>
        )}
      </div>
    </Card>
  );
};

// Composant principal
const ProfessionalPentestInterface = () => {
  const [activeTab, setActiveTab] = useState('reconnaissance');
  const [activeScans, setActiveScans] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [activeCaptures, setActiveCaptures] = useState([]);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [toolsStatus, setToolsStatus] = useState({});
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialiser les statuts des outils
        setToolsStatus({
          nmap: true,
          nikto: true,
          tcpdump: true
        });

        // Charger les interfaces réseau
        const interfacesRes = await fetch(`${API_BASE}/network/interfaces`);
        if (interfacesRes.ok) {
          const interfacesData = await interfacesRes.json();
          setNetworkInterfaces(interfacesData.interfaces || []);
        }

        // Charger l'historique des scans
        const historyRes = await fetch(`${API_BASE}/scan/history`);
        if (historyRes.ok) {
          const history = await historyRes.json();
          if (Array.isArray(history)) {
            setScanHistory(history);
          }
        }

        // Charger l'historique des captures
        const captureHistoryRes = await fetch(`${API_BASE}/network/capture/history`);
        if (captureHistoryRes.ok) {
          const captureHist = await captureHistoryRes.json();
          if (Array.isArray(captureHist)) {
            setCaptureHistory(captureHist);
          }
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Polling des scans actifs
  useEffect(() => {
    const fetchActiveScans = async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/active`);
        if (response.ok) {
          const scans = await response.json();
          if (Array.isArray(scans)) {
            setActiveScans(scans);
            
            if (scans.length > 0 && !selectedScan) {
              const runningScan = scans.find(s => s.status === 'running');
              if (runningScan) {
                setSelectedScan(runningScan.scan_id);
              }
            }
            
            if (selectedScan && !scans.find(s => s.scan_id === selectedScan)) {
              setSelectedScan(null);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching active scans:', error);
      }
    };

    fetchActiveScans();
    const interval = setInterval(fetchActiveScans, 2000);
    return () => clearInterval(interval);
  }, [selectedScan]);

  // Polling des captures actives
  useEffect(() => {
    const fetchActiveCaptures = async () => {
      try {
        const response = await fetch(`${API_BASE}/network/capture/active`);
        if (response.ok) {
          const captures = await response.json();
          if (Array.isArray(captures)) {
            setActiveCaptures(captures);
            
            if (captures.length > 0 && !selectedCapture) {
              const runningCapture = captures.find(c => c.status === 'running');
              if (runningCapture) {
                setSelectedCapture(runningCapture.capture_id);
              }
            }
            
            if (selectedCapture && !captures.find(c => c.capture_id === selectedCapture)) {
              setSelectedCapture(null);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching active captures:', error);
      }
    };

    if (activeTab === 'sniffing') {
      fetchActiveCaptures();
      const interval = setInterval(fetchActiveCaptures, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedCapture, activeTab]);

  // Fonction pour démarrer un scan
  const handleScanStart = async (formData) => {
    try {
      console.log('🚀 Starting scan:', formData);
      
      const response = await fetch(`${API_BASE}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Scan start failed');
      }

      const result = await response.json();
      console.log('✅ Scan started:', result);
      
      if (result.scan_id) {
        setSelectedScan(result.scan_id);
      }
    } catch (error) {
      console.error('❌ Error starting scan:', error);
      alert(`Error: ${error.message}`);
    }
  };

  
  // Fonction pour démarrer une capture
  const handleCaptureStart = async (formData) => {
    try {
      console.log('📡 Starting capture:', formData);
      
      const response = await fetch(`${API_BASE}/network/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Capture start failed');
      }

      const result = await response.json();
      console.log('✅ Capture started:', result);
      
      if (result.capture_id) {
        setSelectedCapture(result.capture_id);
      }
    } catch (error) {
      console.error('❌ Error starting capture:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Fonction pour arrêter une capture
  const handleStopCapture = async (captureId) => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/stop/${captureId}`, { 
        method: 'POST' 
      });
      
      if (response.ok) {
        console.log('✅ Capture stopped successfully');
        handleRefreshCaptureHistory();
      }
    } catch (error) {
      console.error('❌ Error stopping capture:', error);
    }
  };

  // Fonction pour rafraîchir l'historique des scans
  const handleRefreshScanHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/scan/history`);
      if (response.ok) {
        const history = await response.json();
        if (Array.isArray(history)) {
          setScanHistory(history);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing scan history:', error);
    }
  };

  // Fonction pour rafraîchir l'historique des captures
  const handleRefreshCaptureHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/history`);
      if (response.ok) {
        const history = await response.json();
        if (Array.isArray(history)) {
          setCaptureHistory(history);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing capture history:', error);
    }
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div style={{
        backgroundColor: theme.colors.bg.primary,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.text.primary
      }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={48} color={theme.colors.accent.primary} style={{ marginBottom: theme.spacing.md }} />
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Initializing Security Platform...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.colors.bg.primary,
      minHeight: '100vh',
      color: theme.colors.text.primary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      
      <PentestHeader />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: theme.spacing.lg }}>
        <div style={{ display: 'grid', gap: theme.spacing.lg }}>
          
          {/* Onglet Reconnaissance */}
          {activeTab === 'reconnaissance' && (
            <>
              <ScanForm 
                toolsStatus={toolsStatus} 
                onScanStart={handleScanStart}
              />
              
              <TerminalView
                scanId={selectedScan}
                isActive={!!selectedScan}
                title="Reconnaissance Terminal"
              />
            </>
          )}

          {/* Onglet Vulnerability Scanning */}
          {activeTab === 'scanning' && (
            <>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                  <Shield size={20} color={theme.colors.accent.primary} />
                  <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    Web Vulnerability Scanner - NIKTO
                  </h2>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target.elements.niktoTarget.value;
                  const scanType = e.target.elements.niktoScanType.value;
                  if (target) {
                    handleScanStart({ tool: 'nikto', target, scanType });
                    e.target.elements.niktoTarget.value = '';
                  }
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 200px auto', gap: theme.spacing.md, alignItems: 'end' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: theme.spacing.sm, 
                        color: theme.colors.text.secondary,
                        fontSize: '13px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Web Target (URL)
                      </label>
                      <input
                        name="niktoTarget"
                        type="text"
                        placeholder="e.g., http://testphp.vulnweb.com, https://example.com"
                        style={{
                          width: '100%',
                          backgroundColor: theme.colors.bg.tertiary,
                          border: `1px solid ${theme.colors.bg.accent}`,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.md,
                          color: theme.colors.text.primary,
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: theme.spacing.sm, 
                        color: theme.colors.text.secondary,
                        fontSize: '13px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Scan Mode
                      </label>
                      <select
                        name="niktoScanType"
                        defaultValue="comprehensive"
                        style={{
                          width: '100%',
                          backgroundColor: theme.colors.bg.tertiary,
                          border: `1px solid ${theme.colors.bg.accent}`,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.md,
                          color: theme.colors.text.primary,
                          fontSize: '14px'
                        }}
                      >
                        <option value="basic">Fast Scan</option>
                        <option value="comprehensive">Deep Scan</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      variant="success"
                      icon={Shield}
                    >
                      Scan Web App
                    </Button>
                  </div>
                </form>
              </Card>
              
              <TerminalView
                scanId={selectedScan}
                isActive={!!selectedScan}
                title="Web Vulnerability Scanner"
              />
            </>
          )}

          {/* Onglet Sniffing Réseau - NOUVEAU */}
          {activeTab === 'sniffing' && (
            <>
              <NetworkCaptureForm 
                interfaces={networkInterfaces} 
                onCaptureStart={handleCaptureStart}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <ActiveCapturesPanel
                  activeCaptures={activeCaptures}
                  onStopCapture={handleStopCapture}
                  onSelectCapture={setSelectedCapture}
                  selectedCapture={selectedCapture}
                />
                <CaptureHistory
                  captures={captureHistory}
                  onRefresh={handleRefreshCaptureHistory}
                />
              </div>
              
              <CaptureTerminalView
                captureId={selectedCapture}
                isActive={!!selectedCapture}
                title="Network Capture Terminal"
              />
            </>
          )}

          {/* Onglet Reports */}
          {activeTab === 'reports' && (
            <>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                  <FileText size={20} color={theme.colors.accent.primary} />
                  <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    Report Management
                  </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: theme.colors.status.success, fontSize: '24px', fontWeight: '700' }}>
                      {scanHistory.filter(s => s.status === 'completed').length}
                    </div>
                    <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>Completed Scans</div>
                  </div>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: theme.colors.status.warning, fontSize: '24px', fontWeight: '700' }}>
                      {activeScans.length}
                    </div>
                    <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>Active Scans</div>
                  </div>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: theme.colors.status.info, fontSize: '24px', fontWeight: '700' }}>
                      {captureHistory.filter(c => c.status === 'completed').length}
                    </div>
                    <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>Network Captures</div>
                  </div>
                </div>
              </Card>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <Card>
                  <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.md }}>
                    📊 Scan Reports
                  </h3>
                  {scanHistory.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {scanHistory.slice(0, 10).map((scan, index) => (
                        <div
                          key={scan.scan_id || index}
                          style={{
                            backgroundColor: theme.colors.bg.tertiary,
                            border: `1px solid ${theme.colors.bg.accent}`,
                            borderRadius: theme.borderRadius.md,
                            padding: theme.spacing.sm,
                            marginBottom: theme.spacing.sm
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>
                                {scan.tool?.toUpperCase() || 'UNKNOWN'} - {scan.target || 'N/A'}
                              </div>
                              <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                                {scan.start_time ? new Date(scan.start_time).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                            <Badge variant={scan.status === 'completed' ? 'success' : 'error'}>
                              {scan.status || 'unknown'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.text.muted }}>
                      <p>No scan reports available</p>
                    </div>
                  )}
                </Card>

                <Card>
                  <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.md }}>
                    📡 Network Captures
                  </h3>
                  {captureHistory.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {captureHistory.slice(0, 10).map((capture, index) => (
                        <div
                          key={capture.capture_id || index}
                          style={{
                            backgroundColor: theme.colors.bg.tertiary,
                            border: `1px solid ${theme.colors.bg.accent}`,
                            borderRadius: theme.borderRadius.md,
                            padding: theme.spacing.sm,
                            marginBottom: theme.spacing.sm
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>
                                {capture.interface || 'Unknown'} - {capture.packets_captured || 0} packets
                              </div>
                              <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                                {capture.start_time ? new Date(capture.start_time).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
                              <Badge variant={capture.status === 'completed' ? 'success' : 'error'}>
                                {capture.status || 'unknown'}
                              </Badge>
                              {capture.filename && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Download}
                                  onClick={() => window.open(`${API_BASE}/network/capture/download/${capture.capture_id}`, '_blank')}
                                >
                                  PCAP
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.text.muted }}>
                      <p>No network captures available</p>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {/* Onglet Settings */}
          {activeTab === 'settings' && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                <Settings size={20} color={theme.colors.accent.primary} />
                <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  System Configuration
                </h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.lg }}>
                <div>
                  <h3 style={{ color: theme.colors.text.primary, fontSize: '16px', marginBottom: theme.spacing.md }}>
                    Tool Availability
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {Object.entries(toolsStatus).map(([tool, available]) => (
                      <div key={tool} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: theme.colors.text.secondary, textTransform: 'uppercase' }}>
                          {tool}
                        </span>
                        <Badge variant={available ? 'success' : 'error'}>
                          {available ? 'Available' : 'Missing'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ color: theme.colors.text.primary, fontSize: '16px', marginBottom: theme.spacing.md }}>
                    Network Interfaces
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {networkInterfaces.slice(0, 5).map((iface, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>
                          {iface.name}
                        </span>
                        <Badge variant={iface.active ? 'success' : 'default'}>
                          {iface.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ color: theme.colors.text.primary, fontSize: '16px', marginBottom: theme.spacing.md }}>
                    Platform Status
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>API Status</span>
                      <Badge variant="success">Operational</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Active Scans</span>
                      <Badge variant="info">{activeScans.length}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Active Captures</span>
                      <Badge variant="warning">{activeCaptures.length}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Total Reports</span>
                      <Badge variant="default">{scanHistory.length + captureHistory.length}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default ProfessionalPentestInterface;