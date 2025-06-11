FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de configuration
COPY package.json package-lock.json* ./

# Installation des dépendances
RUN npm ci --only=production

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Installation de serve pour servir les fichiers statiques
RUN npm install -g serve

# Port
EXPOSE 3000

# Servir l'application
CMD ["serve", "-s", "build", "-l", "3000"]