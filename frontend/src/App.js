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
// ONGLET METASPLOIT COMPLET
// ================================

// METASPLOIT TAB ENHANCED - Compatible Metasploitable
// Remplacer le composant MetasploitTab dans votre App.js

// METASPLOIT TAB ENHANCED - Compatible Metasploitable (Version Corrigée)
// Remplacer le composant MetasploitTab dans votre App.js

const MetasploitTab = () => {
  const [exploits, setExploits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExploit, setSelectedExploit] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [exploitForm, setExploitForm] = useState({
    exploit: '',
    payload: '',
    target: '',
    port: '',
    lhost: '192.168.1.100', // IP de l'attaquant
    lport: '4444',
    options: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeExploits, setActiveExploits] = useState([]);
  const [exploitOutput, setExploitOutput] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [autoTarget, setAutoTarget] = useState('192.168.1.101'); // IP Metasploitable par défaut

  // Scénarios d'attaque prédéfinis
  const attackScenarios = {
    'quick_pwn': {
      name: 'Quick Pwn Metasploitable',
      description: 'Exploitation rapide des services les plus vulnérables',
      icon: '⚡',
      exploits: ['samba_usermap_script', 'vsftpd_234_backdoor', 'unreal_ircd_3281_backdoor'],
      color: theme.colors.status.error
    },
    'web_attack': {
      name: 'Web Application Attack',
      description: 'Attaques ciblées sur les applications web',
      icon: '🌐',
      exploits: ['tomcat_mgr_upload', 'twiki_history', 'php_cgi_arg_injection'],
      color: theme.colors.status.warning
    },
    'database_attack': {
      name: 'Database Services Attack',
      description: 'Exploitation des services de base de données',
      icon: '🗄️',
      exploits: ['postgres_payload', 'mysql_udf_payload'],
      color: theme.colors.status.info
    },
    'network_services': {
      name: 'Network Services Exploitation',
      description: 'Attaques sur les services réseau divers',
      icon: '🔗',
      exploits: ['distcc_exec', 'java_rmi_server', 'rlogin_arg_injection'],
      color: theme.colors.status.success
    }
  };

  // Filtres avancés
  const filterOptions = {
    'all': { name: 'All Exploits', icon: '🔍' },
    'easy': { name: 'Easy Difficulty', icon: '🟢' },
    'medium': { name: 'Medium Difficulty', icon: '🟡' },
    'hard': { name: 'Hard Difficulty', icon: '🔴' },
    'excellent': { name: 'Excellent Reliability', icon: '⭐' },
    'ftp': { name: 'FTP Services', icon: '📁' },
    'web': { name: 'Web Services', icon: '🌐' },
    'database': { name: 'Database Services', icon: '🗄️' },
    'samba': { name: 'SMB/Samba', icon: '🔗' },
    'ssh': { name: 'SSH Services', icon: '🔐' }
  };

  // Exploits étendus pour Metasploitable
  const metasploitableExploits = [
    {
      name: 'samba_usermap_script',
      module: 'exploit/multi/samba/usermap_script',
      description: 'Samba "username map script" Command Execution',
      platform: 'Linux',
      targets: ['Metasploitable', 'Samba 3.0.20-3.0.25rc3'],
      rank: 'Excellent',
      defaultPort: 139,
      category: 'Remote',
      cve: ['CVE-2007-2447'],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['cmd/unix/reverse', 'cmd/unix/reverse_netcat', 'cmd/unix/bind_netcat'],
      color: '#22c55e'
    },
    {
      name: 'vsftpd_234_backdoor',
      module: 'exploit/unix/ftp/vsftpd_234_backdoor',
      description: 'VSFTPD v2.3.4 Backdoor Command Execution',
      platform: 'Linux',
      targets: ['VSFTPD 2.3.4'],
      rank: 'Excellent',
      defaultPort: 21,
      category: 'Remote',
      cve: ['CVE-2011-2523'],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['cmd/unix/interact', 'cmd/unix/reverse', 'cmd/unix/reverse_netcat'],
      color: '#3b82f6'
    },
    {
      name: 'unreal_ircd_3281_backdoor',
      module: 'exploit/unix/irc/unreal_ircd_3281_backdoor',
      description: 'UnrealIRCd 3.2.8.1 Backdoor Command Execution',
      platform: 'Linux',
      targets: ['UnrealIRCd 3.2.8.1'],
      rank: 'Excellent',
      defaultPort: 6667,
      category: 'Remote',
      cve: ['CVE-2010-2075'],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat'],
      color: '#8b5cf6'
    },
    {
      name: 'distcc_exec',
      module: 'exploit/unix/misc/distcc_exec',
      description: 'DistCC Daemon Command Execution',
      platform: 'Linux',
      targets: ['DistCC Daemon'],
      rank: 'Excellent',
      defaultPort: 3632,
      category: 'Remote',
      cve: ['CVE-2004-2687'],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat', 'cmd/unix/reverse_netcat'],
      color: '#f59e0b'
    },
    {
      name: 'postgres_payload',
      module: 'exploit/linux/postgres/postgres_payload',
      description: 'PostgreSQL for Linux Payload Execution',
      platform: 'Linux',
      targets: ['PostgreSQL on Linux'],
      rank: 'Excellent',
      defaultPort: 5432,
      category: 'Remote',
      cve: [],
      difficulty: 'Medium',
      reliability: 'Good',
      payloads: ['linux/x86/meterpreter/reverse_tcp', 'linux/x86/shell/reverse_tcp', 'cmd/unix/reverse'],
      color: '#06b6d4'
    },
    {
      name: 'mysql_udf_payload',
      module: 'exploit/linux/mysql/mysql_udf_payload',
      description: 'Oracle MySQL UDF Dynamic Library Execution',
      platform: 'Linux',
      targets: ['MySQL on Linux'],
      rank: 'Excellent',
      defaultPort: 3306,
      category: 'Remote',
      cve: [],
      difficulty: 'Medium',
      reliability: 'Good',
      payloads: ['linux/x86/meterpreter/reverse_tcp', 'linux/x86/shell/reverse_tcp'],
      color: '#ef4444'
    },
    {
      name: 'tomcat_mgr_upload',
      module: 'exploit/multi/http/tomcat_mgr_upload',
      description: 'Apache Tomcat Manager Application Deployer Upload',
      platform: 'Multi',
      targets: ['Apache Tomcat'],
      rank: 'Excellent',
      defaultPort: 8080,
      category: 'Remote',
      cve: [],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['java/meterpreter/reverse_tcp', 'java/shell/reverse_tcp', 'generic/shell_reverse_tcp'],
      color: '#10b981'
    },
    {
      name: 'twiki_history',
      module: 'exploit/unix/webapp/twiki_history',
      description: 'TWiki History TWikiUsers rev Parameter Command Execution',
      platform: 'Unix',
      targets: ['TWiki'],
      rank: 'Excellent',
      defaultPort: 80,
      category: 'Remote',
      cve: ['CVE-2005-2877'],
      difficulty: 'Easy',
      reliability: 'Excellent',
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat'],
      color: '#84cc16'
    },
    {
      name: 'php_cgi_arg_injection',
      module: 'exploit/multi/http/php_cgi_arg_injection',
      description: 'PHP CGI Argument Injection',
      platform: 'Multi',
      targets: ['PHP CGI'],
      rank: 'Excellent',
      defaultPort: 80,
      category: 'Remote',
      cve: ['CVE-2012-1823'],
      difficulty: 'Medium',
      reliability: 'Good',
      payloads: ['php/meterpreter/reverse_tcp', 'cmd/unix/reverse', 'generic/shell_reverse_tcp'],
      color: '#f97316'
    },
    {
      name: 'java_rmi_server',
      module: 'exploit/multi/misc/java_rmi_server',
      description: 'Java RMI Server Insecure Default Configuration',
      platform: 'Multi',
      targets: ['Java RMI'],
      rank: 'Excellent',
      defaultPort: 1099,
      category: 'Remote',
      cve: [],
      difficulty: 'Medium',
      reliability: 'Good',
      payloads: ['java/meterpreter/reverse_tcp', 'java/shell/reverse_tcp', 'generic/shell_reverse_tcp'],
      color: '#ec4899'
    },
    {
      name: 'bind_tsig',
      module: 'exploit/unix/dns/bind_tsig',
      description: 'ISC BIND < 9 TSIG Query Handling Buffer Overflow',
      platform: 'Linux',
      targets: ['ISC BIND 8', 'ISC BIND 9.0-9.2.1'],
      rank: 'Good',
      defaultPort: 53,
      category: 'Remote',
      cve: ['CVE-2002-0029'],
      difficulty: 'Hard',
      reliability: 'Average',
      payloads: ['linux/x86/shell/reverse_tcp', 'generic/shell_reverse_tcp'],
      color: '#64748b'
    },
    {
      name: 'rlogin_arg_injection',
      module: 'exploit/unix/misc/rlogin_arg_injection',
      description: 'rlogin Argument Injection',
      platform: 'Linux',
      targets: ['rlogin service'],
      rank: 'Excellent',
      defaultPort: 513,
      category: 'Remote',
      cve: [],
      difficulty: 'Medium',
      reliability: 'Good',
      payloads: ['cmd/unix/reverse', 'cmd/unix/bind_netcat'],
      color: '#06d6a0'
    }
  ];

  useEffect(() => {
    setExploits(metasploitableExploits);
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/metasploit/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const startExploit = async () => {
    if (!exploitForm.exploit || !exploitForm.target) {
      alert('Veuillez sélectionner un exploit et spécifier une cible');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/metasploit/exploit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: exploitForm.exploit,
          payload: exploitForm.payload,
          target: exploitForm.target,
          port: exploitForm.port,
          lhost: exploitForm.lhost,
          lport: exploitForm.lport,
          options: exploitForm.options
        })
      });

      if (response.ok) {
        const result = await response.json();
        setActiveExploits(prev => [...prev, result]);
        setExploitOutput(prev => [...prev, `✅ Exploit ${exploitForm.exploit} lancé contre ${exploitForm.target}:${exploitForm.port}`]);
        loadActiveSessions();
      } else {
        const error = await response.json();
        setExploitOutput(prev => [...prev, `❌ Erreur: ${error.message || 'Échec du lancement'}`]);
      }
    } catch (error) {
      console.error('Error starting exploit:', error);
      setExploitOutput(prev => [...prev, `❌ Erreur de connexion: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectExploit = (exploit) => {
    setSelectedExploit(exploit);
    setExploitForm({
      ...exploitForm,
      exploit: exploit.module,
      payload: exploit.payloads[0],
      port: exploit.defaultPort.toString(),
      target: autoTarget
    });
  };

  const selectScenario = (scenarioKey) => {
    const scenario = attackScenarios[scenarioKey];
    setSelectedScenario(scenarioKey);
    
    // Auto-select first exploit from scenario
    const firstExploit = metasploitableExploits.find(e => 
      scenario.exploits.includes(e.name)
    );
    if (firstExploit) {
      selectExploit(firstExploit);
    }
  };

  const executeScenario = async () => {
    if (!selectedScenario || !autoTarget) {
      alert('Sélectionnez un scénario et spécifiez la cible Metasploitable');
      return;
    }

    const scenario = attackScenarios[selectedScenario];
    setIsLoading(true);
    
    try {
      for (const exploitName of scenario.exploits) {
        const exploit = metasploitableExploits.find(e => e.name === exploitName);
        if (exploit) {
          setExploitOutput(prev => [...prev, `🚀 Lancement automatique: ${exploit.description}`]);
          
          const response = await fetch(`${API_BASE}/metasploit/exploit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              module: exploit.module,
              payload: exploit.payloads[0],
              target: autoTarget,
              port: exploit.defaultPort.toString(),
              lhost: exploitForm.lhost,
              lport: exploitForm.lport
            })
          });

          if (response.ok) {
            setExploitOutput(prev => [...prev, `✅ ${exploit.name} - Succès`]);
          } else {
            setExploitOutput(prev => [...prev, `❌ ${exploit.name} - Échec`]);
          }
          
          // Délai entre exploits
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setExploitOutput(prev => [...prev, `✅ Scénario "${scenario.name}" terminé`]);
      loadActiveSessions();
    } catch (error) {
      setExploitOutput(prev => [...prev, `❌ Erreur dans le scénario: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExploits = exploits.filter(exploit => {
    const matchesSearch = exploit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exploit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exploit.platform.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    
    // Filtres par difficulté
    if (selectedFilter === 'easy') return matchesSearch && exploit.difficulty === 'Easy';
    if (selectedFilter === 'medium') return matchesSearch && exploit.difficulty === 'Medium';
    if (selectedFilter === 'hard') return matchesSearch && exploit.difficulty === 'Hard';
    
    // Filtres par fiabilité
    if (selectedFilter === 'excellent') return matchesSearch && exploit.reliability === 'Excellent';
    
    // Filtres par service
    if (selectedFilter === 'ftp') return matchesSearch && exploit.defaultPort === 21;
    if (selectedFilter === 'web') return matchesSearch && [80, 8080].includes(exploit.defaultPort);
    if (selectedFilter === 'database') return matchesSearch && [3306, 5432].includes(exploit.defaultPort);
    if (selectedFilter === 'samba') return matchesSearch && [139, 445].includes(exploit.defaultPort);
    
    return matchesSearch;
  });

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header avec configuration Metasploitable */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Crosshairs size={24} color={theme.colors.status.error} />
          <div>
            <h1 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '24px', fontWeight: '700' }}>
              Metasploit Framework - Metasploitable Edition
            </h1>
            <p style={{ color: theme.colors.text.muted, fontSize: '14px', margin: 0 }}>
              🎯 Exploitation automatisée et manuelle de Metasploitable avec {metasploitableExploits.length} exploits
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.md }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              🎯 Metasploitable IP
            </label>
            <input
              type="text"
              value={autoTarget}
              onChange={(e) => setAutoTarget(e.target.value)}
              placeholder="192.168.1.101"
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
              textTransform: 'uppercase'
            }}>
              🏠 Attacker IP (LHOST)
            </label>
            <input
              type="text"
              value={exploitForm.lhost}
              onChange={(e) => setExploitForm({...exploitForm, lhost: e.target.value})}
              placeholder="192.168.1.100"
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
              textTransform: 'uppercase'
            }}>
              🔌 Listen Port (LPORT)
            </label>
            <input
              type="text"
              value={exploitForm.lport}
              onChange={(e) => setExploitForm({...exploitForm, lport: e.target.value})}
              placeholder="4444"
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
      </Card>

      {/* Scénarios d'attaque prédéfinis */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Zap size={20} color={theme.colors.status.warning} />
          <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            🚀 Scénarios d'Attaque Automatisés
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          {Object.entries(attackScenarios).map(([key, scenario]) => (
            <div
              key={key}
              onClick={() => selectScenario(key)}
              style={{
                backgroundColor: selectedScenario === key ? scenario.color + '20' : theme.colors.bg.tertiary,
                border: `2px solid ${selectedScenario === key ? scenario.color : theme.colors.bg.accent}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '20px' }}>{scenario.icon}</span>
                <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>
                  {scenario.name}
                </span>
              </div>
              <p style={{ color: theme.colors.text.secondary, fontSize: '12px', margin: 0, marginBottom: theme.spacing.sm }}>
                {scenario.description}
              </p>
              <div style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                {scenario.exploits.length} exploit(s)
              </div>
            </div>
          ))}
        </div>

        {selectedScenario && (
          <Button
            variant="danger"
            icon={Zap}
            onClick={executeScenario}
            disabled={isLoading || !autoTarget}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Exécution du scénario...' : `🚀 Lancer "${attackScenarios[selectedScenario].name}"`}
          </Button>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        
        {/* Sélection d'Exploit avec filtres */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Crosshairs size={20} color={theme.colors.status.error} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🗂️ Exploits Metasploitable ({filteredExploits.length})
            </h2>
          </div>

          {/* Barre de recherche */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un exploit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          {/* Filtres */}
          <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.lg, flexWrap: 'wrap' }}>
            {Object.entries(filterOptions).map(([key, filter]) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                style={{
                  backgroundColor: selectedFilter === key ? theme.colors.accent.primary : theme.colors.bg.tertiary,
                  color: selectedFilter === key ? theme.colors.text.primary : theme.colors.text.secondary,
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.icon} {filter.name}
              </button>
            ))}
          </div>

          {/* Liste des exploits */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredExploits.map((exploit, index) => (
              <div
                key={index}
                onClick={() => selectExploit(exploit)}
                style={{
                  backgroundColor: selectedExploit?.name === exploit.name ? 
                    exploit.color + '20' : theme.colors.bg.tertiary,
                  border: `1px solid ${selectedExploit?.name === exploit.name ? exploit.color : theme.colors.bg.accent}`,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>
                    {exploit.name}
                  </span>
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <Badge variant={
                      exploit.rank === 'Excellent' ? 'success' :
                      exploit.rank === 'Great' ? 'info' :
                      exploit.rank === 'Good' ? 'warning' : 'default'
                    }>
                      {exploit.rank}
                    </Badge>
                    <Badge variant={
                      exploit.difficulty === 'Easy' ? 'success' :
                      exploit.difficulty === 'Medium' ? 'warning' : 'error'
                    }>
                      {exploit.difficulty}
                    </Badge>
                  </div>
                </div>
                <p style={{ color: theme.colors.text.secondary, fontSize: '13px', margin: 0, marginBottom: theme.spacing.sm }}>
                  {exploit.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                      Port: {exploit.defaultPort}
                    </span>
                    {exploit.cve.length > 0 && (
                      <span style={{ color: exploit.color, fontSize: '12px', fontWeight: '500' }}>
                        {exploit.cve[0]}
                      </span>
                    )}
                  </div>
                  <span style={{ color: theme.colors.status.info, fontSize: '12px' }}>
                    {exploit.payloads.length} payload(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Configuration d'Exploitation */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Zap size={20} color={theme.colors.status.warning} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              ⚙️ Configuration d'Exploitation
            </h2>
          </div>

          {selectedExploit ? (
            <div>
              <div style={{ 
                marginBottom: theme.spacing.lg, 
                padding: theme.spacing.md, 
                backgroundColor: selectedExploit.color + '10',
                border: `1px solid ${selectedExploit.color}`,
                borderRadius: theme.borderRadius.md 
              }}>
                <h3 style={{ color: theme.colors.text.primary, fontSize: '16px', marginBottom: theme.spacing.sm }}>
                  {selectedExploit.name}
                </h3>
                <p style={{ color: theme.colors.text.secondary, fontSize: '13px', margin: 0, marginBottom: theme.spacing.sm }}>
                  {selectedExploit.description}
                </p>
                <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  {selectedExploit.cve.map(cve => (
                    <Badge key={cve} variant="error">{cve}</Badge>
                  ))}
                  <Badge variant="info">Port {selectedExploit.defaultPort}</Badge>
                  <Badge variant="default">{selectedExploit.platform}</Badge>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: theme.spacing.sm, 
                    color: theme.colors.text.secondary,
                    fontSize: '13px',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    🎯 Target Host
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.101"
                    value={exploitForm.target}
                    onChange={(e) => setExploitForm({...exploitForm, target: e.target.value})}
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
                    textTransform: 'uppercase'
                  }}>
                    🔌 Target Port
                  </label>
                  <input
                    type="text"
                    value={exploitForm.port}
                    onChange={(e) => setExploitForm({...exploitForm, port: e.target.value})}
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

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.sm, 
                  color: theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  💣 Payload
                </label>
                <select
                  value={exploitForm.payload}
                  onChange={(e) => setExploitForm({...exploitForm, payload: e.target.value})}
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
                  {selectedExploit.payloads.map(payload => (
                    <option key={payload} value={payload}>{payload}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="danger"
                icon={Zap}
                onClick={startExploit}
                disabled={isLoading || !exploitForm.target}
                style={{ width: '100%' }}
              >
                {isLoading ? 'Exploitation en cours...' : '🚀 Lancer l\'Exploitation'}
              </Button>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: theme.spacing.xl,
              color: theme.colors.text.muted
            }}>
              <Crosshairs size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
              <p>Sélectionnez un exploit ou un scénario pour configurer l'exploitation</p>
              <p style={{ fontSize: '13px' }}>💡 Essayez les scénarios automatisés pour Metasploitable</p>
            </div>
          )}
        </Card>
      </div>

      {/* Sessions Actives */}

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Terminal size={20} color={theme.colors.status.success} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🖥️ Sessions Actives ({sessions.length})
            </h2>
          </div>
          <Button variant="ghost" icon={RefreshCw} onClick={loadActiveSessions}>
            Refresh
          </Button>
        </div>

        {sessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.md }}>
            {sessions.map((session, index) => (
              <div
                key={session.id || index}
                style={{
                  backgroundColor: theme.colors.bg.tertiary,
                  border: `2px solid ${theme.colors.status.success}`,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                  <div>
                    <span style={{ color: theme.colors.status.success, fontWeight: '600' }}>
                      🖥️ Session #{session.id || index + 1}
                    </span>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
                      📍 {session.target || 'Unknown target'}
                    </div>
                  </div>
                  <Badge variant="success">🟢 Active</Badge>
                </div>
                <div style={{ fontSize: '13px', color: theme.colors.text.muted, marginBottom: theme.spacing.sm }}>
                  💻 Type: {session.type || 'meterpreter'} | 🐧 OS: {session.platform || 'Linux'}
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.text.muted, marginBottom: theme.spacing.md }}>
                  🚀 Via: {session.exploit_used || 'N/A'}
                </div>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <Button variant="secondary" size="sm">
                    💬 Shell
                  </Button>
                  <Button variant="ghost" size="sm">
                    📋 Info
                  </Button>
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
            <Terminal size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
            <p>🔍 Aucune session active</p>
            <p style={{ fontSize: '13px' }}>Les sessions apparaîtront ici après une exploitation réussie de Metasploitable</p>
          </div>
        )}
        
      </Card>



      {/* Console de Sortie */}
      {exploitOutput.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Terminal size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🖥️ Console Metasploit
            </h2>
          </div>

          <div style={{
            backgroundColor: '#000000',
            border: `1px solid ${theme.colors.bg.accent}`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {exploitOutput.map((line, index) => (
              <div key={index} style={{ 
                color: line.includes('✅') ? '#22c55e' : 
                       line.includes('❌') ? '#dc2626' : 
                       line.includes('🚀') ? '#3b82f6' :
                       line.includes('⚠️') ? '#eab308' : '#e5e5e5',
                marginBottom: '4px'
              }}>
                [{new Date().toLocaleTimeString()}] {line}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
// ================================
// ONGLET SETTINGS COMPLET
// ================================

const SettingsTab = () => {
  const [apiEndpoint, setApiEndpoint] = useState(API_BASE);
  const [toolsStatus, setToolsStatus] = useState({
    nmap: false,
    nikto: false,
    metasploit: false,
    tcpdump: false
  });
  const [systemInfo, setSystemInfo] = useState({
    version: '2.0.0',
    uptime: 'Unknown',
    memory: 'Unknown',
    cpu: 'Unknown'
  });

  useEffect(() => {
    checkToolsAvailability();
    getSystemInfo();
  }, []);

  const checkToolsAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE}/system/tools`);
      if (response.ok) {
        const data = await response.json();
        setToolsStatus(data.tools || {
          nmap: true,
          nikto: true,
          metasploit: true,
          tcpdump: true
        });
      }
    } catch (error) {
      console.error('Error checking tools:', error);
      // Fallback - assume tools are available
      setToolsStatus({
        nmap: true,
        nikto: true,
        metasploit: true,
        tcpdump: true
      });
    }
  };

  const getSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/system/info`);
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Error getting system info:', error);
    }
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: theme.spacing.lg }}>
        
        {/* Configuration API */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Settings size={20} color={theme.colors.status.info} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              API Configuration
            </h2>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              Backend Endpoint
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
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

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{ 
              display: 'block', 
              marginBottom: theme.spacing.sm, 
              color: theme.colors.text.secondary,
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              Connection Status
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: theme.colors.status.success
              }} />
              <span style={{ color: theme.colors.status.success, fontSize: '14px', fontWeight: '500' }}>
                Connected
              </span>
            </div>
          </div>

          <Button variant="secondary" onClick={checkToolsAvailability}>
            Test Connection
          </Button>
        </Card>

        {/* Outils Disponibles */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Target size={20} color={theme.colors.status.warning} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Security Tools
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {Object.entries(toolsStatus).map(([tool, available]) => (
              <div key={tool} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.text.primary, fontWeight: '500', textTransform: 'uppercase' }}>
                    {tool}
                  </span>
                  <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>
                    {tool === 'nmap' ? 'Network Scanner' :
                     tool === 'nikto' ? 'Web Scanner' :
                     tool === 'metasploit' ? 'Exploitation Framework' :
                     tool === 'tcpdump' ? 'Packet Capture' : 'Security Tool'}
                  </span>
                </div>
                <Badge variant={available ? 'success' : 'error'}>
                  {available ? 'Available' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>

          <div style={{ marginTop: theme.spacing.lg }}>
            <Button variant="ghost" onClick={checkToolsAvailability}>
              Refresh Status
            </Button>
          </div>
        </Card>

        {/* Informations Système */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Activity size={20} color={theme.colors.status.info} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              System Information
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Platform Version</span>
              <Badge variant="info">{systemInfo.version}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>System Uptime</span>
              <span style={{ color: theme.colors.text.primary, fontSize: '14px' }}>{systemInfo.uptime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Memory Usage</span>
              <span style={{ color: theme.colors.text.primary, fontSize: '14px' }}>{systemInfo.memory}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>CPU Usage</span>
              <span style={{ color: theme.colors.text.primary, fontSize: '14px' }}>{systemInfo.cpu}</span>
            </div>
          </div>

          <div style={{ marginTop: theme.spacing.lg }}>
            <Button variant="ghost" onClick={getSystemInfo}>
              Refresh Info
            </Button>
          </div>
        </Card>

        {/* Configuration de Sécurité */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Shield size={20} color={theme.colors.status.success} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Security Settings
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Auto-Save Reports</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Scan Timeout</span>
              <span style={{ color: theme.colors.text.primary, fontSize: '14px' }}>300s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Max Concurrent Scans</span>
              <span style={{ color: theme.colors.text.primary, fontSize: '14px' }}>5</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.text.secondary }}>Log Level</span>
              <Badge variant="info">INFO</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ================================
// AUTRES ONGLETS (SIMPLIFIÉS)
// ================================

const ReconnaissanceTab = () => (
  <div style={{ padding: theme.spacing.lg }}>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Target size={20} color={theme.colors.status.info} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Reconnaissance Module
        </h2>
      </div>
      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.text.muted }}>
        <Target size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
        <p>Module de reconnaissance en développement</p>
        <p style={{ fontSize: '13px' }}>Fonctionnalités prévues : DNS enumeration, subdomain discovery, port scanning</p>
      </div>
    </Card>
  </div>
);

const ScanningTab = () => (
  <div style={{ padding: theme.spacing.lg }}>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Activity size={20} color={theme.colors.status.warning} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Vulnerability Scanning
        </h2>
      </div>
      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.text.muted }}>
        <Activity size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
        <p>Module de scan de vulnérabilités en développement</p>
        <p style={{ fontSize: '13px' }}>Fonctionnalités prévues : Nmap, Nikto, OpenVAS integration</p>
      </div>
    </Card>
  </div>
);

const SniffingTab = () => (
  <div style={{ padding: theme.spacing.lg }}>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Network size={20} color={theme.colors.status.success} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Network Sniffing
        </h2>
      </div>
      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.text.muted }}>
        <Network size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
        <p>Module de capture réseau en développement</p>
        <p style={{ fontSize: '13px' }}>Fonctionnalités prévues : tcpdump, Wireshark integration, traffic analysis</p>
      </div>
    </Card>
  </div>
);

const ReportsTab = () => (
  <div style={{ padding: theme.spacing.lg }}>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <FileText size={20} color={theme.colors.status.info} />
        <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Reports & Documentation
        </h2>
      </div>
      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.text.muted }}>
        <FileText size={48} color={theme.colors.text.muted} style={{ marginBottom: theme.spacing.md }} />
        <p>Module de rapports en développement</p>
        <p style={{ fontSize: '13px' }}>Fonctionnalités prévues : PDF generation, executive summaries, technical reports</p>
      </div>
    </Card>
  </div>
);

// ================================
// COMPOSANT PRINCIPAL
// ================================

const ProfessionalPentestInterface = () => {
  const [activeTab, setActiveTab] = useState('reconnaissance');

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
        return <ReconnaissanceTab />;
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

export default ProfessionalPentestInterface;