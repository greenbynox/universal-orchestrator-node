# 🚀 Node Orchestrator v2.3.1 - 77 Blockchains Supportées

<div align="center">

**Refonte Architecturale Data-Driven – Infrastructure Blockchain Modulaire & Sécurisée**
**Blockchain (77 supportées sur 227)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F.svg)](https://www.electronjs.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](tests/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Free](https://img.shields.io/badge/Price-100%25%20FREE-brightgreen.svg)]()
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA.svg)](https://discord.gg/AH93eHVQGU)

<br>

🎉 **100% GRATUIT** - Aucune limite, aucune version payante. Ce projet est fait par et pour la communauté blockchain.

[📥 Télécharger](#-téléchargement) • [📖 Documentation](#-utilisation) • [🤝 Contribuer](#-contribution) • [💬 Discord](https://discord.gg/AH93eHVQGU) • [🐛 Issues](https://github.com/greenbynox/universal-orchestrator-node/issues)

</div>

---

## ✨ Version 2.3.1 – Stabilité (WSL2/Docker), Sécurité & Expérience Dev

### 🔧 Quoi de Neuf en v2.3.0

- **WSL2 / Docker TCP** : durcissement de la détection d'hôte, gestion des ports et stratégie de retry pour éviter les `ECONNREFUSED` côté RPC.
- **Modes supportés “vraiment”** : la matrice `full/pruned/light` est maintenant une source de vérité côté backend (ex: **Ethereum ne propose plus `light`**).
- **Dev workflow** : réduction du bruit Socket.IO/Vite (connexion WS directe au backend en dev) + scripts PowerShell dédiés (`scripts/dev.ps1`, `scripts/start-docker.ps1`).
- **Sécurité** : middleware d'auth API fail-closed en prod (configuration invalide = refus), CORS WS aligné sur HTTP, redaction de configs sensibles dans les events.

### 🎯 Trois Piliers Fondamentaux

| Architecture Modulaire | Sécurité Renforcée | Infrastructure Stable |
|:---:|:---:|:---:|
| **Config TypeScript** modulaire | **Isolation Socket Docker** + whitelist stricte | **Prisma SQLite** temps réel |
| Ajouter une blockchain = 10x plus facile | `sanitizeInput` systématique + AES-256 | Zero-crash avec health checks |
| Réutilisable & extensible | Containers sandboxés + validation stricte | Observabilité complète |

### 🔧 Quoi de Neuf en v2.2.0

#### 1. **Architecture Modulaire (TypeScript Config)** 📝
- Chaque blockchain est définie dans `src/config/blockchains/chains/*.ts` (Bitcoin, Ethereum, Solana, etc.)
- Config inclut : image Docker, ports, volumes, ressources, healthchecks
- **blockchainRegistry** centralise et valide automatiquement les configurations
- **Bénéfice** : Ajouter une nouvelle blockchain facilement avec typage complet
- **Exemple** : `src/config/blockchains/chains/layer1.ts` avec configurations complètes ✅

#### 2. **Sécurité Renforcée – Docker Socket Isolation** 🛡️
- Whitelist stricte d'images (50+ images vérifiées, patterns `ghcr.io/*`, `kylemanna/*`)
- Chaque container sandboxé : `CapDrop: ['ALL']`, `no-new-privileges`
- Validation avant exécution (image, ports, chemins)
- `sanitizeInput` systématique sur tous les vecteurs d'entrée
- **Bénéfice** : Protection contre les injections de commandes Docker
- **Status** : ✅ Implémenté et audité

#### 3. **Infrastructure Stable – Prisma + SQLite** 📊
- Base de données pour nodes, métriques, logs (Prisma ORM typé)
- Health checks automatiques, migration helper pour nœuds legacy
- Prêt pour AI-Ops (détection d'anomalies, maintenance prédictive)
- **Bénéfice** : Zéro crash, observabilité complète, données persistantes
- **Status** : ✅ Prisma generated & migrated (v20251206182219)

#### 4. **AI-Ops & Alerting** 🛰️
- Prisma `Alert` + `Webhook` models, AlertManager (EventEmitter)
- HealthCheckService (CPU/RAM/disk/node down/sync delay) + auto-pruning hook
- Notifications Discord/Telegram/webhook, tableau de bord `/api/dashboard/stats`
- Frontend Dashboard/Alerts pages (Recharts + polling 5s) et modal d'estimation des ressources

---

## ✨ Fonctionnalités v2.3.1

### 🔗 Blockchain (77 supportées sur 227)

<table>
<tr>
<td><b>🏆 Majeures</b></td>
<td>Bitcoin, Ethereum, Solana, Monero, BNB Chain, Cardano, Polkadot, Avalanche, Polygon, Cosmos, NEAR, Algorand, Tezos, TON, Sui, Aptos...</td>
</tr>
<tr>
<td><b>⚡ Layer 2</b></td>
<td>Arbitrum, Optimism, Base, zkSync Era, Linea, Scroll, Blast, Manta, Mode, Mantle, Starknet, Taiko...</td>
</tr>
<tr>
<td><b>🔷 EVM</b></td>
<td>Fantom, Cronos, Harmony, Klaytn, Celo, Aurora, Moonbeam, Metis, Boba, Evmos, Kava, Gnosis...</td>
</tr>
<tr>
<td><b>🔒 Privacy</b></td>
<td>Monero, Zcash, Dash, Firo, Beam, Horizen, Grin, PIVX, Secret Network...</td>
</tr>
<tr>
<td><b>🌌 Cosmos</b></td>
<td>Osmosis, Juno, Injective, Sei, Celestia, Dymension, Stargaze, Akash, Axelar...</td>
</tr>
<tr>
<td><b>🎮 Gaming</b></td>
<td>Immutable X, Gala, Axie Infinity, The Sandbox, Decentraland, Ronin, Enjin...</td>
</tr>
</table>

### 🎯 Fonctionnalités Clés

| Fonctionnalité | Description |
|----------------|-------------|
| 🖱️ **Déploiement 1-clic** | Créer un node en quelques secondes |
| ♾️ **Illimité** | Autant de nodes que votre machine supporte |
| 💼 **Wallets HD** | Génération BIP39 avec chiffrement AES-256-GCM |
| 🔐 **Sécurité v2** | Docker isolation, sanitizeInput, rate limiting |
| 📊 **Monitoring** | CPU, RAM, Disque en temps réel + Prisma logs |
| 🖥️ **Desktop App** | Application Windows native (Electron 39) |
| ₿ **Types Bitcoin** | Legacy, SegWit, Native SegWit (bc1q), Taproot (bc1p) |
| 🤖 **AI-Ready** | Infrastructure prête pour AI-Ops & détection anomalies |

---

## 📥 Téléchargement

### Windows (Recommandé)

> **[📥 Télécharger Node Orchestrator v2.3.1 (Windows/Linux/Mac)](https://github.com/greenbynox/universal-orchestrator-node/releases)**

- **Windows**: `Node Orchestrator-2.3.1-Portable.exe` (Version portable, pas d'installation requise)
- **Linux**: `Node Orchestrator-2.3.1.AppImage` (Exécutable portable)
- **macOS**: `Node Orchestrator-2.3.1-mac.zip` (Application portable)

> Note: **Docker Desktop doit être installé** sur votre machine pour que l'orchestrateur fonctionne.

### Depuis les sources

```bash
# Cloner le repo
git clone https://github.com/greenbynox/universal-orchestrator-node.git
cd universal-orchestrator-node

# Installer les dépendances
npm install
cd frontend && npm install && cd ..

# Lancer en mode développement
npm run dev

# (Windows) Si Docker Desktop est embarqué dans le repo mais pas installé/réparé,
# vous pouvez activer l'auto-install/repair (UAC requis) :
#   - DOCKER_DESKTOP_AUTO_INSTALL=true
#   - DOCKER_DESKTOP_ACCEPT_LICENSE=true
# Exemple (PowerShell):
#   $env:DOCKER_DESKTOP_AUTO_INSTALL='true'
#   $env:DOCKER_DESKTOP_ACCEPT_LICENSE='true'
#   npm run dev

# Ou démarrer l'application Electron complète
npm run start:dev
```

---

## ⚡ Quick Start

### Prérequis

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **OS** | Windows 10 | Windows 11 |
| **RAM** | 4 GB | 8+ GB |
| **CPU** | 2 cores | 4+ cores |
| **Disque** | 10 GB | Variable selon nodes |
| **Node.js** | 18+ | 20+ (pour dev) |
| **Docker** | ✅ Requis | Desktop Edition |

> Note: sur Windows, le **Setup** peut installer Docker Desktop automatiquement. La version **Portable** et l'exécution **depuis les sources** nécessitent que Docker Desktop soit déjà installé et lancé.

### Installation & Démarrage

1. **Docker** :
   - Via le **Setup Windows**: Docker Desktop peut être installé automatiquement.
   - Depuis les **sources** / en **Portable**: installez Docker Desktop : [Docker Desktop](https://docs.docker.com/get-docker/)
2. **Installer les dépendances** :
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```
3. **Lancer en dev complet (Electron + API + React)** :
   ```bash
   npm run start:dev
   ```

### Espace Disque par Blockchain (Full Nodes)

| Blockchain | Full Node | Pruned | Light |
|------------|-----------|--------|-------|
| Bitcoin | 500 GB+ | 10-50 GB | N/A (non supporté par l'orchestrateur) |
| Ethereum | 1 TB+ | 200-500 GB | N/A (geth ne supporte plus le mode light) |
| Solana | 500 GB+ | - | - |
| Monero | 150 GB+ | 30 GB | - |

---

## 📖 Utilisation

### 1. Créer un Node

1. Ouvrez l'application
2. Cliquez sur **"Nouveau Node"**
3. Sélectionnez la blockchain parmi **77 options supportées** (sur 227 visibles)
4. Choisissez le mode (Full, Pruned, Light)
5. Cliquez sur **"Créer"** – Le container démarre automatiquement

### 2. Créer un Wallet

1. Allez dans **Wallets** > **"Nouveau Wallet"**
2. Recherchez votre blockchain (ex: "Bitcoin", "Ethereum")
3. **Entrez un mot de passe** (min 8 caractères) pour chiffrer votre seed
4. Pour Bitcoin, choisissez le type d'adresse:
   - **Legacy** (1xxx...) - Compatible partout
   - **SegWit** (3xxx...) - Frais réduits
   - **Native SegWit** (bc1q...) - Frais très bas ✨
   - **Taproot** (bc1p...) - Le plus récent
5. **Sauvegardez votre seed phrase** (12 mots) en lieu sûr !

⚠️ **IMPORTANT**: Le mot de passe chiffre votre seed localement avec AES-256-GCM. Si vous l'oubliez, vous ne pourrez plus accéder à votre seed !

### 3. Voir sa Seed Phrase

1. Cliquez sur **"Voir Seed"** sur votre wallet
2. Entrez votre mot de passe
3. Votre seed phrase s'affiche
4. Copiez-la et gardez-la en sécurité

---

## 🏗️ Architecture v2.3.0

```
universal-orchestrator-node/
├── src/
│   ├── api/                    # Routes REST
│   ├── core/
│   │   ├── managers/           # NodeManager, WalletManager, DockerManager
│   │   ├── security.ts         # Whitelist, sanitization, validation
│   │   └── services/           # TemplateManager, LogCollector, AI patterns
│   ├── templates/              # YAML blockchain configs (Bitcoin, Ethereum, etc.)
│   ├── utils/
│   │   ├── migrationHelpers.ts # Import legacy nodes.json → Prisma
│   │   └── crypto.ts           # AES-256-GCM, PBKDF2
│   └── server.ts               # Express server
├── electron/                   # Application Electron (Desktop)
│   ├── main.js                # Process principal
│   └── start-server.js        # Serveur embarqué
├── frontend/                   # Interface React + Vite
│   └── src/
│       ├── components/         # Dashboard, Nodes, Wallets, Settings
│       ├── pages/
│       ├── services/           # API clients
│       ├── config/             # 205 blockchains config
│       └── store/              # État Zustand
├── prisma/                     # Schema Prisma ORM
│   ├── schema.prisma           # Models: Node, MetricPoint, LogEntry
│   └── migrations/             # SQL migrations
├── tests/                      # Jest tests (83 tests ✅)
└── docker-compose.yml          # Dev environment
```

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Desktop** | Electron 39 |
| **Backend** | Node.js 20+, Express |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **État** | Zustand |
| **Crypto** | bip39, AES-256-GCM, PBKDF2 |
| **BD** | Prisma ORM + SQLite |
| **Configuration** | YAML Templates |
| **Build** | electron-builder (Portable, AppImage, Zip) |

---

## 🔐 Sécurité v2.3.0

### ✅ Garantie 100% Gratuit & Audité

#### 1. Docker Socket Isolation
- ✅ Whitelist stricte d'images (50+ vérifiées)
- ✅ Validation avant exécution
- ✅ Patterns: `ghcr.io/universal-orchestrator/*`, `kylemanna/*`
- ✅ Containers sandboxés : `CapDrop: ['ALL']`, `no-new-privileges`

#### 2. Input Protection
- ✅ `sanitizeInput` systématique sur tous les vecteurs
- ✅ Rate limiting (100 req/min sur endpoints sensibles)
- ✅ XSS/Injection prevention
- ✅ Path traversal protection

#### 3. Chiffrement des Seeds
- **Algorithme**: AES-256-GCM (Galois/Counter Mode)
- **Dérivation**: PBKDF2 avec 100,000 itérations + SHA-512
- **Salt**: 32 bytes aléatoires par wallet
- **IV**: 16 bytes aléatoires par chiffrement
- **Stockage**: Uniquement en local, jamais envoyé à des serveurs

#### 4. Vérifications Système
Avant chaque démarrage de node :
- ✅ Espace disque suffisant
- ✅ Mémoire RAM disponible
- ✅ Charge CPU acceptable
- ✅ Docker fonctionnel

#### 5. Pureté du Code
- ❌ Aucun plan "premium" ou "enterprise"
- ❌ Aucune limite sur le nombre de nodes
- ❌ Aucune API de paiement (Stripe, etc.)
- ❌ Aucune télémétrie ou tracking
- ✅ Toutes les fonctionnalités pour tous

---

## 🔌 API REST

```http
# Nodes
GET    /api/nodes              # Liste des nodes
POST   /api/nodes              # Créer un node
GET    /api/nodes/:id          # Détails d'un node
POST   /api/nodes/:id/start    # Démarrer
POST   /api/nodes/:id/stop     # Arrêter
DELETE /api/nodes/:id          # Supprimer

# Wallets
GET    /api/wallets            # Liste des wallets
POST   /api/wallets            # Créer un wallet
POST   /api/wallets/:id/seed   # Obtenir la seed
DELETE /api/wallets/:id        # Supprimer

# Système
GET    /api/system/resources   # CPU, RAM, Disk
GET    /api/system/health      # Health check
GET    /api/blockchains        # Liste des 77 blockchains supportées (sur 227)
```

---

## 🧪 Tests & Qualité

```bash
# Exécuter les tests (83 tests, 6 suites)
npm test

# Avec coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# Lint
npm run lint
```

**Status v2.3.0** : ✅ All tests passing | ✅ 0 type errors | ✅ Prisma migrated

---

## 📝 Roadmap

Voir [ROADMAP_v2.0.md](ROADMAP_v2.0.md) pour le plan détaillé.

### Prochaines fonctionnalités :
- 🤖 Assistant IA intégré (détection anomalies, maintenance prédictive)
- 📊 Visualisation graphique des transactions et métriques
- 💸 Envoi/réception de crypto native
- 🔄 Swap & Bridge intégrés
- 📱 Applications mobiles (iOS/Android)
- 🔐 Support hardware wallets (Ledger, Trezor)
- 🔌 Type-safe IPC layer (Electron ↔ API)
- 📡 Real-time streaming des logs (WebSocket)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines complètes.

```bash
# Fork le projet
# Créez votre branche
git checkout -b feature/amazing-feature

# Commit vos changements
git commit -m 'feat: Add amazing feature'

# Push
git push origin feature/amazing-feature

# Ouvrez une Pull Request
```

---

## 💝 Soutenir le Projet

Ce projet est **100% gratuit** et le restera toujours. Si vous souhaitez soutenir son développement, vous pouvez faire un don en crypto via l'onglet **Paramètres** dans l'application.

Les dons servent à:
- ☕ Café pour les développeurs
- 🔧 Améliorer le logiciel
- 📚 Créer de la documentation

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

**100% gratuit, pour toujours.** 🎉

---

## 📞 Support & Communauté

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Rejoindre-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/AH93eHVQGU)
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/greenbynox/universal-orchestrator-node/issues)
[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/greenbynox/universal-orchestrator-node/discussions)

</div>

---

<div align="center">

**Made with ❤️ for the blockchain community**

🌐 Décentralisation pour tous 🌐

<sub>v2.3.1 - Stabilité WSL2/Docker, Sécurité & Dev UX</sub>
<sub>Janvier 2026</sub>

</div>
