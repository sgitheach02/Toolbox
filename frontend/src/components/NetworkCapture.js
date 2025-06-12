// frontend/src/components/NetworkCapture.js
import React, { useState, useEffect } from 'react';

const NetworkCapture = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [activeCaptures, setActiveCaptures] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState('eth0');
  const [captureFilter, setCaptureFilter] = useState('');
  const [captureDuration, setCaptureDuration] = useState(300);
  const [captureName, setCaptureName] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadInterfaces();
    loadFilters();
    loadActiveCaptures();
    
    const interval = setInterval(loadActiveCaptures, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInterfaces = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/interfaces`);
      const data = await response.json();
      setInterfaces(data.interfaces || []);
      if (data.default) {
        setSelectedInterface(data.default);
      }
    } catch (error) {
      console.error('Erreur chargement interfaces:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/filters`);
      const data = await response.json();
      setFilters(data.categories || {});
    } catch (error) {
      console.error('Erreur chargement filtres:', error);
    }
  };

  const loadActiveCaptures = async () => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/status`);
      const data = await response.json();
      setActiveCaptures(data.captures || []);
    } catch (error) {
      console.error('Erreur chargement captures:', error);
    }
  };

  const startCapture = async () => {
    if (!selectedInterface) {
      alert('Sélectionnez une interface réseau');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/network/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interface: selectedInterface,
          duration: captureDuration,
          filter: captureFilter,
          name: captureName || `Capture_${new Date().toLocaleTimeString()}`
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.message}`);
        setCaptureFilter('');
        setCaptureName('');
        loadActiveCaptures();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stopCapture = async (captureId) => {
    try {
      const response = await fetch(`${API_BASE}/network/capture/stop/${captureId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`🛑 ${data.message}`);
        loadActiveCaptures();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const downloadCapture = (captureId) => {
    window.open(`${API_BASE}/network/capture/download/${captureId}`, '_blank');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '🔴';
      case 'completed': return '✅';
      case 'stopped': return '🛑';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📡 Capture Réseau (tcpdump)</h2>
        <p>Surveillance et analyse du trafic réseau en temps réel</p>
      </div>

      {/* Formulaire de nouvelle capture */}
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '25px', marginBottom: '30px' }}>
        <h3>🚀 Nouvelle Capture</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label>Interface Réseau:</label>
            <select 
              value={selectedInterface}
              onChange={(e) => setSelectedInterface(e.target.value)}
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
            >
              {interfaces.map(iface => (
                <option key={iface.name} value={iface.name} style={{ background: '#374151' }}>
                  {iface.display}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Durée:</label>
            <select 
              value={captureDuration}
              onChange={(e) => setCaptureDuration(parseInt(e.target.value))}
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
            >
              <option value={60} style={{ background: '#374151' }}>1 minute</option>
              <option value={300} style={{ background: '#374151' }}>5 minutes</option>
              <option value={600} style={{ background: '#374151' }}>10 minutes</option>
              <option value={1800} style={{ background: '#374151' }}>30 minutes</option>
              <option value={3600} style={{ background: '#374151' }}>1 heure</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Nom de la capture:</label>
          <input
            type="text"
            value={captureName}
            onChange={(e) => setCaptureName(e.target.value)}
            placeholder="ex: Analyse_PrintNightmare"
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Filtre BPF:</label>
          <input
            type="text"
            value={captureFilter}
            onChange={(e) => setCaptureFilter(e.target.value)}
            placeholder="ex: port 80, host printnightmare.thm, smb"
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
          />
        </div>

        {/* Filtres rapides */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#fbbf24' }}>🎯 Filtres Rapides:</h4>
          {Object.entries(filters).map(([category, categoryFilters]) => (
            <div key={category} style={{ marginBottom: '10px' }}>
              <strong style={{ display: 'block', marginBottom: '5px' }}>{category}:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(categoryFilters).map(([name, filterData]) => (
                  <button
                    key={name}
                    onClick={() => setCaptureFilter(filterData.filter)}
                    style={{ 
                      padding: '6px 12px', 
                      background: 'rgba(59,130,246,0.8)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '20px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title={filterData.description}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={startCapture}
          disabled={loading || !selectedInterface}
          style={{ 
            width: '100%', 
            padding: '15px', 
            background: loading ? '#6b7280' : 'linear-gradient(45deg, #10b981, #059669)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '15px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {loading ? '⏳ Démarrage...' : '🚀 Démarrer la Capture'}
        </button>
      </div>

      {/* Liste des captures */}
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '25px' }}>
        <h3>📊 Captures Actives ({activeCaptures.length})</h3>
        
        {activeCaptures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
            <p>Aucune capture en cours</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {activeCaptures.map(capture => (
              <div key={capture.id} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>
                    {getStatusIcon(capture.status)} {capture.name}
                  </h4>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    backgroundColor: capture.status === 'running' ? '#ef4444' : capture.status === 'completed' ? '#10b981' : '#f59e0b'
                  }}>
                    {capture.status}
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                  <p><strong>Interface:</strong> {capture.interface}</p>
                  <p><strong>Durée:</strong> {formatDuration(capture.duration)}</p>
                  {capture.filter && <p><strong>Filtre:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{capture.filter}</code></p>}
                  <p><strong>Démarré:</strong> {new Date(capture.start_time).toLocaleString()}</p>
                  {capture.packets_captured > 0 && <p><strong>Paquets:</strong> {capture.packets_captured.toLocaleString()}</p>}
                  {capture.file_size && <p><strong>Taille:</strong> {formatFileSize(capture.file_size)}</p>}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {capture.status === 'running' && (
                    <button 
                      onClick={() => stopCapture(capture.id)}
                      style={{ padding: '8px 16px', background: 'linear-gradient(45deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
                    >
                      🛑 Arrêter
                    </button>
                  )}
                  
                  {['completed', 'stopped'].includes(capture.status) && (
                    <button 
                      onClick={() => downloadCapture(capture.id)}
                      style={{ padding: '8px 16px', background: 'linear-gradient(45deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
                    >
                      📥 Télécharger
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkCapture;
