import React, { useState, useEffect } from 'react';
import './App.css';

// Configuration API avec détection automatique
const getApiUrl = () => {
  // Détection de l'environnement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Pour Docker ou autres environnements
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const API_URL = getApiUrl();
const BACKEND_URL = API_URL.replace('/api', '');

console.log('🔧 API URL:', API_URL);

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [apiStatus, setApiStatus] = useState('checking');
  const [logs, setLogs] = useState([]);

  // Test de connectivité API amélioré
  useEffect(() => {
    testApiConnection();
    // Test périodique toutes les 30s
    const interval = setInterval(testApiConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const testApiConnection = async () => {
    try {
      console.log('🧪 Test API:', `${API_URL}/health`);
      
      // Essai avec fetch simple d'abord
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Data:', data);
        setApiStatus('connected');
        addLog('✅ API connectée', 'success');
      } else {
        console.log('❌ Response not OK:', response.status);
        setApiStatus('error');
        addLog(`❌ API erreur ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiStatus('disconnected');
      
      // Test de connectivité alternative
      try {
        const pingResponse = await fetch(`${BACKEND_URL}/`, { mode: 'no-cors' });
        addLog('⚠️ API accessible mais CORS bloqué', 'warning');
      } catch (pingError) {
        addLog(`❌ API totalement inaccessible`, 'error');
      }
    }
  };

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      date: new Date().toLocaleDateString('fr-FR')
    };
    setLogs(prev => [log, ...prev.slice(0, 29)]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <span className="shield">🛡️</span>
          <h1>Pacha Toolbox v2.0</h1>
          <span className="subtitle">Pentest Security Suite</span>
        </div>
        <div className="status-bar">
          <span className="target">🎯 Cible: printnightmare.thm</span>
          <span className={`api-status ${apiStatus}`}>
            {apiStatus === 'connected' && '🟢 API Online'}
            {apiStatus === 'disconnected' && '🔴 API Offline'}
            {apiStatus === 'checking' && '🟡 Checking...'}
            {apiStatus === 'error' && '🟠 API Error'}
          </span>
        </div>
      </header>

      <nav className="navigation">
        {[
          { id: 'scan', label: 'Scanner', icon: '🔍' },
          { id: 'exploit', label: 'Exploit', icon: '💥' },
          { id: 'capture', label: 'Capture', icon: '📡' },
          { id: 'reports', label: 'Rapports', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="main-container">
        <main className="main-content">
          {activeTab === 'scan' && <ScanPanel addLog={addLog} />}
          {activeTab === 'exploit' && <ExploitPanel addLog={addLog} />}
          {activeTab === 'capture' && <CapturePanel addLog={addLog} />}
          {activeTab === 'reports' && <ReportsPanel addLog={addLog} />}
        </main>

        <aside className="logs-panel">
          <div className="logs-header">
            <h3>📋 Logs en temps réel</h3>
            <button 
              className="clear-logs" 
              onClick={() => setLogs([])}
              title="Vider les logs"
            >
              🗑️
            </button>
          </div>
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <div className="log-header">
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-type">{getLogIcon(log.type)}</span>
                </div>
                <div className="log-message">{log.message}</div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="no-logs">
                <div className="no-logs-icon">📝</div>
                <div>Aucune activité récente</div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function getLogIcon(type) {
  switch(type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📝';
  }
}

// Composant Scan avec versioning intelligent
function ScanPanel({ addLog }) {
  const [target, setTarget] = useState('127.0.0.1');
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('basic');

  const scanProfiles = {
    basic: { name: 'Basic Scan', args: '-sn', icon: '🏃' },
    version: { name: 'Version Detection', args: '-sV', icon: '🔬' },
    stealth: { name: 'Stealth Scan', args: '-sS -T2', icon: '🥷' },
    aggressive: { name: 'Aggressive Scan', args: '-A -T4', icon: '⚡' },
    printnightmare: { name: 'Print Nightmare', args: '-p 135,139,445,3389 -sV --script smb-vuln*', icon: '🖨️' },
    os: { name: 'OS Detection', args: '-O -sV', icon: '💻' },
    ports: { name: 'Port Scan', args: '-p 1-65535 -sS', icon: '🔌' }
  };

  const startNmapScan = async () => {
    if (scanning) return;
    
    setScanning(true);
    const profile = scanProfiles[scanType];
    addLog(`🔍 Lancement ${profile.name} sur ${target}`, 'info');

    try {
      const response = await fetch(`${API_URL}/scan/nmap`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          target: target.trim(), 
          args: profile.args,
          scan_name: `Scan_nmap_${scanType}`,
          scan_type: scanType
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`✅ ${profile.name} lancé - ID: ${data.scan_id || 'N/A'}`, 'success');
        addLog(`📄 Rapport disponible sous: ${data.scan_name || 'N/A'}`, 'info');
      } else {
        addLog(`❌ Erreur scan: ${data.error || 'Erreur inconnue'}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
      console.error('Scan error:', error);
    }
    
    setScanning(false);
  };

  return (
    <div className="panel">
      <h2>🔍 Scanner de Réseau</h2>
      
      <div className="form-group">
        <label>🎯 Cible :</label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="127.0.0.1, printnightmare.thm, 192.168.1.0/24"
        />
      </div>

      <div className="form-group">
        <label>⚙️ Type de scan :</label>
        <div className="scan-types">
          {Object.entries(scanProfiles).map(([key, profile]) => (
            <label key={key} className="scan-option">
              <input
                type="radio"
                value={key}
                checked={scanType === key}
                onChange={(e) => setScanType(e.target.value)}
              />
              <span className="scan-label">
                <span className="scan-icon">{profile.icon}</span>
                <span className="scan-name">{profile.name}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="button-group">
        <button 
          className="btn btn-primary" 
          onClick={startNmapScan}
          disabled={scanning || !target.trim()}
        >
          {scanning ? (
            <>⏳ Scan en cours...</>
          ) : (
            <>🚀 Lancer {scanProfiles[scanType].name}</>
          )}
        </button>
      </div>

      <div className="scan-preview">
        <h4>📋 Commande à exécuter :</h4>
        <code>nmap {scanProfiles[scanType].args} {target}</code>
      </div>
    </div>
  );
}

// Composant Reports avec boutons PDF/HTML
function ReportsPanel({ addLog }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports/list`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
        addLog(`📊 ${data.reports?.length || 0} rapports trouvés`, 'success');
      } else {
        addLog(`❌ Erreur chargement rapports`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const downloadReport = (filename, format = 'original') => {
    let url;
    
    if (format === 'pdf') {
      // Conversion PDF côté backend
      url = `${BACKEND_URL}/api/reports/export/${filename}?format=pdf`;
      addLog(`📄 Génération PDF: ${filename}`, 'info');
    } else {
      // Téléchargement direct
      url = `${BACKEND_URL}/api/download/${filename}`;
      addLog(`📥 Téléchargement: ${filename}`, 'info');
    }
    
    window.open(url, '_blank');
  };

  const getReportType = (filename) => {
    if (filename.includes('nmap')) return { icon: '🔍', type: 'Nmap Scan' };
    if (filename.includes('masscan')) return { icon: '⚡', type: 'Masscan' };
    if (filename.includes('openvas')) return { icon: '🛡️', type: 'OpenVAS' };
    if (filename.includes('capture')) return { icon: '📡', type: 'Capture' };
    return { icon: '📄', type: 'Rapport' };
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="panel">
      <h2>📊 Rapports Générés</h2>
      
      <div className="button-group">
        <button 
          className="btn btn-secondary" 
          onClick={loadReports}
          disabled={loading}
        >
          {loading ? '⏳ Chargement...' : '🔄 Actualiser'}
        </button>
      </div>
      
      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="no-reports">
            <div className="no-reports-icon">📄</div>
            <div>Aucun rapport généré</div>
            <small>Lancez un scan pour créer des rapports</small>
          </div>
        ) : (
          reports.map((report, i) => {
            const reportType = getReportType(report.filename);
            const isHtml = report.filename.endsWith('.html');
            
            return (
              <div key={i} className="report-item">
                <div className="report-info">
                  <div className="report-header">
                    <span className="report-icon">{reportType.icon}</span>
                    <span className="report-type">{reportType.type}</span>
                  </div>
                  <span className="report-name">{report.filename}</span>
                  <span className="report-size">{formatFileSize(report.size)}</span>
                </div>
                <div className="report-actions">
                  <button 
                    className="btn btn-small"
                    onClick={() => downloadReport(report.filename)}
                    title="Télécharger le fichier original"
                  >
                    📥 Original
                  </button>
                  {isHtml && (
                    <button 
                      className="btn btn-small btn-pdf"
                      onClick={() => downloadReport(report.filename, 'pdf')}
                      title="Convertir en PDF"
                    >
                      📄 PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Composants Capture et Exploit (simplifiés)
function CapturePanel({ addLog }) {
  const [capturing, setCapturing] = useState(false);
  const [duration, setDuration] = useState(60);

  const startCapture = async () => {
    setCapturing(true);
    addLog(`📡 Démarrage capture tcpdump (${duration}s)`, 'info');
    
    setTimeout(() => {
      setCapturing(false);
      addLog(`🏁 Capture terminée`, 'success');
    }, duration * 1000);
  };

  return (
    <div className="panel">
      <h2>📡 Capture Réseau</h2>
      <div className="form-group">
        <label>⏱️ Durée (secondes) :</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Math.max(10, parseInt(e.target.value) || 60))}
          min="10"
          max="300"
        />
      </div>
      <button 
        className="btn btn-primary" 
        onClick={startCapture}
        disabled={capturing}
      >
        {capturing ? '⏳ Capture...' : '📡 Démarrer'}
      </button>
    </div>
  );
}

function ExploitPanel({ addLog }) {
  return (
    <div className="panel">
      <h2>💥 Exploitation</h2>
      <div className="info-card">
        <h4>🖨️ Print Nightmare (CVE-2021-34527)</h4>
        <p>Module d'exploitation en développement</p>
        <button className="btn btn-warning">🚀 Bientôt disponible</button>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default App;