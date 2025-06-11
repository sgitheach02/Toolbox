// src/api/scan.js

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/scan";

// Lancer un scan Nmap (POST sur /api/scan/nmap)
export async function runNmapScan(target, args = "-sV") {
  const response = await fetch(`${API_URL}/nmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, args }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors du scan Nmap");
  }
  return response.json();
}
