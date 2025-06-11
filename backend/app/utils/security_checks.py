import ipaddress
import re
import logging

logger = logging.getLogger(__name__)

def validate_target(target):
    """Validation d'une cible de scan"""
    if not target or len(target) > 255:
        return False, "Cible invalide ou trop longue"
    
    # Vérification des caractères dangereux
    dangerous_chars = [';', '&', '|', '`', ',', '(', ')', '{', '}', '<', '>']
    if any(char in target for char in dangerous_chars):
        return False, "Caractères non autorisés dans la cible"
    
    try:
        # Test si c'est une adresse IP
        ipaddress.ip_address(target)
        return True, "Adresse IP valide"
    except ValueError:
        pass
    
    try:
        # Test si c'est un réseau
        ipaddress.ip_network(target, strict=False)
        return True, "Réseau valide"
    except ValueError:
        pass
    
    # Validation basique du nom de domaine
    domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
    if re.match(domain_pattern, target):
        return True, "Nom de domaine valide"
    
    return False, "Format de cible non reconnu"

def sanitize_filename(filename):
    """Nettoyage d'un nom de fichier"""
    # Suppression des caractères dangereux
    cleaned = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limitation de la longueur
    cleaned = cleaned[:200]
    # Suppression des espaces en début/fin
    cleaned = cleaned.strip()
    
    if not cleaned:
        cleaned = "unnamed_file"
    
    return cleaned

def check_private_ip(ip_str):
    """Vérification si une IP est privée"""
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private
    except ValueError:
        return False

def validate_nmap_args(args):
    """Validation des arguments Nmap"""
    if not args:
        return True, "Arguments vides"
    
    # Arguments dangereux à bloquer
    dangerous_args = [
        '--script=', '--script-args=', '--datadir=', '--system-dns',
        '--dns-servers=', '--source-port=', '--spoof-mac=', '--decoy=',
        '-D', '--max-rate=0', '--min-rate=0'
    ]
    
    for dangerous in dangerous_args:
        if dangerous in args:
            return False, f"Argument non autorisé: {dangerous}"
    
    # Vérification de la longueur
    if len(args) > 200:
        return False, "Arguments trop longs"
    
    return True, "Arguments valides"