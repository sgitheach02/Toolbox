// src/api/scan.js - Version corrigée avec gestion d'erreurs robuste

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

console.log("🔧 Configuration API:", API_URL);

// Fonction helper pour gérer les requêtes avec retry
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    mode: 'cors', // Important pour CORS
    credentials: 'omit', // Pas de cookies
    ...options
  };

  console.log(`🌐 Requête: ${options.method || 'GET'} ${url}`);
  console.log(`📋 Options:`, defaultOptions);

  try {
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Response data:`, data);
    return data;

  } catch (error) {
    console.error(`❌ Erreur requête ${url}:`, error);
    
    // Erreurs détaillées pour le debugging
    if (error.name === 'TypeError') {
      console.error("💥 Erreur TypeError - Problème réseau ou CORS");
    }
    
    throw error;
  }
}

// Test de connectivité
export async function testConnection() {
  try {
    console.log("🧪 Test de connectivité API...");
    const response = await apiRequest('/health');
    console.log("✅ Test réussi:", response);
    return response;
  } catch (error) {
    console.error("❌ Test de connectivité échoué:", error);
    throw error;
  }
}

// Lancer un scan Nmap
export async function runNmapScan(target, args = "-sV") {
  if (!target) {
    throw new Error("Cible requise pour le scan Nmap");
  }

  try {
    console.log(`🔍 Lancement scan Nmap: ${target} avec args: ${args}`);
    
    const response = await apiRequest('/scan/nmap', {
      method: 'POST',
      body: JSON.stringify({ target, args })
    });

    console.log("✅ Scan Nmap lancé:", response);
    return response;
    
  } catch (error) {
    console.error("❌ Erreur scan Nmap:", error);
    throw error;
  }
}

// Lancer un scan Masscan
export async function runMasscanScan(target, ports = "1-1000", rate = "1000") {
  if (!target) {
    throw new Error("Cible requise pour le scan Masscan");
  }

  try {
    console.log(`🚀 Lancement scan Masscan: ${target}`);
    
    const response = await apiRequest('/scan/masscan', {
      method: 'POST',
      body: JSON.stringify({ target, ports, rate })
    });

    console.log("✅ Scan Masscan lancé:", response);
    return response;
    
  } catch (error) {
    console.error("❌ Erreur scan Masscan:", error);
    throw error;
  }
}

// Obtenir le statut d'un scan
export async function getScanStatus(scanId) {
  if (!scanId) {
    throw new Error("ID de scan requis");
  }

  try {
    const response = await apiRequest(`/scan/status/${scanId}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur statut scan ${scanId}:`, error);
    throw error;
  }
}

// Obtenir la liste des rapports
export async function getReportsList() {
  try {
    console.log("📊 Récupération liste des rapports...");
    const response = await apiRequest('/reports/list');
    console.log("✅ Rapports récupérés:", response);
    return response;
  } catch (error) {
    console.error("❌ Erreur liste rapports:", error);
    throw error;
  }
}

// Obtenir les informations réseau
export async function getNetworkInfo() {
  try {
    const response = await apiRequest('/network/info');
    return response;
  } catch (error) {
    console.error("❌ Erreur info réseau:", error);
    throw error;
  }
}

// Export par défaut pour compatibilité
export default {
  testConnection,
  runNmapScan,
  runMasscanScan,
  getScanStatus,
  getReportsList,
  getNetworkInfo
};