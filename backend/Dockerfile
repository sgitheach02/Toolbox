FROM python:3.11-slim

# Installation des outils système
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nmap \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Création des répertoires
RUN mkdir -p /app/reports /app/logs /app/data /app/temp

# Variables d'environnement
ENV PYTHONPATH=/app
ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Commande de démarrage
CMD ["python", "main.py"]
