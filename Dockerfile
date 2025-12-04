# Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copier les fichiers de dépendances frontend
COPY frontend/package*.json ./
RUN npm ci

# Copier le code source frontend
COPY frontend ./

# Build React
RUN npm run build

# Image finale
FROM node:20-alpine

WORKDIR /app

# Installer Docker CLI pour gérer les containers
RUN apk add --no-cache docker-cli

# Copier les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier le backend buildé
COPY --from=backend-builder /app/dist ./dist

# Copier le frontend buildé
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copier les fichiers de config
COPY .env.example ./.env.example

# Créer les dossiers de données
RUN mkdir -p data/nodes data/wallets data/logs

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/system/health || exit 1

# Démarrer l'application
CMD ["node", "dist/server.js"]
