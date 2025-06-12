  return (
    <div style={cyberStyles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#00d4ff', margin: 0, fontSize: '16px', fontWeight: '700' }}>
          CONSOLE OUTPUT - {scanId}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#00ff88' : '#666',
            boxShadow: isConnected ? cyberStyles.glow.success : 'none'
          }}></div>
          <span style={{ fontSize: '12px', color: isConnected ? '#00ff88' : '#666' }}>
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      <div ref={terminalRef} style={cyberStyles.terminal}>
        {output.length > 0 ? (
          output.map((line, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#666', marginRight: '8px' }}>
                [{new Date().toLocaleTimeString()}]
              </span>
              {line}
            </div>
          ))
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Initialisation du scan...
          </div>
        )}
      </div>
    </div>
  );
};

const ScanForm = ({ onScanStart, toolsStatus, scanTypes }) => {
  const [formData, setFormData] = useState({
    tool: 'nmap',
    target: '',
    scanType: 'basic'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.target.trim()) {
      alert('Veuillez saisir une cible');
      return;
    }

    setIsSubmitting(true);
    try {
      await onScanStart(formData);
      setFormData({ ...formData, target: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toolConfig = scanTypes[formData.tool]?.[formData.scanType];

  return (
    <div style={cyberStyles.card}>
      <h2 style={{ 
        color: '#00d4ff', 
        marginBottom: '24px', 
        fontSize: '20px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        🎯 NOUVEAU SCAN
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto 1fr auto auto', 
          gap: '16px', 
          alignItems: 'end',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#00d4ff',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              OUTIL
            </label>
            <select
              style={{
                ...cyberStyles.input,
                minWidth: '120px'
              }}
              value={formData.tool}
              onChange={(e) => setFormData({ ...formData, tool: e.target.value, scanType: 'basic' })}
            >
              <option value="nmap">NMAP</option>
              <option value="nikto">NIKTO</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#00d4ff',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              CIBLE
            </label>
            <input
              style={{
                ...cyberStyles.input,
                width: '100%'
              }}
              type="text"
              placeholder={formData.tool === 'nmap' ? '192.168.1.1 ou domain.com' : 'http://example.com'}
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#00d4ff',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              TYPE
            </label>
            <select
              style={{
                ...cyberStyles.input,
                minWidth: '200px'
              }}
              value={formData.scanType}
              onChange={(e) => setFormData({ ...formData, scanType: e.target.value })}
            >
              {scanTypes[formData.tool] && Object.entries(scanTypes[formData.tool]).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !toolsStatus[formData.tool]}
            style={{
              ...cyberStyles.button.primary,
              opacity: (isSubmitting || !toolsStatus[formData.tool]) ? 0.5 : 1,
              cursor: (isSubmitting || !toolsStatus[formData.tool]) ? 'not-allowed' : 'pointer',
              transform: isSubmitting ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {isSubmitting ? 'LANCEMENT...' : 'LANCER SCAN'}
          </button>
        </div>
        
        {toolConfig && (
          <div style={{
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '8px' }}>
              <strong>DESCRIPTION:</strong> {toolConfig.description}
            </div>
            <div style={{ fontSize: '13px', color: '#a0a0a0' }}>
              <strong>DURÉE ESTIMÉE:</strong> {toolConfig.estimated_time}
            </div>
          </div>
        )}
        
        {!toolsStatus[formData.tool] && (
          <div style={{
            background: 'rgba(255, 51, 51, 0.2)',
            border: '1px solid #ff3333',
            borderRadius: '8px',
            padding: '16px',
            color: '#ff3333',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            ⚠️ {formData.tool.toUpperCase()} N'EST PAS DISPONIBLE SUR CE SYSTÈME
          </div>
        )}
      </form>
    </div>
  );
};

const ActiveScansList = ({ activeScans, onStopScan, onSelectScan, selectedScan }) => (
  <div style={cyberStyles.card}>
    <h2 style={{ 
      color: '#ffff00', 
      marginBottom: '20px', 
      fontSize: '18px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }}>
      ⚡ SCANS ACTIFS ({activeScans.length})
    </h2>
    
    {activeScans.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeScans.map(scan => (
          <div 
            key={scan.scan_id} 
            style={{
              background: selectedScan === scan.scan_id ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 0, 0.1)',
              border: selectedScan === scan.scan_id ? '2px solid #00d4ff' : '1px solid rgba(255, 255, 0, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => onSelectScan(scan.scan_id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ 
                    fontWeight: '700', 
                    color: '#ffffff',
                    fontSize: '14px'
                  }}>
                    {scan.tool.toUpperCase()}
                  </span>
                  <StatusIndicator status={scan.status}>{scan.status}</StatusIndicator>
                </div>
                <div style={{ color: '#ffffff', marginBottom: '4px' }}>
                  🎯 {scan.target}
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                  {scan.scan_type} • Démarré: {new Date(scan.start_time).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {scan.status === 'running' && (
                  <button
                    style={{
                      ...cyberStyles.button.danger,
                      padding: '8px 16px',
                      fontSize: '12px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopScan(scan.scan_id);
                    }}
                  >
                    ARRÊTER
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ 
        textAlign: 'center', 
        color: '#666', 
        padding: '40px',
        fontStyle: 'italic'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <p>Aucun scan actif</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Lancez un scan pour voir l'activité en temps réel
        </p>
      </div>
    )}
  </div>
);

const ScanHistory = ({ scans, onRefresh }) => (
  <div style={cyberStyles.card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ 
        color: '#00ff88', 
        margin: 0, 
        fontSize: '18px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        📋 HISTORIQUE DES SCANS
      </h2>
      <button style={cyberStyles.button.secondary} onClick={onRefresh}>
        🔄 ACTUALISER
      </button>
    </div>
    
    {scans.length > 0 ? (
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {scans.map(scan => (
          <div key={scan.scan_id} style={{
            background: scan.status === 'completed' ? 'rgba(0, 255, 136, 0.1)' : 
                       scan.status === 'error' ? 'rgba(255, 51, 51, 0.1)' : 
                       'rgba(160, 160, 160, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#ffffff' }}>
                    {scan.tool.toUpperCase()}
                  </span>
                  <StatusIndicator status={scan.status}>{scan.status}</StatusIndicator>
                </div>
                <div style={{ color: '#ffffff', marginBottom: '4px' }}>
                  🎯 {scan.target}
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                  {scan.scan_type} • {scan.duration || 'N/A'} • {new Date(scan.start_time).toLocaleString()}
                </div>
                {scan.parsed_results?.summary && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#00d4ff', 
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    📊 {scan.parsed_results.summary}
                  </div>
                )}
              </div>
              {scan.pdf_filename && (
                <a
                  href={`${API_BASE}/reports/download/pdf/${scan.pdf_filename}`}
                  download
                  style={{
                    ...cyberStyles.button.success,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  📄 PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <p>Aucun scan dans l'historique</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Effectuez votre premier scan pour commencer
        </p>
      </div>
    )}
  </div>
);

const ReportsSection = ({ reports, onRefreshReports }) => (
  <div style={cyberStyles.card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ 
        color: '#ff6b35', 
        margin: 0, 
        fontSize: '18px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        📊 RAPPORTS PDF DISPONIBLES
      </h2>
      <button style={cyberStyles.button.secondary} onClick={onRefreshReports}>
        🔄 ACTUALISER
      </button>
    </div>
    
    {reports.length > 0 ? (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {reports.map(report => (
          <div key={report.filename} style={{
            background: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontWeight: '700', 
                color: '#ffffff', 
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                {report.name}
              </div>
              <div style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>
                📁 {report.filename}
              </div>
              <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                📊 {report.size} • {new Date(report.created).toLocaleString()}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`${API_BASE}/reports/preview/pdf/${report.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...cyberStyles.button.primary,
                  textDecoration: 'none',
                  padding: '8px 12px',
                  fontSize: '12px',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                👁️ VOIR
              </a>
              <a
                href={`${API_BASE}/reports/download/pdf/${report.filename}`}
                download
                style={{
                  ...cyberStyles.button.success,
                  textDecoration: 'none',
                  padding: '8px 12px',
                  fontSize: '12px',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                📥 TÉLÉCHARGER
              </a>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Aucun rapport PDF disponible</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Les rapports PDF sont générés automatiquement après chaque scan
        </p>
      </div>
    )}
  </div>
);

const SystemStatus = ({ toolsStatus, systemStats }) => (
  <div style={cyberStyles.card}>
    <h2 style={{ 
      color: '#00d4ff', 
      marginBottom: '20px', 
      fontSize: '18px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }}>
      🔧 ÉTAT DU SYSTÈME
    </h2>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '16px' 
    }}>
      <div style={{
        background: 'rgba(0, 212, 255, 0.1)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h4 style={{ color: '#00d4ff', margin: '0 0 12px 0', fontSize: '14px' }}>
          OUTILS DE SÉCURITÉ
        </h4>
        {Object.entries(toolsStatus).map(([tool, available]) => (
          <div key={tool} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <span style={{ 
              textTransform: 'uppercase', 
              fontWeight: '600',
              fontSize: '12px'
            }}>
              {tool}
            </span>
            <StatusIndicator status={available ? 'completed' : 'error'}>
              {available ? 'ONLINE' : 'OFFLINE'}
            </StatusIndicator>
          </div>
        ))}
      </div>
      
      {systemStats && (
        <div style={{
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ color: '#00ff88', margin: '0 0 12px 0', fontSize: '14px' }}>
            STATISTIQUES
          </h4>
          <div style={{ fontSize: '12px', color: '#ffffff' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>SCANS ACTIFS:</strong> {systemStats.activeScans || 0}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>RAPPORTS PDF:</strong> {systemStats.totalReports || 0}
            </div>
            <div>
              <strong>DERNIÈRE MAJ:</strong> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================

const App = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [toolsStatus, setToolsStatus] = useState({});
  const [scanTypes, setScanTypes] = useState({});
  const [scans, setScans] = useState([]);
  const [activeScans, setActiveScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  // CSS pour les animations
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px currentColor; }
      50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
    }
    
    * {
      scrollbar-width: thin;
      scrollbar-color: #00d4ff #1a1a2e;
    }
    
    *::-webkit-scrollbar {
      width: 8px;
    }
    
    *::-webkit-scrollbar-track {
      background: #1a1a2e;
    }
    
    *::-webkit-scrollbar-thumb {
      background: #00d4ff;
      border-radius: 4px;
    }
    
    *::-webkit-scrollbar-thumb:hover {
      background: #0099cc;
    }
  `;

  // Injecter les styles globaux
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Fonction pour afficher des notifications
  const showNotification = (message, type = 'info') => {
    const colors = {
      success: '#00ff88',
      error: '#ff3333',
      warning: '#ffff00',
      info: '#00d4ff'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: #0a0a0f;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 0 20px ${colors[type]};
      z-index: 10000;
      font-family: 'Fira Code', monospace;
      font-weight: 700;
      font-size: 14px;
      max-width: 400px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  // Chargement initial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const [typesResponse, toolsResponse] = await Promise.all([
          fetch(`${API_BASE}/scan/types`),
          fetch(`${API_BASE}/test/tools`)
        ]);
        
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setScanTypes(typesData.scan_types);
          setToolsStatus(typesData.tools_status);
        }
        
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json();
          setToolsStatus(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(toolsData.tools_tests).map(([tool, test]) => [tool, test.available])
            )
          }));
        }
        
        await Promise.all([
          loadScans(),
          loadActiveScans(),
          loadReports()
        ]);
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('ERREUR CHARGEMENT DONNÉES', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    
    // Actualisation automatique toutes les 3 secondes
    const interval = setInterval(() => {
      loadActiveScans();
      updateSystemStats();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadScans = async () => {
    try {
      const response = await fetch(`${API_BASE}/scans/history?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans);
      }
    } catch (error) {
      console.error('Erreur chargement scans:', error);
    }
  };

  const loadActiveScans = async () => {
    try {
      const response = await fetch(`${API_BASE}/scans/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveScans(data.active_scans);
        
        // Auto-sélectionner le premier scan actif si aucun n'est sélectionné
        if (!selectedScan && data.active_scans.length > 0) {
          setSelectedScan(data.active_scans[0].scan_id);
        }
        
        // Désélectionner si le scan sélectionné n'est plus actif
        if (selectedScan && !data.active_scans.some(s => s.scan_id === selectedScan)) {
          setSelectedScan(data.active_scans.length > 0 ? data.active_scans[0].scan_id : null);
        }
      }
    } catch (error) {
      console.error('Erreur chargement scans actifs:', error);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/list`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    }
  };

  const updateSystemStats = () => {
    setSystemStats({
      activeScans: activeScans.length,
      totalReports: reports.length,
      lastUpdate: new Date().toISOString()
    });
  };

  const handleScanStart = async (formData) => {
    try {
      const endpoint = formData.tool === 'nmap' ? '/scan/nmap' : '/scan/nikto';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: formData.target,
          scan_type: formData.scanType
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(`SCAN ${formData.tool.toUpperCase()} LANCÉ`, 'success');
        
        // Sélectionner automatiquement le nouveau scan
        setSelectedScan(data.scan_id);
        
        // Actualiser les listes
        await loadActiveScans();
        
        // Auto-actualisation renforcée pour ce scan
        const pollInterval = setInterval(async () => {
          await loadActiveScans();
          await loadScans();
          await loadReports();
        }, 2000);
        
        // Arrêter le polling après 2 minutes ou quand le scan est terminé
        setTimeout(() => clearInterval(pollInterval), 120000);
        
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du lancement du scan');
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      showNotification(`ERREUR: ${error.message}`, 'error');
    }
  };

  const handleStopScan = async (scanId) => {
    try {
      const response = await fetch(`${API_BASE}/scan/stop/${scanId}`, {
        method: 'POST'
      });

      if (response.ok) {
        showNotification('SCAN ARRÊTÉ', 'warning');
        await loadActiveScans();
        await loadScans();
        if (selectedScan === scanId) {
          setSelectedScan(null);
        }
      } else {
        throw new Error('Erreur lors de l\'arrêt du scan');
      }
    } catch (error) {
      console.error('Erreur arrêt scan:', error);
      showNotification(`ERREUR: ${error.message}`, 'error');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadScans(),
      loadActiveScans(),
      loadReports()
    ]);
    showNotification('DONNÉES ACTUALISÉES', 'success');
  };

  if (loading) {
    return (
      <div style={{
        ...cyberStyles.container,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '64px', 
            color: '#00d4ff',
            marginBottom: '24px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>⚡</div>
          <div style={{ 
            fontSize: '24px', 
            color: '#ffffff',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>INITIALISATION PACHA TOOLBOX</div>
          <div style={{ 
            fontSize: '14px', 
            color: '#a0a0a0',
            marginTop: '12px'
          }}>Chargement des modules de sécurité...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={cyberStyles.container}>
      <Header />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Navigation par onglets */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '24px',
          background: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '12px',
          padding: '8px',
          border: '1px solid #333'
        }}>
          {[
            { id: 'scanner', label: 'SCANNER', icon: '🎯' },
            { id: 'console', label: 'CONSOLE', icon: '💻' },
            { id: 'reports', label: 'RAPPORTS', icon: '📊' },
            { id: 'system', label: 'SYSTÈME', icon: '🔧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 
                  'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' : 
                  'transparent',
                color: activeTab === tab.id ? '#0a0a0f' : '#00d4ff',
                border: 'none',
                borderRadius: '8px',
                marginRight: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                flex: 1,
                boxShadow: activeTab === tab.id ? cyberStyles.glow.primary : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'scanner' && (
          <div>
            <ScanForm
              onScanStart={handleScanStart}
              toolsStatus={toolsStatus}
              scanTypes={scanTypes}
            />
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: activeScans.length > 0 ? '1fr 1fr' : '1fr', 
              gap: '24px' 
            }}>
              <ActiveScansList
                activeScans={activeScans}
                onStopScan={handleStopScan}
                onSelectScan={setSelectedScan}
                selectedScan={selectedScan}
              />
              
              {activeScans.length > 0 && (
                <ScanHistory
                  scans={scans}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div>
            <TerminalOutput 
              scanId={selectedScan} 
              isActive={!!selectedScan && activeScans.some(s => s.scan_id === selectedScan)}
            />
            
            {activeScans.length > 0 && (
              <ActiveScansList
                activeScans={activeScans}
                onStopScan={handleStopScan}
                onSelectScan={setSelectedScan}
                selectedScan={selectedScan}
              />
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsSection
            reports={reports}
            onRefreshReports={loadReports}
          />
        )}

        {activeTab === 'system' && (
          <SystemStatus
            toolsStatus={toolsStatus}
            systemStats={systemStats}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderTop: '1px solid #00d4ff',
        padding: '24px 0',
        marginTop: '40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#00d4ff',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            PACHA TOOLBOX v2.0
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#a0a0a0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Plateforme professionnelle d'évaluation de sécurité IT
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;// frontend/src/App.js - Interface IT Cyber Professionnelle Moderne
import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ==================== STYLES IT CYBER ====================

const cyberStyles = {
  // Couleurs du thème cyber
  colors: {
    primary: '#00d4ff',      // Cyan cyber
    secondary: '#ff6b35',    // Orange accent
    success: '#00ff88',      // Vert néon
    warning: '#ffff00',      // Jaune vif
    error: '#ff3333',        // Rouge néon
    background: '#0a0a0f',   // Noir profond
    surface: '#1a1a2e',      // Gris foncé
    surfaceLight: '#16213e', // Gris moyen
    text: '#ffffff',         // Blanc
    textSecondary: '#a0a0a0', // Gris clair
    border: '#333',          // Bordure foncée
    borderLight: '#555'      // Bordure claire
  },
  
  // Animations et effets
  glow: {
    primary: '0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff',
    success: '0 0 10px #00ff88, 0 0 20px #00ff88',
    warning: '0 0 10px #ffff00, 0 0 20px #ffff00',
    error: '0 0 10px #ff3333, 0 0 20px #ff3333'
  },
  
  // Styles de base
  container: {
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    backgroundColor: '#0a0a0f',
    minHeight: '100vh',
    color: '#ffffff',
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)'
  },
  
  header: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    borderBottom: '2px solid #00d4ff',
    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  card: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    position: 'relative'
  },
  
  button: {
    primary: {
      background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
      color: '#0a0a0f',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)'
    },
    secondary: {
      background: 'transparent',
      color: '#00d4ff',
      border: '2px solid #00d4ff',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit'
    },
    success: {
      background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
      color: '#0a0a0f',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(0, 255, 136, 0.4)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ff3333 0%, #cc0000 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(255, 51, 51, 0.4)'
    }
  },
  
  input: {
    background: '#16213e',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#ffffff',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  
  terminal: {
    background: '#000000',
    border: '1px solid #00d4ff',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: '13px',
    color: '#00ff88',
    minHeight: '200px',
    maxHeight: '400px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    boxShadow: 'inset 0 0 20px rgba(0, 212, 255, 0.2)'
  }
};

// ==================== COMPOSANTS ====================

const Header = () => (
  <div style={cyberStyles.header}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%2300d4ff" fill-opacity="0.05"%3E%3Cpath d="M20 20L0 0h40L20 20zM20 20L0 40h40L20 20z"/%3E%3C/g%3E%3C/svg%3E")',
      animation: 'pulse 4s ease-in-out infinite'
    }}></div>
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '900',
            letterSpacing: '2px'
          }}>
            PACHA
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(0, 212, 255, 0.2)',
            border: '1px solid #00d4ff',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#00d4ff',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            CYBER SECURITY PLATFORM
          </div>
        </div>
        <div style={{ 
          textAlign: 'right', 
          fontSize: '12px',
          color: '#a0a0a0',
          fontFamily: "'Fira Code', monospace"
        }}>
          <div>v2.0.0 | {new Date().toLocaleDateString()}</div>
          <div style={{ color: '#00ff88' }}>● SYSTEM OPERATIONAL</div>
        </div>
      </div>
    </div>
  </div>
);

const StatusIndicator = ({ status, children }) => {
  const getStatusStyle = (status) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '16px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyle,
          background: 'rgba(0, 255, 136, 0.2)',
          color: '#00ff88',
          border: '1px solid #00ff88'
        };
      case 'running':
        return {
          ...baseStyle,
          background: 'rgba(255, 255, 0, 0.2)',
          color: '#ffff00',
          border: '1px solid #ffff00',
          animation: 'pulse 2s ease-in-out infinite'
        };
      case 'error':
        return {
          ...baseStyle,
          background: 'rgba(255, 51, 51, 0.2)',
          color: '#ff3333',
          border: '1px solid #ff3333'
        };
      case 'starting':
        return {
          ...baseStyle,
          background: 'rgba(0, 212, 255, 0.2)',
          color: '#00d4ff',
          border: '1px solid #00d4ff'
        };
      default:
        return {
          ...baseStyle,
          background: 'rgba(160, 160, 160, 0.2)',
          color: '#a0a0a0',
          border: '1px solid #a0a0a0'
        };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '●';
      case 'error': return '✗';
      case 'starting': return '○';
      default: return '◦';
    }
  };

  return (
    <span style={getStatusStyle(status)}>
      {getStatusIcon(status)} {children}
    </span>
  );
};

const TerminalOutput = ({ scanId, isActive }) => {
  const [output, setOutput] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && scanId) {
      setIsConnected(true);
      
      // Polling pour récupérer les nouvelles lignes
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE}/scan/live/${scanId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.new_lines && data.new_lines.length > 0) {
              setOutput(prev => [...prev, ...data.new_lines]);
            }
            
            if (!data.is_running) {
              setIsConnected(false);
              clearInterval(intervalRef.current);
            }
          }
        } catch (error) {
          console.error('Erreur polling output:', error);
          setIsConnected(false);
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanId, isActive]);

  useEffect(() => {
    // Auto-scroll vers le bas
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  if (!isActive) {
    return (
      <div style={{
        ...cyberStyles.terminal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontStyle: 'italic'
      }}>
        Terminal en attente d'un scan actif...
      </div>
    );
  }

  return (
    <div style={cyberStyles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h