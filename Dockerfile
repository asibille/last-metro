# ⭐ ÉTAPE 1 : Base image Alpine (5MB vs 80MB pour Ubuntu)
FROM node:18-alpine

# ⭐ ÉTAPE 2 : Metadata
LABEL maintainer="votre-email@efrei.fr"
LABEL version="1.0"
LABEL description="LastMetro API - Optimized"

# ⭐ ÉTAPE 3 : Working directory
WORKDIR /app

# ⭐ ÉTAPE 4 : Copy package files SEULEMENT (layer caching optimal)
# Si package.json ne change pas, cette layer est en cache
COPY package*.json ./

# ⭐ ÉTAPE 5 : Install PRODUCTION dependencies uniquement
# --only=production = pas de dev dependencies (jest, etc.)
# npm ci = clean install (plus rapide que npm install)
RUN npm ci --only=production && \
    npm cache clean --force

# ⭐ ÉTAPE 6 : Copy application code (après npm install!)
COPY . .

# ⭐ ÉTAPE 7 : Create non-root user (sécurité)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# ⭐ ÉTAPE 8 : Switch to non-root user
USER nodejs

# ⭐ ÉTAPE 9 : Expose port
EXPOSE 3000

# ⭐ ÉTAPE 10 : Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# ⭐ ÉTAPE 11 : Start command
CMD ["node", "server.js"]