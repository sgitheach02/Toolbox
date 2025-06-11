import xml.etree.ElementTree as ET
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def generate_nmap_report(xml_file, target):
    """Génération d'un rapport HTML à partir d'un fichier XML Nmap"""
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
        
        # Génération du HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rapport Nmap - {target}</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
                .summary {{ background: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .host {{ background: white; border: 1px solid #bdc3c7; margin: 20px 0; border-radius: 5px; }}
                .host-header {{ background: #3498db; color: white; padding: 15px; }}
                .host-content {{ padding: 15px; }}
                .port-table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                .port-table th, .port-table td {{ border: 1px solid #bdc3c7; padding: 8px; text-align: left; }}
                .port-table th {{ background: #34495e; color: white; }}
                .open {{ color: #27ae60; font-weight: bold; }}
                .closed {{ color: #e74c3c; }}
                .filtered {{ color: #f39c12; }}
                .os-info {{ background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 3px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔍 Rapport de Scan Nmap</h1>
                <p><strong>Cible:</strong> {target}</p>
                <p><strong>Date:</strong> {scan_info['start_time']}</p>
                <p><strong>Scanner:</strong> {scan_info['scanner']} {scan_info['version']}</p>
            </div>
            
            <div class="summary">
                <h2>📊 Résumé</h2>
                <ul>
                    <li><strong>Nombre d'hôtes scannés:</strong> {len(hosts)}</li>
                    <li><strong>Total des ports testés:</strong> {total_ports}</li>
                    <li><strong>Ports ouverts:</strong> {open_ports}</li>
                    <li><strong>Commande:</strong> <code>{scan_info['command']}</code></li>
                </ul>
            </div>
        """
        
        # Détails par hôte
        for i, host in enumerate(hosts):
            primary_ip = host["addresses"][0]["addr"] if host["addresses"] else "Inconnu"
            hostname = host["hostnames"][0] if host["hostnames"] else ""
            
            html_content += f"""
            <div class="host">
                <div class="host-header">
                    <h3>🖥️ Hôte {i+1}: {primary_ip}</h3>
                    {f'<p>Nom d\'hôte: {hostname}</p>' if hostname else ''}
                    <p>Statut: <span class="{host['status']}">{host['status'].upper()}</span></p>
                </div>
                <div class="host-content">
            """
            
            # Adresses
            if len(host["addresses"]) > 1:
                html_content += "<h4>📍 Adresses:</h4><ul>"
                for addr in host["addresses"]:
                    html_content += f"<li>{addr['addr']} ({addr['type']})</li>"
                html_content += "</ul>"
            
            # Détection OS
            if host["os"]:
                html_content += '<div class="os-info"><h4>💻 Système d\'exploitation détecté:</h4><ul>'
                for os_info in host["os"]:
                    html_content += f"<li>{os_info['name']} (Précision: {os_info['accuracy']}%)</li>"
                html_content += "</ul></div>"
            
            # Ports
            if host["ports"]:
                html_content += """
                <h4>🔌 Ports et Services:</h4>
                <table class="port-table">
                    <tr>
                        <th>Port</th>
                        <th>Protocole</th>
                        <th>État</th>
                        <th>Service</th>
                        <th>Version</th>
                    </tr>
                """
                
                for port in host["ports"]:
                    state_class = port["state"]
                    service_info = port["service"]
                    service_detail = f"{service_info.get('product', '')} {service_info.get('version', '')}".strip()
                    
                    html_content += f"""
                    <tr>
                        <td>{port['portid']}</td>
                        <td>{port['protocol']}</td>
                        <td class="{state_class}">{port['state'].upper()}</td>
                        <td>{service_info.get('name', 'inconnu')}</td>
                        <td>{service_detail if service_detail else 'N/A'}</td>
                    </tr>
                    """
                
                html_content += "</table>"
            
            html_content += "</div></div>"
        
        html_content += """
            <div style="margin-top: 30px; text-align: center; color: #7f8c8d;">
                <p>Rapport généré par Pacha Toolbox - {}</p>
            </div>
        </body>
        </html>
        """.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        return html_content
        
    except Exception as e:
        logger.error(f"Erreur génération rapport Nmap: {str(e)}")
        return f"<html><body><h1>Erreur génération rapport</h1><p>{str(e)}</p></body></html>"