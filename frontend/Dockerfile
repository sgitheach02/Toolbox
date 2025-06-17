FROM node:18-alpine

# Variables pour éviter les crashes
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation avec plus de mémoire
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --silent --no-progress

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Variables d'environnement React
ENV REACT_APP_API_URL=http://localhost:5000/api
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

# Démarrage avec gestion d'erreurs
CMD ["sh", "-c", "npm start 2>&1 | tee /tmp/react.log || (echo 'React crashed!' && tail -50 /tmp/react.log && sleep infinity)"]
