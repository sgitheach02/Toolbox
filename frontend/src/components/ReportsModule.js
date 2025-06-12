// frontend/src/components/ReportsModule.js
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const ReportsModule = () => {
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState({ total: 0, by_type: {} });
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/list`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setReportStats(data.stats || { total: 0, by_type: {} });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
    }
  };

  const generateReport = async (type) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${API_BASE}/reports/generate/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Rapport généré:', data);
        
        // Rafraîchir la liste des rapports
        await fetchReports();
        
        // Notification de succès
        alert(`✅ ${data.message}`);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert(`❌ Erreur lors de la génération du rapport: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (reportId, format) => {
    setLoadingAction(`download_${reportId}_${format}`);
    
    try {
      const response = await fetch(`${API_BASE}/reports/download/${reportId}/${format}`);
      
      if (response.ok) {
        // Créer un blob et déclencher le téléchargement
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Extraire le nom du fichier depuis les headers ou utiliser un nom par défaut
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `rapport_${reportId}.${format.toLowerCase()}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`📥 Téléchargement réussi: ${filename}`);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert(`❌ Erreur lors du téléchargement: ${error.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const previewReport = async (reportId) => {
    setLoadingAction(`preview_${reportId}`);
    
    try {
      const response = await fetch(`${API_BASE}/reports/preview/${reportId}`);
      
      if (response.ok) {
        // Ouvrir l'aperçu dans un nouvel onglet
        const previewUrl = `${API_BASE}/reports/preview/${reportId}`;
        const previewWindow = window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (!previewWindow) {
          alert('❌ Votre navigateur bloque les pop-ups. Veuillez autoriser les pop-ups pour voir l\'aperçu.');
        } else {
          console.log(`👁️ Aperçu ouvert pour le rapport: ${reportId}`);
        }
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'aperçu:', error);
      alert(`❌ Erreur lors de l'aperçu: ${error.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteReport = async (reportId, reportName) => {
    // Confirmation de suppression
    if (!window.confirm(`⚠️ Êtes-vous sûr de vouloir supprimer le rapport "${reportName}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    setLoadingAction(`delete_${reportId}`);
    
    try {
      const response = await fetch(`${API_BASE}/reports/delete/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Rapport supprimé:', data);
        
        // Rafraîchir la liste des rapports
        await fetchReports();
        
        // Fermer les détails si c'était le rapport sélectionné
        if (selectedReport === reportId) {
          setSelectedReport(null);
        }
        
        alert(`✅ ${data.message}`);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`❌ Erreur lors de la suppression: ${error.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'nmap': return '🔍';
      case 'nikto': return '🌐';
      case 'tcpdump': return '📡';
      default: return '📄';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'nmap': return '#3b82f6';
      case 'nikto': return '#06b6d4';
      case 'tcpdump': return '#10b981';
      default: return '#6b7280';
    }
  };

  const isLoading = (action) => loadingAction === action;

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        📊 Module de Rapports
      </h2>

      {/* Statistiques des rapports */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '20px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📊 Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{reportStats.total}</p>
        </div>

        {Object.entries(reportStats.by_type || {}).map(([type, count]) => (
          <div key={type} style={{
            background: `linear-gradient(135deg, ${getTypeColor(type)}, ${getTypeColor(type)}dd)`,
            padding: '20px',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{getTypeIcon(type)} {type.toUpperCase()}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Actions de génération */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#10b981', marginBottom: '20px' }}>⚡ Génération de Rapports</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <button
            onClick={() => generateReport('nmap')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            🔍 Rapport Nmap
          </button>

          <button
            onClick={() => generateReport('nikto')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            🌐 Rapport Nikto
          </button>

          <button
            onClick={() => generateReport('tcpdump')}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            📡 Rapport tcpdump
          </button>
        </div>

        {isGenerating && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#10b981'
          }}>
            🔄 Génération en cours... Veuillez patienter.
          </div>
        )}
      </div>

      {/* Liste des rapports */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>📜 Rapports Disponibles</h3>
        
        {reports.length > 0 ? (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {reports.map((report) => (
              <div key={report.id} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '15px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(report.type)}</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{report.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      background: getTypeColor(report.type),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {report.type.toUpperCase()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      {report.size}
                    </span>
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  📝 {report.description}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem'
                }}>
                  <span>⏰ {new Date(report.created_at).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {report.formats?.map(format => (
                      <span key={format} style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedReport === report.id && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h4 style={{ color: '#10b981', marginBottom: '15px', fontSize: '1rem' }}>
                      🔧 Actions disponibles
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px',
                      marginBottom: '15px'
                    }}>
                      {/* Boutons de téléchargement par format */}
                      {report.formats?.map(format => (
                        <button 
                          key={format} 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReport(report.id, format);
                          }}
                          disabled={isLoading(`download_${report.id}_${format}`)}
                          style={{
                            background: isLoading(`download_${report.id}_${format}`) 
                              ? 'rgba(107, 114, 128, 0.5)' 
                              : 'linear-gradient(135deg, #10b981, #047857)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            cursor: isLoading(`download_${report.id}_${format}`) ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isLoading(`download_${report.id}_${format}`) ? '⏳' : '📥'} {format}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '10px'
                    }}>
                      {/* Bouton aperçu (seulement si HTML disponible) */}
                      {report.formats?.includes('HTML') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            previewReport(report.id);
                          }}
                          disabled={isLoading(`preview_${report.id}`)}
                          style={{
                            background: isLoading(`preview_${report.id}`) 
                              ? 'rgba(107, 114, 128, 0.5)' 
                              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            cursor: isLoading(`preview_${report.id}`) ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isLoading(`preview_${report.id}`) ? '⏳' : '👁️'} Aperçu
                        </button>
                      )}
                      
                      {/* Bouton de suppression */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReport(report.id, report.name);
                        }}
                        disabled={isLoading(`delete_${report.id}`)}
                        style={{
                          background: isLoading(`delete_${report.id}`) 
                            ? 'rgba(107, 114, 128, 0.5)' 
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: isLoading(`delete_${report.id}`) ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isLoading(`delete_${report.id}`) ? '⏳' : '🗑️'} Supprimer
                      </button>
                    </div>
                    
                    {/* Message informatif */}
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      💡 <strong>Astuce:</strong> L'aperçu s'ouvre dans un nouvel onglet. 
                      Les téléchargements se lancent automatiquement.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            padding: '50px 20px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
            <p>Aucun rapport disponible</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Générez votre premier rapport en utilisant les boutons ci-dessus
            </p>
          </div>
        )}
      </div>

      {/* Section d'aide et informations */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#06b6d4', marginBottom: '20px' }}>ℹ️ Informations sur les Rapports</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h4 style={{ color: '#3b82f6', marginBottom: '10px' }}>🔍 Rapports Nmap</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0' }}>
              Analyses réseau avec découverte d'hôtes, scan de ports et détection de services.
              Formats: HTML et PDF.
            </p>
          </div>

          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            <h4 style={{ color: '#06b6d4', marginBottom: '10px' }}>🌐 Rapports Nikto</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0' }}>
              Analyses de vulnérabilités web avec scan des failles de sécurité courantes.
              Formats: HTML et PDF.
            </p>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>📡 Rapports tcpdump</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0' }}>
              Analyses de capture réseau avec inspection du trafic et détection d'anomalies.
              Formats: PCAP et HTML.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;