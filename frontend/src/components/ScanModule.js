// Solution pour corriger le polling infini du scan Nikto
// frontend/src/components/ScanModule.js

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

const ScanModule = () => {
  const [scans, setScans] = useState([]);
  const [scanForm, setScanForm] = useState({
    tool: 'nikto',
    target: 'http://localhost',
    scan_type: 'basic'
  });
  const [loading, setLoading] = useState(false);
  const [activeScan, setActiveScan] = useState(null);
  const [scanOutput, setScanOutput] = useState([]);
  
  // Refs pour contrôler les intervalles
  const scanPollingRef = useRef(null);
  const outputPollingRef = useRef(null);
  const isPollingRef = useRef(false);

  // Fonction pour nettoyer tous les intervalles
  const cleanupPolling = useCallback(() => {
    if (scanPollingRef.current) {
      clearInterval(scanPollingRef.current);
      scanPollingRef.current = null;
    }
    if (outputPollingRef.current) {
      clearInterval(outputPollingRef.current);
      outputPollingRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Fonction pour récupérer les scans actifs avec limitation
  const fetchActiveScans = useCallback(async () => {
    if (isPollingRef.current) return; // Éviter les appels concurrents
    
    try {
      isPollingRef.current = true;
      const response = await fetch(`${API_BASE}/scan/active`);
      if (response.ok) {
        const data = await response.json();
        setScans(data);
        
        // Si aucun scan actif, arrêter le polling
        if (!data || data.length === 0) {
          cleanupPolling();
          setActiveScan(null);
        }
      }
    } catch (error) {
      console.error('Erreur fetch scans actifs:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [cleanupPolling]);

  // Fonction pour récupérer l'output d'un scan avec limitation
  const fetchScanOutput = useCallback(async (scanId) => {
    if (!scanId || isPollingRef.current) return;
    
    try {
      isPollingRef.current = true;
      const response = await fetch(`${API_BASE}/scan/live/${scanId}`);
      if (response.ok) {
        const data = await response.json();
        setScanOutput(data.lines || []);
        
        // Si le scan n'est plus en cours, arrêter le polling
        if (!data.is_running) {
          cleanupPolling();
          setActiveScan(null);
          console.log(`✅ Scan ${scanId} terminé`);
        }
      }
    } catch (error) {
      console.error('Erreur fetch output scan:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [cleanupPolling]);

  // Démarrer le polling intelligent
  const startPolling = useCallback((scanId = null) => {
    cleanupPolling(); // Nettoyer d'abord
    
    // Polling des scans actifs (moins fréquent)
    scanPollingRef.current = setInterval(() => {
      fetchActiveScans();
    }, 3000); // Toutes les 3 secondes au lieu de 1

    // Polling de l'output du scan actif (plus fréquent mais contrôlé)
    if (scanId) {
      outputPollingRef.current = setInterval(() => {
        fetchScanOutput(scanId);
      }, 2000); // Toutes les 2 secondes
    }
  }, [fetchActiveScans, fetchScanOutput, cleanupPolling]);

  // Démarrer un nouveau scan
  const startScan = async () => {
    if (loading) return;
    
    setLoading(true);
    cleanupPolling(); // Nettoyer le polling précédent
    
    try {
      const response = await fetch(`${API_BASE}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanForm)
      });

      if (response.ok) {
        const result = await response.json();
        setActiveScan(result.scan_id);
        setScanOutput([]);
        
        // Démarrer le polling pour ce scan
        startPolling(result.scan_id);
        
        console.log(`🚀 Scan ${result.scan_id} démarré`);
      } else {
        const error = await response.json();
        console.error('Erreur démarrage scan:', error);
      }
    } catch (error) {
      console.error('Erreur requête scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arrêter un scan
  const stopScan = async (scanId) => {
    try {
      const response = await fetch(`${API_BASE}/scan/stop/${scanId}`, {
        method: 'POST'
      });

      if (response.ok) {
        cleanupPolling();
        setActiveScan(null);
        console.log(`🛑 Scan ${scanId} arrêté`);
      }
    } catch (error) {
      console.error('Erreur arrêt scan:', error);
    }
  };

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  // Chargement initial
  useEffect(() => {
    fetchActiveScans();
  }, [fetchActiveScans]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔍 Scanner de Sécurité</h2>
      
      {/* Formulaire de scan */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <label>Outil:</label>
          <select 
            value={scanForm.tool}
            onChange={(e) => setScanForm(prev => ({...prev, tool: e.target.value}))}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="nikto">Nikto (Web)</option>
            <option value="nmap">Nmap (Réseau)</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Cible:</label>
          <input
            type="text"
            value={scanForm.target}
            onChange={(e) => setScanForm(prev => ({...prev, target: e.target.value}))}
            placeholder="http://example.com ou 192.168.1.1"
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Type:</label>
          <select 
            value={scanForm.scan_type}
            onChange={(e) => setScanForm(prev => ({...prev, scan_type: e.target.value}))}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="basic">Basique</option>
            <option value="comprehensive">Complet</option>
          </select>
        </div>

        <button 
          onClick={startScan}
          disabled={loading || activeScan}
          style={{
            background: loading || activeScan ? '#666' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: loading || activeScan ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Démarrage...' : activeScan ? '🔄 Scan en cours...' : '🚀 Démarrer le scan'}
        </button>
      </div>

      {/* Scans actifs */}
      {scans.length > 0 && (
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3>📊 Scans en cours</h3>
          {scans.map(scan => (
            <div key={scan.scan_id} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{scan.tool}</strong> → {scan.target}
                <div style={{ fontSize: '0.8em', color: '#ccc' }}>
                  ID: {scan.scan_id} | Démarré: {scan.start_time}
                </div>
              </div>
              <button 
                onClick={() => stopScan(scan.scan_id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🛑 Arrêter
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Output du scan */}
      {scanOutput.length > 0 && (
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3>📝 Output du scan</h3>
          <div style={{
            background: '#000',
            color: '#0f0',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {scanOutput.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur de status */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px',
        background: activeScan ? '#10b981' : '#6b7280',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '20px',
        fontSize: '0.9em'
      }}>
        {activeScan ? '🔄 Scan actif' : '⏸️ Aucun scan'}
      </div>
    </div>
  );
};

export default ScanModule;