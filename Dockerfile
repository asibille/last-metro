#############################
# STAGE 1 : BUILDER
#############################
# Utiliser une version récente et sécurisée de Node + Alpine
FROM node:18-alpine3.19 AS builder
WORKDIR /app

# Mettre à jour Alpine pour corriger les vulnérabilités système
RUN apk update && apk upgrade --no-cache

# Copier uniquement les fichiers package.json pour profiter du cache Docker
COPY package*.json ./

# Installer toutes les dépendances (prod + dev)
RUN npm ci

# Copier le reste du projet
COPY . .

# (OPTIONNEL) Build TypeScript si nécessaire
# RUN npm run build

#############################
# STAGE 2 : RUNTIME
#############################
FROM node:18-alpine3.19 AS runtime
WORKDIR /app

# Mettre à jour Alpine pour corriger les vulnérabilités
RUN apk update && apk upgrade --no-cache

# Copier uniquement les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier les fichiers construits depuis le builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/server.js"]
