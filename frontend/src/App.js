import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [apiStatus, setApiStatus] = useState('checking');
  const [logs, setLogs] = useState([]);

  // Test de connectivité API
  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setApiStatus('connected');
        addLog('✅ API connectée', 'success');
      } else {
        setApiStatus('error');
        addLog('❌ API erreur', 'error');
      }
    } catch (error) {
      setApiStatus('disconnected');
      addLog('❌ API déconnectée: ' + error.message, 'error');
    }
  };

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [log, ...prev.slice(0, 19)]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🛡️ Pacha Toolbox v2</h1>
        <div className="status-bar">
          <span className="target">🎯 Cible: printnightmare.thm</span>
          <span className={`api-status ${apiStatus}`}>
            {apiStatus === 'connected' && '🟢 API OK'}
            {apiStatus === 'disconnected' && '🔴 API KO'}
            {apiStatus === 'checking' && '🟡 Test...'}
            {apiStatus === 'error' && '🟠 Erreur'}
          </span>
        </div>
      </header>

      <nav className="navigation">
        {[
          { id: 'scan', label: '🔍 Scan', icon: '🔍' },
          { id: 'exploit', label: '💥 Exploit', icon: '💥' },
          { id: 'capture', label: '📡 Capture', icon: '📡' },
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
        <main className="main-content">
          {activeTab === 'scan' && <ScanPanel addLog={addLog} />}
          {activeTab === 'exploit' && <ExploitPanel addLog={addLog} />}
          {activeTab === 'capture' && <CapturePanel addLog={addLog} />}
          {activeTab === 'reports' && <ReportsPanel addLog={addLog} />}
        </main>

        <aside className="logs-panel">
          <h3>📋 Logs</h3>
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <div className="log-time">{log.timestamp}</div>
                <div className="log-message">{log.message}</div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="no-logs">Aucune activité</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Composant Scan
function ScanPanel({ addLog }) {
  const [target, setTarget] = useState('127.0.0.1');
  const [scanning, setScanning] = useState(false);

  const startNmapScan = async () => {
    if (scanning) return;
    
    setScanning(true);
    addLog(`🔍 Démarrage scan Nmap: ${target}`, 'info');

    try {
      const response = await fetch(`${API_URL}/scan/nmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, args: '-sV' })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`✅ Scan lancé: ${data.scan_id}`, 'success');
      } else {
        addLog(`❌ Erreur: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error.message}`, 'error');
    }
    
    setScanning(false);
  };

  return (
    <div className="panel">
      <h2>🔍 Scanner Réseau</h2>
      
      <div className="form-group">
        <label>Cible:</label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="127.0.0.1 ou printnightmare.thm"
        />
      </div>
      
      <div className="button-group">
        <button 
          className="btn btn-primary" 
          onClick={startNmapScan}
          disabled={scanning}
        >
          {scanning ? '⏳ Scan...' : '🔍 Scan Nmap'}
        </button>
      </div>
    </div>
  );
}

// Composant Exploit
function ExploitPanel({ addLog }) {
  return (
    <div className="panel">
      <h2>💥 Exploitation</h2>
      <div className="info-card">
        <h4>Print Nightmare (CVE-2021-34527)</h4>
        <p>Module d'exploitation pour la vulnérabilité Print Spooler de Windows.</p>
        <button className="btn btn-warning">🚀 Lancer exploit</button>
      </div>
    </div>
  );
}

// Composant Capture
function CapturePanel({ addLog }) {
  const [capturing, setCapturing] = useState(false);

  const startCapture = async () => {
    setCapturing(true);
    addLog('📡 Démarrage capture tcpdump', 'info');
    
    try {
      const response = await fetch(`${API_URL}/network/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interface: 'eth0', 
          duration: 60,
          filter_type: 'smb_rpc' 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`✅ Capture démarrée: ${data.capture_id}`, 'success');
        setTimeout(() => setCapturing(false), 60000);
      } else {
        addLog(`❌ Erreur capture: ${data.error}`, 'error');
        setCapturing(false);
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error');
      setCapturing(false);
    }
  };

  return (
    <div className="panel">
      <h2>📡 Capture Réseau</h2>
      <div className="form-group">
        <p>Capture tcpdump optimisée pour Print Nightmare</p>
        <button 
          className="btn btn-primary" 
          onClick={startCapture}
          disabled={capturing}
        >
          {capturing ? '⏳ Capture...' : '📡 Capturer (60s)'}
        </button>
      </div>
    </div>
  );
}

// Composant Reports
function ReportsPanel({ addLog }) {
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/list`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
        addLog(`📊 ${data.reports?.length || 0} rapports trouvés`, 'success');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="panel">
      <h2>📊 Rapports</h2>
      <button className="btn btn-secondary" onClick={loadReports}>
        🔄 Actualiser
      </button>
      
      <div className="reports-list">
        {reports.length === 0 ? (
          <p>Aucun rapport trouvé</p>
        ) : (
          reports.map((report, i) => (
            <div key={i} className="report-item">
              <span>{report.filename}</span>
              <a href={report.download_url} className="btn btn-small">📥</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;