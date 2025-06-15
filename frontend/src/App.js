import React, { useState, useEffect, useRef } from 'react';

// Configuration API
const API_BASE = 'http://localhost:5000/api';

// ================================
// ICÔNES SVG COMPLÈTES
// ================================

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
    <path d="m12 1 2.09 6.26L22 12l-7.91 4.74L12 23l-2.09-6.26L2 12l7.91-4.74L12 1Z"></path>
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

const Zap = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
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

const RefreshCw = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="23,4 23,10 17,10"></polyline>
    <polyline points="1,20 1,14 7,14"></polyline>
    <path d="m23 10a8.5 8.5 0 0 0-14.5-6"></path>
    <path d="m1 14a8.5 8.5 0 0 0 14.5 6"></path>
  </svg>
);

const Download = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Play = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="5,3 19,12 5,21 5,3"></polygon>
  </svg>
);

const X = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Plus = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Eye = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// ================================
// THÈME PROFESSIONNEL
// ================================

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

// ================================
// COMPOSANTS UI RÉUTILISABLES
// ================================

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.tertiary}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...style
  }}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, disabled = false, onClick, type = 'button', fullWidth = false }) => {
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
        justifyContent: 'center',
        gap: theme.spacing.sm,
        fontWeight: '500',
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto'
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

const Input = ({ type = 'text', placeholder, value, onChange, style = {} }) => (
  <input
    type={type}
    placeholder={placeholder}
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
      outline: 'none'
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

// ================================
// HEADER PROFESSIONNEL
// ================================

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

// ================================
// COMPOSANT TERMINAL INTERACTIF
// ================================

const InteractiveTerminal = ({ sessionId, session, onClose }) => {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    // Messages d'accueil
    setOutput([
      `🖥️ Session #${sessionId} shell opened`,
      `📍 Target: ${session?.target || 'Unknown'}`,
      `💻 Type: ${session?.type || 'meterpreter'}`,
      `🐧 Platform: ${session?.platform || 'linux'}`,
      ``,
      `💡 Tapez 'help' pour voir les commandes disponibles`,
      `💡 Tapez 'exit' pour fermer le shell`,
      `💡 Utilisez ↑/↓ pour naviguer dans l'historique`,
      ``
    ]);
  }, [sessionId, session]);

  useEffect(() => {
    // Auto-scroll vers le bas
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = async () => {
    if (!input.trim() || isExecuting) return;
    
    const command = input.trim();
    setOutput(prev => [...prev, `${getPrompt()}${command}`]);
    
    // Ajouter à l'historique
    if (command !== 'exit' && command !== '') {
      setHistory(prev => [...prev, command]);
      setHistoryIndex(-1);
    }
    
    // Commandes locales
    if (command === 'exit') {
      onClose();
      return;
    }
    
    if (command === 'clear') {
      setOutput([]);
      setInput('');
      return;
    }
    
    if (command === 'help') {
      setOutput(prev => [...prev,
        `🔧 Commandes disponibles:`,
        ``,
        `📁 Système:`,
        `  pwd           - Répertoire courant`,
        `  ls / dir      - Lister fichiers`,
        `  cd <dir>      - Changer répertoire`,
        `  cat <file>    - Lire fichier`,
        `  whoami        - Utilisateur courant`,
        `  id            - Informations utilisateur`,
        `  ps            - Processus en cours`,
        `  netstat -an   - Connexions réseau`,
        ``,
        `🔍 Reconnaissance:`,
        `  uname -a      - Informations système`,
        `  cat /etc/passwd   - Liste utilisateurs`,
        `  find / -perm -4000 2>/dev/null  - Binaires SUID`,
        ``,
        `🌐 Réseau:`,
        `  ifconfig      - Configuration réseau`,
        `  arp -a        - Table ARP`,
        `  route -n      - Table routage`,
        ``,
        `🔧 Utilitaires:`,
        `  clear         - Effacer console`,
        `  exit          - Fermer shell`,
        `  help          - Cette aide`,
        ``
      ]);
      setInput('');
      return;
    }
    
    setIsExecuting(true);
    
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command })
      });
      
      if (response.ok) {
        const result = await response.json();
        const commandOutput = result.output || `Commande '${command}' exécutée`;
        
        // Ajouter l'output ligne par ligne pour un meilleur affichage
        const lines = commandOutput.split('\n');
        setOutput(prev => [...prev, ...lines]);
      } else {
        setOutput(prev => [...prev, `❌ Erreur: Impossible d'exécuter la commande`]);
      }
    } catch (error) {
      setOutput(prev => [...prev, `❌ Erreur de connexion: ${error.message}`]);
    }
    
    setIsExecuting(false);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getPrompt = () => {
    const user = session?.type === 'meterpreter' ? 'meterpreter' : 'distccd';
    const host = 'metasploitable';
    return `${user}@${host}:~$ `;
  };

  const quickCommands = [
    { cmd: 'whoami', desc: '👤 Utilisateur' },
    { cmd: 'pwd', desc: '📁 Répertoire' },
    { cmd: 'ls -la', desc: '📋 Fichiers' },
    { cmd: 'ps aux', desc: '⚡ Processus' },
    { cmd: 'netstat -an', desc: '🌐 Réseau' },
    { cmd: 'uname -a', desc: '💻 Système' },
    { cmd: 'cat /etc/passwd', desc: '👥 Utilisateurs' },
    { cmd: 'ifconfig', desc: '🔌 Interfaces' }
  ];

  return (
    <Card style={{ marginTop: theme.spacing.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Terminal size={20} color={theme.colors.status.info} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            💻 Shell Interactif - Session #{sessionId}
          </h2>
          {isExecuting && (
            <Badge variant="warning">Executing...</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>
          Fermer
        </Button>
      </div>

      {/* Terminal */}
      <div
        ref={outputRef}
        style={{
          backgroundColor: '#000000',
          border: `1px solid ${theme.colors.bg.accent}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          minHeight: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4'
        }}
      >
        {/* Output */}
        <div style={{ marginBottom: theme.spacing.md }}>
          {output.map((line, index) => (
            <div key={index} style={{ 
              color: line.includes('$') && (line.includes('@') || line.includes(':')) ? '#22c55e' : 
                    line.startsWith('❌') ? '#dc2626' : 
                    line.includes('🖥️') || line.includes('📍') || line.includes('💻') || line.includes('🐧') ? '#3b82f6' :
                    line.includes('💡') ? '#eab308' :
                    line.includes('🔧') || line.includes('📁') || line.includes('🔍') || line.includes('🌐') ? '#8b5cf6' :
                    '#e5e5e5',
              marginBottom: '2px',
              whiteSpace: 'pre-wrap'
            }}>
              {line}
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
            {getPrompt()}
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre commande..."
            disabled={isExecuting}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e5e5',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '13px'
            }}
            autoFocus
          />
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: theme.spacing.sm, 
        marginTop: theme.spacing.md
      }}>
        {quickCommands.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              setInput(action.cmd);
              setTimeout(() => executeCommand(), 100);
            }}
            disabled={isExecuting}
            style={{
              backgroundColor: theme.colors.bg.tertiary,
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.bg.accent}`,
              borderRadius: theme.borderRadius.sm,
              padding: '6px 8px',
              fontSize: '11px',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              opacity: isExecuting ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {action.desc}
          </button>
        ))}
      </div>
    </Card>
  );
};

// ================================
// COMPOSANT EXPLOIT METASPLOIT
// ================================

const ExploitLauncher = ({ onExploitLaunched }) => {
  const [selectedExploit, setSelectedExploit] = useState('');
  const [target, setTarget] = useState('192.168.1.10');
  const [port, setPort] = useState('445');
  const [payload, setPayload] = useState('');
  const [lhost, setLhost] = useState('192.168.1.5');
  const [lport, setLport] = useState('4444');
  const [isLaunching, setIsLaunching] = useState(false);

  const exploits = [
    {
      name: 'samba_usermap_script',
      module: 'exploit/multi/samba/usermap_script',
      description: 'Samba "username map script" Command Execution',
      defaultPort: 139,
      payloads: ['cmd/unix/reverse', 'cmd/unix/reverse_netcat', 'cmd/unix/bind_netcat']
    },
    {
      name: 'vsftpd_234_backdoor',
      module: 'exploit/unix/ftp/vsftpd_234_backdoor',
      description: 'VSFTPD v2.3.4 Backdoor Command Execution',
      defaultPort: 21,
      payloads: ['cmd/unix/interact', 'cmd/unix/reverse', 'cmd/unix/reverse_netcat']
    },
    {
      name: 'unreal_ircd_3281_backdoor',
      module: 'exploit/unix/irc/unreal_ircd_3281_backdoor',
      description: 'UnrealIRCd 3.2.8.1 Backdoor Command Execution',
      defaultPort: 6667,
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat']
    },
    {
      name: 'distcc_exec',
      module: 'exploit/unix/misc/distcc_exec',
      description: 'DistCC Daemon Command Execution',
      defaultPort: 3632,
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat']
    }
  ];

  const selectedExploitData = exploits.find(e => e.module === selectedExploit);

  useEffect(() => {
    if (selectedExploitData) {
      setPort(selectedExploitData.defaultPort.toString());
      setPayload(selectedExploitData.payloads[0]);
    }
  }, [selectedExploit, selectedExploitData]);

  const launchExploit = async () => {
    if (!selectedExploit || !target || !payload) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setIsLaunching(true);

    try {
      const response = await fetch(`${API_BASE}/metasploit/exploit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: selectedExploit,
          target: target,
          port: port,
          payload: payload,
          lhost: lhost,
          lport: lport
        })
      });

      if (response.ok) {
        const result = await response.json();
        onExploitLaunched && onExploitLaunched(result);
        
        // Reset form
        setSelectedExploit('');
        setTarget('192.168.1.10');
        setPort('445');
        setPayload('');
        setLhost('192.168.1.5');
        setLport('4444');
      } else {
        alert('Erreur lors du lancement de l\'exploit');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }

    setIsLaunching(false);
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Zap size={20} color={theme.colors.status.warning} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Lancer un Exploit
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: theme.spacing.sm, 
            color: theme.colors.text.secondary,
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Module d'Exploit
          </label>
          <Select
            options={exploits.map(e => ({ value: e.module, label: e.name }))}
            value={selectedExploit}
            onChange={(e) => setSelectedExploit(e.target.value)}
            placeholder="Sélectionnez un exploit"
          />
          {selectedExploitData && (
            <div style={{ marginTop: theme.spacing.sm, fontSize: '12px', color: theme.colors.text.muted }}>
              {selectedExploitData.description}
            </div>
          )}
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: theme.spacing.sm, 
            color: theme.colors.text.secondary,
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Target IP
          </label>
          <Input
            type="text"
            placeholder="192.168.1.10"
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
            Port
          </label>
          <Input
            type="text"
            placeholder="445"
            value={port}
            onChange={(e) => setPort(e.target.value)}
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
            Payload
          </label>
          <Select
            options={selectedExploitData ? selectedExploitData.payloads.map(p => ({ value: p, label: p })) : []}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Sélectionnez un payload"
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
            LHOST (Listener IP)
          </label>
          <Input
            type="text"
            placeholder="192.168.1.5"
            value={lhost}
            onChange={(e) => setLhost(e.target.value)}
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
            LPORT (Listener Port)
          </label>
          <Input
            type="text"
            placeholder="4444"
            value={lport}
            onChange={(e) => setLport(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: theme.spacing.lg }}>
        <Button 
          variant="danger" 
          icon={Play}
          onClick={launchExploit}
          disabled={!selectedExploit || !target || !payload || isLaunching}
          fullWidth
        >
          {isLaunching ? 'Lancement en cours...' : 'Lancer l\'Exploit'}
        </Button>
      </div>
    </Card>
  );
};

// ================================
// COMPOSANT SESSION MANAGER
// ================================

const SessionManager = ({ sessions, onSessionUpdate, onOpenShell }) => {
  const [refreshing, setRefreshing] = useState(false);

  const refreshSessions = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions`);
      if (response.ok) {
        const data = await response.json();
        onSessionUpdate(data);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des sessions:', error);
    }
    setRefreshing(false);
  };

  const killSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await refreshSessions();
      } else {
        alert('Erreur lors de la fermeture de la session');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const getSessionInfo = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions/${sessionId}/info`);
      if (response.ok) {
        const data = await response.json();
        alert(`Session Info:\nTarget: ${data.target}\nType: ${data.type}\nPlatform: ${data.platform}\nHostname: ${data.host_info?.hostname || 'Unknown'}\nOS: ${data.host_info?.os || 'Unknown'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Crosshairs size={20} color={theme.colors.status.info} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Sessions Actives ({sessions.length})
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          icon={RefreshCw}
          onClick={refreshSessions}
          disabled={refreshing}
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: theme.spacing.xl, 
          color: theme.colors.text.muted,
          backgroundColor: theme.colors.bg.tertiary,
          borderRadius: theme.borderRadius.md,
          border: `2px dashed ${theme.colors.bg.accent}`
        }}>
          <Target size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Aucune session active</p>
          <p style={{ margin: `${theme.spacing.sm} 0 0 0`, fontSize: '14px' }}>
            Lancez un exploit pour créer une session
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {sessions.map(session => (
            <div 
              key={session.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: theme.colors.bg.tertiary,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.bg.accent}`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                  <Badge variant="info">#{session.id}</Badge>
                  <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '16px' }}>
                    {session.target}
                  </span>
                  <Badge variant={session.status === 'active' ? 'success' : 'warning'}>
                    {session.status}
                  </Badge>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg, fontSize: '13px', color: theme.colors.text.muted }}>
                  <span>💻 {session.type}</span>
                  <span>🐧 {session.platform}</span>
                  <span>📅 {new Date(session.opened_at).toLocaleString()}</span>
                  {session.exploit_used && (
                    <span>🎯 {session.exploit_used.split('/').pop()}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={Eye}
                  onClick={() => getSessionInfo(session.id)}
                >
                  Info
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  icon={Terminal}
                  onClick={() => onOpenShell(session.id)}
                >
                  Shell
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  icon={X}
                  onClick={() => killSession(session.id)}
                >
                  Kill
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// ================================
// COMPOSANT EXPLOIT OUTPUT
// ================================

const ExploitOutput = ({ exploitId, onClose }) => {
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const outputRef = useRef(null);

  useEffect(() => {
    const fetchOutput = async () => {
      try {
        const response = await fetch(`${API_BASE}/metasploit/exploit/${exploitId}/output`);
        if (response.ok) {
          const data = await response.json();
          setOutput(data.output || []);
          setIsRunning(data.is_running || false);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'output:', error);
      }
    };

    fetchOutput();
    
    // Poll pour les mises à jour en temps réel
    const interval = setInterval(fetchOutput, 2000);
    
    return () => clearInterval(interval);
  }, [exploitId]);

  useEffect(() => {
    // Auto-scroll vers le bas
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <Card style={{ marginTop: theme.spacing.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Zap size={20} color={theme.colors.status.warning} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Exploit Output - {exploitId}
          </h2>
          {isRunning && (
            <Badge variant="warning">Running...</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>
          Fermer
        </Button>
      </div>

      <div
        ref={outputRef}
        style={{
          backgroundColor: '#000000',
          border: `1px solid ${theme.colors.bg.accent}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          minHeight: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4'
        }}
      >
        {output.length === 0 ? (
          <div style={{ color: theme.colors.text.muted, fontStyle: 'italic' }}>
            En attente de l'output de l'exploit...
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} style={{ 
              color: line.includes('[*]') ? '#3b82f6' :
                    line.includes('[+]') ? '#22c55e' :
                    line.includes('[-]') || line.includes('[!]') ? '#dc2626' :
                    line.includes('[DEBUG]') ? '#8b5cf6' :
                    '#e5e5e5',
              marginBottom: '2px',
              whiteSpace: 'pre-wrap'
            }}>
              {line}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

// ================================
// ONGLET METASPLOIT PRINCIPAL
// ================================

const MetasploitTab = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [shellVisible, setShellVisible] = useState(false);
  const [exploitOutput, setExploitOutput] = useState(null);
  const [exploitOutputVisible, setExploitOutputVisible] = useState(false);

  useEffect(() => {
    // Charger les sessions au démarrage
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      setSessions([]);
    }
  };

  const handleExploitLaunched = (result) => {
    if (result.exploit_id) {
      setExploitOutput(result.exploit_id);
      setExploitOutputVisible(true);
      
      // Rafraîchir les sessions après quelques secondes
      setTimeout(() => {
        fetchSessions();
      }, 5000);
    }
  };

  const handleOpenShell = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    setSelectedSession(session);
    setShellVisible(true);
  };

  const handleCloseShell = () => {
    setShellVisible(false);
    setSelectedSession(null);
  };

  const handleCloseExploitOutput = () => {
    setExploitOutputVisible(false);
    setExploitOutput(null);
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        
        {/* Exploit Launcher */}
        <ExploitLauncher onExploitLaunched={handleExploitLaunched} />
        
        {/* Session Manager */}
        <SessionManager 
          sessions={sessions} 
          onSessionUpdate={setSessions}
          onOpenShell={handleOpenShell}
        />
        
        {/* Exploit Output */}
        {exploitOutputVisible && exploitOutput && (
          <ExploitOutput 
            exploitId={exploitOutput}
            onClose={handleCloseExploitOutput}
          />
        )}
        
        {/* Interactive Terminal */}
        {shellVisible && selectedSession && (
          <InteractiveTerminal
            sessionId={selectedSession.id}
            session={selectedSession}
            onClose={handleCloseShell}
          />
        )}
      </div>
    </div>
  );
};

// ================================
// NAVIGATION TABS
// ================================

const NavigationTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'reconnaissance', label: 'Reconnaissance', icon: Target },
    { id: 'scanning', label: 'Vulnerability Scanning', icon: Activity },
    { id: 'metasploit', label: 'Metasploit', icon: Crosshairs },
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

// ================================
// AUTRES ONGLETS (SIMPLIFIÉS)
// ================================
// Formulaire de scan
const ScanForm = ({ toolsStatus, onScanStart }) => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);

  // RECONNAISSANCE = NMAP UNIQUEMENT
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
  // Filtrer les scans par outil actuel
  const filteredScans = activeScans.filter(scan => scan.tool === currentTool);
  
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
                      {scan.tool.toUpperCase()}
                    </span>
                    <Badge variant={scan.status === 'running' ? 'warning' : scan.status === 'completed' ? 'success' : 'error'}>
                      {scan.status}
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
                  Target: {scan.target}
                </div>
                <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                  {scan.scan_type} • Started: {new Date(scan.start_time).toLocaleTimeString()}
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

  useEffect(() => {
    if (!isActive || !scanId) return;

    setIsConnected(true);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/live/${scanId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.new_lines && data.new_lines.length > 0) {
            setOutput(prev => [...prev, ...data.new_lines]);
          }
          if (!data.is_running) {
            setIsConnected(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        setIsConnected(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
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
const ScanHistory = ({ scans, onRefresh }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <FileText size={20} color={theme.colors.status.success} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Scan History
        </h2>
      </div>
      <Button variant="ghost" icon={RefreshCw} onClick={onRefresh}>
        Refresh
      </Button>
    </div>

    {scans.length > 0 ? (
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {scans.map(scan => (
          <div
            key={scan.scan_id}
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
                    {scan.tool.toUpperCase()}
                  </span>
                  <Badge variant={
                    scan.status === 'completed' ? 'success' :
                    scan.status === 'error' ? 'error' : 'default'
                  }>
                    {scan.status}
                  </Badge>
                </div>
                <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: theme.spacing.xs }}>
                  Target: {scan.target}
                </div>
                <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                  {scan.scan_type} • {scan.duration || 'N/A'} • {new Date(scan.start_time).toLocaleString()}
                </div>
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

// Composant principal
const ProfessionalPentestInterface = () => {
  const [activeTab, setActiveTab] = useState('reconnaissance');
  const [activeScans, setActiveScans] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [toolsStatus, setToolsStatus] = useState({});
  const [selectedScan, setSelectedScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setToolsStatus({
          nmap: true,
          nikto: true,
          masscan: true,
          dirb: true,
          gobuster: true,
          sqlmap: true
        });

        const historyRes = await fetch(`${API_BASE}/scan/history`);
        if (historyRes.ok) {
          const history = await historyRes.json();
          setScanHistory(history);
        }
      } catch (error) {
        console.error('Error loading data:', error);
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

  // Polling des scans actifs
  useEffect(() => {
    const fetchActiveScans = async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/active`);
        if (response.ok) {
          const scans = await response.json();
          setActiveScans(scans);
          
          if (scans.length > 0 && !selectedScan) {
            setSelectedScan(scans[0].scan_id);
          }
          
          if (selectedScan && !scans.find(s => s.scan_id === selectedScan)) {
            setSelectedScan(null);
          }
        }
      } catch (error) {
        console.error('Error fetching active scans:', error);
      }
    };

    fetchActiveScans();
    const interval = setInterval(fetchActiveScans, 2000);
    return () => clearInterval(interval);
  }, [selectedScan]);

  const handleScanStart = async (formData) => {
    try {
      const response = await fetch(`${API_BASE}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Scan start failed');
      }

      const result = await response.json();
      if (result.scan_id) {
        setSelectedScan(result.scan_id);
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleStopScan = async (scanId) => {
    try {
      await fetch(`${API_BASE}/scan/stop/${scanId}`, { method: 'POST' });
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const handleRefreshHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/scan/history`);
      if (response.ok) {
        const history = await response.json();
        setScanHistory(history);
      }
    } catch (error) {
      console.error('Error refreshing history:', error);
    }
  };

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
      <PentestHeader />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: theme.spacing.lg }}>
        <div style={{ display: 'grid', gap: theme.spacing.lg }}>
          
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
                  scans={scanHistory.filter(s => s.tool === 'nmap')}
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
                  if (target) {
                    handleScanStart({ tool: 'nikto', target, scanType: 'comprehensive' });
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
                        <option value="fast">Fast Scan</option>
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
                  scans={scanHistory.filter(s => s.tool === 'nikto')}
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
                      {scanHistory.filter(s => s.report_filename).length}
                    </div>
                    <div style={{ color: theme.colors.text.muted, fontSize: '12px' }}>Available Reports</div>
                  </div>
                </div>
              </Card>
              
              <ScanHistory
                scans={scanHistory}
                onRefresh={handleRefreshHistory}
              />
            </>
          )}

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
                      <Badge variant="info">{activeScans.length}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.text.secondary }}>Total Scans</span>
                      <Badge variant="default">{scanHistory.length}</Badge>
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

// ================================
// COMPOSANT PRINCIPAL
// ================================

const EnhancedMetasploitInterface = () => {
  const [activeTab, setActiveTab] = useState('metasploit');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reconnaissance':
        return <ReconnaissanceTab />;
      case 'scanning':
        return <ScanningTab />;
      case 'metasploit':
        return <MetasploitTab />;
      case 'sniffing':
        return <SniffingTab />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <MetasploitTab />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.bg.primary,
      color: theme.colors.text.primary
    }}>
      <PentestHeader />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: theme.spacing.lg }}>
        {renderTabContent()}
      </main>
    </div>
  );
};

export default EnhancedMetasploitInterface;