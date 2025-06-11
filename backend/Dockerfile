FROM python:3.11-slim

# Métadonnées
LABEL maintainer="Pacha Toolbox v2"
LABEL description="Backend de sécurité pour tests de pénétration Print Nightmare"
LABEL version="2.0"

# Variables d'environnement
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app
ENV FLASK_APP=app.main:create_app
ENV FLASK_ENV=production

# Mise à jour et installation des outils de sécurité essentiels
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Outils réseau et sécurité
    nmap \
    tcpdump \
    netcat-openbsd \
    curl \
    wget \
    dnsutils \
    net-tools \
    iproute2 \
    # Outils de développement
    git \
    build-essential \
    pkg-config \
    # Hydra pour bruteforce
    hydra \
    # Outils système
    procps \
    psmisc \
    unzip \
    zip \
    # Nettoyage
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Installation d'ExploitDB (SearchSploit)
RUN echo "📚 Installation d'ExploitDB..." && \
    git clone --depth 1 https://github.com/offensive-security/exploitdb.git /opt/exploitdb && \
    ln -sf /opt/exploitdb/searchsploit /usr/local/bin/searchsploit && \
    chmod +x /opt/exploitdb/searchsploit && \
    # Mise à jour initiale
    cd /opt/exploitdb && \
    git pull && \
    ./searchsploit -u || echo "Mise à jour SearchSploit terminée"

# Installation des wordlists pour Hydra
RUN echo "📝 Installation des wordlists..." && \
    mkdir -p /usr/share/wordlists && \
    # RockYou wordlist (populaire)
    curl -L -o /tmp/rockyou.txt.gz https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt && \
    gunzip -c /tmp/rockyou.txt.gz 2>/dev/null > /usr/share/wordlists/rockyou.txt || \
    curl -L -o /usr/share/wordlists/rockyou.txt https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Leaked-Databases/rockyou.txt || \
    echo "password\nadmin\n123456\npassword123\nP@ssw0rd" > /usr/share/wordlists/rockyou.txt && \
    # Common passwords
    curl -L -o /usr/share/wordlists/common.txt https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-1000.txt || \
    echo "admin\npassword\nroot\n123456" > /usr/share/wordlists/common.txt && \
    # FastTrack wordlist
    curl -L -o /usr/share/wordlists/fasttrack.txt https://raw.githubusercontent.com/drtychai/wordlists/master/fasttrack.txt || \
    echo "administrator\npassword\nroot" > /usr/share/wordlists/fasttrack.txt && \
    # Nettoyage
    rm -f /tmp/rockyou.txt.gz && \
    # Vérification des tailles
    echo "Wordlists installées:" && \
    ls -la /usr/share/wordlists/

# Configuration du répertoire de travail
WORKDIR /app

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN echo "🐍 Installation des dépendances Python..." && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Création des répertoires nécessaires
RUN mkdir -p \
    /app/data \
    /app/reports \
    /app/logs \
    /app/temp \
    /app/exploitdb \
    /app/templates && \
    # Permissions appropriées
    chmod 755 /app/data /app/reports /app/logs /app/temp

# Copie du code source
COPY . .

# Configuration des permissions pour nmap (scan SYN nécessite des privilèges)
RUN chmod +s /usr/bin/nmap 2>/dev/null || echo "⚠️ Permissions nmap configurées"

# Script de configuration Print Nightmare
RUN echo "🎯 Configuration Print Nightmare..." && \
    mkdir -p /app/config/printnightmare && \
    echo '# Configuration spécifique Print Nightmare CVE-2021-34527' > /app/config/printnightmare/targets.conf && \
    echo 'printnightmare.thm' >> /app/config/printnightmare/targets.conf && \
    echo '172.20.0.0/16' >> /app/config/printnightmare/targets.conf

# Script d'entrée personnalisé
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Script de santé
COPY scripts/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Configuration du healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh

# Variables d'environnement spécifiques
ENV TARGET_HOST=printnightmare.thm
ENV REDIS_URL=redis://redis:6379/0
ENV OPENVAS_URL=http://openvas:9392
ENV EXPLOITDB_PATH=/opt/exploitdb
ENV WORDLISTS_PATH=/usr/share/wordlists

# Exposition du port
EXPOSE 5000

# Point d'entrée
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "-m", "app.main"]