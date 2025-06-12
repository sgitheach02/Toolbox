// frontend/src/App.js - Version unifiée Scanner & Capture
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

// Composant principal de navigation
const Navigation = ({ activeSection, setActiveSection, apiStatus }) => {
  const sections = [
    { id: 'dashboard', name: '🏠 Dashboard', icon: '🏠' },
    { id: 'scan', name: '🔍 Scans', icon: '🔍' },
    { id: 'network', name: '📡 Réseau', icon: '📡' },
    { id: 'reports', name: '📊 Rapports', icon: '📊' }
  ];

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <h1 style={{ 
          margin: '0', 
          color: 'white', 
          fontSize: '1.8rem',
          fontWeight: 'bold'
        }}>
          🛡️ Pacha Toolbox
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                background: activeSection === section.id 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'rgba(255,255,255,0.1)',
                border: activeSection === section.id 
                  ? '2px solid rgba(255,255,255,0.5)'
                  : '2px solid transparent',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeSection === section.id ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          background: apiStatus === 'connected' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          {apiStatus === 'connected' ? '✅ Connecté' : '❌ Déconnecté'}
        </div>
      </div>
    </nav>
  );
};

// Composant Dashboard avec statut unifié
const Dashboard = ({ systemStatus }) => {
  const [stats, setStats] = useState({
    active_scans: 0,
    active_captures: 0,
    scan_history_count: 0,
    capture_history_count: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '3rem', 
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          🛡️ Pacha Toolbox
        </h2>
        <p style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '30px' }}>
          Suite unifiée de sécurité réseau et d'analyse
        </p>
      </div>

      {/* Cartes de statut */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          padding: '25px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>🔍 Scans Actifs</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.active_scans}
          </p>
          <p style={{ opacity: 0.8 }}>En cours d'exécution</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981, #047857)',
          padding: '25px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>📡 Captures Actives</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.active_captures}
          </p>
          <p style={{ opacity: 0.8 }}>Surveillance réseau</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '25px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>📊 Historique</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.scan_history_count + stats.capture_history_count}
          </p>
          <p style={{ opacity: 0.8 }}>Total des analyses</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          padding: '25px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>🛠️ Outils</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>4</p>
          <p style={{ opacity: 0.8 }}>Nmap, Nikto, tcpdump, tshark</p>
        </div>
      </div>

      {/* Statut des outils */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '30px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#fbbf24', marginBottom: '20px', fontSize: '1.5rem' }}>
          🔧 Statut des Outils
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {systemStatus.tools_available && Object.entries(systemStatus.tools_available).map(([category, tools]) => (
            <div key={category} style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h4 style={{ 
                color: '#10b981', 
                marginBottom: '15px',
                textTransform: 'capitalize'
              }}>
                {category === 'scan_tools' ? '🔍 Scan' : '📡 Réseau'}
              </h4>
              {Object.entries(tools).map(([tool, available]) => (
                <div key={tool} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  padding: '5px 0'
                }}>
                  <span style={{ color: 'white' }}>{tool}</span>
                  <span style={{
                    color: available ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {available ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modules disponibles */}
      <div style={{
        marginTop: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '25px'
      }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.2)',
          padding: '30px',
          borderRadius: '15px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>🔍 Scans de Reconnaissance</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            Nmap pour la découverte réseau, scan de ports et détection de services.
            Nikto pour l'analyse de vulnérabilités web.
          </p>
        </div>
        
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          padding: '30px',
          borderRadius: '15px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>📡 Capture Réseau</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            tcpdump et tshark pour la capture et l'analyse de trafic réseau 
            en temps réel.
          </p>
        </div>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.2)',
          padding: '30px',
          borderRadius: '15px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '15px' }}>📊 Rapports Unifiés</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            Génération automatique de rapports HTML et PDF pour tous les 
            types d'analyses.
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant de scan unifié
const ScanModule = () => {
  const [scanTypes, setScanTypes] = useState({});
  const [activeTab, setActiveTab] = useState('nmap');
  const [scanConfig, setScanConfig] = useState({
    target: '127.0.0.1',
    scan_type: 'basic',
    custom_args: ''
  });
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    fetchScanTypes();
    fetchScanHistory();
  }, []);

  const fetchScanTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/scan/types`);
      if (response.ok) {
        const data = await response.json();
        setScanTypes(data.scan_types || {});
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des types:', error);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/scans/history?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setScanHistory(data.scans || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const executeScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const endpoint = activeTab === 'nmap' ? '/scan/nmap' : '/scan/nikto';
      const payload = {
        target: scanConfig.target,
        scan_type: scanConfig.scan_type
      };

      if (scanConfig.custom_args) {
        payload.args = scanConfig.custom_args;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setScanResult(result);
        fetchScanHistory();
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      setScanResult({ error: error.message });
    } finally {
      setIsScanning(false);
    }
  };

  const currentScanTypes = scanTypes[activeTab] || {};

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🔍 Module de Scans
      </h2>

      {/* Onglets de sélection d'outil */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        justifyContent: 'center'
      }}>
        {['nmap', 'nikto'].map(tool => (
          <button
            key={tool}
            onClick={() => {
              setActiveTab(tool);
              setScanConfig(prev => ({ ...prev, scan_type: 'basic' }));
            }}
            style={{
              background: activeTab === tool 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase'
            }}
          >
            {tool === 'nmap' ? '🔍 NMAP' : '🌐 NIKTO'}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Configuration du scan */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '20px' }}>⚙️ Configuration</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              🎯 Cible
            </label>
            <input
              type="text"
              value={scanConfig.target}
              onChange={(e) => setScanConfig(prev => ({ ...prev, target: e.target.value }))}
              placeholder={activeTab === 'nikto' ? 'http://example.com' : '192.168.1.1'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              📋 Type de scan
            </label>
            <select
              value={scanConfig.scan_type}
              onChange={(e) => setScanConfig(prev => ({ ...prev, scan_type: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            >
              {Object.entries(currentScanTypes).map(([key, config]) => (
                <option key={key} value={key} style={{ background: '#1f2937' }}>
                  {config.icon} {config.name} - {config.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              🔧 Arguments personnalisés (optionnel)
            </label>
            <input
              type="text"
              value={scanConfig.custom_args}
              onChange={(e) => setScanConfig(prev => ({ ...prev, custom_args: e.target.value }))}
              placeholder="Ex: -sV -O pour Nmap"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            onClick={executeScan}
            disabled={isScanning || !scanConfig.target}
            style={{
              width: '100%',
              padding: '15px',
              background: isScanning 
                ? 'rgba(107, 114, 128, 0.5)' 
                : 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isScanning ? '🔄 Scan en cours...' : '🚀 Lancer le scan'}
          </button>
        </div>

        {/* Résultats du scan */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '20px' }}>📊 Résultats</h3>
          
          {scanResult ? (
            <div style={{ color: 'white' }}>
              {scanResult.error ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  color: '#fca5a5'
                }}>
                  ❌ Erreur: {scanResult.error}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong>🆔 Scan ID:</strong> {scanResult.scan_id}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong>🎯 Cible:</strong> {scanResult.target}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong>⏱️ Durée:</strong> {scanResult.duration}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong>📋 Type:</strong> {scanResult.scan_config?.name}
                  </div>
                  
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ color: '#10b981', marginBottom: '10px' }}>
                      📈 Résultats détaillés
                    </h4>
                    {activeTab === 'nmap' && scanResult.results && (
                      <div>
                        <p>🖥️ Hôtes découverts: {scanResult.results.hosts_discovered}</p>
                        <p>🔌 Ports ouverts: {scanResult.results.ports_open?.join(', ')}</p>
                        <p>🛠️ Services: {scanResult.results.services_detected?.join(', ')}</p>
                        {scanResult.results.os_detection && (
                          <p>💻 OS détecté: {scanResult.results.os_detection}</p>
                        )}
                      </div>
                    )}
                    {activeTab === 'nikto' && scanResult.results && (
                      <div>
                        <p>🔍 Vulnérabilités trouvées: {scanResult.results.vulnerabilities_found}</p>
                        <p>⚠️ Niveau de risque: {scanResult.results.risk_level}</p>
                        <p>📄 Pages testées: {scanResult.results.pages_tested}</p>
                        <div style={{ marginTop: '10px' }}>
                          <strong>🛡️ Vulnérabilités:</strong>
                          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                            {scanResult.results.vulnerabilities?.map((vuln, index) => (
                              <li key={index} style={{ marginBottom: '3px' }}>{vuln}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.6)',
              padding: '50px 20px'
            }}>
              {isScanning ? (
                <div>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔄</div>
                  <p>Scan en cours d'exécution...</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                  <p>Configurez et lancez un scan pour voir les résultats</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historique des scans */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>📜 Historique des scans</h3>
        
        {scanHistory.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {scanHistory.map((scan, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {scan.tool === 'nmap' ? '🔍' : '🌐'} {scan.scan_id}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    {new Date(scan.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  🎯 {scan.target} • 📋 {scan.scan_config?.name} • ⏱️ {scan.duration}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            padding: '30px'
          }}>
            📋 Aucun scan dans l'historique
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de capture réseau
const NetworkModule = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [captureConfig, setCaptureConfig] = useState({
    interface: 'any',
    filter: '',
    packet_count: 100
  });
  const [activeCaptures, setActiveCaptures] = useState([]);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    fetchInterfaces();
    fetchActiveCaptures();
    fetchCaptureHistory();
    
    const interval = setInterval(() => {
      fetchActiveCaptures();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchInterfaces = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/interfaces`);
      if (response.ok) {
        const data = await response.json();
        setInterfaces(data.interfaces || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des interfaces:', error);
    }
  };

  const fetchActiveCaptures = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/captures/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveCaptures(data.active_captures || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des captures actives:', error);
    }
  };

  const fetchCaptureHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/captures/history?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setCaptureHistory(data.captures || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const startCapture = async () => {
    setIsCapturing(true);
    
    try {
      const response = await fetch(`${API_BASE}/network/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(captureConfig)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Capture démarrée:', result);
        fetchActiveCaptures();
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la capture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCapture = async (captureId) => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/${captureId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchActiveCaptures();
        fetchCaptureHistory();
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la capture:', error);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #10b981, #047857)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        📡 Module Réseau & Capture
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Configuration de capture */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '20px' }}>⚙️ Configuration Capture</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              🌐 Interface réseau
            </label>
            <select
              value={captureConfig.interface}
              onChange={(e) => setCaptureConfig(prev => ({ ...prev, interface: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            >
              <option value="any" style={{ background: '#1f2937' }}>any (toutes)</option>
              {interfaces.map(iface => (
                <option key={iface.id} value={iface.name} style={{ background: '#1f2937' }}>
                  {iface.name} - {iface.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              🔍 Filtre (optionnel)
            </label>
            <input
              type="text"
              value={captureConfig.filter}
              onChange={(e) => setCaptureConfig(prev => ({ ...prev, filter: e.target.value }))}
              placeholder="Ex: tcp port 80, icmp, host 192.168.1.1"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              📦 Nombre de paquets
            </label>
            <input
              type="number"
              value={captureConfig.packet_count}
              onChange={(e) => setCaptureConfig(prev => ({ ...prev, packet_count: parseInt(e.target.value) || 100 }))}
              min="1"
              max="10000"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            onClick={startCapture}
            disabled={isCapturing}
            style={{
              width: '100%',
              padding: '15px',
              background: isCapturing 
                ? 'rgba(107, 114, 128, 0.5)' 
                : 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isCapturing ? '🔄 Démarrage...' : '🚀 Démarrer la capture'}
          </button>
        </div>

        {/* Captures actives */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '20px' }}>⚡ Captures Actives</h3>
          
          {activeCaptures.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {activeCaptures.map(capture => (
                <div key={capture.capture_id} style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>
                      📡 {capture.capture_id.split('_')[1]}
                    </span>
                    <button
                      onClick={() => stopCapture(capture.capture_id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ⏹️ Arrêter
                    </button>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    🌐 Interface: {capture.interface}
                  </div>
                  {capture.filter && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                      🔍 Filtre: {capture.filter}
                    </div>
                  )}
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    📦 Paquets: {capture.packet_count} • ⏰ {new Date(capture.start_time).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.6)',
              padding: '50px 20px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📡</div>
              <p>Aucune capture active</p>
            </div>
          )}
        </div>
      </div>

      {/* Historique des captures */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>📜 Historique des Captures</h3>
        
        {captureHistory.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {captureHistory.map((capture, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    📡 {capture.capture_id?.split('_')[1] || 'N/A'}
                  </span>
                  <span style={{ 
                    color: capture.status === 'completed' ? '#10b981' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {capture.status === 'completed' ? '✅ Terminé' : '❌ Erreur'}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  🌐 Interface: {capture.interface} • 📦 {capture.packet_count} paquets
                </div>
                {capture.filter && (
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    🔍 Filtre: {capture.filter}
                  </div>
                )}
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: '5px' }}>
                  ⏰ {new Date(capture.start_time).toLocaleString()}
                  {capture.end_time && ` → ${new Date(capture.end_time).toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            padding: '30px'
          }}>
            📋 Aucune capture dans l'historique
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de rapports complet
const ReportsModule = () => {
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState({ total: 0, by_type: {} });
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Simulation de données de rapports
    const mockReports = [
      {
        id: 'report_001',
        name: 'Scan Nmap complet - 192.168.1.0/24',
        type: 'nmap',
        status: 'completed',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        size: '2.4 MB',
        format: ['HTML', 'PDF'],
        description: 'Scan de découverte réseau avec détection de services'
      },
      {
        id: 'report_002',
        name: 'Analyse Nikto - example.com',
        type: 'nikto',
        status: 'completed',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        size: '1.8 MB',
        format: ['HTML'],
        description: 'Scan de vulnérabilités web complet'
      },
      {
        id: 'report_003',
        name: 'Capture tcpdump - Interface eth0',
        type: 'tcpdump',
        status: 'completed',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        size: '5.6 MB',
        format: ['PCAP', 'HTML'],
        description: 'Capture de trafic HTTP/HTTPS pendant 30 minutes'
      }
    ];

    setReports(mockReports);
    setReportStats({
      total: mockReports.length,
      by_type: {
        nmap: 1,
        nikto: 1,
        tcpdump: 1
      }
    });
  }, []);

  const generateReport = async (type) => {
    setIsGenerating(true);
    
    // Simulation de génération de rapport
    setTimeout(() => {
      const newReport = {
        id: `report_${Date.now()}`,
        name: `Nouveau rapport ${type} - ${new Date().toLocaleString()}`,
        type: type,
        status: 'completed',
        created_at: new Date().toISOString(),
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        format: type === 'tcpdump' ? ['PCAP', 'HTML'] : ['HTML', 'PDF'],
        description: `Rapport généré automatiquement`
      };
      
      setReports(prev => [newReport, ...prev]);
      setReportStats(prev => ({
        total: prev.total + 1,
        by_type: {
          ...prev.by_type,
          [type]: (prev.by_type[type] || 0) + 1
        }
      }));
      setIsGenerating(false);
    }, 3000);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'nmap': return '🔍';
      case 'nikto': return '🌐';
      case 'tcpdump': return '📡';
      default: return '📄';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'nmap': return '#3b82f6';
      case 'nikto': return '#06b6d4';
      case 'tcpdump': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        📊 Module de Rapports
      </h2>

      {/* Statistiques des rapports */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '20px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📊 Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{reportStats.total}</p>
        </div>

        {Object.entries(reportStats.by_type).map(([type, count]) => (
          <div key={type} style={{
            background: `linear-gradient(135deg, ${getTypeColor(type)}, ${getTypeColor(type)}dd)`,
            padding: '20px',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{getTypeIcon(type)} {type.toUpperCase()}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Actions de génération */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#10b981', marginBottom: '20px' }}>⚡ Génération de Rapports</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <button
            onClick={() => generateReport('nmap')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            🔍 Rapport Nmap
          </button>

          <button
            onClick={() => generateReport('nikto')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            🌐 Rapport Nikto
          </button>

          <button
            onClick={() => generateReport('tcpdump')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            📡 Rapport tcpdump
          </button>
        </div>

        {isGenerating && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#10b981'
          }}>
            🔄 Génération en cours... Veuillez patienter.
          </div>
        )}
      </div>

      {/* Liste des rapports */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>📜 Rapports Disponibles</h3>
        
        {reports.length > 0 ? (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {reports.map((report) => (
              <div key={report.id} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '15px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(report.type)}</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{report.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      background: getTypeColor(report.type),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {report.type.toUpperCase()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      {report.size}
                    </span>
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  📝 {report.description}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem'
                }}>
                  <span>⏰ {new Date(report.created_at).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {report.format.map(format => (
                      <span key={format} style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedReport === report.id && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px'
                    }}>
                      {report.format.map(format => (
                        <button key={format} style={{
                          background: 'linear-gradient(135deg, #10b981, #047857)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          📥 Télécharger {format}
                        </button>
                      ))}
                      
                      <button style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        👁️ Aperçu
                      </button>
                      
                      <button style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            padding: '50px 20px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
            <p>Aucun rapport disponible</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Générez votre premier rapport en utilisant les boutons ci-dessus
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal de l'application
const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('disconnected');
  const [systemStatus, setSystemStatus] = useState({});

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        setSystemStatus(data);
      } else {
        throw new Error('API non disponible');
      }
    } catch (error) {
      console.error('Erreur de connexion API:', error);
      setApiStatus('disconnected');
      setSystemStatus({});
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard systemStatus={systemStatus} />;
      case 'scan':
        return <ScanModule />;
      case 'network':
        return <NetworkModule />;
      case 'reports':
        return <ReportsModule />;
      default:
        return <Dashboard systemStatus={systemStatus} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1f2937 50%, #111827 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        apiStatus={apiStatus}
      />
      
      <main style={{ minHeight: 'calc(100vh - 80px)' }}>
        {renderActiveSection()}
      </main>
      
      {/* Footer */}
      <footer style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ 
          margin: '0', 
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem'
        }}>
          🛡️ Pacha Toolbox v2.0 - Suite de sécurité réseau unifiée • 
          API: {apiStatus === 'connected' ? '✅' : '❌'} • 
          Dernière mise à jour: {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
};

export default App;