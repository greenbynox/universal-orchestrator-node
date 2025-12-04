#!/bin/bash

# ===========================================
# Script d'installation Node Orchestrator
# ===========================================

set -e

echo "🚀 Installation de Node Orchestrator..."
echo ""

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 20+"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ requise. Version actuelle: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi
echo "✅ npm $(npm -v)"

# Docker (optionnel mais recommandé)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')"
else
    echo "⚠️  Docker non détecté. Installation manuelle requise pour les nodes."
fi

echo ""
echo "📦 Installation des dépendances backend..."
npm install

echo ""
echo "📦 Installation des dépendances frontend..."
cd frontend
npm install
cd ..

echo ""
echo "⚙️  Configuration..."

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Générer des clés aléatoires
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Remplacer dans le fichier .env
    sed -i "s/your-32-char-encryption-key-here/$ENCRYPTION_KEY/" .env
    sed -i "s/your-jwt-secret-key/$JWT_SECRET/" .env
    
    echo "✅ Fichier .env créé avec des clés générées"
else
    echo "ℹ️  Fichier .env existant conservé"
fi

# Créer les dossiers de données
mkdir -p data/nodes data/wallets data/logs
echo "✅ Dossiers de données créés"

echo ""
echo "🏗️  Build du projet..."
npm run build

echo ""
echo "=================================="
echo "✅ Installation terminée !"
echo "=================================="
echo ""
echo "Pour lancer l'application:"
echo ""
echo "  Mode Production:"
echo "    npm start"
echo ""
echo "  Mode Développement:"
echo "    npm run dev"
echo "    cd frontend && npm run dev"
echo ""
echo "  Avec Docker:"
echo "    docker-compose up -d"
echo ""
echo "L'application sera disponible sur http://localhost:3000"
echo ""
