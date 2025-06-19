# Dockerfile Backend Pacha Toolbox - AVEC METASPLOIT RÉEL
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Mise à jour et outils de base
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    hydra \
    medusa \
    sshpass \
    perl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation des outils qui MARCHENT vraiment dans Debian
RUN apt-get update && apt-get install -y \
    nmap \
    tcpdump \
    netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation de Nikto depuis les SOURCES
RUN cd /opt && \
    git clone https://github.com/sullo/nikto.git && \
    cd nikto && \
    chmod +x program/nikto.pl && \
    ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto && \
    nikto -Version

# Installation des dépendances Metasploit
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    build-essential \
    zlib1g-dev \
    libreadline-dev \
    libssl-dev \
    libpq-dev \
    libsqlite3-dev \
    libpcap-dev \
    openjdk-17-jre-headless \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour Metasploit
RUN useradd -m -s /bin/bash msf && \
    echo "msf ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Installer Metasploit via le script officiel
RUN curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && \
    chmod 755 msfinstall && \
    ./msfinstall && \
    rm msfinstall

# Donner les permissions nécessaires
RUN chown -R msf:msf /opt/metasploit-framework || true
RUN chmod +x /usr/bin/msfconsole || true

WORKDIR /app

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Répertoires
RUN mkdir -p /app/data/reports /app/data/logs /app/data/temp
RUN chown -R msf:msf /app/data

# Code source
COPY . .
RUN chown -R msf:msf /app

# Script de vérification
COPY <<EOF /app/check_tools.sh
#!/bin/bash
echo "🔍 Vérification des outils:"
for tool in nmap nikto tcpdump hydra msfconsole; do
  if command -v \$tool >/dev/null 2>&1; then
    echo "✅ \$tool: OK"
  else
    echo "❌ \$tool: MANQUANT"
  fi
done
echo "Test Metasploit:"
msfconsole --version || echo "Metasploit installé, initialisation au runtime"
EOF

RUN chmod +x /app/check_tools.sh

# Test final
RUN /app/check_tools.sh

EXPOSE 5000

# Script de démarrage
COPY <<EOF /app/start.sh
#!/bin/bash
set -e
echo "Starting Pacha Toolbox with real Metasploit..."

# Démarrer PostgreSQL
echo "Starting PostgreSQL..."
service postgresql start
sleep 5

# Initialiser Metasploit DB si nécessaire (en tant que user msf)
if [ ! -f /home/msf/.msf4/database.yml ]; then
    echo "Initializing Metasploit database..."
    su - msf -c "msfdb init" || echo "DB init skipped, will use without DB"
fi

# Vérifier les outils
echo "Checking security tools..."
for tool in nmap nikto hydra tcpdump msfconsole; do
    if command -v \$tool >/dev/null 2>&1; then
        echo "✅ \$tool: Available"
    else
        echo "❌ \$tool: Missing"
    fi
done

echo "All tools ready, starting application..."
exec python3 main.py
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]