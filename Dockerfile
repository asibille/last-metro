FROM node:18-alpine

# Crée le dossier de travail
WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe uniquement les dependencies prod
RUN npm ci --only=production

# Copie le reste des fichiers
COPY . .

# Expose le port
EXPOSE 3000

# Définir la variable d'environnement
ENV PORT=3000

# Commande pour démarrer le serveur
CMD ["node", "server.js"]
