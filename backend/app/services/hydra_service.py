# backend/app/services/hydra_service.py
import subprocess
import threading
import time
import os
import re
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class HydraService:
    """Service pour les attaques par force brute avec Hydra"""
    
    def __init__(self):
        self.active_attacks = {}
        self.attack_history = {}
        self.wordlists_path = "/usr/share/wordlists"
        self.custom_wordlists_path = "/app/data/wordlists"
        
        # Créer le répertoire pour les wordlists personnalisées
        os.makedirs(self.custom_wordlists_path, exist_ok=True)
        
        # Services supportés par Hydra
        self.supported_services = {
            'ssh': {'port': 22, 'description': 'SSH Service'},
            'ftp': {'port': 21, 'description': 'FTP Service'},
            'telnet': {'port': 23, 'description': 'Telnet Service'},
            'http-get': {'port': 80, 'description': 'HTTP Basic Auth'},
            'http-post-form': {'port': 80, 'description': 'HTTP POST Form'},
            'https-get': {'port': 443, 'description': 'HTTPS Basic Auth'},
            'https-post-form': {'port': 443, 'description': 'HTTPS POST Form'},
            'mysql': {'port': 3306, 'description': 'MySQL Database'},
            'mssql': {'port': 1433, 'description': 'Microsoft SQL Server'},
            'postgres': {'port': 5432, 'description': 'PostgreSQL Database'},
            'rdp': {'port': 3389, 'description': 'Remote Desktop Protocol'},
            'smb': {'port': 445, 'description': 'SMB/CIFS Service'},
            'vnc': {'port': 5900, 'description': 'VNC Service'},
            'pop3': {'port': 110, 'description': 'POP3 Service'},
            'imap': {'port': 143, 'description': 'IMAP Service'},
            'smtp': {'port': 25, 'description': 'SMTP Service'}
        }
    
    def check_hydra_availability(self) -> Dict:
        """Vérifier la disponibilité de Hydra"""
        try:
            result = subprocess.run(['hydra', '-h'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=10)
            
            if result.returncode == 0:
                # Extraire la version de Hydra
                version_match = re.search(r'Hydra.*v(\d+\.\d+)', result.stdout)
                version = version_match.group(1) if version_match else "Unknown"
                
                return {
                    'available': True,
                    'version': version,
                    'path': '/usr/bin/hydra',
                    'supported_services': list(self.supported_services.keys())
                }
            else:
                return {'available': False, 'error': 'Hydra command failed'}
                
        except FileNotFoundError:
            return {'available': False, 'error': 'Hydra not installed'}
        except subprocess.TimeoutExpired:
            return {'available': False, 'error': 'Hydra command timeout'}
        except Exception as e:
            return {'available': False, 'error': str(e)}
    
    def get_available_wordlists(self) -> Dict:
        """Récupérer les wordlists disponibles"""
        wordlists = {}
        
        # Wordlists système communes
        common_wordlists = {
            'rockyou': '/usr/share/wordlists/rockyou.txt',
            'common': '/usr/share/wordlists/dirb/common.txt',
            'fasttrack': '/usr/share/wordlists/fasttrack.txt',
            'metasploit_unix_users': '/usr/share/wordlists/metasploit/unix_users.txt',
            'metasploit_unix_passwords': '/usr/share/wordlists/metasploit/unix_passwords.txt',
            'darkweb2017': '/usr/share/wordlists/darkweb2017-top1000.txt',
            'top1000': '/usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt'
        }
        
        # Vérifier les wordlists système
        for name, path in common_wordlists.items():
            if os.path.exists(path):
                try:
                    size = os.path.getsize(path)
                    with open(path, 'r', errors='ignore') as f:
                        lines = sum(1 for _ in f)
                    
                    wordlists[name] = {
                        'path': path,
                        'size': size,
                        'lines': lines,
                        'type': 'system'
                    }
                except:
                    pass
        
        # Vérifier les wordlists personnalisées
        if os.path.exists(self.custom_wordlists_path):
            for filename in os.listdir(self.custom_wordlists_path):
                if filename.endswith('.txt'):
                    path = os.path.join(self.custom_wordlists_path, filename)
                    try:
                        size = os.path.getsize(path)
                        with open(path, 'r', errors='ignore') as f:
                            lines = sum(1 for _ in f)
                        
                        wordlists[filename.replace('.txt', '')] = {
                            'path': path,
                            'size': size,
                            'lines': lines,
                            'type': 'custom'
                        }
                    except:
                        pass
        
        return wordlists
    
    def create_custom_wordlist(self, name: str, content: str) -> Dict:
        """Créer une wordlist personnalisée"""
        try:
            filepath = os.path.join(self.custom_wordlists_path, f"{name}.txt")
            
            with open(filepath, 'w') as f:
                f.write(content)
            
            size = os.path.getsize(filepath)
            lines = content.count('\n') + 1
            
            return {
                'success': True,
                'name': name,
                'path': filepath,
                'size': size,
                'lines': lines
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def validate_target(self, target: str, service: str) -> Tuple[bool, str]:
        """Valider une cible pour l'attaque"""
        # Vérification basique du format IP/hostname
        if not target or len(target.strip()) == 0:
            return False, "Cible vide"
        
        # Pour les services web, accepter les URLs
        if service in ['http-get', 'http-post-form', 'https-get', 'https-post-form']:
            if not (target.startswith('http://') or target.startswith('https://') or 
                   re.match(r'^[\w\.-]+$', target)):
                return False, "Format URL invalide pour service web"
        
        # Pour les autres services, vérifier format IP/hostname
        else:
            if not re.match(r'^[\w\.-]+$', target):
                return False, "Format IP/hostname invalide"
        
        # Vérification que le service est supporté
        if service not in self.supported_services:
            return False, f"Service '{service}' non supporté"
        
        return True, "Cible valide"
    
    def build_hydra_command(self, config: Dict) -> List[str]:
        """Construire la commande Hydra"""
        cmd = ['hydra']
        
        # Options de base
        cmd.extend(['-t', str(config.get('threads', 4))])
        cmd.extend(['-w', str(config.get('timeout', 30))])
        
        # Mode verbeux pour récupérer la sortie
        cmd.append('-V')
        
        # Credentials
        if config.get('username'):
            cmd.extend(['-l', config['username']])
        elif config.get('userlist_path'):
            cmd.extend(['-L', config['userlist_path']])
        else:
            return None  # Pas de credentials
        
        if config.get('password'):
            cmd.extend(['-p', config['password']])
        elif config.get('passlist_path'):
            cmd.extend(['-P', config['passlist_path']])
        else:
            return None  # Pas de mots de passe
        
        # Options spécifiques au service
        if config['service'] == 'http-post-form':
            # Format: /login.php:username=^USER^&password=^PASS^:F=incorrect
            form_data = config.get('form_data', '/login.php:username=^USER^&password=^PASS^:F=incorrect')
            cmd.append(f"{config['target']}:{config.get('port', 80)}")
            cmd.append('http-post-form')
            cmd.append(form_data)
        elif config['service'] == 'https-post-form':
            form_data = config.get('form_data', '/login.php:username=^USER^&password=^PASS^:F=incorrect')
            cmd.append(f"{config['target']}:{config.get('port', 443)}")
            cmd.append('https-post-form')
            cmd.append(form_data)
        else:
            # Service standard
            cmd.append(f"{config['target']}:{config.get('port', self.supported_services[config['service']]['port'])}")
            cmd.append(config['service'])
        
        # Options additionnelles
        if config.get('continue_on_found'):
            cmd.append('-f')  # Arrêt après le premier succès
        
        if config.get('exit_on_found'):
            cmd.append('-F')  # Arrêt après le premier succès sur n'importe quel host
        
        # Fichier de sortie
        output_file = f"/app/data/reports/hydra_{config['attack_id']}.txt"
        cmd.extend(['-o', output_file])
        
        return cmd
    
    def parse_hydra_output(self, line: str) -> Dict:
        """Parser une ligne de sortie de Hydra"""
        result = {
            'type': 'info',
            'message': line.strip(),
            'timestamp': datetime.now().isoformat()
        }
        
        # Tentative de connexion
        if '[ATTEMPT]' in line:
            result['type'] = 'attempt'
            # Extraire target, login, password
            attempt_match = re.search(r'target (\S+) - login "([^"]*)" - pass "([^"]*)"', line)
            if attempt_match:
                result['target'] = attempt_match.group(1)
                result['login'] = attempt_match.group(2)
                result['password'] = attempt_match.group(3)
        
        # Credential trouvé
        elif '[FOUND]' in line or 'login:' in line and 'password:' in line:
            result['type'] = 'success'
            # Extraire les credentials
            cred_match = re.search(r'login:\s*(\S+)\s+password:\s*(\S+)', line)
            if cred_match:
                result['login'] = cred_match.group(1)
                result['password'] = cred_match.group(2)
        
        # Erreur
        elif '[ERROR]' in line or 'ERROR' in line:
            result['type'] = 'error'
        
        # Progression
        elif '[STATUS]' in line:
            result['type'] = 'status'
        
        return result
    
    def run_attack_async(self, attack_id: str, config: Dict):
        """Exécuter une attaque Hydra de manière asynchrone"""
        try:
            logger.info(f"🚀 Démarrage attaque Hydra {attack_id}")
            
            # Construire la commande
            cmd = self.build_hydra_command(config)
            if not cmd:
                self.active_attacks[attack_id]['status'] = 'error'
                self.active_attacks[attack_id]['error'] = 'Configuration invalide'
                return
            
            logger.info(f"💻 Commande Hydra: {' '.join(cmd)}")
            
            # Lancer le processus
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                universal_newlines=True
            )
            
            # Stocker le PID
            self.active_attacks[attack_id]['pid'] = process.pid
            self.active_attacks[attack_id]['process'] = process
            
            attempts = 0
            credentials_found = []
            
            # Lire la sortie en temps réel
            for line in iter(process.stdout.readline, ''):
                if attack_id not in self.active_attacks:
                    break
                
                if self.active_attacks[attack_id]['status'] == 'stopped':
                    process.terminate()
                    break
                
                # Parser la ligne
                parsed = self.parse_hydra_output(line)
                self.active_attacks[attack_id]['output'].append(parsed)
                
                # Compter les tentatives
                if parsed['type'] == 'attempt':
                    attempts += 1
                    self.active_attacks[attack_id]['attempts'] = attempts
                
                # Credentials trouvés
                if parsed['type'] == 'success':
                    credential = {
                        'login': parsed.get('login'),
                        'password': parsed.get('password'),
                        'found_at': datetime.now().isoformat()
                    }
                    credentials_found.append(credential)
                    self.active_attacks[attack_id]['credentials'] = credentials_found
                
                # Mise à jour du progrès (estimation)
                if attempts > 0:
                    estimated_total = config.get('estimated_attempts', 1000)
                    progress = min(95, (attempts / estimated_total) * 100)
                    self.active_attacks[attack_id]['progress'] = progress
            
            # Attendre la fin du processus
            return_code = process.wait()
            
            # Finaliser l'attaque
            if attack_id in self.active_attacks:
                if return_code == 0:
                    self.active_attacks[attack_id]['status'] = 'completed'
                    self.active_attacks[attack_id]['progress'] = 100
                else:
                    self.active_attacks[attack_id]['status'] = 'failed'
                
                self.active_attacks[attack_id]['completed_at'] = datetime.now().isoformat()
                self.active_attacks[attack_id]['return_code'] = return_code
                
                # Déplacer vers l'historique
                self.attack_history[attack_id] = self.active_attacks[attack_id].copy()
                
                logger.info(f"✅ Attaque Hydra {attack_id} terminée - Code: {return_code}")
        
        except Exception as e:
            logger.error(f"❌ Erreur attaque Hydra {attack_id}: {str(e)}")
            if attack_id in self.active_attacks:
                self.active_attacks[attack_id]['status'] = 'error'
                self.active_attacks[attack_id]['error'] = str(e)
                self.active_attacks[attack_id]['completed_at'] = datetime.now().isoformat()
    
    def start_attack(self, config: Dict) -> Dict:
        """Démarrer une nouvelle attaque"""
        try:
            attack_id = f"hydra_{int(time.time())}_{len(self.active_attacks)}"
            
            # Validation
            is_valid, error_msg = self.validate_target(config['target'], config['service'])
            if not is_valid:
                return {'success': False, 'error': error_msg}
            
            # Configuration complète
            attack_config = {
                'attack_id': attack_id,
                'target': config['target'],
                'service': config['service'],
                'port': config.get('port', self.supported_services[config['service']]['port']),
                'username': config.get('username'),
                'userlist_path': config.get('userlist_path'),
                'password': config.get('password'),
                'passlist_path': config.get('passlist_path'),
                'threads': config.get('threads', 4),
                'timeout': config.get('timeout', 30),
                'form_data': config.get('form_data'),
                'continue_on_found': config.get('continue_on_found', False),
                'exit_on_found': config.get('exit_on_found', True),
                'estimated_attempts': config.get('estimated_attempts', 1000),
                'status': 'starting',
                'started_at': datetime.now().isoformat(),
                'progress': 0,
                'attempts': 0,
                'credentials': [],
                'output': [],
                'pid': None
            }
            
            # Stocker l'attaque
            self.active_attacks[attack_id] = attack_config
            
            # Lancer dans un thread séparé
            thread = threading.Thread(
                target=self.run_attack_async,
                args=(attack_id, attack_config)
            )
            thread.daemon = True
            thread.start()
            
            # Changer le statut
            self.active_attacks[attack_id]['status'] = 'running'
            
            return {
                'success': True,
                'attack_id': attack_id,
                'message': 'Attaque Hydra démarrée'
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur démarrage attaque: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def stop_attack(self, attack_id: str) -> Dict:
        """Arrêter une attaque"""
        try:
            if attack_id not in self.active_attacks:
                return {'success': False, 'error': 'Attaque non trouvée'}
            
            attack = self.active_attacks[attack_id]
            
            if attack['status'] != 'running':
                return {'success': False, 'error': 'Attaque non en cours'}
            
            # Arrêter le processus
            if 'process' in attack and attack['process']:
                attack['process'].terminate()
                time.sleep(1)
                if attack['process'].poll() is None:
                    attack['process'].kill()
            
            # Mettre à jour le statut
            attack['status'] = 'stopped'
            attack['completed_at'] = datetime.now().isoformat()
            
            logger.info(f"🛑 Attaque Hydra {attack_id} arrêtée")
            
            return {'success': True, 'message': 'Attaque arrêtée'}
            
        except Exception as e:
            logger.error(f"❌ Erreur arrêt attaque: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_attack_status(self, attack_id: str) -> Dict:
        """Récupérer le statut d'une attaque"""
        if attack_id in self.active_attacks:
            return self.active_attacks[attack_id]
        elif attack_id in self.attack_history:
            return self.attack_history[attack_id]
        else:
            return None
    
    def get_all_attacks(self) -> Dict:
        """Récupérer toutes les attaques"""
        return {
            'active': self.active_attacks,
            'history': self.attack_history,
            'summary': {
                'active_count': len(self.active_attacks),
                'history_count': len(self.attack_history),
                'total_credentials': sum(len(a.get('credentials', [])) for a in {**self.active_attacks, **self.attack_history}.values())
            }
        }
    
    def cleanup_old_attacks(self, max_history: int = 50):
        """Nettoyer les anciennes attaques"""
        if len(self.attack_history) > max_history:
            # Garder les plus récentes
            sorted_attacks = sorted(
                self.attack_history.items(),
                key=lambda x: x[1].get('started_at', ''),
                reverse=True
            )
            
            self.attack_history = dict(sorted_attacks[:max_history])
            
            logger.info(f"🧹 Nettoyage historique Hydra: gardé {max_history} attaques")