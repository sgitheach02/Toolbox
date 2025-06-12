# frontend/Dockerfile - Version simple qui fonctionne
FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Variables d'environnement
ENV REACT_APP_API_URL=http://localhost:5000/api

# Démarrage en mode développement
CMD ["npm", "start"]