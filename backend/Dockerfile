FROM python:3.11-slim

# Installation des outils système avec tcpdump
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nmap \
    tcpdump \
    tshark \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Port d'exposition
EXPOSE 5000

# Commande de démarrage
CMD ["python", "main.py"]
