FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de configuration
COPY package.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Installation de serve pour servir les fichiers statiques
RUN npm install -g serve

EXPOSE 3000

# Servir l'application
CMD ["serve", "-s", "build", "-l", "3000"]