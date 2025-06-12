import xml.etree.ElementTree as ET
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

def generate_nmap_report(xml_file, target):
    """Génération d'un rapport HTML à partir d'un fichier XML Nmap avec bannière Pacha"""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Extraction des données
        scan_info = {
            "scanner": root.get("scanner", "nmap"),
            "version": root.get("version", "unknown"),
            "start_time": root.get("startstr", "unknown"),
            "command": root.get("args", "unknown")
        }
        
        hosts = []
        total_ports = 0
        open_ports = 0
        
        for host in root.findall(".//host"):
            host_info = {
                "addresses": [],
                "ports": [],
                "status": "unknown",
                "hostnames": [],
                "os": []
            }
            
            # Statut
            status = host.find("status")
            if status is not None:
                host_info["status"] = status.get("state", "unknown")
            
            # Adresses
            for address in host.findall(".//address"):
                host_info["addresses"].append({
                    "addr": address.get("addr"),
                    "type": address.get("addrtype")
                })
            
            # Noms d'hôte
            for hostname in host.findall(".//hostname"):
                host_info["hostnames"].append(hostname.get("name", ""))
            
            # Ports
            for port in host.findall(".//port"):
                port_info = {
                    "portid": port.get("portid"),
                    "protocol": port.get("protocol"),
                    "state": "unknown",
                    "service": {}
                }
                
                state = port.find("state")
                if state is not None:
                    port_info["state"] = state.get("state")
                    if port_info["state"] == "open":
                        open_ports += 1
                
                service = port.find("service")
                if service is not None:
                    port_info["service"] = {
                        "name": service.get("name", ""),
                        "product": service.get("product", ""),
                        "version": service.get("version", ""),
                        "extrainfo": service.get("extrainfo", "")
                    }
                
                host_info["ports"].append(port_info)
                total_ports += 1
            
            # OS Detection
            for osmatch in host.findall(".//osmatch"):
                host_info["os"].append({
                    "name": osmatch.get("name", ""),
                    "accuracy": osmatch.get("accuracy", "0")
                })
            
            hosts.append(host_info)
        
        # Génération du timestamp pour le rapport
        report_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        scan_id = os.path.basename(xml_file).split('_')[1] if '_' in os.path.basename(xml_file) else "unknown"
        
        # Génération du HTML avec bannière Pacha
        html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Nmap - {target}</title>
    <style>
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #e0e0e0;
            line-height: 1.6;
        }}
        
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto; 
            background: #1a1a2e; 
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border-radius: 15px;
            overflow: hidden;
        }}
        
        .pacha-banner {{
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            padding: 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .pacha-banner::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            animation: float 20s infinite linear;
        }}
        
        @keyframes float {{
            0% {{ transform: translate(-50%, -50%) rotate(0deg); }}
            100% {{ transform: translate(-50%, -50%) rotate(360deg); }}
        }}
        
        .pacha-logo {{
            font-size: 4rem;
            margin-bottom: 1rem;
            position: relative;
            z-index: 2;
        }}
        
        .pacha-title {{
            font-size: 2.5rem;
            font-weight: 700;
            color: #0a0a0a;
            margin: 0;
            position: relative;
            z-index: 2;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }}
        
        .pacha-subtitle {{
            font-size: 1.2rem;
            color: #0a0a0a;
            margin: 0.5rem 0 0 0;
            position: relative;
            z-index: 2;
            opacity: 0.8;
        }}
        
        .report-header {{ 
            background: #16213e; 
            color: #00ff88; 
            padding: 2rem; 
            border-bottom: 3px solid #00ff88;
        }}
        
        .report-title {{
            font-size: 2rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }}
        
        .scan-info {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }}
        
        .info-card {{
            background: rgba(0, 255, 136, 0.1);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #00ff88;
        }}
        
        .summary {{ 
            background: linear-gradient(135deg, #16213e, #1a1a2e);
            padding: 2rem; 
            border-bottom: 1px solid #333;
        }}
        
        .summary h2 {{
            color: #00ff88;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }}
        
        .stat-card {{
            background: #0a0a0a;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #333;
            text-align: center;
            transition: all 0.3s ease;
        }}
        
        .stat-card:hover {{
            border-color: #00ff88;
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.2);
        }}
        
        .stat-number {{
            font-size: 2.5rem;
            font-weight: 700;
            color: #00ff88;
            margin-bottom: 0.5rem;
        }}
        
        .stat-label {{
            color: #ccc;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .host {{ 
            background: #1a1a2e; 
            border: 1px solid #333; 
            margin: 2rem; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }}
        
        .host-header {{ 
            background: linear-gradient(135deg, #00ff88, #00d4ff); 
            color: #0a0a0a; 
            padding: 1.5rem; 
            font-weight: 700;
        }}
        
        .host-content {{ 
            padding: 2rem; 
        }}
        
        .ports-table {{ 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 1.5rem;
            background: #0a0a0a;
            border-radius: 8px;
            overflow: hidden;
        }}
        
        .ports-table th, .ports-table td {{ 
            border: 1px solid #333; 
            padding: 1rem; 
            text-align: left; 
        }}
        
        .ports-table th {{ 
            background: #16213e; 
            color: #00ff88; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .ports-table tr:nth-child(even) {{
            background: rgba(0, 255, 136, 0.02);
        }}
        
        .ports-table tr:hover {{
            background: rgba(0, 255, 136, 0.1);
        }}
        
        .open {{ 
            color: #00ff88; 
            font-weight: bold; 
            background: rgba(0, 255, 136, 0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
        }}
        
        .closed {{ 
            color: #ff453a; 
            background: rgba(255, 69, 58, 0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
        }}
        
        .filtered {{ 
            color: #ff9f0a; 
            background: rgba(255, 159, 10, 0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
        }}
        
        .os-info {{ 
            background: linear-gradient(135deg, #16213e, #1a1a2e);
            padding: 1.5rem; 
            margin: 1.5rem 0; 
            border-radius: 8px; 
            border-left: 4px solid #00ff88;
        }}
        
        .service-version {{
            font-family: 'Courier New', monospace;
            background: rgba(0, 212, 255, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            font-size: 0.8rem;
        }}
        
        .footer {{
            background: #0a0a0a;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #333;
        }}
        
        .footer-logo {{
            font-size: 2rem;
            margin-bottom: 1rem;
        }}
        
        .footer-text {{
            color: #666;
            font-size: 0.9rem;
        }}
        
        .security-notice {{
            background: rgba(255, 159, 10, 0.1);
            border: 1px solid #ff9f0a;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 2rem;
            color: #ff9f0a;
        }}
        
        @media (max-width: 768px) {{
            .container {{ margin: 1rem; }}
            .pacha-title {{ font-size: 2rem; }}
            .report-title {{ font-size: 1.5rem; }}
            .scan-info {{ grid-template-columns: 1fr; }}
            .stats-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- BANNIÈRE PACHA -->
        <div class="pacha-banner">
            <div class="pacha-logo">🛡️</div>
            <h1 class="pacha-title">PACHA TOOLBOX</h1>
            <p class="pacha-subtitle">Professional Penetration Testing Suite</p>
        </div>

        <!-- HEADER DU RAPPORT -->
        <div class="report-header">
            <div class="report-title">
                <span>🔍</span>
                <span>Rapport de Scan Nmap</span>
            </div>
            <div class="scan-info">
                <div class="info-card">
                    <strong>🎯 Cible:</strong> {target}
                </div>
                <div class="info-card">
                    <strong>🆔 ID Scan:</strong> {scan_id}
                </div>
                <div class="info-card">
                    <strong>⏰ Date:</strong> {report_timestamp}
                </div>
                <div class="info-card">
                    <strong>🔧 Scanner:</strong> {scan_info['scanner']} {scan_info['version']}
                </div>
            </div>
        </div>

        <!-- NOTICE DE SÉCURITÉ -->
        <div class="security-notice">
            <strong>⚠️ NOTICE DE SÉCURITÉ:</strong> Ce rapport contient des informations sensibles sur l'infrastructure réseau. 
            Diffusion restreinte aux équipes autorisées uniquement.
        </div>

        <!-- RÉSUMÉ -->
        <div class="summary">
            <h2>📊 Résumé Exécutif</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">{len(hosts)}</div>
                    <div class="stat-label">Hôtes Scannés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{total_ports}</div>
                    <div class="stat-label">Ports Testés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{open_ports}</div>
                    <div class="stat-label">Ports Ouverts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{((open_ports/total_ports)*100):.1f}%</div>
                    <div class="stat-label">Taux d'Ouverture</div>
                </div>
            </div>
        </div>"""

        # Détails par hôte
        for i, host in enumerate(hosts):
            primary_ip = host["addresses"][0]["addr"] if host["addresses"] else "Inconnu"
            hostname = host["hostnames"][0] if host["hostnames"] else ""
            
            html_content += f"""
        <div class="host">
            <div class="host-header">
                <h3>🖥️ Hôte {i+1}: {primary_ip}</h3>
                {f'<p><strong>Nom d\'hôte:</strong> {hostname}</p>' if hostname else ''}
                <p><strong>Statut:</strong> <span class="{host['status']}">{host['status'].upper()}</span></p>
            </div>
            <div class="host-content">"""
            
            # Adresses multiples
            if len(host["addresses"]) > 1:
                html_content += "<h4>📍 Adresses IP:</h4><ul>"
                for addr in host["addresses"]:
                    html_content += f"<li><strong>{addr['addr']}</strong> ({addr['type']})</li>"
                html_content += "</ul>"
            
            # Détection OS
            if host["os"]:
                html_content += '<div class="os-info"><h4>💻 Système d\'exploitation détecté:</h4><ul>'
                for os_info in host["os"]:
                    html_content += f"<li><strong>{os_info['name']}</strong> (Précision: {os_info['accuracy']}%)</li>"
                html_content += "</ul></div>"
            
            # Ports et services
            if host["ports"]:
                html_content += """
                <h4>🔌 Ports et Services:</h4>
                <table class="ports-table">
                    <thead>
                        <tr>
                            <th>Port</th>
                            <th>Protocole</th>
                            <th>État</th>
                            <th>Service</th>
                            <th>Version</th>
                        </tr>
                    </thead>
                    <tbody>"""
                
                for port in host["ports"]:
                    state_class = port["state"]
                    service_info = port["service"]
                    service_detail = f"{service_info.get('product', '')} {service_info.get('version', '')}".strip()
                    
                    html_content += f"""
                        <tr>
                            <td><strong>{port['portid']}</strong></td>
                            <td>{port['protocol'].upper()}</td>
                            <td><span class="{state_class}">{port['state'].upper()}</span></td>
                            <td>{service_info.get('name', 'inconnu')}</td>
                            <td>{f'<span class="service-version">{service_detail}</span>' if service_detail else 'N/A'}</td>
                        </tr>"""
                
                html_content += """
                    </tbody>
                </table>"""
            else:
                html_content += "<p><em>Aucun port ouvert détecté</em></p>"
            
            html_content += "</div></div>"
        
        # Footer
        html_content += f"""
        <div class="footer">
            <div class="footer-logo">🛡️</div>
            <div class="footer-text">
                <strong>Rapport généré par Pacha Toolbox v2.0</strong><br>
                Professional Penetration Testing Suite<br>
                {report_timestamp} - Confidentiel
            </div>
        </div>
    </div>
</body>
</html>"""
        
        return html_content
        
    except Exception as e:
        logger.error(f"Erreur génération rapport Nmap: {str(e)}")
        return generate_error_report(target, str(e))

def generate_error_report(target, error_message):
    """Génération d'un rapport d'erreur avec style Pacha"""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Erreur - Rapport Pacha Toolbox</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0a0a0a, #1a1a2e); color: #e0e0e0; margin: 0; padding: 2rem; }}
        .container {{ max-width: 800px; margin: 0 auto; background: #1a1a2e; padding: 2rem; border-radius: 15px; border: 1px solid #ff453a; }}
        .error-header {{ background: #ff453a; color: white; padding: 1.5rem; margin: -2rem -2rem 2rem -2rem; border-radius: 15px 15px 0 0; }}
        .error-title {{ font-size: 1.8rem; margin: 0; }}
        .error-details {{ background: #0a0a0a; padding: 1rem; border-radius: 8px; font-family: monospace; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="error-header">
            <h1 class="error-title">❌ Erreur de Génération de Rapport</h1>
        </div>
        <p><strong>Cible:</strong> {target}</p>
        <p><strong>Erreur:</strong></p>
        <div class="error-details">{error_message}</div>
        <p><em>Généré par Pacha Toolbox v2.0</em></p>
    </div>
</body>
</html>"""