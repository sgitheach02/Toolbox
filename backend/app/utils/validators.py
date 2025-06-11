import re
import ipaddress
import logging

logger = logging.getLogger(__name__)

def validate_target(target):
    """Validation complète d'une cible"""
    if not target or len(target) > 255:
        return False
    
    # Caractères dangereux
    dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '<', '>', '"', "'"]
    if any(char in target for char in dangerous_chars):
        logger.warning(f"Caractères dangereux détectés dans la cible: {target}")
        return False
    
    # Validation des formats
    return (
        validate_ip(target) or 
        validate_network(target) or 
        validate_domain(target) or
        validate_hostname(target)
    )

def validate_ip(ip_str):
    """Validation d'une adresse IP"""
    try:
        ip = ipaddress.ip_address(ip_str)
        
        # Autoriser les IPs de test et lab
        allowed_ranges = [
            ipaddress.ip_network("172.20.0.0/16"),  # Docker lab
            ipaddress.ip_network("192.168.0.0/16"), # RFC1918
            ipaddress.ip_network("10.0.0.0/8"),     # RFC1918
            ipaddress.ip_network("127.0.0.0/8"),    # Loopback
        ]
        
        for network in allowed_ranges:
            if ip in network:
                return True
        
        # Log pour IPs non autorisées
        logger.warning(f"IP non autorisée: {ip_str}")
        return False
        
    except ValueError:
        return False

def validate_network(network_str):
    """Validation d'un réseau"""
    try:
        network = ipaddress.ip_network(network_str, strict=False)
        
        # Réseaux autorisés
        allowed_ranges = [
            ipaddress.ip_network("172.20.0.0/16"),
            ipaddress.ip_network("192.168.0.0/16"),
            ipaddress.ip_network("10.0.0.0/8"),
        ]
        
        for allowed in allowed_ranges:
            if network.subnet_of(allowed) or network.supernet_of(allowed):
                return True
        
        return False
        
    except ValueError:
        return False

def validate_domain(domain):
    """Validation d'un nom de domaine"""
    if domain in ["printnightmare.thm", "localhost"]:
        return True
    
    # Pattern basique pour domaines
    domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
    
    if re.match(domain_pattern, domain):
        # Domaines autorisés pour lab
        allowed_domains = [".thm", ".local", ".lab", ".test"]
        return any(domain.endswith(suffix) for suffix in allowed_domains)
    
    return False

def validate_hostname(hostname):
    """Validation d'un nom d'hôte"""
    if hostname in ["printnightmare.thm", "localhost"]:
        return True
    
    # Pattern hostname
    hostname_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$'
    return bool(re.match(hostname_pattern, hostname))

def validate_port(port):
    """Validation d'un port"""
    try:
        port_num = int(port)
        return 1 <= port_num <= 65535
    except (ValueError, TypeError):
        return False

def validate_wordlist(wordlist_name):
    """Validation d'une wordlist"""
    allowed_wordlists = [
        "rockyou", "common", "passwords", "users",
        "fasttrack", "dirb_common", "small"
    ]
    return wordlist_name in allowed_wordlists

def sanitize_filename(filename):
    """Nettoyage d'un nom de fichier"""
    # Suppression des caractères dangereux
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Limitation de la longueur
    sanitized = sanitized[:200]
    
    # Suppression des espaces et points en début/fin
    sanitized = sanitized.strip('. ')
    
    if not sanitized:
        sanitized = "unknown_file"
    
    return sanitized

def validate_nmap_args(args):
    """Validation des arguments Nmap"""
    if not args:
        return True
    
    # Arguments dangereux bloqués
    dangerous_args = [
        "--script-args-file=", "--datadir=", "--system-dns",
        "--dns-servers=", "--source-port=", "--spoof-mac=",
        "--decoy=", "-D", "--max-rate=0", "--min-rate=0",
        "--script-trace", "--packet-trace"
    ]
    
    for dangerous in dangerous_args:
        if dangerous in args:
            logger.warning(f"Argument Nmap dangereux bloqué: {dangerous}")
            return False
    
    # Limitation de longueur
    if len(args) > 500:
        logger.warning("Arguments Nmap trop longs")
        return False
    
    return True

def validate_hydra_args(service, username, wordlist):
    """Validation des arguments Hydra"""
    # Services autorisés
    allowed_services = ["smb", "rdp", "ssh", "ftp", "http", "https"]
    if service not in allowed_services:
        return False
    
    # Username
    if not username or len(username) > 100:
        return False
    
    # Wordlist
    if not validate_wordlist(wordlist):
        return False
    
    return True

