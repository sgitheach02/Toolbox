// frontend/src/App.js - Version corrigée complète
import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('checking');
  const [systemData, setSystemData] = useState({});
  const [loading, setLoading] = useState(false);

  // Vérification de l'API au démarrage
  useEffect(() => {
    checkApiHealth();
    fetchSystemData();
    
    // Actualisation automatique
    const interval = setInterval(() => {
      checkApiHealth();
      fetchSystemData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        console.log('✅ API connectée:', data);
      } else {
        throw new Error('API unreachable');
      }
    } catch (error) {
      console.error('❌ Erreur API:', error);
      setApiStatus('disconnected');
    }
  };

  const fetchSystemData = async () => {
    try {
      // Récupération des données du système
      const [statusResponse, scansResponse, reportsResponse] = await Promise.allSettled([
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/scans/history?limit=10`),
        fetch(`${API_BASE}/reports/list`)
      ]);

      const newSystemData = {};

      // Status général
      if (statusResponse.status === 'fulfilled' && statusResponse.value.ok) {
        const statusData = await statusResponse.value.json();
        newSystemData.status = statusData;
      }

      // Historique des scans
      if (scansResponse.status === 'fulfilled' && scansResponse.value.ok) {
        const scansData = await scansResponse.value.json();
        newSystemData.scans = scansData.scans || [];
        newSystemData.total_scans = scansData.total || 0;
      } else {
        newSystemData.scans = [];
        newSystemData.total_scans = 0;
      }

      // Rapports
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value.ok) {
        const reportsData = await reportsResponse.value.json();
        newSystemData.reports = reportsData.reports || [];
        newSystemData.total_reports = reportsData.total || 0;
      } else {
        newSystemData.reports = [];
        newSystemData.total_reports = 0;
      }

      setSystemData(newSystemData);

    } catch (error) {
      console.error('❌ Erreur récupération données système:', error);
    }
  };

  // Navigation principale
  const Navigation = () => (
    <nav style={{
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🛡️ Pacha Toolbox
        </h1>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        {['dashboard', 'scans', 'network', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab 
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : 'transparent',
              color: 'white',
              border: activeTab === tab ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.95rem',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab === 'dashboard' && '🏠 Dashboard'}
            {tab === 'scans' && '🔍 Scans'}
            {tab === 'network' && '📡 Réseau'}
            {tab === 'reports' && '📊 Rapports'}
          </button>
        ))}
        
        <div style={{
          background: apiStatus === 'connected' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {apiStatus === 'connected' ? '✅ API OK' : '❌ API OFF'}
        </div>
      </div>
    </nav>
  );

  // Dashboard principal
  const Dashboard = () => {
    const activeScans = systemData.scans?.filter(scan => scan.status === 'running')?.length || 0;
    const totalScans = systemData.total_scans || 0;
    const totalReports = systemData.total_reports || 0;

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
              {activeScans}
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
              0
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
              {totalScans}
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
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
              4
            </p>
            <p style={{ opacity: 0.8 }}>Nmap, Nikto, tcpdump, tshark</p>
          </div>
        </div>

        {/* Activité récente */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#fbbf24' }}>🕒 Activité Récente</h3>
          
          {systemData.scans && systemData.scans.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {systemData.scans.slice(0, 5).map((scan, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#3b82f6' }}>
                      {scan.tool?.toUpperCase()} - {scan.target}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Date inconnue'}
                    </p>
                  </div>
                  <div style={{
                    background: scan.status === 'completed' ? '#10b981' : scan.status === 'failed' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {scan.status === 'completed' ? '✅ Terminé' : 
                     scan.status === 'failed' ? '❌ Échec' : '⏳ En cours'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '40px'
            }}>
              <p style={{ fontSize: '1.2rem' }}>Aucune activité récente</p>
              <p style={{ fontSize: '0.9rem' }}>Lancez votre premier scan pour voir l'activité ici</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Module de Scans
  const ScansModule = () => {
    const [scanForm, setScanForm] = useState({
      tool: 'nmap',
      target: '127.0.0.1',
      scan_type: 'basic'
    });
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async () => {
      setIsScanning(true);
      try {
        const response = await fetch(`${API_BASE}/scan/${scanForm.tool}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scanForm)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Scan lancé:', result);
          alert('✅ Scan lancé avec succès !');
          
          // Actualiser les données
          fetchSystemData();
        } else {
          throw new Error('Erreur lors du lancement du scan');
        }
      } catch (error) {
        console.error('❌ Erreur scan:', error);
        alert('❌ Erreur lors du lancement du scan');
      } finally {
        setIsScanning(false);
      }
    };

    return (
      <div style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: '30px', color: '#3b82f6' }}>🔍 Module de Scans</h2>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Nouveau Scan</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fbbf24' }}>Outil:</label>
              <select
                value={scanForm.tool}
                onChange={(e) => setScanForm({...scanForm, tool: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <option value="nmap">Nmap</option>
                <option value="nikto">Nikto</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fbbf24' }}>Cible:</label>
              <input
                type="text"
                value={scanForm.target}
                onChange={(e) => setScanForm({...scanForm, target: e.target.value})}
                placeholder="192.168.1.1"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fbbf24' }}>Type:</label>
              <select
                value={scanForm.scan_type}
                onChange={(e) => setScanForm({...scanForm, scan_type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <option value="basic">Basique</option>
                <option value="comprehensive">Complet</option>
                <option value="stealth">Furtif</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleScan}
            disabled={isScanning}
            style={{
              background: isScanning 
                ? 'rgba(59, 130, 246, 0.5)' 
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {isScanning ? '⏳ Scan en cours...' : '🚀 Lancer le Scan'}
          </button>
        </div>
        
        {/* Historique des scans */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Historique des Scans</h3>
          
          {systemData.scans && systemData.scans.length > 0 ? (
            systemData.scans.map((scan, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                marginBottom: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#3b82f6' }}>
                    {scan.tool?.toUpperCase()} - {scan.target}
                  </h4>
                  <div style={{
                    background: scan.status === 'completed' ? '#10b981' : scan.status === 'failed' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {scan.status}
                  </div>
                </div>
                
                <p style={{ margin: '5px 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong>Type:</strong> {scan.scan_type || 'N/A'}
                </p>
                <p style={{ margin: '5px 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong>Date:</strong> {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Date inconnue'}
                </p>
                
                {scan.results && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '5px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      <strong>Résultats:</strong> {JSON.stringify(scan.results, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '40px'
            }}>
              <p>Aucun scan dans l'historique</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Module Réseau
  const NetworkModule = () => (
    <div style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '30px', color: '#10b981' }}>📡 Module Réseau</h2>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px' }}>🚧 Module en développement</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Le module de capture réseau sera disponible dans une prochaine version.
        </p>
      </div>
    </div>
  );

  // Module Rapports
  const ReportsModule = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = async () => {
      setIsGenerating(true);
      try {
        const response = await fetch(`${API_BASE}/reports/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'html',
            type: 'comprehensive',
            period: '7_days'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Rapport généré:', result);
          alert('✅ Rapport généré avec succès !');
          
          // Actualiser les données
          fetchSystemData();
        } else {
          throw new Error('Erreur lors de la génération du rapport');
        }
      } catch (error) {
        console.error('❌ Erreur génération rapport:', error);
        alert('❌ Erreur lors de la génération du rapport');
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: '30px', color: '#f59e0b' }}>📊 Module Rapports</h2>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Générer un nouveau rapport</h3>
          
          <button
            onClick={generateReport}
            disabled={isGenerating}
            style={{
              background: isGenerating 
                ? 'rgba(245, 158, 11, 0.5)' 
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {isGenerating ? '⏳ Génération...' : '📄 Générer Rapport HTML'}
          </button>
        </div>
        
        {/* Liste des rapports */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Rapports disponibles ({systemData.total_reports || 0})</h3>
          
          {systemData.reports && systemData.reports.length > 0 ? (
            systemData.reports.map((report, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                marginBottom: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#f59e0b' }}>
                    {report.filename}
                  </h4>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Taille: {report.size_formatted || 'N/A'} • 
                    Format: {report.format || 'N/A'} • 
                    Créé: {report.created_at ? new Date(report.created_at).toLocaleString() : 'Date inconnue'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  onClick={() => window.open(`${API_BASE}/reports/preview/${report.filename}`, '_blank')}
                  >
                    👁️ Aperçu
                  </button>
                  
                  <button style={{
                    background: 'linear-gradient(135deg, #10b981, #047857)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  onClick={() => window.open(`${API_BASE}/reports/download/${report.filename}`, '_blank')}
                  >
                    📥 Télécharger
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '40px'
            }}>
              <p>Aucun rapport disponible</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                Générez votre premier rapport en utilisant le bouton ci-dessus
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu principal
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scans':
        return <ScansModule />;
      case 'network':
        return <NetworkModule />;
      case 'reports':
        return <ReportsModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1f2937 50%, #111827 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Navigation />
      
      <main style={{ minHeight: 'calc(100vh - 80px)' }}>
        {renderActiveTab()}
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
}

export default App;