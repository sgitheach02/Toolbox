import React, { useState } from "react";
import ReactDOM from "react-dom";
import { runNmapScan } from "./api/scan"; // Ajuste le chemin selon ta structure exacte

function App() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await runNmapScan(target);
      setResult(data.result);
    } catch (err) {
      setError(err.message || "Erreur inconnue.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "50px auto", fontFamily: "sans-serif" }}>
      <h1>Pacha Toolbox Frontend (React)</h1>
      <form onSubmit={handleScan} style={{ marginBottom: 30 }}>
        <input
          type="text"
          placeholder="Cible (ex: 192.168.1.1)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16, width: "70%" }}
        />
        <button type="submit" disabled={loading} style={{ padding: 8, marginLeft: 8 }}>
          {loading ? "Scan..." : "Lancer le scan"}
        </button>
      </form>
      {result && (
        <pre
          style={{
            background: "#222",
            color: "#4aff4a",
            padding: 16,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            overflowX: "auto",
          }}
        >
          {result}
        </pre>
      )}
      {error && (
        <div style={{ color: "red", marginTop: 20 }}>
          <b>Erreur :</b> {error}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

