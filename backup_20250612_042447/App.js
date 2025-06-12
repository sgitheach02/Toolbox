// frontend/src/App.js - Version améliorée avec sélection de scans et téléchargements
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [tasks, setTasks] = useState([]);
  const [scanTypes, setScanTypes] = useState({});
  const [reports, setReports] = useState([]);
  const [scanForm, setScanForm] = useState({
    tool: 'nmap',
    scan_type: 'basic',
    target: '127.0.0.1',
    custom_args: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');

  // Test de connexion API
  const testApiConnection = async () => {
    try {
      console.log('🔗 Test connexion API:', API_URL);
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connectée:', data);
        setApiStatus('connected');
        
        // Charger les types de scans
        await loadScanTypes();
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('❌ Erreur connexion API:', error);
      setApiStatus('error');
    }
  };

  // Chargement des types de scans
  const loadScanTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/scan/types`);
      if (response.ok) {
        const data = await response.json();
        setScanTypes(data.scan_types);
        console.log('📋 Types de scans chargés:', data.scan_types);
      }
    } catch (error) {
      console.error('❌ Erreur chargement types de scans:', error);
    }
  };

  // Chargement de l'historique des scans
  const loadScansHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/scans/history`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.scans);
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
    }
  };

  // Chargement des rapports
  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/list`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
    }
  };

  // Initialisation
  useEffect(() => {
    testApiConnection();
  }, []);

  // Chargement des données selon l'onglet actif
  useEffect(() => {
    if (apiStatus === 'connected') {
      if (activeTab === 'history') {
        loadScansHistory();
      } else if (activeTab === 'reports') {
        loadReports();
      }
    }
  }, [activeTab, apiStatus]);

  // Soumission de scan
  const handleScanSubmit = async (e) => {
    e.preventDefault();
    
    if (!scanForm.target.trim()) {
      alert('Veuillez saisir une cible');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Lancement scan:', scanForm);
      
      const payload = {
        target: scanForm.target,
        scan_type: scanForm.scan_type
      };

      // Ajouter les arguments personnalisés si fournis
      if (scanForm.custom_args.trim()) {
        payload.args = scanForm.custom_args;
      }
      
      const response = await fetch(`${API_URL}/scan/${scanForm.tool}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Résultat scan:', result);
        
        // Ajouter à l'historique local
        setTasks(prev => [result, ...prev]);
        
        // Reset formulaire
        setScanForm({
          tool: 'nmap',
          scan_type: 'basic',
          target: '127.0.0.1',
          custom_args: ''
        });
        
        alert('✅ Scan terminé avec succès! Rapport généré.');
      } else {
        const error = await response.json();
        console.error('❌ Erreur scan:', error);
        alert(`Erreur: ${error.error || 'Scan échoué'}`);
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement de rapport
  const downloadReport = (filename) => {
    const downloadUrl = `${API_URL}/reports/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Test API manuel
  const handleApiTest = async () => {
    try {
      const response = await fetch(`${API_URL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'frontend-connection', timestamp: new Date().toISOString() })
      });
      
      const result = await response.json();
      console.log('🧪 Test API réussi:', result);
      alert('✅ Test API réussi! Voir la console pour les détails.');
    } catch (error) {
      console.error('❌ Erreur test API:', error);
      alert('❌ Erreur test API');
    }
  };

  // Obtenir les types de scans pour l'outil sélectionné
  const getAvailableScanTypes = () => {
    return scanTypes[scanForm.tool] || {};
  };

  // Obtenir les infos du type de scan sélectionné
  const getCurrentScanTypeInfo = () => {
    const available = getAvailableScanTypes();
    return available[scanForm.scan_type] || { name: '', description: '', args: '' };
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <h1>🛡️ Pacha Toolbox</h1>
        <div className="header-controls">
          <div className={`status-indicator ${apiStatus}`}>
            <div className="status-dot"></div>
            <span>
              {apiStatus === 'connected' ? 'API Connectée' : 
               apiStatus === 'error' ? 'API Erreur' : 'Vérification...'}
            </span>
          </div>
          <button onClick={handleApiTest} className="test-btn">
            🧪 Test API
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          🔍 Nouveau Scan
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Historique ({tasks.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Rapports ({reports.length})
        </button>
      </nav>

      {/* Contenu principal */}
      <main className="app-main">
        
        {/* Onglet Nouveau Scan */}
        {activeTab === 'scan' && (
          <section className="scan-module">
            <h2>🔍 Nouveau Scan</h2>
            <form onSubmit={handleScanSubmit} className="scan-form">
              
              {/* Sélection de l'outil */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tool">Outil de scan:</label>
                  <select 
                    id="tool"
                    value={scanForm.tool} 
                    onChange={(e) => setScanForm(prev => ({...prev, tool: e.target.value, scan_type: 'basic'}))}
                    className="scan-input"
                  >
                    <option value="nmap">🗺️ Nmap - Port Scanner</option>
                    <option value="nikto">🕷️ Nikto - Web Scanner</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="target">Cible:</label>
                  <input 
                    type="text" 
                    id="target"
                    value={scanForm.target}
                    onChange={(e) => setScanForm(prev => ({...prev, target: e.target.value}))}
                    placeholder="Ex: 127.0.0.1, localhost"
                    className="scan-input"
                    required
                  />
                </div>
              </div>

              {/* Sélection du type de scan */}
              <div className="form-group">
                <label htmlFor="scan_type">Type de scan:</label>
                <select
                  id="scan_type"
                  value={scanForm.scan_type}
                  onChange={(e) => setScanForm(prev => ({...prev, scan_type: e.target.value}))}
                  className="scan-input"
                >
                  {Object.entries(getAvailableScanTypes()).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.name} - {info.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informations sur le type de scan sélectionné */}
              {getCurrentScanTypeInfo().name && (
                <div className="scan-type-info">
                  <h4>{getCurrentScanTypeInfo().icon} {getCurrentScanTypeInfo().name}</h4>
                  <p><strong>Description:</strong> {getCurrentScanTypeInfo().description}</p>
                  <p><strong>Arguments par défaut:</strong> <code>{getCurrentScanTypeInfo().args}</code></p>
                </div>
              )}
              
              {/* Arguments personnalisés */}
              <div className="form-group">
                <label htmlFor="custom_args">Arguments personnalisés (optionnel):</label>
                <input 
                  type="text" 
                  id="custom_args"
                  value={scanForm.custom_args}
                  onChange={(e) => setScanForm(prev => ({...prev, custom_args: e.target.value}))}
                  placeholder={`Laisser vide pour utiliser: ${getCurrentScanTypeInfo().args || 'arguments par défaut'}`}
                  className="scan-input"
                />
                <small className="form-help">
                  💡 Si fourni, remplace les arguments par défaut du type de scan sélectionné
                </small>
              </div>
              
              <button 
                type="submit" 
                className="scan-button"
                disabled={loading || apiStatus !== 'connected'}
              >
                {loading ? '⏳ Scan en cours...' : `🚀 Lancer ${getCurrentScanTypeInfo().name || 'le Scan'}`}
              </button>
            </form>
          </section>
        )}

        {/* Onglet Historique */}
        {activeTab === 'history' && (
          <section className="tasks-panel">
            <h3>📊 Historique des Scans ({tasks.length})</h3>
            
            {tasks.length === 0 ? (
              <div className="no-tasks">
                <p>Aucun scan dans l'historique. Lancez votre premier scan!</p>
              </div>
            ) : (
              <div className="tasks-container">
                {tasks.map((task, index) => (
                  <div key={index} className={`task-item ${task.status}`}>
                    <div className="task-header">
                      <span className="task-type">
                        {task.scan_type_info?.icon} {task.tool.toUpperCase()} - {task.scan_type_info?.name}
                      </span>
                      <span className={`task-status ${task.status}`}>
                        {task.status === 'completed' ? 'TERMINÉ' : 
                         task.status === 'running' ? 'EN COURS' : 
                         task.status === 'failed' ? 'ÉCHEC' : task.status}
                      </span>
                    </div>
                    
                    <div className="task-details">
                      <p><strong>Cible:</strong> {task.target}</p>
                      <p><strong>ID:</strong> {task.scan_id}</p>
                      <p><strong>Date:</strong> {new Date(task.timestamp).toLocaleString()}</p>
                      <p><strong>Type:</strong> {task.scan_type_info?.description}</p>
                      {task.message && <p><strong>Message:</strong> {task.message}</p>}
                      
                      {task.results && Object.keys(task.results).length > 0 && (
                        <div className="task-result">
                          <p><strong>Résultats:</strong></p>
                          {task.results.ports_open && (
                            <p>• Ports ouverts: {Array.isArray(task.results.ports_open) ? 
                              task.results.ports_open.join(', ') : task.results.ports_open}</p>
                          )}
                          {task.results.vulnerabilities && (
                            <p>• Vulnérabilités: {Array.isArray(task.results.vulnerabilities) ? 
                              task.results.vulnerabilities.join(', ') : task.results.vulnerabilities}</p>
                          )}
                          {task.results.scan_time && (
                            <p>• Durée: {task.results.scan_time}</p>
                          )}
                          {task.results.risk_level && (
                            <p>• Niveau de risque: <span className={`risk-${task.results.risk_level}`}>
                              {task.results.risk_level.toUpperCase()}</span></p>
                          )}
                        </div>
                      )}

                      {/* Bouton de téléchargement de rapport */}
                      {task.report_filename && (
                        <div className="task-actions">
                          <button 
                            onClick={() => downloadReport(task.report_filename)}
                            className="download-btn"
                          >
                            📥 Télécharger le Rapport
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Onglet Rapports */}
        {activeTab === 'reports' && (
          <section className="reports-panel">
            <div className="panel-header">
              <h3>📄 Rapports Disponibles ({reports.length})</h3>
              <button onClick={loadReports} className="refresh-btn">
                🔄 Actualiser
              </button>
            </div>
            
            {reports.length === 0 ? (
              <div className="no-reports">
                <p>Aucun rapport disponible. Les rapports sont générés automatiquement après chaque scan.</p>
              </div>
            ) : (
              <div className="reports-grid">
                {reports.map((report, index) => (
                  <div key={index} className="report-card">
                    <div className="report-header">
                      <h4>📄 {report.filename}</h4>
                      <span className="report-size">
                        {(report.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    
                    <div className="report-details">
                      <p><strong>Créé:</strong> {new Date(report.created).toLocaleString()}</p>
                      <p><strong>Type:</strong> Rapport HTML</p>
                    </div>
                    
                    <div className="report-actions">
                      <button 
                        onClick={() => downloadReport(report.filename)}
                        className="download-btn primary"
                      >
                        📥 Télécharger
                      </button>
                      <button 
                        onClick={() => window.open(report.download_url, '_blank')}
                        className="view-btn"
                      >
                        👁️ Prévisualiser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Pacha Toolbox v2.0 - Tests d'intrusion automatisés</p>
        <p>Status API: 
          <span className={`status-${apiStatus}`}>
            {apiStatus === 'connected' ? ' ✅ Opérationnelle' : 
             apiStatus === 'error' ? ' ❌ Hors ligne' : ' ⏳ Vérification'}
          </span>
        </p>
        <p>
          🔗 <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">Health Check</a> | 
          📊 Scans: {tasks.length} | 
          📄 Rapports: {reports.length}
        </p>
      </footer>
    </div>
  );
}

export default App;