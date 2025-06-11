FROM python:3.11-slim

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Installation des outils essentiels seulement
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nmap \
    curl \
    wget \
    netcat-openbsd \
    procps \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Répertoire de travail
WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Création des répertoires
RUN mkdir -p /app/data /app/reports /app/logs && \
    chmod 755 /app/data /app/reports /app/logs

# Copie du code source
COPY . .

# Wordlists basiques intégrées
RUN mkdir -p /usr/share/wordlists && \
    echo -e "password\nadmin\n123456\npassword123\nP@ssw0rd\nadministrator\nroot\nguest\nservice" > /usr/share/wordlists/common.txt && \
    cp /usr/share/wordlists/common.txt /usr/share/wordlists/rockyou.txt

# Script de santé simple
RUN echo '#!/bin/bash\ncurl -f http://localhost:5000/api/health || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD /healthcheck.sh

# Port
EXPOSE 5000

# Démarrage
CMD ["python", "-m", "app.main"]