import React, { useState, useEffect, useRef } from 'react';

// Configuration API
const API_BASE = 'http://localhost:5000/api';

// Icônes simples en SVG
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
              PACHA - Pentest Automation & Cybersecurity Hacking Assistant
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

// Navigation
const NavigationTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'reconnaissance', label: 'Reconnaissance', icon: Target },
    { id: 'scanning', label: 'Vulnerability Scanning', icon: Activity },
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

// Formulaire de scan
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

        {scanTypes[scanType] && (
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.bg.primary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.accent.primary}33`
          }}>
            <div style={{ color: theme.colors.text.primary, fontSize: '14px', marginBottom: theme.spacing.xs }}>
              <strong>{scanTypes[scanType].name}</strong>
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '13px' }}>
              {scanTypes[scanType].description}
            </div>
          </div>
        )}

        {!toolsStatus.nmap && (
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: `${theme.colors.status.error}20`,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.status.error}`,
            color: theme.colors.status.error,
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ NMAP is not available on this system
          </div>
        )}
      </form>
    </Card>
  );
};

// Panneau des scans actifs
const ProgressBar = ({ progress, status }) => (
  <div style={{
    width: '100%',
    height: '8px',
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: theme.spacing.md
  }}>
    <div style={{
      height: '100%',
      backgroundColor: status === 'completed' ? theme.colors.status.success : 
                      status === 'error' ? theme.colors.status.error : 
                      theme.colors.accent.primary,
      width: `${progress}%`,
      transition: 'width 0.3s ease',
      animation: status === 'running' ? 'pulse 2s infinite' : 'none'
    }} />
  </div>
);

const ActiveScansPanel = ({ activeScans, onStopScan, onSelectScan, selectedScan, currentTool }) => {
  // ✅ Fonction sécurisée pour filtrer les scans - CORRECTION CRITIQUE
  const getSafeActiveScans = () => {
    return Array.isArray(activeScans) ? activeScans : [];
  };

  const filteredScans = getSafeActiveScans().filter(scan => scan && scan.tool === currentTool);
  
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Activity size={20} color={theme.colors.status.warning} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Active {currentTool.toUpperCase()} Scans ({filteredScans.length})
          </h2>
        </div>
      </div>

      {filteredScans.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {filteredScans.map(scan => {
            const progress = scan.status === 'completed' ? 100 : 
                           scan.status === 'running' ? 75 : 
                           scan.status === 'error' ? 100 : 25;
            
            return (
              <div
                key={scan.scan_id}
                onClick={() => onSelectScan(scan.scan_id)}
                style={{
                  backgroundColor: selectedScan === scan.scan_id ? 
                    `${theme.colors.accent.primary}20` : 
                    theme.colors.bg.tertiary,
                  border: selectedScan === scan.scan_id ? 
                    `1px solid ${theme.colors.accent.primary}` : 
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
                      {scan.tool ? scan.tool.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <Badge variant={scan.status === 'running' ? 'warning' : scan.status === 'completed' ? 'success' : 'error'}>
                      {scan.status || 'unknown'}
                    </Badge>
                  </div>
                  {scan.status === 'running' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Square}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStopScan(scan.scan_id);
                      }}
                    >
                      Stop
                    </Button>
                  )}
                </div>
                
                <ProgressBar progress={progress} status={scan.status} />
                
                <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                  Target: {scan.target || 'N/A'}
                </div>
                <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                  {scan.scan_type || 'N/A'} • Started: {scan.start_time ? new Date(scan.start_time).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: theme.spacing.xl,
          color: theme.colors.text.muted
        }}>
          <Activity size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
          <p>No active {currentTool.toUpperCase()} scans</p>
          <p style={{ fontSize: '13px' }}>Execute a scan to monitor real-time activity</p>
        </div>
      )}
    </Card>
  );
};

// Terminal
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

// Historique des scans
const ScanHistory = ({ scans, onRefresh }) => {
  // ✅ Fonction sécurisée pour les scans - CORRECTION CRITIQUE
  const getSafeScans = () => {
    return Array.isArray(scans) ? scans : [];
  };

  const safeScans = getSafeScans();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <FileText size={20} color={theme.colors.status.success} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Scan History ({safeScans.length})
          </h2>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {safeScans.length > 0 ? (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {safeScans.map((scan, index) => (
            <div
              key={scan.scan_id || index}
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
                      {scan.tool ? scan.tool.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <Badge variant={
                      scan.status === 'completed' ? 'success' :
                      scan.status === 'error' ? 'error' : 'default'
                    }>
                      {scan.status || 'unknown'}
                    </Badge>
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                    Target: {scan.target || 'N/A'}
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                    {scan.scan_type || 'N/A'} • {scan.duration || 'N/A'} • {scan.start_time ? new Date(scan.start_time).toLocaleString() : 'N/A'}
                  </div>
                  {scan.error && (
                    <div style={{ color: theme.colors.status.error, fontSize: '12px', marginTop: theme.spacing.xs }}>
                      Error: {scan.error}
                    </div>
                  )}
                </div>
                {scan.report_filename && (
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => window.open(`${API_BASE}/reports/download/${scan.report_filename}`, '_blank')}
                    >
                      TXT
                    </Button>
                    {scan.pdf_filename && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={Download}
                        onClick={() => window.open(`${API_BASE}/reports/download/${scan.pdf_filename}`, '_blank')}
                      >
                        PDF
                      </Button>
                    )}
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
          <p>No scan history</p>
          <p style={{ fontSize: '13px' }}>Completed scans will appear here</p>
        </div>
      )}
    </Card>
  );
};

// Composant principal - INTERFACE PROFESSIONNELLE CORRIGÉE
const ProfessionalPentestInterface = () => {
  const [activeTab, setActiveTab] = useState('reconnaissance');
  const [activeScans, setActiveScans] = useState([]); // ✅ Initialisation sécurisée
  const [scanHistory, setScanHistory] = useState([]); // ✅ Initialisation sécurisée
  const [toolsStatus, setToolsStatus] = useState({});
  const [selectedScan, setSelectedScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fonction sécurisée pour l'historique - CORRECTION CRITIQUE
  const getSafeScanHistory = () => {
    return Array.isArray(scanHistory) ? scanHistory : [];
  };

  // ✅ Fonction sécurisée pour les scans actifs - CORRECTION CRITIQUE
  const getSafeActiveScans = () => {
    return Array.isArray(activeScans) ? activeScans : [];
  };

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialiser les statuts des outils
        setToolsStatus({
          nmap: true,
          nikto: true,
          masscan: true,
          dirb: true,
          gobuster: true,
          sqlmap: true
        });

        // Charger l'historique avec vérification sécurisée
        const historyRes = await fetch(`${API_BASE}/scan/history`);
        if (historyRes.ok) {
          const history = await historyRes.json();
          if (Array.isArray(history)) {
            setScanHistory(history);
            console.log('✅ History loaded:', history.length, 'scans');
          } else {
            console.warn('⚠️ History is not an array:', history);
            setScanHistory([]);
          }
        } else {
          console.warn('⚠️ Failed to load history');
          setScanHistory([]);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setScanHistory([]);
        setToolsStatus({
          nmap: true,
          nikto: true,
          masscan: true,
          dirb: true,
          gobuster: true,
          sqlmap: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Polling des scans actifs avec vérification sécurisée
  useEffect(() => {
    const fetchActiveScans = async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/active`);
        if (response.ok) {
          const scans = await response.json();
          if (Array.isArray(scans)) {
            setActiveScans(scans);
            
            // Sélectionner automatiquement un scan actif
            if (scans.length > 0 && !selectedScan) {
              const runningScan = scans.find(s => s.status === 'running');
              if (runningScan) {
                setSelectedScan(runningScan.scan_id);
              }
            }
            
            // Désélectionner si le scan n'existe plus
            if (selectedScan && !scans.find(s => s.scan_id === selectedScan)) {
              setSelectedScan(null);
            }
          } else {
            console.warn('⚠️ Active scans is not an array:', scans);
            setActiveScans([]);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching active scans:', error);
        setActiveScans([]);
      }
    };

    fetchActiveScans();
    const interval = setInterval(fetchActiveScans, 2000);
    return () => clearInterval(interval);
  }, [selectedScan]);

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

  // Fonction pour arrêter un scan
  const handleStopScan = async (scanId) => {
    try {
      console.log('🛑 Stopping scan:', scanId);
      
      const response = await fetch(`${API_BASE}/scan/stop/${scanId}`, { 
        method: 'POST' 
      });
      
      if (response.ok) {
        console.log('✅ Scan stopped successfully');
        // Rafraîchir l'historique après arrêt
        handleRefreshHistory();
      }
    } catch (error) {
      console.error('❌ Error stopping scan:', error);
    }
  };

  // Fonction pour rafraîchir l'historique
  const handleRefreshHistory = async () => {
    try {
      console.log('🔄 Refreshing history...');
      
      const response = await fetch(`${API_BASE}/scan/history`);
      if (response.ok) {
        const history = await response.json();
        if (Array.isArray(history)) {
          setScanHistory(history);
          console.log('✅ History refreshed:', history.length, 'scans');
        } else {
          console.warn('⚠️ Refresh: History is not an array:', history);
          setScanHistory([]);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing history:', error);
      setScanHistory([]);
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <ActiveScansPanel
                  activeScans={activeScans}
                  onStopScan={handleStopScan}
                  onSelectScan={setSelectedScan}
                  selectedScan={selectedScan}
                  currentTool="nmap"
                />
                <ScanHistory
                  scans={getSafeScanHistory().filter(s => s.tool === 'nmap')}
                  onRefresh={handleRefreshHistory}
                />
              </div>
              
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
                
                <div style={{
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.bg.primary,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.status.success}33`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontSize: '14px', marginBottom: theme.spacing.xs }}>
                    <strong>Web Vulnerability Assessment</strong>
                  </div>
                  <div style={{ color: theme.colors.text.muted, fontSize: '13px' }}>
                    • Comprehensive web application security testing<br/>
                    • Detection of common vulnerabilities (XSS, SQLi, etc.)<br/>
                    • Server configuration issues and outdated software
                  </div>
                </div>
              </Card>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                <ActiveScansPanel
                  activeScans={activeScans}
                  onStopScan={handleStopScan}
                  onSelectScan={setSelectedScan}
                  selectedScan={selectedScan}
                  currentTool="nikto"
                />
                <ScanHistory
                  scans={getSafeScanHistory().filter(s => s.tool === 'nikto')}
                  onRefresh={handleRefreshHistory}
                />
              </div>
              
              <TerminalView
                scanId={selectedScan}
                isActive={!!selectedScan}
                title="Web Vulnerability Scanner"
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
                      {getSafeScanHistory().filter(s => s.status === 'completed').length}
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
                      {getSafeActiveScans().length}
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
                      {getSafeScanHistory().filter(s => s.report_filename).length}
                    </div>
                    <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>Available Reports</div>
                  </div>
                </div>
              </Card>
              
              <ScanHistory
                scans={getSafeScanHistory()}
                onRefresh={handleRefreshHistory}
              />
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
                    Platform Status
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>API Status</span>
                      <Badge variant="success">Operational</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Active Scans</span>
                      <Badge variant="info">{getSafeActiveScans().length}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Total Scans</span>
                      <Badge variant="default">{getSafeScanHistory().length}</Badge>
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