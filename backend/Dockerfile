# Dockerfile Backend Pacha Toolbox - MINIMAL ET FONCTIONNEL
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

# Installation de Nikto depuis les SOURCES (la vraie solution)
RUN cd /opt && \
    git clone https://github.com/sullo/nikto.git && \
    cd nikto && \
    chmod +x program/nikto.pl && \
    ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto && \
    nikto -Version

# Test que nikto fonctionne
RUN which nikto && nikto -Version

WORKDIR /app

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Répertoires
RUN mkdir -p /app/data/reports /app/data/logs /app/data/temp

# Code source
COPY . .

# Script de vérification simple
RUN echo '#!/bin/bash\n\
echo "🔍 Vérification des outils:"\n\
for tool in nmap nikto tcpdump; do\n\
  if command -v $tool >/dev/null 2>&1; then\n\
    echo "✅ $tool: OK"\n\
  else\n\
    echo "❌ $tool: MANQUANT"\n\
  fi\n\
done\n\
echo "Test nikto:"\n\
nikto -Version | head -2' > /app/check_tools.sh && chmod +x /app/check_tools.sh

# Test final
RUN /app/check_tools.sh

EXPOSE 5000

CMD ["python3", "main.py"]