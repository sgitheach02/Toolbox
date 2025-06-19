import React, { useState, useEffect, useCallback, useRef } from 'react';

const Terminal = ({ size = 16, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const SessionInteraction = ({ session, onClose }) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Commandes prédéfinies selon le type de session
  const getAvailableCommands = () => {
    if (session.type === 'meterpreter') {
      return [
        { cmd: 'sysinfo', desc: 'System information' },
        { cmd: 'getuid', desc: 'Get current user ID' },
        { cmd: 'pwd', desc: 'Print working directory' },
        { cmd: 'ls', desc: 'List directory contents' },
        { cmd: 'ps', desc: 'List processes' },
        { cmd: 'shell', desc: 'Drop to system shell' },
        { cmd: 'download', desc: 'Download file from target' },
        { cmd: 'upload', desc: 'Upload file to target' },
        { cmd: 'screenshot', desc: 'Take screenshot' },
        { cmd: 'webcam_snap', desc: 'Take webcam photo' },
        { cmd: 'keyscan_start', desc: 'Start keylogger' },
        { cmd: 'migrate', desc: 'Migrate to another process' },
        { cmd: 'getsystem', desc: 'Attempt to elevate privileges' },
        { cmd: 'hashdump', desc: 'Dump password hashes' }
      ];
    } else {
      return [
        { cmd: 'whoami', desc: 'Current user' },
        { cmd: 'pwd', desc: 'Current directory' },
        { cmd: 'ls -la', desc: 'List files' },
        { cmd: 'ps aux', desc: 'List processes' },
        { cmd: 'uname -a', desc: 'System information' },
        { cmd: 'ifconfig', desc: 'Network configuration' },
        { cmd: 'netstat -tlnp', desc: 'Network connections' },
        { cmd: 'cat /etc/passwd', desc: 'System users' },
        { cmd: 'cat /etc/shadow', desc: 'Password hashes' },
        { cmd: 'find / -perm -4000 2>/dev/null', desc: 'SUID binaries' }
      ];
    }
  };

  // Simuler l'exécution de commandes
  const simulateCommandExecution = async (cmd) => {
    const responses = {
      // Meterpreter commands
      'sysinfo': `Computer        : ${session.target}
OS              : Linux Ubuntu 18.04
Architecture    : x64
System Language : en_US
Domain          : WORKGROUP
Logged On Users : 2
Meterpreter     : x64/linux`,

      'getuid': `Server username: uid=0, gid=0, euid=0, egid=0`,
      
      'pwd': `/root`,
      
      'ls': `drwxr-xr-x 1 root root  4096 Jun 19 12:30 .
drwxr-xr-x 1 root root  4096 Jun 19 12:30 ..
-rw-r--r-- 1 root root   220 Jun 19 12:30 .bash_logout
-rw-r--r-- 1 root root  3771 Jun 19 12:30 .bashrc
-rw-r--r-- 1 root root   807 Jun 19 12:30 .profile
drwx------ 2 root root  4096 Jun 19 12:30 .ssh
-rw------- 1 root root  1024 Jun 19 12:30 flag.txt`,

      'ps': `PID   Name                 Arch  Session  User          Path
---   ----                 ----  -------  ----          ----
1     systemd              x64   0        root          /sbin/init
2     kthreadd             x64   0        root          
450   vsftpd               x64   0        root          /usr/sbin/vsftpd
1234  bash                 x64   0        root          /bin/bash`,

      // Shell commands
      'whoami': 'root',
      
      'uname -a': 'Linux metasploitable 4.4.0-142-generic #168-Ubuntu SMP x86_64 GNU/Linux',
      
      'ls -la': `total 28
drwxr-xr-x 1 root root  4096 Jun 19 12:30 .
drwxr-xr-x 1 root root  4096 Jun 19 12:30 ..
-rw-r--r-- 1 root root   220 Jun 19 12:30 .bash_logout
-rw-r--r-- 1 root root  3771 Jun 19 12:30 .bashrc
-rw-r--r-- 1 root root   807 Jun 19 12:30 .profile
-rw------- 1 root root  1024 Jun 19 12:30 flag.txt`,

      'ps aux': `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1  37700  5516 ?        Ss   12:30   0:01 /sbin/init
root       450  0.0  0.0  53272  3084 ?        Ss   12:30   0:00 /usr/sbin/vsftpd
root      1234  0.0  0.0  18508  3312 pts/0    Ss   12:35   0:00 /bin/bash`,

      'ifconfig': `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.6.154  netmask 255.255.255.0  broadcast 192.168.6.255
        ether 02:42:c0:a8:06:9a  txqueuelen 0  (Ethernet)`,

      'cat /etc/passwd': `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
ftp:x:14:50:FTP User:/var/ftp:/usr/sbin/nologin
msfadmin:x:1000:1000:msfadmin,,,:/home/msfadmin:/bin/bash`,

      'hashdump': `Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
msfadmin:1000:aad3b435b51404eeaad3b435b51404ee:e52cac67419a9a224a3b108f3fa6cb6d:::`,

      'getsystem': `...got system via technique 1 (Named Pipe Impersonation (In Memory/Admin)).`,

      'screenshot': `Screenshot saved to: /tmp/screenshot_20250619_123845.jpeg`,

      'download': `[*] downloading: /etc/passwd -> /tmp/passwd
[*] download successful`,

      'migrate': `[*] Migrating from 1234 to 2345...
[*] Migration completed successfully.`,
    };

    // Commandes avec paramètres
    if (cmd.startsWith('cat ')) {
      const file = cmd.split(' ')[1];
      if (file === '/etc/shadow') {
        return `root:$6$salt$encrypted_hash:18947:0:99999:7:::
daemon:*:18947:0:99999:7:::
msfadmin:$6$salt$another_hash:18947:0:99999:7:::`;
      }
      return `cat: ${file}: Permission denied`;
    }

    if (cmd.startsWith('find ')) {
      return `/usr/bin/passwd
/usr/bin/sudo
/bin/su
/usr/bin/pkexec`;
    }

    // Réponse par défaut
    return responses[cmd] || `Command '${cmd}' executed successfully.
Output would appear here in a real session.`;
  };

  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    const currentCommand = command.trim();
    
    // Ajouter la commande à l'historique
    setCommandHistory(prev => [...prev, currentCommand]);
    
    // Ajouter la commande à la sortie
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, {
      type: 'command',
      content: `meterpreter > ${currentCommand}`,
      timestamp
    }]);

    setCommand('');
    setHistoryIndex(-1);

    try {
      // Simuler le délai d'exécution
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const result = await simulateCommandExecution(currentCommand);
      
      setOutput(prev => [...prev, {
        type: 'output',
        content: result,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error) {
      setOutput(prev => [...prev, {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  // Auto-scroll vers le bas
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '90%',
        height: '90%',
        maxWidth: '1200px',
        backgroundColor: '#0a0a0a',
        border: '2px solid #00ff88',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 255, 136, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Terminal size={20} color="#00ff88" />
            <div>
              <div style={{ color: '#00ff88', fontWeight: '700', fontSize: '16px' }}>
                Session {session.id} - {session.target}
              </div>
              <div style={{ color: '#888', fontSize: '12px' }}>
                {session.type} | {session.platform} | {session.arch || 'x86'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(0, 255, 136, 0.2)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#00ff88',
              fontWeight: '600'
            }}>
              ACTIVE
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Terminal Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Commands Sidebar */}
          <div style={{
            width: '250px',
            backgroundColor: '#151515',
            borderRight: '1px solid #333',
            padding: '16px',
            overflowY: 'auto'
          }}>
            <div style={{ color: '#00ff88', fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>
              📋 Quick Commands
            </div>
            {getAvailableCommands().slice(0, 10).map((cmdInfo, index) => (
              <div
                key={index}
                onClick={() => setCommand(cmdInfo.cmd)}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: '#222',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#00ff88'}
                onMouseLeave={(e) => e.target.style.borderColor = 'transparent'}
              >
                <div style={{ color: '#00ff88', fontSize: '12px', fontFamily: 'monospace' }}>
                  {cmdInfo.cmd}
                </div>
                <div style={{ color: '#888', fontSize: '10px' }}>
                  {cmdInfo.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Terminal Output */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              ref={terminalRef}
              style={{
                flex: 1,
                backgroundColor: '#000',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '13px',
                overflowY: 'auto',
                color: '#e5e5e5'
              }}
            >
              {/* Initial message */}
              <div style={{ color: '#00ff88', marginBottom: '16px' }}>
                Meterpreter session {session.id} opened ({session.target}) at {session.opened_at}
                <br />
                Type 'help' for available commands, or use the sidebar for quick access.
              </div>

              {/* Command output */}
              {output.map((item, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  {item.type === 'command' ? (
                    <div style={{ color: '#00ff88' }}>{item.content}</div>
                  ) : item.type === 'error' ? (
                    <div style={{ color: '#ff6b6b' }}>{item.content}</div>
                  ) : (
                    <div style={{ color: '#e5e5e5', whiteSpace: 'pre-wrap' }}>{item.content}</div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isExecuting && (
                <div style={{ color: '#888', fontStyle: 'italic' }}>
                  Executing command...
                </div>
              )}
            </div>

            {/* Command Input */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #333',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#00ff88', fontFamily: 'monospace' }}>
                meterpreter &gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isExecuting}
                placeholder="Enter command..."
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e5e5e5',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={executeCommand}
                disabled={!command.trim() || isExecuting}
                style={{
                  backgroundColor: '#00ff88',
                  color: '#000',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: (!command.trim() || isExecuting) ? 0.5 : 1
                }}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
// MODULE METASPLOIT
// ================================

const MetasploitTab = () => {
  const [exploit, setExploit] = useState('');
  const [target, setTarget] = useState('');
  const [payload, setPayload] = useState('');
  const [lhost, setLhost] = useState('');
  const [lport, setLport] = useState('4444');
  const [exploitMode, setExploitMode] = useState('predefined');
  const [selectedCategory, setSelectedCategory] = useState('web');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(null);

  // 📂 CHARGEMENT INITIAL
  useEffect(() => {
    const savedResults = persistenceService.load('metasploit_results', []);
    const savedForm = persistenceService.load('metasploit_form', {});
    
    setResults(savedResults);
    if (savedForm.exploit) setExploit(savedForm.exploit);
    if (savedForm.target) setTarget(savedForm.target);
    if (savedForm.payload) setPayload(savedForm.payload);
    if (savedForm.lhost) setLhost(savedForm.lhost);
    
    console.log('📂 Metasploit: Données restaurées');
  }, []);

  // 💾 SAUVEGARDE AUTO
  useEffect(() => {
    if (exploit || target || payload || lhost) {
      persistenceService.save('metasploit_form', { exploit, target, payload, lhost });
    }
  }, [exploit, target, payload, lhost]);

  useEffect(() => {
    if (results.length > 0) {
      persistenceService.save('metasploit_results', results.slice(0, 20));
    }
  }, [results]);

  const exploitCategories = {
    web: [
      { value: 'exploit/multi/http/struts2_content_type_ognl', label: 'Apache Struts2 OGNL' },
      { value: 'exploit/multi/http/apache_mod_cgi_bash_env_exec', label: 'Apache mod_cgi Bash Environment' },
      { value: 'exploit/linux/http/php_cgi_arg_injection', label: 'PHP CGI Argument Injection' }
    ],
    windows: [
      { value: 'exploit/windows/smb/ms17_010_eternalblue', label: 'MS17-010 EternalBlue SMB' },
      { value: 'exploit/windows/smb/ms08_067_netapi', label: 'MS08-067 NetAPI' },
      { value: 'exploit/windows/dcerpc/ms03_026_dcom', label: 'MS03-026 DCOM' }
    ],
    linux: [
      { value: 'exploit/unix/ftp/vsftpd_234_backdoor', label: 'VSFTPD 2.3.4 Backdoor' },
      { value: 'exploit/multi/samba/usermap_script', label: 'Samba "username map script"' },
      { value: 'exploit/unix/irc/unreal_ircd_3281_backdoor', label: 'UnrealIRCd 3.2.8.1 Backdoor' }
    ]
  };

  const payloadOptions = [
    { value: 'windows/meterpreter/reverse_tcp', label: 'Windows Meterpreter Reverse TCP' },
    { value: 'linux/x86/meterpreter/reverse_tcp', label: 'Linux x86 Meterpreter Reverse TCP' },
    { value: 'linux/x64/meterpreter/reverse_tcp', label: 'Linux x64 Meterpreter Reverse TCP' },
    { value: 'windows/shell/reverse_tcp', label: 'Windows Shell Reverse TCP' },
    { value: 'linux/x86/shell/reverse_tcp', label: 'Linux x86 Shell Reverse TCP' },
    { value: 'cmd/unix/reverse', label: 'Unix Command Shell' }
  ];

  const taskStatus = useTaskPolling(currentTaskId, useCallback((status) => {
    if (status.status === 'completed') {
      const newResult = {
        id: currentTaskId,
        exploit: exploit,
        target: target,
        payload: payload,
        lhost: lhost,
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        results: status.data.results || {},
        raw_output: status.data.raw_output,
        sessions: status.data.results?.sessions || []
      };
      
      setResults(prev => [newResult, ...prev]);
      
      // Ajouter les sessions trouvées
      if (status.data.results?.sessions?.length > 0) {
        setSessions(prev => [...status.data.results.sessions, ...prev]);
      }
      
      setError('');
    } else if (status.status === 'failed') {
      setError(status.data.error || 'Erreur inconnue');
    }
    setCurrentTaskId(null);
  }, [currentTaskId, exploit, target, payload, lhost]));

  const startExploit = async () => {
    if (!exploit || !target || !payload || !lhost) {
      setError('Veuillez renseigner tous les champs requis');
      return;
    }

    setError('');
    try {
      const response = await apiService.request('/scan/metasploit', {
        method: 'POST',
        body: JSON.stringify({ exploit, target, payload, lhost })
      });
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSessions([]);
    persistenceService.remove('metasploit_results');
  };

  // NOUVELLE FONCTION: Ouvrir interaction session
  const openSessionInteraction = (session) => {
    console.log('🔗 Ouverture interaction session:', session);
    setActiveSession(session);
  };

  // NOUVELLE FONCTION: Fermer interaction session
  const closeSessionInteraction = () => {
    console.log('❌ Fermeture interaction session');
    setActiveSession(null);
  };

  const isExploiting = currentTaskId && taskStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Crosshairs size={20} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Metasploit Framework - Exploitation Engine
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
            ⚠️ AVERTISSEMENT CRITIQUE
          </div>
          <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
            Metasploit Framework ne doit être utilisé QUE sur vos propres systèmes ou avec autorisation écrite explicite.
            L'utilisation non autorisée constitue une violation de la loi et peut entraîner des poursuites pénales.
          </div>
        </div>

        {isExploiting ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            backgroundColor: theme.colors.bg.tertiary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.bg.accent}`
          }}>
            <Loader size={32} color={theme.colors.accent.primary} />
            <div style={{ color: theme.colors.text.primary, fontSize: '16px', fontWeight: '600', marginTop: theme.spacing.md }}>
              💣 Exploitation Metasploit en cours...
            </div>
            <div style={{ color: theme.colors.text.muted, fontSize: '14px', marginTop: theme.spacing.sm }}>
              {exploit} contre {target}
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
                  📂 Catégorie {selectedCategory && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={[
                    { value: 'web', label: '🌐 Exploits Web' },
                    { value: 'windows', label: '🪟 Exploits Windows' },
                    { value: 'linux', label: '🐧 Exploits Linux/Unix' }
                  ]}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="Catégorie d'exploits"
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
                  💣 Exploit {exploit && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={exploitCategories[selectedCategory] || []}
                  value={exploit}
                  onChange={(e) => setExploit(e.target.value)}
                  placeholder="Choisir un exploit"
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
                  🎯 Target {target && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Input
                  placeholder="192.168.1.100 ou example.com"
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
                  📦 Payload {payload && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={payloadOptions}
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Type de payload"
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
                  🏠 LHOST {lhost && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Input
                  placeholder="192.168.1.50 (votre IP)"
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
                  🔌 LPORT
                </label>
                <Input
                  placeholder="4444"
                  value={lport}
                  onChange={(e) => setLport(e.target.value)}
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
              onClick={startExploit}
              disabled={!exploit || !target || !payload || !lhost}
              variant="primary"
              icon={Play}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
            >
              💣 Start Metasploit Exploit
            </Button>
          </>
        )}
      </Card>

      {/* Sessions actives */}
      {sessions.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            🔗 Sessions Actives ({sessions.length}) - Cliquez pour interagir
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: theme.spacing.md }}>
            {sessions.slice(0, 5).map((session, index) => (
              <div 
                key={index} 
                onClick={() => openSessionInteraction(session)}
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: theme.borderRadius.md,
                  border: `2px solid ${theme.colors.status.success}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = theme.colors.accent.primary;
                  e.target.style.backgroundColor = 'rgba(0, 255, 136, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = theme.colors.status.success;
                  e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: theme.colors.accent.primary,
                  color: '#000000',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  🖱️ CLICK TO INTERACT
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                  <Badge variant="success">SESSION {session.id || index + 1}</Badge>
                  <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>
                    {session.timestamp || new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <div style={{ marginBottom: theme.spacing.sm }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={16} color={theme.colors.accent.primary} />
                    🎯 {session.target || target}
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '12px', marginTop: '4px' }}>
                    Type: <strong>{session.type || 'shell'}</strong> | Platform: <strong>{session.platform || 'linux'}</strong>
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '11px', 
                  color: theme.colors.text.muted, 
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '4px 6px',
                  borderRadius: '4px'
                }}>
                  Exploit: {session.exploit_used || exploit}
                </div>

                <div style={{ marginTop: theme.spacing.sm, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(session.type === 'meterpreter' ? 
                    ['sysinfo', 'getuid', 'ps', 'hashdump'] : 
                    ['whoami', 'uname -a', 'ps aux', 'ls -la']
                  ).map(cmd => (
                    <span key={cmd} style={{
                      fontSize: '9px',
                      padding: '2px 4px',
                      backgroundColor: 'rgba(0, 255, 136, 0.2)',
                      borderRadius: '3px',
                      color: theme.colors.accent.primary
                    }}>
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            💣 Metasploit Results ({results.length})
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
                <Badge variant="info">{result.exploit?.split('/').pop()}</Badge>
                <span style={{ color: theme.colors.text.muted, fontSize: '12px' }}>{result.timestamp}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm }}>
                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: result.sessions?.length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${result.sessions?.length > 0 ? theme.colors.status.success : theme.colors.status.error}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🔗 Sessions
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.sessions?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Modal d'interaction session */}
      {activeSession && (
        <SessionInteraction
          session={activeSession}
          onClose={closeSessionInteraction}
        />
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
// DOWNLOAD MANAGER - NOUVEAU
// ================================
const DownloadManager = ({ taskId, taskData, taskStatus }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = getApiBaseUrl();

  const loadFiles = async () => {
    if (!taskId || taskStatus !== 'completed') return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.request(`/scan/files/${taskId}`);
      setFiles(response.files || []);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (downloadUrl, filename) => {
    try {
      const link = document.createElement('a');
      link.href = `${API_BASE}${downloadUrl}`;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`📥 Téléchargement de ${filename} démarré`);
    } catch (err) {
      console.error(`❌ Erreur téléchargement: ${err.message}`);
    }
  };

  const downloadCapture = () => {
    if (!taskId) return;
    const url = `${API_BASE}/api/scan/download/${taskId}`;
    const filename = `capture_${taskId}.pcap`;
    window.open(url, '_blank');
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pcap': return '📦';
      case 'log': return '📄';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  useEffect(() => {
    loadFiles();
  }, [taskId, taskStatus]);

  if (taskStatus !== 'completed') return null;

  if (taskId && taskId.startsWith('tcpdump_')) {
    return (
      <div style={{ 
        marginTop: '15px', 
        padding: '15px', 
        background: 'rgba(0, 255, 136, 0.1)', 
        borderRadius: '10px',
        border: '1px solid rgba(0, 255, 136, 0.3)'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#00ff88', fontSize: '14px' }}>
          📥 Téléchargement de la capture
        </h4>
        
        {loading && <p style={{ color: '#ffd700', fontSize: '12px' }}>🔄 Chargement...</p>}
        {error && <p style={{ color: '#ff6b6b', fontSize: '12px' }}>❌ {error}</p>}
        
        {!loading && !error && (
          <>
            {files.length > 0 ? (
              <div>
                {files.map((file, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
                        {getFileIcon(file.type)} {file.filename}
                      </div>
                      <div style={{ color: '#ccc', fontSize: '10px' }}>
                        {file.size_human} • {formatDate(file.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadFile(file.download_url, file.filename)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      📥 Télécharger
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p style={{ color: '#ffd700', fontSize: '12px' }}>
                  ⚠️ Essayez le téléchargement direct
                </p>
                <button
                  onClick={downloadCapture}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  📦 Télécharger PCAP
                </button>
              </div>
            )}
            
            <button
              onClick={loadFiles}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              🔄 Actualiser
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
};


// ================================
// HISTORY TAB - NOUVEAU
// ================================
const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiService.getScanHistory();
      setHistory(data.scans || []);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredHistory = () => {
    let filtered = history;

    if (filter !== 'all') {
      filtered = filtered.filter(task => task.tool === filter);
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
        break;
      case 'tool':
        filtered.sort((a, b) => a.tool.localeCompare(b.tool));
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return filtered;
  };

  const getToolIcon = (tool) => {
    const icons = {
      'nmap': '🔍',
      'nikto': '🕷️', 
      'hydra': '🔨',
      'metasploit': '💣',
      'tcpdump': '📡'
    };
    return icons[tool] || '🔧';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'completed': '✅',
      'failed': '❌',
      'running': '🔄'
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#4ade80',
      'failed': '#ef4444',
      'running': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const renderTaskResults = (tool, results) => {
    if (!results) return null;

    switch (tool) {
      case 'tcpdump':
        return (
          <div style={{ fontSize: '12px' }}>
            {results.packets_captured && (
              <p style={{ color: '#4ade80', margin: '4px 0' }}>
                📦 {results.packets_captured} paquets capturés
              </p>
            )}
            {results.file_size && (
              <p style={{ color: '#60a5fa', margin: '4px 0' }}>
                💾 {Math.round(results.file_size / 1024)} KB
              </p>
            )}
          </div>
        );

      case 'nmap':
        return (
          <div style={{ fontSize: '12px' }}>
            {results.summary && (
              <p style={{ color: '#4ade80', margin: '4px 0' }}>{results.summary}</p>
            )}
            {results.detailed_ports && (
              <p style={{ color: '#fbbf24', margin: '4px 0' }}>
                🔍 {results.detailed_ports.filter(p => p.state === 'open').length} ports ouverts
              </p>
            )}
          </div>
        );

      case 'nikto':
        return (
          <div style={{ fontSize: '12px' }}>
            {results.summary && (
              <p style={{ color: '#4ade80', margin: '4px 0' }}>{results.summary}</p>
            )}
            {results.vulnerabilities && (
              <p style={{ color: '#ef4444', margin: '4px 0' }}>
                🚨 {results.vulnerabilities.length} vulnérabilité(s)
              </p>
            )}
          </div>
        );

      case 'hydra':
        return (
          <div style={{ fontSize: '12px' }}>
            {results.summary && (
              <p style={{ color: results.success ? '#4ade80' : '#fbbf24', margin: '4px 0' }}>
                {results.summary}
              </p>
            )}
            {results.credentials_found && results.credentials_found.length > 0 && (
              <p style={{ color: '#ef4444', margin: '4px 0' }}>
                🔓 {results.credentials_found.length} credential(s)
              </p>
            )}
          </div>
        );

      case 'metasploit':
        return (
          <div style={{ fontSize: '12px' }}>
            {results.summary && (
              <p style={{ color: results.success ? '#4ade80' : '#fbbf24', margin: '4px 0' }}>
                {results.summary}
              </p>
            )}
            {results.sessions && results.sessions.length > 0 && (
              <p style={{ color: '#ef4444', margin: '4px 0' }}>
                🎯 {results.sessions.length} session(s)
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const filteredHistory = getFilteredHistory();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <Loader size={32} color={theme.colors.accent.primary} />
        <p style={{ color: theme.colors.accent.primary, marginTop: '16px' }}>
          🔄 Chargement de l'historique...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* En-tête avec filtres */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={24} color={theme.colors.accent.primary} />
            <h2 style={{ color: theme.colors.text.primary, margin: 0, fontSize: '20px' }}>
              Historique des Scans & Captures
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge variant="success">{filteredHistory.length} résultat(s)</Badge>
            <Button size="sm" onClick={loadHistory}>🔄 Actualiser</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              🔍 Filtrer par outil:
            </label>
            <Select
              options={[
                { value: 'all', label: 'Tous les outils' },
                { value: 'nmap', label: '🔍 Nmap' },
                { value: 'nikto', label: '🕷️ Nikto' },
                { value: 'hydra', label: '🔨 Hydra' },
                { value: 'metasploit', label: '💣 Metasploit' },
                { value: 'tcpdump', label: '📡 tcpdump' }
              ]}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ color: theme.colors.text.secondary, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              📅 Trier par:
            </label>
            <Select
              options={[
                { value: 'newest', label: 'Plus récent' },
                { value: 'oldest', label: 'Plus ancien' },
                { value: 'tool', label: 'Outil' },
                { value: 'status', label: 'Statut' }
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${theme.colors.status.error}`,
            borderRadius: theme.borderRadius.md,
            color: '#ff6b6b'
          }}>
            ❌ {error}
          </div>
        )}
      </Card>

      {/* Liste des tâches */}
      {filteredHistory.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: theme.colors.text.primary, margin: '0 0 8px 0' }}>
            Aucun historique trouvé
          </h3>
          <p style={{ color: theme.colors.text.muted, margin: 0 }}>
            {filter === 'all' 
              ? "Lancez des scans pour voir l'historique ici"
              : `Aucun scan ${filter} trouvé. Essayez un autre filtre.`
            }
          </p>
        </Card>
      ) : (
        filteredHistory.map((task, index) => (
          <Card key={`${task.task_id}-${index}`}>
            {/* En-tête de la tâche */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div>
                <h3 style={{ margin: 0, color: theme.colors.text.primary, fontSize: '16px' }}>
                  {getToolIcon(task.tool)} {task.tool.toUpperCase()}
                </h3>
                <p style={{ margin: '5px 0', color: theme.colors.text.muted, fontSize: '12px', fontFamily: 'monospace' }}>
                  {task.task_id}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge 
                  variant={task.status === 'completed' ? 'success' : task.status === 'failed' ? 'error' : 'warning'}
                >
                  {getStatusIcon(task.status)} {task.status.toUpperCase()}
                </Badge>
                {task.completed_at && (
                  <p style={{ margin: '5px 0', color: theme.colors.text.muted, fontSize: '10px' }}>
                    {new Date(task.completed_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>

            {/* Cible */}
            {task.data?.target && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: theme.colors.text.secondary, fontSize: '12px' }}>
                  🎯 Cible: <strong style={{ color: theme.colors.text.primary }}>{task.data.target}</strong>
                </span>
              </div>
            )}

            {/* Résultats */}
            {task.data?.results && (
              <div style={{ marginBottom: '15px' }}>
                {renderTaskResults(task.tool, task.data.results)}
              </div>
            )}

            {/* Détails techniques */}
            {task.data && (
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: theme.borderRadius.md, 
                padding: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                  {task.data.execution_time && <span>⏱️ {task.data.execution_time} </span>}
                  {task.data.tool_version && <span>🔧 {task.data.tool_version}</span>}
                </div>
                {task.data.command && (
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '10px', 
                    color: theme.colors.text.secondary,
                    marginTop: '4px',
                    wordBreak: 'break-all'
                  }}>
                    ⚡ {task.data.command}
                  </div>
                )}
              </div>
            )}

            {/* Gestionnaire de téléchargement */}
            <DownloadManager 
              taskId={task.task_id} 
              taskData={task.data} 
              taskStatus={task.status} 
            />
          </Card>
        ))
      )}
    </div>
  );
};

// ================================
// MODULE TCPDUMP
// ================================

const TcpdumpTab = () => {
  const [interface_, setInterface_] = useState('');
  const [filter, setFilter] = useState('');
  const [duration, setDuration] = useState('60');
  const [packetCount, setPacketCount] = useState('');
  const [captureMode, setCaptureMode] = useState('time'); // 'time', 'count', 'continuous'
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // 📂 CHARGEMENT INITIAL
  useEffect(() => {
    const savedResults = persistenceService.load('tcpdump_results', []);
    const savedForm = persistenceService.load('tcpdump_form', {});
    
    setResults(savedResults);
    if (savedForm.interface_) setInterface_(savedForm.interface_);
    if (savedForm.filter) setFilter(savedForm.filter);
    if (savedForm.duration) setDuration(savedForm.duration);
    if (savedForm.packetCount) setPacketCount(savedForm.packetCount);
    if (savedForm.captureMode) setCaptureMode(savedForm.captureMode);
    
    console.log('📂 Tcpdump: Données restaurées');
  }, []);

  // 💾 SAUVEGARDE AUTO - FIXÉE
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
    { value: 'tcp port 21', label: 'FTP Traffic (port 21)' },
    { value: 'tcp port 23', label: 'Telnet Traffic (port 23)' },
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
        top_hosts: status.data.results?.top_hosts || [],
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
        // Ne pas inclure les champs null/undefined
        ...(captureMode === 'time' && duration && { duration: parseInt(duration) }),
        ...(captureMode === 'count' && packetCount && { packet_count: parseInt(packetCount) })
      };

      const response = await apiService.request('/scan/tcpdump', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCurrentTaskId(response.task_id);
    } catch (error) {
      setError(error.message);
    }
  };

  // FONCTION STOP AJOUTÉE
  const stopCapture = async () => {
    if (currentTaskId) {
      try {
        await apiService.request(`/scan/tcpdump/${currentTaskId}/stop`, {
          method: 'POST'
        });
        setError('');
        // Le polling se chargera de mettre à jour le statut
      } catch (error) {
        setError(`Erreur arrêt capture: ${error.message}`);
      }
    }
  };

  const clearResults = () => {
    setResults([]);
    persistenceService.remove('tcpdump_results');
  };

  const getProtocolColor = (protocol) => {
    switch (protocol.toLowerCase()) {
      case 'tcp': return theme.colors.status.info;
      case 'udp': return theme.colors.status.warning;
      case 'icmp': return theme.colors.status.success;
      case 'http': return '#ff6b6b';
      case 'https': return '#00ff88';
      default: return theme.colors.text.muted;
    }
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

        {/* Avertissement de sécurité */}
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: `1px solid ${theme.colors.status.warning}`,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.lg
        }}>
          <div style={{ color: theme.colors.status.warning, fontWeight: '600', marginBottom: theme.spacing.sm }}>
            ⚠️ AVERTISSEMENT RÉSEAU
          </div>
          <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
            La capture de paquets réseau peut capturer des données sensibles. Utilisez uniquement sur vos propres réseaux 
            ou avec autorisation explicite. Respectez la confidentialité et la législation en vigueur.
          </div>
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
            <div style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: theme.borderRadius.sm,
              fontSize: '12px',
              color: theme.colors.accent.primary
            }}>
              💾 Résultats sauvegardés automatiquement | Task ID: {currentTaskId}
            </div>
            {/* BOUTON STOP FIXÉ */}
            <Button
              onClick={stopCapture}
              variant="danger"
              style={{ marginTop: theme.spacing.lg }}
            >
              🛑 Stop Capture
            </Button>
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
                  🔗 Interface Réseau {interface_ && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={interfaces}
                  value={interface_}
                  onChange={(e) => setInterface_(e.target.value)}
                  placeholder="Choisir interface"
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  💡 'any' capture toutes les interfaces
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
                  🔍 Filtre BPF {filter && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                </label>
                <Select
                  options={filterPresets}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtres prédéfinis"
                />
                <Input
                  placeholder="Ou filtre personnalisé (ex: host 192.168.1.1 and port 80)"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ marginTop: theme.spacing.sm, fontSize: '11px' }}
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
                  ⚙️ Mode de Capture {captureMode && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
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
                    ⏱️ Durée (secondes) {duration && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="3600"
                  />
                  <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                    📝 Recommandé: 60-300 secondes
                  </div>
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
                    📊 Nombre de Paquets {packetCount && <span style={{ color: theme.colors.accent.primary }}>💾</span>}
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={packetCount}
                    onChange={(e) => setPacketCount(e.target.value)}
                    min="1"
                    max="100000"
                  />
                  <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '4px' }}>
                    📝 Recommandé: 1000-10000 paquets
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
              {captureMode === 'time' && ` (${duration}s)`}
              {captureMode === 'count' && ` (${packetCount} packets)`}
              {captureMode === 'continuous' && ' (Manual Stop)'}
            </Button>
          </>
        )}
      </Card>

      {results.length > 0 && (
        <Card>
          <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.lg }}>
            📡 Tcpdump Results ({results.length}) - Auto-sauvegardés
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
                <span style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{result.interface}</span>
                <Badge variant="info">{result.captureMode}</Badge>
                {result.filter && <Badge variant="default">{result.filter}</Badge>}
                <Badge variant={result.status === 'completed' ? 'success' : 'warning'}>
                  {result.status === 'stopped' ? 'STOPPED' : 'COMPLETED'}
                </Badge>
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

                <div style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.status.warning}`
                }}>
                  <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                    🏠 Hosts
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                    {result.top_hosts?.length || 0}
                  </div>
                </div>

                {result.command && (
                  <div style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.status.error}`
                  }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '12px' }}>
                      ⚡ Command
                    </div>
                    <div style={{ 
                      color: theme.colors.text.secondary, 
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}>
                      tcpdump -i {result.interface}...
                    </div>
                  </div>
                )}
              </div>

              {/* Protocols breakdown */}
              {result.protocols && Object.keys(result.protocols).length > 0 && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    📊 Protocol Distribution
                  </h4>
                  <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                    {Object.entries(result.protocols).slice(0, 8).map(([protocol, count], index) => (
                      <div key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: getProtocolColor(protocol) + '20',
                        border: `1px solid ${getProtocolColor(protocol)}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '11px',
                        color: getProtocolColor(protocol),
                        fontWeight: '600'
                      }}>
                        {protocol.toUpperCase()}: {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top hosts */}
              {result.top_hosts && result.top_hosts.length > 0 && (
                <div>
                  <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm, fontSize: '14px' }}>
                    🏠 Top Active Hosts
                  </h4>
                  <div style={{ 
                    backgroundColor: theme.colors.bg.primary,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {result.top_hosts.slice(0, 10).map((host, index) => (
                      <div key={index} style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: theme.colors.text.secondary,
                        marginBottom: '3px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{host.ip || host}</span>
                        <span style={{ color: theme.colors.accent.primary }}>{host.packets || 'N/A'}</span>
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
        return <HistoryTab />;
      case 'hydra':
        return <HydraTab />;
      case 'metasploit':
        return <MetasploitTab />;
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

const SessionInteractionWithAPI = ({ session, onClose }) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionDetails, setSessionDetails] = useState(null);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Charger les détails de la session et l'historique
  useEffect(() => {
    const loadSessionDetails = async () => {
      try {
        const response = await apiService.request(`/sessions/${session.id}`);
        setSessionDetails(response.session);
        
        // Charger l'historique des commandes
        if (response.command_history) {
          const historyOutput = response.command_history.map(cmd => [
            {
              type: 'command',
              content: `${session.type === 'meterpreter' ? 'meterpreter' : 'shell'} > ${cmd.command}`,
              timestamp: cmd.timestamp
            },
            {
              type: 'output',
              content: cmd.output,
              timestamp: cmd.timestamp
            }
          ]).flat();
          
          setOutput(historyOutput);
        }
        
        // Extraire les commandes pour l'historique
        const commands = response.command_history?.map(cmd => cmd.command) || [];
        setCommandHistory(commands);
        
      } catch (error) {
        console.error('Erreur chargement session:', error);
        setOutput([{
          type: 'error',
          content: `Erreur chargement session: ${error.message}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    if (session.id) {
      loadSessionDetails();
    }
  }, [session.id]);

  // Exécuter une commande via l'API
  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    const currentCommand = command.trim();
    
    // Ajouter la commande à l'historique local
    setCommandHistory(prev => [...prev, currentCommand]);
    
    // Ajouter la commande à la sortie
    const timestamp = new Date().toLocaleTimeString();
    const prompt = session.type === 'meterpreter' ? 'meterpreter' : 'shell';
    
    setOutput(prev => [...prev, {
      type: 'command',
      content: `${prompt} > ${currentCommand}`,
      timestamp
    }]);

    setCommand('');
    setHistoryIndex(-1);

    try {
      // Appel API réel
      const response = await apiService.request(`/sessions/${session.id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ command: currentCommand })
      });

      if (response.success) {
        setOutput(prev => [...prev, {
          type: 'output',
          content: response.output,
          timestamp: response.timestamp || new Date().toLocaleTimeString()
        }]);
      } else {
        setOutput(prev => [...prev, {
          type: 'error',
          content: response.error || 'Erreur inconnue',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

    } catch (error) {
      setOutput(prev => [...prev, {
        type: 'error',
        content: `Erreur API: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Fermer la session via l'API
  const closeSession = async () => {
    try {
      await apiService.request(`/sessions/${session.id}/close`, {
        method: 'POST'
      });
      console.log(`Session ${session.id} fermée`);
    } catch (error) {
      console.error('Erreur fermeture session:', error);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Commandes suggérées selon le type
  const getQuickCommands = () => {
    if (session.type === 'meterpreter') {
      return [
        { cmd: 'sysinfo', desc: 'System information', icon: '💻' },
        { cmd: 'getuid', desc: 'Current user ID', icon: '👤' },
        { cmd: 'ps', desc: 'List processes', icon: '⚙️' },
        { cmd: 'hashdump', desc: 'Dump password hashes', icon: '🔐' },
        { cmd: 'screenshot', desc: 'Take screenshot', icon: '📸' },
        { cmd: 'shell', desc: 'Drop to system shell', icon: '🐚' },
        { cmd: 'download /etc/passwd', desc: 'Download passwd file', icon: '⬇️' },
        { cmd: 'migrate 1234', desc: 'Migrate to process', icon: '🔄' },
        { cmd: 'getsystem', desc: 'Elevate privileges', icon: '🔒' },
        { cmd: 'webcam_snap', desc: 'Take webcam photo', icon: '📷' }
      ];
    } else {
      return [
        { cmd: 'whoami', desc: 'Current user', icon: '👤' },
        { cmd: 'uname -a', desc: 'System information', icon: '💻' },
        { cmd: 'ps aux', desc: 'List processes', icon: '⚙️' },
        { cmd: 'cat /etc/passwd', desc: 'System users', icon: '📄' },
        { cmd: 'cat /etc/shadow', desc: 'Password hashes', icon: '🔐' },
        { cmd: 'ls -la', desc: 'List files detailed', icon: '📁' },
        { cmd: 'ifconfig', desc: 'Network config', icon: '🌐' },
        { cmd: 'netstat -tlnp', desc: 'Network connections', icon: '🔗' },
        { cmd: 'find / -perm -4000 2>/dev/null', desc: 'SUID binaries', icon: '🔍' },
        { cmd: 'cat /root/flag.txt', desc: 'Get the flag!', icon: '🚩' }
      ];
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '95%',
        height: '95%',
        maxWidth: '1400px',
        backgroundColor: '#0a0a0a',
        border: '2px solid #00ff88',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 255, 136, 0.3)'
      }}>
        {/* Header avec stats temps réel */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Terminal size={20} color="#00ff88" />
            <div>
              <div style={{ color: '#00ff88', fontWeight: '700', fontSize: '16px' }}>
                🔗 Session {session.id} - {session.target}
              </div>
              <div style={{ color: '#888', fontSize: '12px' }}>
                {session.type} | {session.platform} | {sessionDetails?.commands_executed || 0} commandes
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(0, 255, 136, 0.2)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#00ff88',
              fontWeight: '600'
            }}>
              🟢 LIVE API
            </div>
            <button
              onClick={closeSession}
              style={{
                background: '#ff6b6b',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              🔒 Close Session
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Terminal Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Commands Sidebar avec API */}
          <div style={{
            width: '280px',
            backgroundColor: '#151515',
            borderRight: '1px solid #333',
            padding: '16px',
            overflowY: 'auto'
          }}>
            <div style={{ color: '#00ff88', fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>
              ⚡ Quick Commands ({session.type})
            </div>
            
            {getQuickCommands().map((cmdInfo, index) => (
              <div
                key={index}
                onClick={() => setCommand(cmdInfo.cmd)}
                style={{
                  padding: '10px',
                  marginBottom: '6px',
                  backgroundColor: '#222',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#00ff88';
                  e.target.style.backgroundColor = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = '#222';
                }}
              >
                <div style={{ 
                  color: '#00ff88', 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{cmdInfo.icon}</span>
                  {cmdInfo.cmd}
                </div>
                <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
                  {cmdInfo.desc}
                </div>
              </div>
            ))}

            {/* Stats de session */}
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              backgroundColor: '#1a1a1a',
              borderRadius: '6px',
              border: '1px solid #333'
            }}>
              <div style={{ color: '#00ff88', fontWeight: '600', marginBottom: '8px', fontSize: '12px' }}>
                📊 Session Stats
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                <div>Commands: {commandHistory.length}</div>
                <div>Type: {session.type}</div>
                <div>Platform: {session.platform}</div>
                <div>Created: {session.opened_at}</div>
              </div>
            </div>

            {/* Aide rapide */}
            <div style={{ 
              marginTop: '12px', 
              padding: '10px', 
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}>
              <div style={{ color: '#00ff88', fontWeight: '600', marginBottom: '6px', fontSize: '11px' }}>
                💡 Quick Tips
              </div>
              <div style={{ fontSize: '9px', color: '#888', lineHeight: '1.4' }}>
                • ↑↓ pour naviguer l'historique<br/>
                • Tab pour auto-complétion<br/>
                • 'help' pour aide complète<br/>
                • Clic sur commandes sidebar
              </div>
            </div>
          </div>

          {/* Terminal Output avec indicateur API */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              ref={terminalRef}
              style={{
                flex: 1,
                backgroundColor: '#000',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '13px',
                overflowY: 'auto',
                color: '#e5e5e5'
              }}
            >
              {/* Message initial avec API info */}
              <div style={{ color: '#00ff88', marginBottom: '16px' }}>
                🔗 Meterpreter session {session.id} opened ({session.target}) via REAL API
                <br />
                ⚡ Live backend interaction - Commands are executed on simulated target
                <br />
                📡 Type 'help' for available commands, or use the sidebar for quick access.
                <br />
                {session.exploit_used && `🎯 Exploited via: ${session.exploit_used}`}
              </div>

              {/* Command output */}
              {output.map((item, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  {item.type === 'command' ? (
                    <div style={{ color: '#00ff88', fontWeight: '600' }}>{item.content}</div>
                  ) : item.type === 'error' ? (
                    <div style={{ color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: '4px', borderRadius: '3px' }}>
                      ❌ {item.content}
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#e5e5e5', 
                      whiteSpace: 'pre-wrap',
                      backgroundColor: item.content.includes('flag') || item.content.includes('CTF') ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                      padding: item.content.includes('flag') || item.content.includes('CTF') ? '4px' : '0',
                      borderRadius: '3px'
                    }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator avec animation */}
              {isExecuting && (
                <div style={{ 
                  color: '#888', 
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid #333',
                    borderTop: '2px solid #00ff88',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Executing command via API...
                </div>
              )}
            </div>

            {/* Command Input avec indicateurs */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #333',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#00ff88', fontFamily: 'monospace', fontWeight: '600' }}>
                  {session.type === 'meterpreter' ? 'meterpreter' : 'shell'} &gt;
                </span>
                {isExecuting && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#00ff88',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }}></div>
                )}
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isExecuting}
                placeholder={isExecuting ? "Executing..." : "Enter command..."}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e5e5e5',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  outline: 'none',
                  opacity: isExecuting ? 0.6 : 1
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={executeCommand}
                  disabled={!command.trim() || isExecuting}
                  style={{
                    backgroundColor: '#00ff88',
                    color: '#000',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px',
                    opacity: (!command.trim() || isExecuting) ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {isExecuting ? '⏳ Executing...' : '🚀 Execute'}
                </button>
                
                <button
                  onClick={() => setCommand('')}
                  style={{
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Styles intégrés pour animations */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}
        </style>
      </div>
    </div>
  );
};


export default PachaPentestSuite;