import React, { useState, useEffect } from 'react';
import './App.css';

// Configuration API avec détection d'environnement
const getApiUrl = () => {
  // En développement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // En production/Docker
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const API_URL = getApiUrl();
console.log('🔧 Configuration API:', API_URL);

// Classe pour gérer les appels API avec retry et gestion d'erreurs
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      mode: 'cors',
      credentials: 'omit',
      ...options
    };

    console.log(`🌐 Requête: ${options.method || 'GET'} ${url}`);

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Réponse reçue (tentative ${attempt}):`, data);
        return data;

      } catch (error) {
        console.error(`❌ Erreur tentative ${attempt}/${this.retryCount}:`, error);
        
        if (attempt === this.retryCount) {
          throw error;
        }
        
        // Attente avant retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Méthodes utilitaires
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Instance API globale
const apiClient = new ApiClient(API_URL);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('checking');
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Test de connectivité au démarrage et périodique
  useEffect(() => {
    testApiConnection();
    const interval = setInterval(testApiConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Polling des tâches actives
  useEffect(() => {
    if (apiStatus === 'connected') {
      const interval = setInterval(updateTasks, 5000);
      return () => clearInterval(interval);
    }
  }, [apiStatus]);

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      date: new Date().toLocaleDateString('fr-FR')
    };
    setLogs(prev => [log, ...prev.slice(0, 49)]); // Garde les 50 derniers logs
  };

  const testApiConnection = async () => {
    try {
      setApiStatus('checking');
      const response = await apiClient.get('/health');
      setApiStatus('connected');
      addLog('✅ API connectée avec succès', 'success');
      console.log('✅ API Health:', response);
    } catch (error) {
      setApiStatus('disconnected');
      addLog(`❌ API déconnectée: ${error.message}`, 'error');
      console.error('❌ Erreur API:', error);
    }
  };

  const updateTasks = async () => {
    try {
      const response = await apiClient.get('/scan/tasks');
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('⚠️ Erreur récupération tâches:', error);
    }
  };

  const startNmapScan = async (target, args = '-sV') => {
    if (!target.trim()) {
      addLog('❌ Veuillez spécifier une cible', 'error');
      return;
    }

    try {
      setLoading(true);
      addLog(`🔍 Démarrage scan Nmap: ${target}`, 'info');
      
      const response = await apiClient.post('/scan/nmap', {
        target: target.trim(),
        args: args.trim()
      });

      addLog(`✅ Scan démarré: ${response.task_id}`, 'success');
      updateTasks(); // Mise à jour immédiate
    } catch (error) {
      addLog(`❌ Erreur scan Nmap: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startMasscanScan = async (target, ports = '1-1000', rate = '1000') => {
    if (!target.trim()) {
      addLog('❌ Veuillez spécifier une cible', 'error');
      return;
    }

    try {
      setLoading(true);
      addLog(`🚀 Démarrage scan Masscan: ${target}`, 'info');
      
      const response = await apiClient.post('/scan/masscan', {
        target: target.trim(),
        ports: ports.trim(),
        rate: rate.trim()
      });

      addLog(`✅ Scan démarré: ${response.task_id}`, 'success');
      updateTasks();
    } catch (error) {
      addLog(`❌ Erreur scan Masscan: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTaskDetails = async (taskId) => {
    try {
      const response = await apiClient.get(`/scan/status/${taskId}`);
      return response;
    } catch (error) {
      console.error('Erreur récupération détails tâche:', error);
      return null;
    }
  };

  // Composants de l'interface
  const StatusIndicator = () => (
    <div className={`status-indicator ${apiStatus}`}>
      <div className="status-dot"></div>
      <span>
        {apiStatus === 'connected' && '✅ API Connectée'}
        {apiStatus === 'disconnected' && '❌ API Déconnectée'}
        {apiStatus === 'checking' && '🔄 Vérification...'}
      </span>
      <button onClick={testApiConnection} className="test-btn">
        Test
      </button>
    </div>
  );

  const LogsPanel = () => (
    <div className="logs-panel">
      <h3>Logs d'activité</h3>
      <div className="logs-container">
        {logs.map(log => (
          <div key={log.id} className={`log-entry ${log.type}`}>
            <span className="log-time">{log.timestamp}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="log-entry info">
            <span className="log-message">Aucun log pour le moment</span>
          </div>
        )}
      </div>
    </div>
  );

  const ScanModule = () => {
    const [nmapTarget, setNmapTarget] = useState('');
    const [nmapArgs, setNmapArgs] = useState('-sV');
    const [masscanTarget, setMasscanTarget] = useState('');
    const [masscanPorts, setMasscanPorts] = useState('1-1000');
    const [masscanRate, setMasscanRate] = useState('1000');

    return (
      <div className="scan-module">
        <h2>🔍 Module de Scan</h2>
        
        <div className="scan-section">
          <h3>Nmap Scanner</h3>
          <div className="scan-form">
            <input
              type="text"
              placeholder="Cible (ex: 192.168.1.1, localhost)"
              value={nmapTarget}
              onChange={(e) => setNmapTarget(e.target.value)}
              className="scan-input"
            />
            <input
              type="text"
              placeholder="Arguments Nmap (ex: -sV -sC)"
              value={nmapArgs}
              onChange={(e) => setNmapArgs(e.target.value)}
              className="scan-input"
            />
            <button
              onClick={() => startNmapScan(nmapTarget, nmapArgs)}
              disabled={loading || apiStatus !== 'connected'}
              className="scan-button"
            >
              {loading ? '🔄 Démarrage...' : '🚀 Lancer Nmap'}
            </button>
          </div>
        </div>

        <div className="scan-section">
          <h3>Masscan Scanner</h3>
          <div className="scan-form">
            <input
              type="text"
              placeholder="Cible"
              value={masscanTarget}
              onChange={(e) => setMasscanTarget(e.target.value)}
              className="scan-input"
            />
            <input
              type="text"
              placeholder="Ports (ex: 1-1000)"
              value={masscanPorts}
              onChange={(e) => setMasscanPorts(e.target.value)}
              className="scan-input"
            />
            <input
              type="text"
              placeholder="Rate (ex: 1000)"
              value={masscanRate}
              onChange={(e) => setMasscanRate(e.target.value)}
              className="scan-input"
            />
            <button
              onClick={() => startMasscanScan(masscanTarget, masscanPorts, masscanRate)}
              disabled={loading || apiStatus !== 'connected'}
              className="scan-button"
            >
              {loading ? '🔄 Démarrage...' : '🚀 Lancer Masscan'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TasksPanel = () => (
    <div className="tasks-panel">
      <h3>Tâches Actives ({tasks.length})</h3>
      <div className="tasks-container">
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.status}`}>
            <div className="task-header">
              <span className="task-type">{task.type}</span>
              <span className={`task-status ${task.status}`}>
                {task.status === 'running' && '🔄'}
                {task.status === 'completed' && '✅'}
                {task.status === 'failed' && '❌'}
                {task.status === 'created' && '📝'}
                {task.status}
              </span>
            </div>
            <div className="task-details">
              <p><strong>Cible:</strong> {task.data?.target}</p>
              <p><strong>Créé:</strong> {new Date(task.created_at).toLocaleString('fr-FR')}</p>
              {task.updated_at && (
                <p><strong>Mis à jour:</strong> {new Date(task.updated_at).toLocaleString('fr-FR')}</p>
              )}
              {task.result && (
                <div className="task-result">
                  <p><strong>Résultat:</strong></p>
                  <p>Ports ouverts: {task.result.open_ports?.length || 0}</p>
                  {task.result.report_file && (
                    <a href={`${API_URL}/download/${task.result.report_file.split('/').pop()}`} 
                       target="_blank" rel="noopener noreferrer">
                      📄 Télécharger le rapport
                    </a>
                  )}
                </div>
              )}
              {task.error && (
                <div className="task-error">
                  <p><strong>Erreur:</strong> {task.error}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="no-tasks">
            <p>Aucune tâche active</p>
          </div>
        )}
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Statut API</h3>
          <StatusIndicator />
        </div>
        <div className="stat-card">
          <h3>Tâches Actives</h3>
          <div className="stat-number">{tasks.length}</div>
        </div>
        <div className="stat-card">
          <h3>Dernière Activité</h3>
          <div className="stat-text">
            {logs.length > 0 ? logs[0].timestamp : 'Aucune'}
          </div>
        </div>
      </div>
      <div className="dashboard-content">
        <TasksPanel />
        <LogsPanel />
      </div>
    </div>
  );

  const TabNavigation = () => (
    <nav className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        📊 Dashboard
      </button>
      <button
        className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
        onClick={() => setActiveTab('scan')}
      >
        🔍 Scan
      </button>
      <button
        className={`tab-button ${activeTab === 'recon' ? 'active' : ''}`}
        onClick={() => setActiveTab('recon')}
      >
        🕵️ Reconnaissance
      </button>
      <button
        className={`tab-button ${activeTab === 'exploit' ? 'active' : ''}`}
        onClick={() => setActiveTab('exploit')}
      >
        💥 Exploitation
      </button>
      <button
        className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
        onClick={() => setActiveTab('reports')}
      >
        📊 Rapports
      </button>
    </nav>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scan':
        return <ScanModule />;
      case 'recon':
        return <div className="module"><h2>🕵️ Module Reconnaissance</h2><p>En développement...</p></div>;
      case 'exploit':
        return <div className="module"><h2>💥 Module Exploitation</h2><p>En développement...</p></div>;
      case 'reports':
        return <div className="module"><h2>📊 Module Rapports</h2><p>En développement...</p></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🛡️ Pacha Toolbox</h1>
        <div className="header-info">
          <StatusIndicator />
        </div>
      </header>
      
      <TabNavigation />
      
      <main className="app-main">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;