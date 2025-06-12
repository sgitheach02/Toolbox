FROM python:3.11-slim

# Installation des outils de sécurité
RUN apt-get update && apt-get install -y \
    nmap \
    masscan \
    nikto \
    dirb \
    sqlmap \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

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

# Exposition du port
EXPOSE 5000

# Commande de démarrage
CMD ["python", "main.py"]

# backend/Dockerfile.dev
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    nmap \
    masscan \
    nikto \
    dirb \
    sqlmap \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Installation des outils de développement
RUN pip install flask-cors python-dotenv

COPY . .

RUN mkdir -p /app/reports /app/logs /app/data

ENV PYTHONPATH=/app
ENV FLASK_ENV=development
ENV FLASK_DEBUG=true

EXPOSE 5000

CMD ["python", "main.py"]
