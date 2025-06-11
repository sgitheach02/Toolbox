import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

// Configuration de l'API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Composant principal
function App() {
  const [activeTab, setActiveTab] = useState("nmap");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: 0 }}>
      {/* Header */}
      <header style={{ 
        background: "linear-gradient(135deg, #2c3e50, #3498db)", 
        color: "white", 
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "300" }}>
          🛡️ Pacha Toolbox - Suite de Sécurité
        </h1>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
          Outils de test de pénétration et d'analyse de sécurité
        </p>
      </header>

      {/* Navigation */}
      <nav style={{ 
        background: "#34495e", 
        padding: "0",
        borderBottom: "3px solid #3498db"
      }}>
        {["nmap", "wireshark", "metasploit", "openvas", "reports"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              padding: "15px 25px",
              cursor: "pointer",
              fontSize: "16px",
              textTransform: "capitalize",
              transition: "all 0.3s ease"
            }}
          >
            {tab === "nmap" && "🔍"} 
            {tab === "wireshark" && "📡"} 
            {tab === "metasploit" && "💥"} 
            {tab === "openvas" && "🔒"} 
            {tab === "reports" && "📊"} 
            {" " + tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Contenu principal */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 140px)" }}>
        {/* Zone principale */}
        <main style={{ flex: 1, padding: "20px" }}>
          {activeTab === "nmap" && <NmapScanner addNotification={addNotification} />}
          {activeTab === "wireshark" && <WiresharkCapture addNotification={addNotification} />}
          {activeTab === "metasploit" && <MetasploitConsole addNotification={addNotification} />}
          {activeTab === "openvas" && <OpenVASScanner addNotification={addNotification} />}
          {activeTab === "reports" && <ReportsManager />}
        </main>

        {/* Panneau de notifications */}
        <aside style={{ 
          width: "300px", 
          background: "#f8f9fa", 
          borderLeft: "1px solid #dee2e6",
          padding: "20px"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#495057" }}>🔔 Notifications</h3>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{
                background: notif.type === 'error' ? "#f8d7da" : 
                           notif.type === 'warning' ? "#fff3cd" : "#d1ecf1",
                border: `1px solid ${notif.type === 'error' ? "#f5c6cb" : 
                                    notif.type === 'warning' ? "#ffeaa7" : "#bee5eb"}`,
                borderRadius: "5px",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "14px"
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {notif.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                Aucune notification récente
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Composant Nmap Scanner
function NmapScanner({ addNotification }) {
  const [target, setTarget] = useState("");
  const [args, setArgs] = useState("-sV");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const handleScan = async (e, isAsync = false) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/scan/nmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          target, 
          args, 
          async: isAsync
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
      setScanHistory(prev => [data, ...prev.slice(0, 4)]);
      addNotification(`Scan Nmap ${isAsync ? 'lancé' : 'terminé'} pour ${target}`, 'info');
      
    } catch (err) {
      const errorResult = { error: err.message };
      setResult(errorResult);
      addNotification(`Erreur scan Nmap: ${err.message}`, 'error');
    }
    
    setLoading(false);
  };

  const masscanScan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/scan/masscan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          target,
          ports: "1-1000",
          rate: "1000"
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setResult(data);
      addNotification(`Masscan terminé pour ${target}`, 'info');
      
    } catch (err) {
      setResult({ error: err.message });
      addNotification(`Erreur Masscan: ${err.message}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>🔍 Scanner Nmap / Masscan</h2>
      
      <div style={{ 
        background: "white", 
        padding: "25px", 
        borderRadius: "10px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <form onSubmit={(e) => handleScan(e, false)}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Cible (IP/Domaine/Réseau):
            </label>
            <input
              type="text"
              placeholder="192.168.1.1 ou example.com ou 192.168.1.0/24"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Arguments Nmap:
            </label>
            <select 
              value={args} 
              onChange={(e) => setArgs(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            >
              <option value="-sV">Détection de version (-sV)</option>
              <option value="-sS">Scan SYN (-sS)</option>
              <option value="-sU">Scan UDP (-sU)</option>
              <option value="-sC -sV">Scripts par défaut + versions (-sC -sV)</option>
              <option value="-A">Scan agressif (-A)</option>
              <option value="-sn">Ping scan seulement (-sn)</option>
              <option value="-O">Détection OS (-O)</option>
              <option value="-p-">Tous les ports (-p-)</option>
            </select>
          </div>
          
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: "#3498db",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              {loading ? "⏳ Scan en cours..." : "🔍 Scan Nmap"}
            </button>
            
            <button 
              type="button"
              onClick={(e) => handleScan(e, true)}
              disabled={loading}
              style={{
                background: "#2ecc71",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px"
              }}
            >
              ⚡ Scan Async
            </button>
            
            <button 
              type="button"
              onClick={masscanScan}
              disabled={loading}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px"
              }}
            >
              🚀 Masscan
            </button>
          </div>
        </form>
      </div>

      {/* Résultats */}
      {result && (
        <ResultDisplay result={result} title="Résultats du scan" />
      )}

      {/* Historique */}
      {scanHistory.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>📜 Historique des scans récents</h3>
          {scanHistory.map((scan, index) => (
            <div key={index} style={{
              background: "white",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "5px",
              border: "1px solid #dee2e6"
            }}>
              <strong>Cible:</strong> {scan.target} | 
              <strong> Statut:</strong> {scan.status} | 
              <strong> ID:</strong> {scan.scan_id}
              {scan.report_files && (
                <div>
                  {scan.report_files.map(file => (
                    <a 
                      key={file.filename}
                      href={file.download_url}
                      style={{ marginRight: "10px", color: "#3498db" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📄 {file.filename} ({file.format})
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant Wireshark Capture
function WiresharkCapture({ addNotification }) {
  const [interfaceName, setInterfaceName] = useState("any");
  const [duration, setDuration] = useState(60);
  const [filter, setFilter] = useState("");
  const [captureName, setCaptureName] = useState("");
  const [activeCaptures, setActiveCaptures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interfaces] = useState([
    { name: "any", description: "Toutes les interfaces" },
    { name: "eth0", description: "Interface Ethernet" },
    { name: "wlan0", description: "Interface WiFi" },
    { name: "lo", description: "Interface Loopback" }
  ]);

  const startCapture = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/wireshark/capture/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interface: interfaceName,
          duration,
          filter,
          name: captureName || `capture_${Date.now()}`
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      addNotification(`Capture démarrée sur ${interfaceName} pour ${duration}s`, 'info');
      loadActiveCaptures();
      
    } catch (err) {
      addNotification(`Erreur capture: ${err.message}`, 'error');
    }
    
    setLoading(false);
  };

  const loadActiveCaptures = async () => {
    try {
      const response = await fetch(`${API_URL}/wireshark/capture/list`);
      const data = await response.json();
      if (response.ok) {
        setActiveCaptures(data.captures || []);
      }
    } catch (err) {
      console.error("Erreur chargement captures:", err);
    }
  };

  const stopCapture = async (captureId) => {
    try {
      const response = await fetch(`${API_URL}/wireshark/capture/stop/${captureId}`, {
        method: "POST"
      });

      const data = await response.json();
      
      if (response.ok) {
        addNotification(`Capture ${captureId} arrêtée`, 'info');
        loadActiveCaptures();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addNotification(`Erreur arrêt capture: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    loadActiveCaptures();
  }, []);

  return (
    <div>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>📡 Capture de Paquets Wireshark</h2>
      
      <div style={{ 
        background: "white", 
        padding: "25px", 
        borderRadius: "10px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <form onSubmit={startCapture}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Interface réseau:
            </label>
            <select
              value={interfaceName}
              onChange={(e) => setInterfaceName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            >
              {interfaces.map(iface => (
                <option key={iface.name} value={iface.name}>
                  {iface.description}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Durée (secondes):
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="1"
              max="3600"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Filtre de capture (optionnel):
            </label>
            <input
              type="text"
              placeholder="ex: tcp port 80 or udp"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Nom de la capture:
            </label>
            <input
              type="text"
              placeholder="Ma capture réseau"
              value={captureName}
              onChange={(e) => setCaptureName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: "#9b59b6",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Démarrage..." : "📡 Démarrer capture"}
          </button>
        </form>
      </div>

      {/* Captures actives */}
      {activeCaptures.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>🔴 Captures en cours</h3>
          <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
            {activeCaptures.map(capture => (
              <div key={capture.capture_id} style={{
                padding: "15px",
                borderBottom: "1px solid #dee2e6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong>{capture.capture_name}</strong> 
                  <span style={{ marginLeft: "10px", color: "#6c757d" }}>
                    ({capture.interface}) - {capture.status}
                  </span>
                  {capture.file_info && (
                    <div style={{ fontSize: "14px", color: "#28a745" }}>
                      📄 {capture.file_info.filename} ({(capture.file_info.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
                
                {capture.status === "running" && (
                  <button
                    onClick={() => stopCapture(capture.capture_id)}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "8px 15px",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    ⏹️ Arrêter
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Metasploit Console
function MetasploitConsole({ addNotification }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [exploits, setExploits] = useState([]);
  const [selectedExploit, setSelectedExploit] = useState(null);
  const [exploitTarget, setExploitTarget] = useState("");
  const [exploitPort, setExploitPort] = useState("80");
  const [loading, setLoading] = useState(false);

  const searchExploits = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/metasploit/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      setExploits(data.exploits || []);
      addNotification(`${data.exploits?.length || 0} exploits trouvés pour "${searchQuery}"`, 'info');
      
    } catch (err) {
      addNotification(`Erreur recherche: ${err.message}`, 'error');
    }
    
    setLoading(false);
  };

  const getExploitInfo = async (exploitName) => {
    try {
      const response = await fetch(`${API_URL}/metasploit/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exploit_name: exploitName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSelectedExploit({ name: exploitName, ...data.info });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addNotification(`Erreur info exploit: ${err.message}`, 'error');
    }
  };

  const runExploit = async () => {
    if (!selectedExploit || !exploitTarget) {
      addNotification("Sélectionnez un exploit et spécifiez une cible", 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/metasploit/exploit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exploit: selectedExploit.name,
          target: exploitTarget,
          port: exploitPort,
          confirm_authorization: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      addNotification(`Exploit ${selectedExploit.name} lancé contre ${exploitTarget}`, 'warning');
      
    } catch (err) {
      addNotification(`Erreur exploitation: ${err.message}`, 'error');
    }
  };

  return (
    <div>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>💥 Console Metasploit</h2>
      
      {/* Avertissement de sécurité */}
      <div style={{
        background: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "5px",
        padding: "15px",
        marginBottom: "20px"
      }}>
        <h4 style={{ color: "#856404", margin: "0 0 10px 0" }}>⚠️ Avertissement</h4>
        <p style={{ margin: 0, color: "#856404" }}>
          Les outils Metasploit sont destinés uniquement aux tests de pénétration autorisés. 
          Assurez-vous d'avoir l'autorisation explicite avant de tester des systèmes.
        </p>
      </div>

      {/* Recherche d'exploits */}
      <div style={{ 
        background: "white", 
        padding: "25px", 
        borderRadius: "10px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <h3>🔍 Recherche d'exploits</h3>
        <form onSubmit={searchExploits}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="ex: windows, apache, ftp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
              style={{
                flex: 1,
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px"
              }}
            >
              {loading ? "⏳" : "🔍"} Rechercher
            </button>
          </div>
        </form>

        {/* Résultats de recherche */}
        {exploits.length > 0 && (
          <div>
            <h4>📋 Exploits trouvés ({exploits.length})</h4>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {exploits.map((exploit, index) => (
                <div 
                  key={index}
                  onClick={() => getExploitInfo(exploit.name)}
                  style={{
                    padding: "10px",
                    border: "1px solid #dee2e6",
                    borderRadius: "5px",
                    marginBottom: "5px",
                    cursor: "pointer",
                    background: selectedExploit?.name === exploit.name ? "#e3f2fd" : "#f8f9fa"
                  }}
                >
                  <strong>{exploit.name}</strong>
                  <div style={{ fontSize: "14px", color: "#6c757d" }}>
                    {exploit.description} | Rang: {exploit.rank} | Date: {exploit.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Informations de l'exploit sélectionné */}
      {selectedExploit && (
        <div style={{ 
          background: "white", 
          padding: "25px", 
          borderRadius: "10px", 
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "20px"
        }}>
          <h3>📊 Détails de l'exploit</h3>
          <div style={{ marginBottom: "20px" }}>
            <p><strong>Nom:</strong> {selectedExploit.name}</p>
            <p><strong>Description:</strong> {selectedExploit.description}</p>
            {selectedExploit.author && selectedExploit.author.length > 0 && (
              <p><strong>Auteur:</strong> {selectedExploit.author.join(", ")}</p>
            )}
          </div>

          <h4>🎯 Configuration d'attaque</h4>
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Cible:
              </label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={exploitTarget}
                onChange={(e) => setExploitTarget(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e9ecef",
                  borderRadius: "5px"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Port:
              </label>
              <input
                type="text"
                value={exploitPort}
                onChange={(e) => setExploitPort(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e9ecef",
                  borderRadius: "5px"
                }}
              />
            </div>
          </div>

          <button 
            onClick={runExploit}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              padding: "12px 25px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            💥 Lancer l'exploit
          </button>
        </div>
      )}
    </div>
  );
}

// Composant OpenVAS Scanner
function OpenVASScanner({ addNotification }) {
  const [target, setTarget] = useState("172.29.103.151"); // IP utilisateur corrigée
  const [scanName, setScanName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [scanStatus, setScanStatus] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    // Charger les informations réseau
    fetch(`${API_URL}/network/info`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setNetworkInfo(data);
        }
      })
      .catch(err => console.log("Info réseau non disponible"));
  }, []);

  const startVulnScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/openvas/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          target, 
          scan_name: scanName || `Scan_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}`
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
      setTaskId(data.task_id);
      addNotification(`Scan OpenVAS démarré pour ${target}`, 'info');
      
      // Démarrage du polling du statut
      pollScanStatus(data.task_id);
      
    } catch (err) {
      setResult({ error: err.message });
      addNotification(`Erreur OpenVAS: ${err.message}`, 'error');
    }
    
    setLoading(false);
  };

  const pollScanStatus = async (id) => {
    try {
      const response = await fetch(`${API_URL}/openvas/status/${id}`);
      const data = await response.json();
      
      setScanStatus(data);
      
      if (data.status === "Done") {
        addNotification(`Scan OpenVAS terminé pour la tâche ${id}`, 'info');
      } else if (data.status === "Running") {
        // Continuer le polling toutes les 10 secondes
        setTimeout(() => pollScanStatus(id), 10000);
      }
    } catch (err) {
      console.error("Erreur polling statut:", err);
    }
  };

  const downloadReport = async () => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`${API_URL}/openvas/report/${taskId}?format=xml`);
      const data = await response.json();
      
      if (response.ok) {
        addNotification(`Rapport OpenVAS généré: ${data.report_file.filename}`, 'info');
        // Ouvrir le lien de téléchargement
        window.open(data.report_file.download_url, '_blank');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addNotification(`Erreur téléchargement rapport: ${err.message}`, 'error');
    }
  };

  return (
    <div>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>🔒 Scanner de Vulnérabilités OpenVAS</h2>
      
      {/* Information réseau et DVWA */}
      <div style={{
        background: "#d4edda",
        border: "1px solid #c3e6cb",
        borderRadius: "5px",
        padding: "15px",
        marginBottom: "20px"
      }}>
        <h4 style={{ color: "#155724", margin: "0 0 10px 0" }}>🎯 Informations Réseau</h4>
        <p style={{ margin: "5px 0", color: "#155724" }}>
          <strong>DVWA:</strong> http://localhost:8080 (interface web)
        </p>
        <p style={{ margin: "5px 0", color: "#155724" }}>
          <strong>Votre subnet:</strong> 172.29.103.151/20
        </p>
        {networkInfo && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ margin: "2px 0", color: "#155724", fontSize: "14px" }}>
              <strong>IPs suggérées:</strong> {networkInfo.suggested_targets?.join(", ")}
            </p>
          </div>
        )}
      </div>
      
      <div style={{ 
        background: "white", 
        padding: "25px", 
        borderRadius: "10px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <form onSubmit={startVulnScan}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Cible à scanner:
            </label>
            <input
              type="text"
              placeholder="172.29.103.151 (votre réseau)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
            <small style={{ color: "#6c757d" }}>
              Utilisez une IP de votre réseau 172.29.103.x ou localhost
            </small>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Nom du scan (optionnel):
            </label>
            <input
              type="text"
              placeholder="Scan de vulnérabilités réseau"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Démarrage..." : "🔒 Lancer scan OpenVAS"}
          </button>
        </form>

        {/* Statut du scan */}
        {scanStatus && (
          <div style={{ 
            marginTop: "20px", 
            padding: "15px", 
            background: "#f8f9fa", 
            borderRadius: "5px",
            border: "1px solid #dee2e6"
          }}>
            <h4>📊 Statut du scan</h4>
            <p><strong>Statut:</strong> {scanStatus.status}</p>
            <p><strong>Progression:</strong> {scanStatus.progress}%</p>
            
            {scanStatus.status === "Done" && (
              <button 
                onClick={downloadReport}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📥 Télécharger le rapport
              </button>
            )}
          </div>
        )}
      </div>

      {/* Résultats */}
      {result && (
        <ResultDisplay result={result} title="Résultats OpenVAS" />
      )}
    </div>
  );
}

// Composant Gestionnaire de Rapports
function ReportsManager() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/list`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Erreur chargement rapports:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Chargement des rapports...</div>;
  }

  return (
    <div>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>📊 Gestionnaire de Rapports</h2>
      
      <div style={{ 
        background: "white", 
        padding: "25px", 
        borderRadius: "10px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        {reports.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6c757d", fontSize: "18px" }}>
            📄 Aucun rapport généré pour le moment
          </p>
        ) : (
          <div>
            <h3>📋 Rapports disponibles ({reports.length})</h3>
            <div style={{ display: "grid", gap: "15px" }}>
              {reports.map((report, index) => (
                <div key={index} style={{
                  padding: "20px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  background: "#f8f9fa"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                        📄 {report.filename}
                      </h4>
                      <p style={{ margin: "5px 0", color: "#6c757d" }}>
                        Taille: {(report.size / 1024).toFixed(1)} KB | 
                        Type: {report.type} | 
                        Créé: {new Date(report.created).toLocaleString()}
                      </p>
                    </div>
                    <a 
                      href={report.download_url}
                      style={{
                        background: "#007bff",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        textDecoration: "none",
                        fontWeight: "bold"
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📥 Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant d'affichage des résultats
function ResultDisplay({ result, title }) {
  if (!result) return null;

  return (
    <div style={{ 
      background: "white", 
      padding: "20px", 
      borderRadius: "10px", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      marginTop: "20px"
    }}>
      <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>{title}</h3>
      
      {result.error ? (
        <div style={{ 
          color: "#dc3545", 
          background: "#f8d7da", 
          padding: "15px", 
          borderRadius: "5px",
          border: "1px solid #f5c6cb"
        }}>
          <strong>❌ Erreur:</strong> {result.error}
        </div>
      ) : (
        <div>
          {result.result && (
            <pre style={{
              background: "#1e1e1e",
              color: "#4aff4a",
              padding: "20px",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              fontFamily: "Consolas, Monaco, monospace",
              fontSize: "14px",
              lineHeight: "1.4"
            }}>
              {result.result}
            </pre>
          )}
          
          {result.report_files && result.report_files.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <h4>📁 Fichiers générés:</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {result.report_files.map((file, index) => (
                  <a 
                    key={index}
                    href={file.download_url}
                    style={{
                      background: "#28a745",
                      color: "white",
                      padding: "8px 15px",
                      borderRadius: "5px",
                      textDecoration: "none",
                      fontSize: "14px"
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 {file.filename} ({file.format.toUpperCase()})
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {result.scan_id && (
            <div style={{ 
              marginTop: "15px", 
              padding: "10px", 
              background: "#e8f5e8", 
              borderRadius: "5px",
              fontSize: "14px"
            }}>
              <strong>🆔 ID du scan:</strong> {result.scan_id}
              {result.status && <span> | <strong>Statut:</strong> {result.status}</span>}
              {result.target && <span> | <strong>Cible:</strong> {result.target}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));