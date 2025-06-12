// frontend/src/App.js - Version corrigée
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [tasks, setTasks] = useState([]);
  const [scanForm, setScanForm] = useState({
    tool: 'nmap',
    target: '',
    args: '-sS'
  });

  // Fonction de test de connexion API (useCallback pour éviter l'erreur eslint)
  const testApiConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('Erreur connexion API:', error);
      setApiStatus('error');
    }
  }, []);

  // Test de connexion API au chargement
  useEffect(() => {
    testApiConnection();
  }, [testApiConnection]); // Dépendance correcte ajoutée

  // Fonction de soumission de scan
  const handleScanSubmit = async (e) => {
    e.preventDefault();
    
    if (!scanForm.target.trim()) {
      alert('Veuillez saisir une cible');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/scan/${scanForm.tool}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: scanForm.target,
          args: scanForm.args
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Ajouter la tâche à la liste
        const newTask = {
          id: Date.now(),
          tool: scanForm.tool,
          target: scanForm.target,
          status: result.status || 'completed',
          timestamp: new Date().toISOString(),
          results: result.results || {}
        };
        
        setTasks(prev => [newTask, ...prev]);
        
        // Reset du formulaire
        setScanForm({
          tool: 'nmap',
          target: '',
          args: '-sS'
        });
      } else {
        console.error('Erreur scan:', result);
        alert(`Erreur: ${result.error || 'Scan échoué'}`);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // Fonction pour tester l'API (fix de la variable non utilisée)
  const handleApiTest = async () => {
    try {
      const response = await fetch(`${API_URL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'frontend-connection' })
      });
      
      const result = await response.json();
      console.log('Test API:', result);
      alert('Test API réussi! Voir la console pour les détails.');
    } catch (error) {
      console.error('Erreur test API:', error);
      alert('Erreur test API');
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <h1>🛡️ Pacha Toolbox</h1>
        <div className={`status-indicator ${apiStatus}`}>
          API: {apiStatus === 'connected' ? '✅ Connecté' : 
                apiStatus === 'error' ? '❌ Erreur' : '🔄 Vérification...'}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="app-main">
        
        {/* Section de scan */}
        <section className="scan-section">
          <h2>🔍 Nouveau Scan</h2>
          <form onSubmit={handleScanSubmit} className="scan-form">
            <div className="form-group">
              <label htmlFor="tool">Outil:</label>
              <select 
                id="tool"
                value={scanForm.tool} 
                onChange={(e) => setScanForm(prev => ({...prev, tool: e.target.value}))}
              >
                <option value="nmap">Nmap</option>
                <option value="nikto">Nikto</option>
                <option value="dirb">Dirb</option>
                <option value="sqlmap">SQLMap</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="target">Cible:</label>
              <input 
                type="text" 
                id="target"
                value={scanForm.target}
                onChange={(e) => setScanForm(prev => ({...prev, target: e.target.value}))}
                placeholder="Ex: 192.168.1.1 ou example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="args">Arguments:</label>
              <input 
                type="text" 
                id="args"
                value={scanForm.args}
                onChange={(e) => setScanForm(prev => ({...prev, args: e.target.value}))}
                placeholder="Ex: -sS -O pour nmap"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                🚀 Lancer le Scan
              </button>
              <button type="button" onClick={handleApiTest} className="btn-secondary">
                🧪 Test API
              </button>
            </div>
          </form>
        </section>

        {/* Section des résultats */}
        <section className="results-section">
          <h2>📊 Résultats ({tasks.length})</h2>
          
          {tasks.length === 0 ? (
            <div className="no-results">
              <p>Aucun scan effectué. Lancez votre premier scan ci-dessus.</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className={`task-item ${task.status}`}>
                  <div className="task-header">
                    <span className="task-tool">{task.tool.toUpperCase()}</span>
                    <span className="task-target">{task.target}</span>
                    <span className={`task-status ${task.status}`}>
                      {task.status === 'completed' ? '✅ Terminé' : 
                       task.status === 'running' ? '🔄 En cours' : 
                       task.status === 'failed' ? '❌ Échec' : task.status}
                    </span>
                  </div>
                  
                  <div className="task-details">
                    <p><strong>Heure:</strong> {new Date(task.timestamp).toLocaleString()}</p>
                    {task.results && Object.keys(task.results).length > 0 && (
                      <div className="task-results">
                        <p><strong>Résultats:</strong></p>
                        <pre>{JSON.stringify(task.results, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Pacha Toolbox v2.0 - Outil de tests d'intrusion automatisés</p>
      </footer>
    </div>
  );
}

export default App;