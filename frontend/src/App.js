// frontend/src/App.js - Version avec onglet réseau
import React, { useState, useEffect } from 'react';
import NetworkCapture from './components/NetworkCapture';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('checking');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'scan', name: 'Scans', icon: '🔍' },
    { id: 'network', name: 'Réseau', icon: '📡' },
    { id: 'reports', name: 'Rapports', icon: '📊' }
  ];

  // Vérification de l'API
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
          setApiStatus('healthy');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>🏠 Dashboard Pacha Toolbox</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Plateforme de pentesting et analyse réseau</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '40px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '10px' }}>🔍 Scans de Reconnaissance</h3>
                <p>Nmap, Nikto, et détection de vulnérabilités</p>
              </div>
              
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <h3 style={{ color: '#10b981', marginBottom: '10px' }}>📡 Capture Réseau</h3>
                <p>tcpdump pour l'analyse de trafic en temps réel</p>
              </div>
              
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>📊 Rapports</h3>
                <p>Génération et export de rapports détaillés</p>
              </div>
            </div>
          </div>
        );
      
      case 'scan':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🔍 Module de Scans</h2>
            <p style={{ color: '#fbbf24', fontSize: '1.1rem' }}>Module de scans en cours de développement</p>
            <div style={{ marginTop: '40px', background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '15px' }}>
              <h3>🚧 Fonctionnalités à venir</h3>
              <ul style={{ textAlign: 'left', marginTop: '20px' }}>
                <li>🔍 Interface Nmap avancée</li>
                <li>🌐 Scans Nikto automatisés</li>
                <li>📋 Templates de scans prédéfinis</li>
                <li>📊 Rapports de scans en temps réel</li>
              </ul>
            </div>
          </div>
        );
      
      case 'network':
        return <NetworkCapture />;
      
      case 'reports':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>📊 Rapports</h2>
            <p style={{ color: '#fbbf24', fontSize: '1.1rem' }}>Module de rapports en cours de développement</p>
            <div style={{ marginTop: '40px', background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '15px' }}>
              <h3>📋 Fonctionnalités prévues</h3>
              <ul style={{ textAlign: 'left', marginTop: '20px' }}>
                <li>📄 Export PDF des résultats</li>
                <li>📊 Graphiques et statistiques</li>
                <li>🔍 Analyse comparative</li>
                <li>📧 Envoi automatique de rapports</li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return <div>Page non trouvée</div>;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {/* Header avec navigation */}
      <header style={{ 
        background: 'rgba(0, 0, 0, 0.2)', 
        padding: '15px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <h1 style={{ 
            fontSize: '1.8rem', 
            margin: 0,
            background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔒 Pacha Toolbox
          </h1>
          
          <nav style={{ display: 'flex', gap: '10px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'none';
                  }
                }}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main>
        {renderTabContent()}
      </main>

      {/* Footer avec statut API */}
      <footer style={{ 
        background: 'rgba(0, 0, 0, 0.2)', 
        padding: '15px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'fixed',
        bottom: 0,
        width: '100%'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: 'center',
          padding: '0 20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            🔒 Pacha Toolbox v2.0 - API Status: 
            <span style={{ 
              color: apiStatus === 'healthy' ? '#10b981' : apiStatus === 'error' ? '#ef4444' : '#fbbf24',
              fontWeight: 'bold',
              marginLeft: '5px'
            }}>
              {apiStatus === 'healthy' ? '✅ Opérationnelle' : 
               apiStatus === 'error' ? '❌ Hors ligne' : '⏳ Vérification'}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
