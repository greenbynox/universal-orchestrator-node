# 🚀 Node Orchestrator

**MVP d'Orchestrateur de Nodes Multi-Blockchains**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

Une plateforme intuitive pour déployer, gérer et monitorer des nodes blockchain en un clic.

![Dashboard Preview](docs/dashboard-preview.png)

---

## ✨ Fonctionnalités

### 🔗 Blockchains Supportées
- **Bitcoin (BTC)** - Full node, Pruned, Light
- **Ethereum (ETH)** - Full node, Pruned, Light  
- **Solana (SOL)** - Validator, RPC
- **Monero (XMR)** - Full node, Pruned
- **BNB Chain (BNB)** - Full node, Light

### 🎯 Fonctionnalités Clés
- ✅ **Déploiement en 1 clic** - Installer et lancer un node en quelques secondes
- ✅ **Multi-instances** - Plusieurs nodes de la même blockchain avec isolation complète
- ✅ **Monitoring temps réel** - CPU, RAM, stockage, logs en direct via WebSocket
- ✅ **Auto-détection** - Recommandation automatique du mode (Full/Pruned/Light) selon vos ressources
- ✅ **Wallets HD** - Génération de portefeuilles BIP39/BIP44 avec chiffrement AES
- ✅ **Paiements Crypto** - Accepte BTC, ETH, USDC pour les abonnements premium
- ✅ **Architecture Plugin** - Facilement extensible pour de nouvelles blockchains

---

## 📋 Prérequis

- **Node.js** 20+ 
- **Docker** 20+ avec Docker Compose
- **RAM** 4GB minimum (8GB+ recommandé pour plusieurs nodes)
- **Stockage** Variable selon les nodes (voir tableau ci-dessous)

### Espace Disque par Blockchain

| Blockchain | Full Node | Pruned | Light |
|------------|-----------|--------|-------|
| Bitcoin | 500 GB+ | 10-50 GB | < 1 GB |
| Ethereum | 1 TB+ | 200-500 GB | < 1 GB |
| Solana | 500 GB+ | - | - |
| Monero | 150 GB+ | 30 GB | - |
| BNB Chain | 500 GB+ | - | < 1 GB |

---

## 🚀 Installation Rapide

### Option 1: Docker (Recommandé)

```bash
# Cloner le repo
git clone https://github.com/your-username/node-orchestrator.git
cd node-orchestrator

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer avec Docker Compose
docker-compose up -d

# L'application est disponible sur http://localhost:3000
```

### Option 2: Installation Manuelle

```bash
# Cloner le repo
git clone https://github.com/your-username/node-orchestrator.git
cd node-orchestrator

# Installer les dépendances backend
npm install

# Installer les dépendances frontend
cd frontend && npm install && cd ..

# Copier et configurer les variables d'environnement
cp .env.example .env

# Mode développement (avec hot reload)
npm run dev

# Dans un autre terminal, lancer le frontend
cd frontend && npm run dev
```

### Option 3: Développement avec Docker

```bash
# Lancer l'environnement de développement complet
docker-compose -f docker-compose.dev.yml up

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

---

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Application
NODE_ENV=development
PORT=3000

# Sécurité
ENCRYPTION_KEY=your-32-char-encryption-key-here
JWT_SECRET=your-jwt-secret-key

# Adresses de paiement
PAYMENT_ADDRESS_BTC=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
PAYMENT_ADDRESS_ETH=0x742d35Cc6634C0532925a3b844Bc9e7595f1234
PAYMENT_ADDRESS_USDC=0x742d35Cc6634C0532925a3b844Bc9e7595f1234

# APIs externes (optionnel)
ETHERSCAN_API_KEY=your-etherscan-api-key
```

---

## 📖 Utilisation

### 1. Créer un Node

1. Cliquez sur **"Nouveau Node"** dans le dashboard
2. Sélectionnez la blockchain (BTC, ETH, SOL, XMR, BNB)
3. Choisissez le mode (Full, Pruned, Light) - auto-recommandé selon vos ressources
4. Donnez un nom à votre node
5. Cliquez sur **"Créer"**

Le node sera automatiquement déployé dans un container Docker isolé.

### 2. Gérer les Nodes

- **▶️ Démarrer** - Lance le container du node
- **⏸️ Arrêter** - Stop le container proprement
- **🔄 Redémarrer** - Restart complet du node
- **📊 Voir les logs** - Logs en temps réel
- **🗑️ Supprimer** - Supprime le node et ses données

### 3. Créer un Wallet

1. Allez dans **Wallets** > **"Nouveau Wallet"**
2. Sélectionnez la blockchain
3. Donnez un nom au wallet
4. Votre wallet HD est généré avec une seed phrase BIP39

⚠️ **Important**: Sauvegardez votre seed phrase dans un endroit sûr !

### 4. Monitoring

Le dashboard affiche en temps réel:
- Statut de tous les nodes (running, stopped, syncing...)
- Utilisation CPU/RAM/Disque
- Logs en streaming
- Progression de synchronisation

---

## 🏗️ Architecture

```
node-orchestrator/
├── src/                    # Backend (Node.js + Express)
│   ├── api/               # Routes REST API
│   ├── core/              # Managers (Node, Wallet, Payment)
│   ├── utils/             # Utilitaires (logger, crypto, system)
│   ├── websocket/         # Handler WebSocket
│   ├── config/            # Configuration centralisée
│   └── server.ts          # Point d'entrée
├── frontend/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages (Dashboard, Nodes, Wallets, Settings)
│   │   ├── services/     # API et WebSocket clients
│   │   └── store/        # État global (Zustand)
├── data/                  # Données persistantes
│   ├── nodes/            # Données des nodes
│   ├── wallets/          # Wallets chiffrés
│   └── logs/             # Logs applicatifs
└── docker-compose.yml    # Orchestration Docker
```

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React 18, Vite, Tailwind CSS |
| État | Zustand |
| Temps réel | Socket.io |
| Containers | Docker |
| Crypto | ethers.js, bip39 |
| Logging | Winston |

---

## 💳 Plans & Tarifs

| Plan | Prix | Nodes | Fonctionnalités |
|------|------|-------|-----------------|
| **Free** | $0 | 2 nodes | Fonctionnalités de base |
| **Starter** | $19/mois | 5 nodes | + Support prioritaire |
| **Premium** | $49/mois | 15 nodes | + Multi-wallets, Analytics |
| **Enterprise** | Custom | Illimité | + SLA, Support dédié |

Paiements acceptés: **BTC, ETH, USDC**

---

## 🔌 API

### Endpoints Principaux

```
# Nodes
GET    /api/nodes              # Liste des nodes
POST   /api/nodes              # Créer un node
GET    /api/nodes/:id          # Détails d'un node
DELETE /api/nodes/:id          # Supprimer un node
POST   /api/nodes/:id/start    # Démarrer
POST   /api/nodes/:id/stop     # Arrêter
GET    /api/nodes/:id/logs     # Logs

# Wallets
GET    /api/wallets            # Liste des wallets
POST   /api/wallets            # Créer un wallet
GET    /api/wallets/:id        # Détails + seed
DELETE /api/wallets/:id        # Supprimer

# Système
GET    /api/system/resources   # CPU, RAM, Disk
GET    /api/system/health      # Health check

# Paiements
GET    /api/payments/plans     # Plans disponibles
POST   /api/payments/create    # Créer un paiement
GET    /api/payments/:id/verify # Vérifier paiement
```

### WebSocket Events

```javascript
// Connexion
const socket = io('http://localhost:3000');

// Events émis par le serveur
socket.on('node:created', (node) => {});
socket.on('node:statusChanged', ({ nodeId, status }) => {});
socket.on('node:metrics', ({ nodeId, metrics }) => {});
socket.on('resources:update', (resources) => {});
```

---

## 🧩 Ajouter une Blockchain (Plugin)

1. Ajouter le type dans `src/types/index.ts`:
```typescript
export type BlockchainType = 'bitcoin' | 'ethereum' | ... | 'new-chain';
```

2. Ajouter la configuration dans `src/config/index.ts`:
```typescript
blockchains: {
  'new-chain': {
    name: 'New Chain',
    symbol: 'NEW',
    dockerImage: 'newchain/node:latest',
    defaultPorts: { rpc: 8545, p2p: 30303 },
    modes: ['full', 'light'],
    minResources: { cpu: 2, ram: 4, storage: 100 },
  },
}
```

3. Mettre à jour le frontend pour afficher la nouvelle blockchain.

---

## 🔐 Sécurité

- 🔒 Wallets chiffrés en AES-256
- 🛡️ Rate limiting sur les API
- 🔑 Isolation Docker pour chaque node
- 📝 Logs d'audit
- ✅ Helmet.js pour les headers HTTP

---

## 📝 Roadmap

- [x] MVP avec 5 blockchains
- [x] Dashboard de monitoring
- [x] Génération de wallets HD
- [x] Paiements crypto
- [ ] Notifications (email, Telegram, Discord)
- [ ] Backup automatique des wallets
- [ ] Support Kubernetes
- [ ] Mobile app (React Native)
- [ ] Plus de blockchains (Polkadot, Cosmos, Avalanche...)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

Version Premium disponible avec fonctionnalités étendues.

---

## 📞 Support

- 📧 Email: support@node-orchestrator.io
- 💬 Discord: [Rejoindre le serveur](https://discord.gg/node-orchestrator)
- 📖 Documentation: [docs.node-orchestrator.io](https://docs.node-orchestrator.io)

---

<p align="center">
  Made with ❤️ for the blockchain community
</p>
