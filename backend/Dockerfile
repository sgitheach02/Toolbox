FROM python:3.9-slim

# Installation des outils essentiels
RUN apt-get update && \
    apt-get install -y \
    nmap \
    curl \
    wget \
    netcat-openbsd \
    dnsutils \
    whois \
    && rm -rf /var/lib/apt/lists/*

# Configuration de l'environnement virtuel Python
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Création des répertoires nécessaires
RUN mkdir -p /app/data /app/reports /app/temp /app/logs

# Copie du code source
COPY . .

# Permissions pour nmap
RUN chmod +s /usr/bin/nmap 2>/dev/null || echo "⚠️  Nmap permissions configured"

EXPOSE 5000

# Point d'entrée simple
CMD ["python", "-m", "app.main"]