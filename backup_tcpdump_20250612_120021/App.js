// frontend/src/App.js - Version avec liste déroulante améliorée
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
  const [convertingToPdf, setConvertingToPdf] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Test de connexion API
  const testApiConnection = async () => {
    try {
      console.log('🔗 Test connexion API Ultra-Aesthetic:', API_URL);
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Ultra-Aesthetic connectée:', data);
        console.log('🎨 Fonctionnalités:', data.features);
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

  // Chargement des types de scans avec couleurs
  const loadScanTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/scan/types`);
      if (response.ok) {
        const data = await response.json();
        setScanTypes(data.scan_types);
        console.log('🎨 Types de scans avec couleurs chargés:', data.scan_types);
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
        console.log('🎨 Rapports ultra-esthétiques chargés:', data.reports);
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
      console.log('🚀 Lancement scan ultra-esthétique:', scanForm);
      
      const payload = {
        target: scanForm.target,
        scan_type: scanForm.scan_type
      };

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
        console.log('✅ Résultat scan ultra-esthétique:', result);
        
        // Ajouter à l'historique local
        setTasks(prev => [result, ...prev]);
        
        // Reset formulaire
        setScanForm({
          tool: 'nmap',
          scan_type: 'basic',
          target: '127.0.0.1',
          custom_args: ''
        });
        
        // Message avec émojis et style
        const formats = result.formats_available?.join(' + ') || 'HTML';
        alert(`🎨 Scan terminé ! Rapport ultra-esthétique généré en format: ${formats} ✨`);
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

  // Téléchargement de rapport HTML
  const downloadReport = (filename) => {
    const downloadUrl = `${API_URL}/reports/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Téléchargement de rapport PDF
  const downloadPdfReport = (filename) => {
    const downloadUrl = `${API_URL}/reports/download/pdf/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prévisualisation de rapport en NOUVEL ONGLET
  const viewReportNewTab = (filename, reportName) => {
    const viewUrl = `${API_URL}/reports/view/${filename}`;
    window.open(viewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    console.log(`🔗 Ouverture du rapport en nouvel onglet: ${reportName}`);
  };

  // Conversion HTML vers PDF
  const convertToPdf = async (htmlFilename) => {
    const reportId = htmlFilename.replace('.html', '');
    setConvertingToPdf(prev => ({ ...prev, [reportId]: true }));

    try {
      const response = await fetch(`${API_URL}/reports/convert-to-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html_filename: htmlFilename })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`🎨 Conversion PDF ultra-esthétique réussie: ${result.pdf_filename} ✨`);
        
        // Recharger la liste des rapports
        await loadReports();
      } else {
        const error = await response.json();
        alert(`❌ Erreur conversion: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur conversion PDF:', error);
      alert('❌ Erreur lors de la conversion PDF');
    } finally {
      setConvertingToPdf(prev => ({ ...prev, [reportId]: false }));
    }
  };

  // Test API manuel
  const handleApiTest = async () => {
    try {
      const response = await fetch(`${API_URL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'frontend-ultra-aesthetic', timestamp: new Date().toISOString() })
      });
      
      const result = await response.json();
      console.log('🧪 Test API ultra-esthétique réussi:', result);
      alert('✨ Test API ultra-esthétique réussi ! Voir la console pour les détails. 🎨');
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
    return available[scanForm.scan_type] || { name: '', description: '', args: '', icon: '', color: '#667eea' };
  };

  // Gérer la sélection d'un type de scan
  const handleScanTypeSelect = (scanTypeKey) => {
    setScanForm(prev => ({ ...prev, scan_type: scanTypeKey }));
    setIsDropdownOpen(false);
  };

  return (
    <div className="App">
      {/* Header Enhanced */}
      <header className="app-header ultra-aesthetic">
        <div className="header-content">
          <h1>🛡️ Pacha Toolbox</h1>
          <div className="header-subtitle">Ultra-Aesthetic Security Suite</div>
        </div>
        <div className="header-controls">
          <div className={`status-indicator ${apiStatus} ultra`}>
            <div className="status-dot"></div>
            <span>
              {apiStatus === 'connected' ? 'API Ultra Connectée' : 
               apiStatus === 'error' ? 'API Erreur' : 'Vérification...'}
            </span>
          </div>
          <button onClick={handleApiTest} className="test-btn ultra">
            ✨ Test API
          </button>
        </div>
      </header>

      {/* Navigation Enhanced */}
      <nav className="tab-navigation ultra-aesthetic">
        <button 
          className={`tab-button ultra ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          🔍 Nouveau Scan
        </button>
        <button 
          className={`tab-button ultra ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Historique ({tasks.length})
        </button>
        <button 
          className={`tab-button ultra ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🎨 Rapports ({reports.length})
        </button>
      </nav>

      {/* Contenu principal */}
      <main className="app-main ultra-aesthetic">
        
        {/* Onglet Nouveau Scan */}
        {activeTab === 'scan' && (
          <section className="scan-module ultra">
            <h2>🔍 Nouveau Scan Ultra-Esthétique</h2>
            <form onSubmit={handleScanSubmit} className="scan-form ultra">
              
              {/* Sélection de l'outil */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tool">Outil de scan:</label>
                  <select 
                    id="tool"
                    value={scanForm.tool} 
                    onChange={(e) => setScanForm(prev => ({...prev, tool: e.target.value, scan_type: 'basic'}))}
                    className="scan-input ultra"
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
                    className="scan-input ultra"
                    required
                  />
                </div>
              </div>

              {/* Sélection du type de scan avec dropdown personnalisé */}
              <div className="form-group">
                <label htmlFor="scan_type">Type de scan:</label>
                <div className="custom-dropdown ultra">
                  <div 
                    className="dropdown-selected ultra"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{borderColor: getCurrentScanTypeInfo().color}}
                  >
                    <div className="selected-content">
                      <span className="selected-icon" style={{color: getCurrentScanTypeInfo().color}}>
                        {getCurrentScanTypeInfo().icon}
                      </span>
                      <div className="selected-text">
                        <div className="selected-name">{getCurrentScanTypeInfo().name}</div>
                        <div className="selected-desc">{getCurrentScanTypeInfo().description}</div>
                      </div>
                    </div>
                    <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="dropdown-options ultra">
                      {Object.entries(getAvailableScanTypes()).map(([key, info]) => (
                        <div
                          key={key}
                          className={`dropdown-option ultra ${scanForm.scan_type === key ? 'selected' : ''}`}
                          onClick={() => handleScanTypeSelect(key)}
                          data-type={key}
                        >
                          <span className="option-icon">
                            {info.icon}
                          </span>
                          <div className="option-content">
                            <div className="option-name">
                              {info.name}
                            </div>
                            <div className="option-description">
                              {info.description}
                            </div>
                            <div className="option-args">
                              <code>{info.args}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Informations sur le type de scan avec couleur */}
              {getCurrentScanTypeInfo().name && (
                <div 
                  className="scan-type-info ultra"
                  style={{
                    borderColor: getCurrentScanTypeInfo().color,
                    backgroundColor: `${getCurrentScanTypeInfo().color}15`
                  }}
                >
                  <h4 style={{color: getCurrentScanTypeInfo().color}}>
                    {getCurrentScanTypeInfo().icon} {getCurrentScanTypeInfo().name}
                  </h4>
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
                  className="scan-input ultra"
                />
                <small className="form-help ultra">
                  💡 Si fourni, remplace les arguments par défaut du type de scan sélectionné
                </small>
              </div>
              
              <button 
                type="submit" 
                className="scan-button ultra"
                style={{background: `linear-gradient(135deg, ${getCurrentScanTypeInfo().color}, #764ba2)`}}
                disabled={loading || apiStatus !== 'connected'}
              >
                {loading ? '⏳ Scan en cours...' : `🚀 Lancer ${getCurrentScanTypeInfo().name || 'le Scan'}`}
              </button>
            </form>
          </section>
        )}

        {/* Onglet Historique Enhanced */}
        {activeTab === 'history' && (
          <section className="tasks-panel ultra">
            <h3>📊 Historique des Scans Ultra-Esthétiques ({tasks.length})</h3>
            
            {tasks.length === 0 ? (
              <div className="no-tasks ultra">
                <p>🎨 Aucun scan ultra-esthétique dans l'historique. Lancez votre premier scan !</p>
              </div>
            ) : (
              <div className="tasks-container ultra">
                {tasks.map((task, index) => (
                  <div 
                    key={index} 
                    className={`task-item ultra ${task.status}`}
                    style={{borderLeftColor: task.scan_type_info?.color || '#667eea'}}
                  >
                    <div className="task-header ultra">
                      <span 
                        className="task-type ultra"
                        style={{backgroundColor: `${task.scan_type_info?.color || '#667eea'}20`}}
                      >
                        {task.scan_type_info?.icon} {task.tool.toUpperCase()} - {task.scan_type_info?.name}
                      </span>
                      <span className={`task-status ultra ${task.status}`}>
                        {task.status === 'completed' ? '✅ TERMINÉ' : 
                         task.status === 'running' ? '⏳ EN COURS' : 
                         task.status === 'failed' ? '❌ ÉCHEC' : task.status}
                      </span>
                    </div>
                    
                    <div className="task-details ultra">
                      <p><strong>🎯 Cible:</strong> {task.target}</p>
                      <p><strong>🆔 ID:</strong> {task.scan_id}</p>
                      <p><strong>📅 Date:</strong> {new Date(task.timestamp).toLocaleString()}</p>
                      <p><strong>📝 Type:</strong> {task.scan_type_info?.description}</p>
                      {task.message && <p><strong>💬 Message:</strong> {task.message}</p>}
                      
                      {/* Formats disponibles avec couleurs */}
                      {task.formats_available && (
                        <p><strong>📄 Formats:</strong> 
                          <span className="formats-badges ultra">
                            {task.formats_available.map(format => (
                              <span key={format} className={`format-badge ultra format-${format.toLowerCase()}`}>
                                {format === 'HTML' ? '🌐' : '📄'} {format}
                              </span>
                            ))}
                          </span>
                        </p>
                      )}
                      
                      {task.results && Object.keys(task.results).length > 0 && (
                        <div className="task-result ultra">
                          <p><strong>📊 Résultats:</strong></p>
                          {task.results.ports_open && (
                            <p>🔌 Ports ouverts: {Array.isArray(task.results.ports_open) ? 
                              task.results.ports_open.join(', ') : task.results.ports_open}</p>
                          )}
                          {task.results.vulnerabilities && (
                            <p>🚨 Vulnérabilités: {Array.isArray(task.results.vulnerabilities) ? 
                              task.results.vulnerabilities.join(', ') : task.results.vulnerabilities}</p>
                          )}
                          {task.results.scan_time && (
                            <p>⏱️ Durée: {task.results.scan_time}</p>
                          )}
                          {task.results.risk_level && (
                            <p>⚠️ Niveau de risque: <span className={`risk-${task.results.risk_level} ultra`}>
                              {task.results.risk_level.toUpperCase()}</span></p>
                          )}
                        </div>
                      )}

                      {/* Actions de rapport Ultra-Enhanced */}
                      {(task.report_filename || task.report_pdf_filename) && (
                        <div className="task-actions ultra">
                          <div className="actions-group ultra">
                            <span className="actions-label ultra">🎨 Rapports Ultra-Esthétiques disponibles:</span>
                            
                            {/* Actions HTML */}
                            {task.report_filename && (
                              <div className="action-set ultra">
                                <button 
                                  onClick={() => viewReportNewTab(task.report_filename, `${task.tool} - ${task.target}`)}
                                  className="action-btn ultra view-btn"
                                  title="Voir le rapport ultra-esthétique en nouvel onglet"
                                >
                                  👁️ Voir Rapport
                                </button>
                                <button 
                                  onClick={() => downloadReport(task.report_filename)}
                                  className="action-btn ultra download-btn html"
                                  title="Télécharger le rapport HTML ultra-esthétique"
                                >
                                  🌐 HTML
                                </button>
                              </div>
                            )}
                            
                            {/* Actions PDF */}
                            {task.report_pdf_filename ? (
                              <button 
                                onClick={() => downloadPdfReport(task.report_pdf_filename)}
                                className="action-btn ultra download-btn pdf"
                                title="Télécharger le rapport PDF ultra-esthétique"
                              >
                                📄 PDF
                              </button>
                            ) : task.report_filename && (
                              <button 
                                onClick={() => convertToPdf(task.report_filename)}
                                className="action-btn ultra convert-btn"
                                disabled={convertingToPdf[task.report_filename?.replace('.html', '')]}
                                title="Convertir en PDF ultra-esthétique"
                              >
                                {convertingToPdf[task.report_filename?.replace('.html', '')] ? 
                                  '⏳ Conversion...' : '📄 Créer PDF'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Onglet Rapports Ultra-Enhanced */}
        {activeTab === 'reports' && (
          <section className="reports-panel ultra">
            <div className="panel-header ultra">
              <h3>🎨 Rapports Ultra-Esthétiques Disponibles ({reports.length})</h3>
              <div className="header-actions">
                <button onClick={loadReports} className="refresh-btn ultra">
                  🔄 Actualiser
                </button>
              </div>
            </div>
            
            {reports.length === 0 ? (
              <div className="no-reports ultra">
                <p>🎨 Aucun rapport ultra-esthétique disponible. Les rapports sont générés automatiquement après chaque scan.</p>
              </div>
            ) : (
              <div className="reports-grid ultra">
                {reports.map((report, index) => (
                  <div key={index} className="report-card ultra enhanced">
                    <div className="report-header ultra">
                      <div className="report-title ultra">
                        <h4>🎨 {report.main_filename}</h4>
                        <div className="report-formats ultra">
                          {report.formats?.map(format => (
                            <span key={format} className={`format-badge ultra format-${format.toLowerCase()}`}>
                              {format === 'HTML' ? '🌐' : '📄'} {format}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="report-meta ultra">
                        <span className="report-date ultra">
                          {new Date(report.created).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="report-details ultra">
                      <div className="size-info ultra">
                        {report.html_filename && (
                          <div className="file-info ultra">
                            <span className="file-type">HTML:</span>
                            <span className="file-size">{(report.html_size / 1024).toFixed(1)} KB</span>
                          </div>
                        )}
                        {report.pdf_filename && (
                          <div className="file-info ultra">
                            <span className="file-type">PDF:</span>
                            <span className="file-size">{(report.pdf_size / 1024).toFixed(1)} KB</span>
                          </div>
                        )}
                      </div>
                      <p><strong>🆔 ID:</strong> {report.report_id}</p>
                      <p><strong>📅 Créé:</strong> {new Date(report.created).toLocaleString()}</p>
                    </div>
                    
                    <div className="report-actions ultra enhanced">
                      {/* Section HTML */}
                      {report.html_filename && (
                        <div className="actions-section ultra">
                          <span className="section-label ultra">🌐 HTML Ultra-Esthétique</span>
                          <div className="action-buttons ultra">
                            <button 
                              onClick={() => viewReportNewTab(report.html_filename, report.main_filename)}
                              className="action-btn ultra view-btn"
                              title="Voir en nouvel onglet"
                            >
                              👁️ Voir
                            </button>
                            <button 
                              onClick={() => downloadReport(report.html_filename)}
                              className="action-btn ultra download-btn html"
                              title="Télécharger HTML"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Section PDF */}
                      <div className="actions-section ultra">
                        <span className="section-label ultra">📄 PDF Ultra-Esthétique</span>
                        <div className="action-buttons ultra">
                          {report.pdf_filename ? (
                            <button 
                              onClick={() => downloadPdfReport(report.pdf_filename)}
                              className="action-btn ultra download-btn pdf"
                              title="Télécharger PDF"
                            >
                              ⬇️ PDF
                            </button>
                          ) : report.html_filename && (
                            <button 
                              onClick={() => convertToPdf(report.html_filename)}
                              className="action-btn ultra convert-btn"
                              disabled={convertingToPdf[report.report_id]}
                              title="Convertir en PDF"
                            >
                              {convertingToPdf[report.report_id] ? '⏳' : '🔄'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer Ultra-Enhanced */}
      <footer className="app-footer ultra">
        <div className="footer-content">
          <p>🛡️ Pacha Toolbox v2.0 Ultra-Aesthetic - Tests d'intrusion de nouvelle génération</p>
          <p>Status API: 
            <span className={`status-${apiStatus} ultra`}>
              {apiStatus === 'connected' ? ' ✨ Ultra Opérationnelle' : 
               apiStatus === 'error' ? ' ❌ Hors ligne' : ' ⏳ Vérification'}
            </span>
          </p>
          <p>
            🔗 <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">Health Check</a> | 
            📊 Scans: {tasks.length} | 
            🎨 Rapports: {reports.length} |
            ✨ Ultra-Aesthetic Support
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;