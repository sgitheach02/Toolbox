import re
import ipaddress
import logging

logger = logging.getLogger(__name__)

def validate_target(target):
    """Validation simplifiée d'une cible"""
    if not target or len(target) > 255:
        return False
    
    # Caractères dangereux
    dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '<', '>', '"', "'"]
    if any(char in target for char in dangerous_chars):
        logger.warning(f"Caractères dangereux détectés dans la cible: {target}")
        return False
    
    # Cibles autorisées pour le lab
    allowed_targets = [
        "127.0.0.1",
        "localhost", 
        "printnightmare.thm"
    ]
    
    if target in allowed_targets:
        return True
    
    # Validation des IPs privées
    try:
        ip = ipaddress.ip_address(target)
        if ip.is_private or ip.is_loopback:
            return True
    except ValueError:
        pass
    
    # Validation des réseaux privés
    try:
        network = ipaddress.ip_network(target, strict=False)
        private_ranges = [
            ipaddress.ip_network("172.20.0.0/16"),
            ipaddress.ip_network("192.168.0.0/16"),
            ipaddress.ip_network("10.0.0.0/8"),
        ]
        
        for private_range in private_ranges:
            if network.subnet_of(private_range) or network.supernet_of(private_range):
                return True
    except ValueError:
        pass
    
    # Domaines de lab
    lab_domains = [".thm", ".local", ".lab", ".test"]
    if any(target.endswith(suffix) for suffix in lab_domains):
        return True
    
    logger.warning(f"Cible non autorisée: {target}")
    return False

def sanitize_filename(filename):
    """Nettoyage d'un nom de fichier"""
    cleaned = re.sub(r'[<>:"/\\|?*]', '_', filename)
    cleaned = cleaned[:200]
    cleaned = cleaned.strip('. ')
    
    if not cleaned:
        cleaned = "unknown_file"
    
    return cleaned

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
    
    if len(args) > 500:
        logger.warning("Arguments Nmap trop longs")
        return False
    
    return True