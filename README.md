# 🚀 Node Orchestrator

<div align="center">

**Orchestrateur de Nodes Multi-Blockchains - 100% Gratuit & Open Source**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F.svg)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Free](https://img.shields.io/badge/Price-100%25%20FREE-brightgreen.svg)]()
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA.svg)](https://discord.gg/AH93eHVQGU)

<br>

🎉 **100% GRATUIT** - Aucune limite, aucune version payante. Ce projet est fait par et pour la communauté blockchain.

[📥 Télécharger](#-téléchargement) • [📖 Documentation](#-utilisation) • [💬 Discord](https://discord.gg/AH93eHVQGU) • [🐛 Issues](https://github.com/greenbynox/universal-orchestrator-node/issues)

</div>

---

## 🌟 Pourquoi Node Orchestrator ?

Nous croyons que tout le monde devrait pouvoir participer à la décentralisation des blockchains. C'est pourquoi Node Orchestrator est **entièrement gratuit**, sans limites cachées.

| ✅ Vraiment gratuit | ✅ Open Source | ✅ 205 blockchains | ✅ Sécurisé |
|:---:|:---:|:---:|:---:|
| Pas de freemium | Code transparent | Support le + large | AES-256-GCM |

---

## ✨ Fonctionnalités v1.0.3

### 🔗 205+ Blockchains Supportées

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
| 🔐 **Sécurité** | Chiffrement des seeds, rate limiting, input sanitization |
| 📊 **Monitoring** | CPU, RAM, Disque en temps réel |
| 🖥️ **Desktop App** | Application Windows native (Electron) |
| ₿ **Types Bitcoin** | Legacy, SegWit, Native SegWit (bc1q), Taproot (bc1p) |

---

## 📥 Téléchargement

### Windows (Recommandé)

> **[📥 Télécharger Node Orchestrator v1.0.3 (Windows)](https://github.com/greenbynox/universal-orchestrator-node/releases)**

- `Node Orchestrator-1.0.3-Setup.exe` - Installateur Windows
- `Node Orchestrator-1.0.3-Portable.exe` - Version portable (aucune installation)

### Depuis les sources

```bash
# Cloner le repo
git clone https://github.com/greenbynox/universal-orchestrator-node.git
cd universal-orchestrator-node

# Installer les dépendances
npm install

# Installer les dépendances frontend
cd frontend && npm install && cd ..

# Lancer en mode développement
npm run dev
```

---

## ⚡ Quick Start

1. **Installer Docker** : [Docker Desktop](https://docs.docker.com/get-docker/) puis démarrez-le.
2. **Installer les dépendances** :
  ```bash
  npm install
  cd frontend && npm install && cd ..
  ```
3. **Lancer en dev complet (Electron + API + React)** :
  ```bash
  npm run start:dev
  ```

---

## 📋 Prérequis

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **OS** | Windows 10 | Windows 11 |
| **RAM** | 4 GB | 8+ GB |
| **CPU** | 2 cores | 4+ cores |
| **Disque** | 10 GB | Variable selon nodes |
| **Node.js** | 18+ | 20+ (pour dev) |

### Espace Disque par Blockchain (pour nodes complets)

| Blockchain | Full Node | Pruned | Light |
|------------|-----------|--------|-------|
| Bitcoin | 500 GB+ | 10-50 GB | < 1 GB |
| Ethereum | 1 TB+ | 200-500 GB | < 1 GB |
| Solana | 500 GB+ | - | - |
| Monero | 150 GB+ | 30 GB | - |

---

## 📖 Utilisation

### 1. Créer un Node

1. Ouvrez l'application
2. Cliquez sur **"Nouveau Node"**
3. Sélectionnez la blockchain parmi 205 options
4. Choisissez le mode (Full, Pruned, Light)
5. Cliquez sur **"Créer"**

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

⚠️ **IMPORTANT**: Le mot de passe chiffre votre seed localement. Si vous l'oubliez, vous ne pourrez plus accéder à votre seed !

### 3. Voir sa Seed Phrase

1. Cliquez sur **"Voir Seed"** sur votre wallet
2. Entrez votre mot de passe
3. Votre seed phrase s'affiche
4. Copiez-la et gardez-la en sécurité

---

## 🏗️ Architecture

```
universal-orchestrator-node/
├── electron/               # Application Electron
│   ├── main.js            # Process principal
│   └── start-server.js    # Serveur Express embarqué
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Composants UI
│   │   ├── pages/         # Pages (Dashboard, Nodes, Wallets, Settings)
│   │   ├── services/      # API clients
│   │   ├── config/        # 205 blockchains config
│   │   └── store/         # État Zustand
├── src/                    # Backend TypeScript (dev)
│   ├── api/               # Routes REST
│   ├── core/              # Managers
│   └── config/            # Configuration
├── tests/                  # Tests unitaires
└── scripts/               # Scripts utilitaires
```

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Desktop | Electron 39 |
| Backend | Node.js, Express |
| Frontend | React 18, Vite, Tailwind CSS |
| État | Zustand |
| Crypto | bip39, AES-256-GCM, PBKDF2 |
| Build | electron-builder |

---

## 🔐 Sécurité

### ✅ Garantie 100% Gratuit

> **Ce code source a été audité et nettoyé de toute logique commerciale.**
> 
> - ❌ Aucun plan "premium" ou "enterprise"
> - ❌ Aucune limite sur le nombre de nodes
> - ❌ Aucune API de paiement (Stripe, etc.)
> - ❌ Aucune télémétrie ou tracking
> - ✅ Toutes les fonctionnalités sont disponibles pour tous
> 
> Le code est open source et peut être audité par n'importe qui.

### 🐳 Sécurité Docker

Node Orchestrator utilise le socket Docker pour gérer les containers de nodes blockchain. Pour garantir la sécurité :

- **Whitelist d'images stricte** : Seules les images Docker officielles des blockchains sont autorisées. Voir `src/core/security.ts` pour la liste complète (50+ images vérifiées).
- **Validation avant exécution** : Chaque image est validée contre la whitelist avant d'être lancée.
- **Containers sandboxés** : Chaque node tourne dans son propre container isolé avec :
  - `CapDrop: ['ALL']` - Suppression de toutes les capabilities Linux
  - `SecurityOpt: ['no-new-privileges']` - Empêche l'escalade de privilèges
  - Limites mémoire et CPU configurées

### 🛡️ Protection des Entrées

- **Sanitization** : Tous les noms de nodes et paramètres sont nettoyés pour prévenir les injections
- **Validation stricte** : Types de blockchain, modes, ports sont validés
- **Path traversal protection** : Les chemins de fichiers sont sécurisés contre les attaques `../`

### 🔒 Chiffrement des Seeds
- **Algorithme**: AES-256-GCM (Galois/Counter Mode)
- **Dérivation de clé**: PBKDF2 avec 100,000 itérations + SHA-512
- **Salt**: 32 bytes aléatoires par wallet
- **IV**: 16 bytes aléatoires par chiffrement

### 🛡️ Protection API
- Rate limiting (100 req/min sur endpoints sensibles)
- Input sanitization (XSS/injection protection)
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Validation des mots de passe (8-256 caractères)

### 📦 Stockage Local
- Seeds chiffrées jamais stockées en clair
- Données dans `%APPDATA%/node-orchestrator/data/`
- Aucune donnée envoyée à des serveurs externes

### 📋 Vérifications Système (Anti-Crash)

Avant de lancer un node, le système vérifie automatiquement :
- **Espace disque** : Suffisant pour la blockchain + 20GB de marge
- **Mémoire RAM** : Compatible avec les besoins du node
- **Charge CPU** : Pas de surcharge qui bloquerait le démarrage
- **Docker** : Disponible et fonctionnel

Si les ressources sont insuffisantes, un message d'erreur explicite est affiché.

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
POST   /api/wallets            # Créer un wallet (+ password)
POST   /api/wallets/:id/seed   # Obtenir la seed (+ password)
DELETE /api/wallets/:id        # Supprimer

# Système
GET    /api/system/resources   # CPU, RAM, Disk
GET    /api/system/health      # Health check
GET    /api/blockchains        # Liste 205 blockchains
```

---

## 📝 Roadmap v2.0

Voir [ROADMAP_v2.0.md](ROADMAP_v2.0.md) pour le plan détaillé.

### Prochaines fonctionnalités prévues:
- 🤖 Assistant IA intégré
- 📊 Visualisation graphique des transactions
- 💸 Envoi/réception de crypto
- 🔄 Swap & Bridge intégrés
- 📱 Applications mobiles
- 🔐 Support hardware wallets (Ledger, Trezor)

---

## 💝 Soutenir le Projet

Ce projet est **100% gratuit** et le restera toujours. Si vous souhaitez soutenir son développement, vous pouvez faire un don en crypto via l'onglet **Paramètres** dans l'application.

Les dons servent à:
- ☕ Café pour les développeurs
- 🔧 Améliorer le logiciel
- 📚 Créer de la documentation

---

## 🤝 Contribution

Les contributions sont les bienvenues !

```bash
# Fork le projet
# Créez votre branche
git checkout -b feature/amazing-feature

# Commit vos changements
git commit -m 'Add amazing feature'

# Push
git push origin feature/amazing-feature

# Ouvrez une Pull Request
```

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

**100% gratuit, pour toujours.** 🎉

---

## 📞 Support & Communauté

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Rejoindre-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/AH93eHVQGU)
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/greenbynox/universal-orchestrator-node/issues)

</div>

---

<div align="center">

**Made with ❤️ for the blockchain community**

🌐 Décentralisation pour tous 🌐

<sub>v1.0.3 - Décembre 2025</sub>

</div>
