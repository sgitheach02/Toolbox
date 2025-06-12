// frontend/src/components/ReportsModule.js - Version corrigée et optimisée
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const ReportsModule = () => {
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState({ total: 0, by_type: {} });
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchReports();
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/list`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setReportStats(data.stats || { total: 0, by_type: {} });
      } else {
        console.error('Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      showNotification('❌ Erreur lors du chargement des rapports', 'error');
    }
  };

  const isLoading = (action) => loadingAction === action;

  const showNotification = (message, type = 'info') => {
    // Notification toast simple
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: bold;
      max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

  const downloadReport = async (reportId, format, filename) => {
    setLoadingAction(`download_${reportId}_${format}`);
    
    try {
      let downloadUrl;
      if (format === 'PDF') {
        downloadUrl = `${API_BASE}/reports/download/pdf/${filename}`;
      } else {
        downloadUrl = `${API_BASE}/reports/download/${filename}`;
      }
      
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Nom de fichier automatique ou depuis les headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let downloadFilename = filename;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).?\2|[^;\n]*)/);
          if (filenameMatch) {
            downloadFilename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification(`✅ Téléchargement réussi: ${downloadFilename}`, 'success');
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      showNotification(`❌ Erreur lors du téléchargement: ${error.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const previewReport = async (reportId, filename) => {
    setLoadingAction(`preview_${reportId}`);
    
    try {
      // URL de prévisualisation directe
      const previewUrl = `${API_BASE}/reports/preview/${filename}`;
      
      // Vérifier que le rapport existe avant d'ouvrir
      const response = await fetch(previewUrl, { method: 'HEAD' });
      
      if (response.ok) {
        const previewWindow = window.open(
          previewUrl, 
          '_blank', 
          'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes'
        );
        
        if (!previewWindow) {
          showNotification('❌ Votre navigateur bloque les pop-ups. Veuillez autoriser les pop-ups pour voir l\'aperçu.', 'error');
        } else {
          showNotification(`👁️ Aperçu ouvert pour: ${filename}`, 'success');
        }
      } else {
        throw new Error(`Rapport non disponible (${response.status})`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'aperçu:', error);
      showNotification(`❌ Erreur lors de l'aperçu: ${error.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteReport = async (reportId, reportName, filename) => {
    // Confirmation de suppression renforcée
    const confirmMessage = `⚠️ SUPPRESSION DÉFINITIVE

Êtes-vous absolument sûr de vouloir supprimer le rapport :
"${reportName}"

Fichier: ${filename}

⚠️ Cette action est IRRÉVERSIBLE !
⚠️ Tous les formats (HTML, PDF) seront supprimés !

Tapez "SUPPRIMER" ci-dessous pour confirmer :`;

    const userConfirmation = prompt(confirmMessage);
    
    if (userConfirmation !== 'SUPPRIMER') {
      showNotification('🔒 Suppression annulée', 'info');
      return;
    }
    
    setLoadingAction(`delete_${reportId}`);
    
    try {
      const response = await fetch(`${API_BASE}/reports/delete/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          filename: filename,
          confirm: true 
        })
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
        
        showNotification(`✅ Rapport supprimé avec succès: ${reportName}`, 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(`❌ Erreur lors de la suppression: ${error.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'nmap': '🔍',
      'nikto': '🌐',
      'tcpdump': '📡',
      'custom': '⚙️'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = {
      'nmap': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'nikto': 'linear-gradient(135deg, #06b6d4, #0891b2)',
      'tcpdump': 'linear-gradient(135deg, #10b981, #047857)',
      'custom': 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    };
    return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  // Filtrage des rapports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.filename?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* En-tête avec statistiques */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#f8fafc', marginBottom: '20px', textAlign: 'center' }}>
          📊 Gestionnaire de Rapports Pacha Toolbox
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '5px' }}>📈</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportStats.total}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Rapports Total</div>
          </div>
          
          {Object.entries(reportStats.by_type || {}).map(([type, count]) => (
            <div key={type} style={{
              background: getTypeColor(type),
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{getTypeIcon(type)}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{type.toUpperCase()}</div>
            </div>
          ))}
        </div>
        
        {/* Contrôles de filtrage et recherche */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '15px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un rapport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 15px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '12px 15px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          >
            <option value="all">Tous les types</option>
            <option value="nmap">Nmap</option>
            <option value="nikto">Nikto</option>
            <option value="tcpdump">tcpdump</option>
          </select>
          
          <button
            onClick={fetchReports}
            style={{
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Liste des rapports */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>
          📜 Rapports Disponibles ({filteredReports.length})
        </h3>
        
        {filteredReports.length > 0 ? (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredReports.map((report) => (
              <div key={report.id || report.filename} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '15px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedReport(
                selectedReport === (report.id || report.filename) 
                  ? null 
                  : (report.id || report.filename)
              )}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(report.type)}</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>
                      {report.name || report.filename}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Badges de format */}
                    {report.formats?.map(format => (
                      <span key={format} style={{
                        background: format === 'PDF' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #047857)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {format}
                      </span>
                    ))}
                    
                    <span style={{ 
                      background: getTypeColor(report.type),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {(report.type || 'unknown').toUpperCase()}
                    </span>
                    
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      {report.size || 'N/A'}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontSize: '0.9rem', 
                  marginBottom: '10px' 
                }}>
                  📁 {report.filename || report.html_filename}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem'
                }}>
                  <span>⏰ {new Date(report.created || report.created_at).toLocaleString()}</span>
                  <span>📊 {report.status || 'Disponible'}</span>
                </div>

                {selectedReport === (report.id || report.filename) && (
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
                    
                    {/* Boutons de téléchargement par format */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px',
                      marginBottom: '15px'
                    }}>
                      {report.formats?.map(format => (
                        <button 
                          key={format} 
                          onClick={(e) => {
                            e.stopPropagation();
                            const filename = format === 'PDF' 
                              ? (report.pdf_filename || report.filename?.replace('.html', '.pdf'))
                              : (report.html_filename || report.filename);
                            downloadReport(report.id || report.filename, format, filename);
                          }}
                          disabled={isLoading(`download_${report.id || report.filename}_${format}`)}
                          style={{
                            background: isLoading(`download_${report.id || report.filename}_${format}`) 
                              ? 'rgba(107, 114, 128, 0.5)' 
                              : 'linear-gradient(135deg, #10b981, #047857)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            cursor: isLoading(`download_${report.id || report.filename}_${format}`) ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isLoading(`download_${report.id || report.filename}_${format}`) ? '⏳' : '📥'} {format}
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
                            const filename = report.html_filename || report.filename;
                            previewReport(report.id || report.filename, filename);
                          }}
                          disabled={isLoading(`preview_${report.id || report.filename}`)}
                          style={{
                            background: isLoading(`preview_${report.id || report.filename}`) 
                              ? 'rgba(107, 114, 128, 0.5)' 
                              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            cursor: isLoading(`preview_${report.id || report.filename}`) ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isLoading(`preview_${report.id || report.filename}`) ? '⏳' : '👁️'} Aperçu
                        </button>
                      )}
                      
                      {/* Bouton de suppression */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReport(
                            report.id || report.filename, 
                            report.name || report.filename,
                            report.filename || report.html_filename
                          );
                        }}
                        disabled={isLoading(`delete_${report.id || report.filename}`)}
                        style={{
                          background: isLoading(`delete_${report.id || report.filename}`) 
                            ? 'rgba(107, 114, 128, 0.5)' 
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: isLoading(`delete_${report.id || report.filename}`) ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isLoading(`delete_${report.id || report.filename}`) ? '⏳' : '🗑️'} Supprimer
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
                      Les téléchargements se lancent automatiquement. La suppression nécessite une confirmation.
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
            <p>Aucun rapport trouvé</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              {searchTerm || filterType !== 'all' 
                ? 'Essayez d\'ajuster vos filtres' 
                : 'Les rapports seront générés automatiquement lors des scans'
              }
            </p>
          </div>
        )}
      </div>

      {/* Section d'aide */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#06b6d4', marginBottom: '20px' }}>ℹ️ Guide des Rapports</h3>
        
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
              Analyses réseau : découverte d'hôtes, scan de ports, détection de services.
              <br/>Génération automatique lors des scans.
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
              Audits de sécurité web : vulnérabilités, configurations, failles.
              <br/>Génération automatique lors des scans.
            </p>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>⚙️ Fonctionnalités</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0' }}>
              📥 Téléchargement HTML • 👁️ Aperçu instantané • 🗑️ Suppression sécurisée
              <br/>🔍 Recherche et filtres avancés • 🔄 Actualisation automatique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;