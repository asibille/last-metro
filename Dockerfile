# Dockerfile.ci
FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (dev inclues)
RUN npm ci

# Copier le reste du code
COPY . .

EXPOSE 3000
ENV PORT=3000

# Commande par défaut : attendre la DB et lancer les tests
CMD sh -c "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do echo 'Waiting for Postgres...'; sleep 2; done; npm test"
