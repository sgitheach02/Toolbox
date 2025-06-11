// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('reconnaissance');
  const [tasks, setTasks] = useState({});
  const [logs, setLogs] = useState([]);

  // Ajout de log
  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setLogs(prev => [log, ...prev.slice(0, 49)]);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🛡️ Pacha Toolbox v2 - Print Nightmare Lab</h1>
        <div className="target-info">
          <span className="target">🎯 Cible: printnightmare.thm</span>
          <span className="status">🟢 Laboratoire actif</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="navigation">
        {[
          { id: 'reconnaissance', label: '🔍 Reconnaissance', icon: '🔍' },
          { id: 'exploitation', label: '💥 Exploitation', icon: '💥' },
          { id: 'network', label: '📡 Réseau', icon: '📡' },
          { id: 'bruteforce', label: '🔐 Bruteforce', icon: '🔐' },
          { id: 'reports', label: '📊 Rapports', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <div className="main-container">
        {/* Contenu principal */}
        <main className="main-content">
          {activeTab === 'reconnaissance' && <ReconnaissancePanel addLog={addLog} tasks={tasks} setTasks={setTasks} />}
          {activeTab === 'exploitation' && <ExploitationPanel addLog={addLog} tasks={tasks} setTasks={setTasks} />}
          {activeTab === 'network' && <NetworkPanel addLog={addLog} tasks={tasks} setTasks={setTasks} />}
          {activeTab === 'bruteforce' && <BruteforcePanel addLog={addLog} tasks={tasks} setTasks={setTasks} />}
          {activeTab === 'reports' && <ReportsPanel addLog={addLog} />}
        </main>

        {/* Panneau de logs */}
        <aside className="logs-panel">
          <h3>📋 Logs d'activité</h3>
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <div className="log-time">{log.timestamp.toLocaleTimeString()}</div>
                <div className="log-message">{log.message}</div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="no-logs">Aucune activité récente</div>
            )}
          </div>
        </aside>
      </div>

      {/* Panneau de tasks */}
      <TasksStatus tasks={tasks} />
    </div>
  );
}

// Composant Reconnaissance
function ReconnaissancePanel({ addLog, tasks, setTasks }) {
  const [target, setTarget] = useState('printnightmare.thm');
  const [scanType, setScanType] = useState('printnightmare');

  const startNmapScan = async () => {
    try {
      const response = await fetch(`${API_URL}/recon/nmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, scan_type: scanType })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks(prev => ({ ...prev, [data.task_id]: { ...data, type: 'nmap' } }));
        addLog(`🔍 Scan Nmap ${scanType} lancé sur ${target}`, 'success');
        pollTaskStatus(data.task_id);
      } else {
        addLog(`❌ Erreur Nmap: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  const startOpenVASScan = async () => {
    try {
      const response = await fetch(`${API_URL}/recon/openvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks(prev => ({ ...prev, [data.task_id]: { ...data, type: 'openvas' } }));
        addLog(`🔒 Scan OpenVAS lancé sur ${target}`, 'success');
        pollTaskStatus(data.task_id);
      } else {
        addLog(`❌ Erreur OpenVAS: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  const searchExploits = async () => {
    try {
      const response = await fetch(`${API_URL}/recon/searchsploit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'print nightmare CVE-2021-34527' })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`📚 ${data.count} exploits trouvés pour Print Nightmare`, 'success');
      } else {
        addLog(`❌ Erreur SearchSploit: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  const pollTaskStatus = async (taskId) => {
    // Polling simple du statut des tâches
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/task/${taskId}/status`);
        const data = await response.json();
        
        if (data.status === 'completed' || data.status === 'failed') {
          setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], ...data } }));
          addLog(`✅ Tâche ${taskId} terminée: ${data.status}`, data.status === 'completed' ? 'success' : 'error');
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 5000);
  };

  return (
    <div className="panel">
      <h2>🔍 Phase de Reconnaissance</h2>
      
      <div className="section">
        <h3>Configuration</h3>
        <div className="form-group">
          <label>Cible:</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="printnightmare.thm"
          />
        </div>
        
        <div className="form-group">
          <label>Type de scan Nmap:</label>
          <select value={scanType} onChange={(e) => setScanType(e.target.value)}>
            <option value="printnightmare">Print Nightmare (SMB + RPC)</option>
            <option value="quick">Scan rapide</option>
            <option value="full">Scan complet</option>
            <option value="stealth">Scan furtif</option>
            <option value="vuln">Détection de vulnérabilités</option>
          </select>
        </div>
      </div>

      <div className="section">
        <h3>Actions</h3>
        <div className="button-group">
          <button className="btn btn-primary" onClick={startNmapScan}>
            🔍 Scan Nmap
          </button>
          <button className="btn btn-secondary" onClick={startOpenVASScan}>
            🔒 Scan OpenVAS
          </button>
          <button className="btn btn-info" onClick={searchExploits}>
            📚 SearchSploit
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Print Nightmare - Informations</h3>
        <div className="info-card">
          <h4>CVE-2021-34527 / CVE-2021-1675</h4>
          <p><strong>Description:</strong> Vulnérabilité critique dans le Windows Print Spooler permettant l'élévation de privilèges et l'exécution de code à distance.</p>
          <p><strong>Ports cibles:</strong> 135 (RPC), 139/445 (SMB), 3389 (RDP)</p>
          <p><strong>Services:</strong> Print Spooler, RPC Endpoint Mapper</p>
        </div>
      </div>
    </div>
  );
}

// Composant Exploitation
function ExploitationPanel({ addLog, tasks, setTasks }) {
  const [selectedExploit, setSelectedExploit] = useState('cve_2021_34527');
  const [payload, setPayload] = useState('windows/x64/meterpreter/reverse_tcp');
  const [lhost, setLhost] = useState('172.20.0.2');

  const exploits = {
    'cve_2021_34527': {
      name: 'Print Nightmare (CVE-2021-34527)',
      description: 'Exploitation via RPC Print Spooler',
      msf_module: 'exploit/windows/dcerpc/cve_2021_34527_printnightmare'
    },
    'cve_2021_1675': {
      name: 'Print Nightmare Local (CVE-2021-1675)', 
      description: 'Élévation de privilèges locale',
      msf_module: 'exploit/windows/local/cve_2021_1675_printnightmare'
    }
  };

  const runExploit = async () => {
    if (!window.confirm('⚠️ Confirmer l\'exécution de l\'exploit sur la cible autorisée?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/exploit/metasploit/exploit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exploit: selectedExploit,
          target: 'printnightmare.thm',
          payload,
          lhost,
          confirm_authorization: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks(prev => ({ ...prev, [data.task_id]: { ...data, type: 'exploit' } }));
        addLog(`💥 Exploit ${selectedExploit} lancé`, 'warning');
      } else {
        addLog(`❌ Erreur exploitation: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  const generatePayload = async () => {
    try {
      const response = await fetch(`${API_URL}/exploit/metasploit/payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, lhost, lport: '4444', format: 'exe' })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`🎯 Payload généré: ${data.output_file.filename}`, 'success');
      } else {
        addLog(`❌ Erreur génération payload: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  return (
    <div className="panel">
      <h2>💥 Phase d'Exploitation</h2>
      
      <div className="section">
        <h3>Configuration d'attaque</h3>
        <div className="form-group">
          <label>Exploit:</label>
          <select value={selectedExploit} onChange={(e) => setSelectedExploit(e.target.value)}>
            {Object.entries(exploits).map(([key, exploit]) => (
              <option key={key} value={key}>{exploit.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Payload:</label>
          <select value={payload} onChange={(e) => setPayload(e.target.value)}>
            <option value="windows/x64/meterpreter/reverse_tcp">Meterpreter Reverse TCP (x64)</option>
            <option value="windows/meterpreter/reverse_tcp">Meterpreter Reverse TCP (x86)</option>
            <option value="windows/x64/shell/reverse_tcp">Shell Reverse TCP (x64)</option>
            <option value="windows/shell/reverse_tcp">Shell Reverse TCP (x86)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>LHOST (IP d'écoute):</label>
          <input
            type="text"
            value={lhost}
            onChange={(e) => setLhost(e.target.value)}
            placeholder="172.20.0.2"
          />
        </div>
      </div>

      <div className="section">
        <h3>Actions d'exploitation</h3>
        <div className="button-group">
          <button className="btn btn-danger" onClick={runExploit}>
            💥 Lancer l'exploit
          </button>
          <button className="btn btn-warning" onClick={generatePayload}>
            🎯 Générer payload
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Détails de l'exploit sélectionné</h3>
        {selectedExploit && (
          <div className="info-card">
            <h4>{exploits[selectedExploit].name}</h4>
            <p><strong>Description:</strong> {exploits[selectedExploit].description}</p>
            <p><strong>Module Metasploit:</strong> <code>{exploits[selectedExploit].msf_module}</code></p>
            <p><strong>Cible:</strong> printnightmare.thm</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Réseau
function NetworkPanel({ addLog, tasks, setTasks }) {
  const [interface_, setInterface] = useState('eth0');
  const [duration, setDuration] = useState(300);
  const [filter, setFilter] = useState('host printnightmare.thm');

  const startCapture = async () => {
    try {
      const response = await fetch(`${API_URL}/network/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: interface_, duration, filter })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks(prev => ({ ...prev, [data.task_id]: { ...data, type: 'capture' } }));
        addLog(`📡 Capture réseau démarrée sur ${interface_} (${duration}s)`, 'success');
      } else {
        addLog(`❌ Erreur capture: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  const analyzeCapture = async (filename) => {
    try {
      const response = await fetch(`${API_URL}/network/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pcap_file: filename })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`🔍 Analyse de ${filename} terminée`, 'success');
      } else {
        addLog(`❌ Erreur analyse: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  return (
    <div className="panel">
      <h2>📡 Capture et Analyse Réseau</h2>
      
      <div className="section">
        <h3>Configuration de capture</h3>
        <div className="form-group">
          <label>Interface réseau:</label>
          <select value={interface_} onChange={(e) => setInterface(e.target.value)}>
            <option value="eth0">eth0 (Ethernet principal)</option>
            <option value="any">any (Toutes interfaces)</option>
            <option value="docker0">docker0 (Interface Docker)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Durée (secondes):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min="30"
            max="3600"
          />
        </div>
        
        <div className="form-group">
          <label>Filtre de capture:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="host printnightmare.thm">Trafic Print Nightmare</option>
            <option value="port 445 or port 135 or port 139">Ports SMB/RPC</option>
            <option value="tcp port 445">SMB seulement</option>
            <option value="tcp port 135">RPC seulement</option>
            <option value="">Tout le trafic</option>
          </select>
        </div>
      </div>

      <div className="section">
        <h3>Actions de capture</h3>
        <div className="button-group">
          <button className="btn btn-primary" onClick={startCapture}>
            📡 Démarrer capture
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Filtres prédéfinis Print Nightmare</h3>
        <div className="filter-presets">
          <button 
            className="btn btn-small" 
            onClick={() => setFilter('tcp port 445 and (tcp[tcpflags] & tcp-syn != 0)')}
          >
            SMB Connections
          </button>
          <button 
            className="btn btn-small" 
            onClick={() => setFilter('tcp port 135 and dcerpc')}
          >
            RPC Print Spooler
          </button>
          <button 
            className="btn btn-small" 
            onClick={() => setFilter('smb2 and smb2.cmd == 5')}
          >
            SMB2 Tree Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Bruteforce
function BruteforcePanel({ addLog, tasks, setTasks }) {
  const [service, setService] = useState('smb');
  const [username, setUsername] = useState('administrator');
  const [wordlist, setWordlist] = useState('rockyou');
  const [target, setTarget] = useState('printnightmare.thm');

  const startBruteforce = async () => {
    if (!window.confirm('⚠️ Confirmer l\'attaque par force brute sur la cible autorisée?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bruteforce/hydra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          service,
          username,
          wordlist,
          confirm_authorization: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks(prev => ({ ...prev, [data.task_id]: { ...data, type: 'bruteforce' } }));
        addLog(`🔐 Attaque Hydra lancée: ${service}://${username}@${target}`, 'warning');
      } else {
        addLog(`❌ Erreur bruteforce: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
  };

  return (
    <div className="panel">
      <h2>🔐 Attaques par Force Brute</h2>
      
      <div className="section">
        <h3>Configuration d'attaque</h3>
        <div className="form-group">
          <label>Service cible:</label>
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="smb">SMB (445)</option>
            <option value="rdp">RDP (3389)</option>
            <option value="ssh">SSH (22)</option>
            <option value="ftp">FTP (21)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Nom d'utilisateur:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="administrator"
          />
        </div>
        
        <div className="form-group">
          <label>Wordlist:</label>
          <select value={wordlist} onChange={(e) => setWordlist(e.target.value)}>
            <option value="rockyou">RockYou (populaire)</option>
            <option value="common">Mots de passe communs</option>
            <option value="passwords">FastTrack</option>
          </select>
        </div>

        <div className="form-group">
          <label>Cible:</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="printnightmare.thm"
          />
        </div>
      </div>

      <div className="section">
        <h3>Actions de bruteforce</h3>
        <div className="button-group">
          <button className="btn btn-warning" onClick={startBruteforce}>
            🔐 Lancer attaque Hydra
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Comptes Print Nightmare courants</h3>
        <div className="common-accounts">
          <div className="account-card">
            <h4>Comptes Windows par défaut</h4>
            <ul>
              <li><code>administrator</code> / <code>admin</code></li>
              <li><code>guest</code></li>
              <li><code>support</code></li>
            </ul>
          </div>
          <div className="account-card">
            <h4>Mots de passe courants</h4>
            <ul>
              <li><code>password</code></li>
              <li><code>admin</code></li>
              <li><code>123456</code></li>
              <li><code>P@ssw0rd</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Rapports
function ReportsPanel({ addLog }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/list`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
        addLog(`📊 ${data.reports?.length || 0} rapports chargés`, 'info');
      }
    } catch (error) {
      addLog(`❌ Erreur chargement rapports: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const deleteReport = async (filename) => {
    if (!window.confirm(`Supprimer le rapport ${filename}?`)) return;

    try {
      const response = await fetch(`${API_URL}/reports/delete/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReports(prev => prev.filter(r => r.filename !== filename));
        addLog(`🗑️ Rapport ${filename} supprimé`, 'success');
      }
    } catch (error) {
      addLog(`❌ Erreur suppression: ${error.message}`, 'error');
    }
  };

  if (loading) return <div className="loading">Chargement des rapports...</div>;

  return (
    <div className="panel">
      <h2>📊 Gestionnaire de Rapports</h2>
      
      <div className="section">
        <h3>Rapports disponibles ({reports.length})</h3>
        {reports.length === 0 ? (
          <div className="no-reports">
            📄 Aucun rapport généré pour le moment
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report, index) => (
              <div key={index} className="report-card">
                <div className="report-header">
                  <h4>{getReportIcon(report.type)} {report.filename}</h4>
                  <div className="report-actions">
                    <a 
                      href={report.download_url}
                      className="btn btn-small btn-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📥 Télécharger
                    </a>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => deleteReport(report.filename)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="report-info">
                  <p><strong>Type:</strong> {report.type}</p>
                  <p><strong>Taille:</strong> {formatFileSize(report.size)}</p>
                  <p><strong>Créé:</strong> {new Date(report.created).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3>Actions</h3>
        <div className="button-group">
          <button className="btn btn-secondary" onClick={loadReports}>
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Statut des Tâches
function TasksStatus({ tasks }) {
  const activeTasks = Object.values(tasks).filter(task => 
    task.status === 'started' || task.status === 'running'
  );

  if (activeTasks.length === 0) return null;

  return (
    <div className="tasks-status">
      <h3>⚡ Tâches en cours ({activeTasks.length})</h3>
      <div className="tasks-list">
        {activeTasks.map(task => (
          <div key={task.task_id} className="task-item">
            <div className="task-info">
              <span className="task-type">{getTaskIcon(task.type)} {task.type}</span>
              <span className="task-target">{task.target}</span>
            </div>
            <div className="task-status">
              <div className="spinner"></div>
              <span>{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fonctions utilitaires
function getReportIcon(type) {
  const icons = {
    nmap: '🔍',
    openvas: '🔒',
    metasploit: '💥',
    hydra: '🔐',
    tcpdump: '📡'
  };
  return icons[type] || '📄';
}

function getTaskIcon(type) {
  const icons = {
    nmap: '🔍',
    openvas: '🔒',
    exploit: '💥',
    bruteforce: '🔐',
    capture: '📡'
  };
  return icons[type] || '⚡';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default App;