FROM python:3.11-slim

# Mise à jour et installation des outils de base seulement
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installation de nmap (outil principal)
RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Création des répertoires nécessaires
RUN mkdir -p /app/reports /app/logs /app/data

# Variables d'environnement
ENV PYTHONPATH=/app
ENV FLASK_APP=main.py

EXPOSE 5000

# Commande de démarrage
CMD ["python", "main.py"]