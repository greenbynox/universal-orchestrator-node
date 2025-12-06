# 🤝 Guide de Contribution – Node Orchestrator v2.0

Merci de votre intérêt pour contribuer à Node Orchestrator ! Ce guide explique comment contribuer efficacement.

---

## 📋 Table des Matières

1. [Code of Conduct](#-code-of-conduct)
2. [Comment Contribuer](#-comment-contribuer)
3. [Setup Développement](#-setup-développement)
4. [Workflow Git](#-workflow-git)
5. [Standards de Code](#-standards-de-code)
6. [Architecture v2.0](#-architecture-v20)
7. [Testing](#-testing)
8. [Pull Requests](#-pull-requests)
9. [Ressources](#-ressources)

---

## 📌 Code of Conduct

Nous nous engageons à maintenir un environnement accueillant et respectueux pour tous les contributeurs.

**Attendus:**
- ✅ Soyez respectueux et inclusif
- ✅ Acceptez les critiques constructives
- ✅ Focalisez sur ce qui est meilleur pour la communauté
- ✅ Reportez les violations via les issues privées

**Non toléré:**
- ❌ Harcèlement, discrimination, abus
- ❌ Trolling ou spam
- ❌ Attaques personnelles

---

## 🎯 Comment Contribuer

### Types de Contributions Bienvenues

#### 1. **Nouvelles Blockchains** (Facile ⭐)
Ajouter support pour une blockchain non supportée.
- **Fichier à créer**: `src/templates/blockchain_name.yaml`
- **Exemple**: `src/templates/bitcoin_full.yaml`
- **Effort**: 10 min (si image Docker existe)
- **Test**: Vérifier que le node démarre

#### 2. **Améliorations de Sécurité** (Important 🛡️)
- Améliorer la whitelist Docker
- Ajouter validations d'input
- Corriger vulnérabilités
- Augmenter le sandboxing

#### 3. **Optimisations de Performance** (Moyen ⚡)
- Réduire mémoire/CPU
- Optimiser les queries Prisma
- Améliorer les temps de démarrage

#### 4. **Documentation** (Important 📚)
- Améliorer README, guides, comments
- Ajouter exemples
- Corriger typos/erreurs

#### 5. **Tests & Qualité** (Important ✅)
- Augmenter couverture (actuellement 83 tests)
- Ajouter edge cases
- Améliorer CI/CD

#### 6. **Features AI-Ops** (Avancé 🤖)
- Détection anomalies
- Maintenance prédictive
- Alertes intelligentes

---

## 🚀 Setup Développement

### Prérequis

```bash
# Node.js 20+
node --version

# npm 10+
npm --version

# Docker Desktop (pour les nodes)
docker --version

# Git
git --version
```

### Installation Locale

```bash
# 1. Fork le repo sur GitHub
# https://github.com/greenbynox/universal-orchestrator-node

# 2. Clone ton fork
git clone https://github.com/TON_USERNAME/universal-orchestrator-node.git
cd universal-orchestrator-node

# 3. Ajoute l'upstream remote
git remote add upstream https://github.com/greenbynox/universal-orchestrator-node.git

# 4. Installe les dépendances
npm install

# 5. Setup frontend
cd frontend && npm install && cd ..

# 6. Génère Prisma client
npm run prisma:generate

# 7. Migre la BD
npm run prisma:migrate

# 8. Démarre en dev
npm run start:dev
```

### Vérifier l'Installation

```bash
# Tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```

Si tout passe ✅, tu es prêt!

---

## 🔧 Workflow Git

### Créer une Branche Feature

```bash
# Assure-toi d'être à jour
git fetch upstream
git checkout main
git pull upstream main

# Crée ta branche feature (depuis main)
git checkout -b feature/my-amazing-feature

# Ou bugfix
git checkout -b bugfix/fix-docker-whitelist

# Ou doc
git checkout -b docs/add-ai-ops-guide
```

### Format des Noms de Branches

- `feature/description` - Nouvelle fonctionnalité
- `bugfix/description` - Correction de bug
- `docs/description` - Documentation
- `refactor/description` - Refactoring
- `test/description` - Tests

### Commits

```bash
# Commit avec message clair
git commit -m "feat: Add new blockchain support for Solana"
git commit -m "fix: Prevent Docker socket injection attack"
git commit -m "docs: Update CONTRIBUTING.md"

# Format: <type>: <description>
# Types: feat, fix, docs, refactor, test, perf, chore
```

### Push & Pull Request

```bash
# Push ta branche
git push origin feature/my-amazing-feature

# Sur GitHub: crée une PR vers main
# - Titre clair
# - Description détaillée
# - Référence aux issues (#123)
# - Checklist de test
```

---

## 📐 Standards de Code

### TypeScript

```typescript
// ✅ BON
export interface BlockchainConfig {
  name: string;
  symbol: string;
  image: string;
}

const createNode = async (config: BlockchainConfig): Promise<Node> => {
  // ...
};

// ❌ MAUVAIS
let x = {};
function create(c) { }
```

**Rules:**
- `strict: true` dans tsconfig.json
- Toujours typer les fonctions et paramètres
- Éviter `any` (utilise `unknown` si nécessaire)

### Naming Conventions

```typescript
// Classes
class NodeManager { }
class DockerManager { }

// Interfaces
interface INodeConfig { }
interface IBlockchainTemplate { }

// Constantes
const DEFAULT_PORT = 8080;
const WHITELIST_IMAGES = ['bitcoin:latest'];

// Fonctions
const sanitizeInput = (input: string) => { };
const validateNodeId = (id: string): boolean => { };

// Fichiers
// - Componants React: PascalCase (Dashboard.tsx)
// - Utilitaires: camelCase (nodeManager.ts)
// - Types: camelCase.types.ts (node.types.ts)
// - Tests: .test.ts (node.test.ts)
```

### ESLint & Prettier

```bash
# Check
npm run lint

# Fix automatiquement
npm run lint -- --fix

# Format Prettier
npx prettier --write .
```

### Sécurité

**Obligatoire pour tout code:**

```typescript
// ✅ Tous les inputs utilisateur DOIVENT être sanitisés
import { sanitizeInput } from '@core/security';

const createNode = (name: string) => {
  const safeName = sanitizeInput(name);
  // ...
};

// ✅ Validation stricte des images Docker
import { validateImageWhitelist } from '@core/security';

if (!validateImageWhitelist(imageName)) {
  throw new Error('Image not whitelisted');
}

// ✅ Logs sensibles (JAMAIS les mots de passe!)
logger.info('Node started', { nodeId, image, ports });
// logger.info('Node started', { nodeId, image, ports, password }); ❌ JAMAIS
```

---

## 🏗️ Architecture v2.0

### Structure Modulaire par Templates YAML

```yaml
# src/templates/bitcoin_full.yaml
version: '3.8'
name: bitcoin_full
blockchain: bitcoin
mode: full

docker:
  image: kylemanna/bitcoind:latest
  container_name: "{nodeId}"
  ports:
    - "{p2pPort}:8333"
    - "{rpcPort}:8332"
  volumes:
    - "{dataPath}:/bitcoin"
  environment:
    - BITCOIN_NETWORK=mainnet
  cap_drop:
    - ALL
  security_opt:
    - no-new-privileges
  
  healthcheck:
    test: ["CMD", "bitcoin-cli", "-rpcconnect=127.0.0.1", "getblockcount"]
    interval: 30s
    timeout: 10s
    retries: 3

resources:
  min_cpu: 1
  min_memory: 4096  # MB
  min_disk: 500000  # MB (500 GB)

ai_patterns:
  - name: "block_sync_lag"
    query: "SELECT blockHeight FROM metrics WHERE nodeId = ? ORDER BY timestamp DESC LIMIT 1"
  - name: "peer_count"
    query: "SELECT peerCount FROM metrics WHERE nodeId = ? ORDER BY timestamp DESC LIMIT 1"
```

**Comment ajouter une blockchain:**

1. Crée `src/templates/blockchain_name.yaml`
2. Copie la structure Bitcoin
3. Remplace l'image Docker, les ports, les volumes
4. Ajoute le healthcheck spécifique
5. Teste localement
6. Soumet une PR

### Sécurité – Whitelist d'Images

```typescript
// src/core/security.ts
export const IMAGE_WHITELIST = [
  // Patterns exacts
  'bitcoin:latest',
  'ethereum:latest',
  'solana-validator:latest',
  
  // Patterns avec wildcards
  'ghcr.io/universal-orchestrator/*',
  'kylemanna/*',
  
  // Registries approuvées
  /^(docker\.io|gcr\.io|quay\.io)\/.*/,
];

export const validateImageWhitelist = (image: string): boolean => {
  return IMAGE_WHITELIST.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(image);
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(image);
    }
    return image === pattern;
  });
};
```

### Prisma ORM

```typescript
// prisma/schema.prisma
model Node {
  id       String   @id @default(cuid())
  name     String
  config   Json
  state    NodeState @default(PENDING)
  createdAt DateTime @default(now())
  
  metrics   MetricPoint[]
  logs      LogEntry[]
}

model MetricPoint {
  id       String   @id @default(cuid())
  nodeId   String   @db.ForeignKey(references: [id])
  cpu      Float
  memory   Int
  disk     Int
  timestamp DateTime @default(now())
  
  node   Node @relation(fields: [nodeId], references: [id])
}

model LogEntry {
  id       String   @id @default(cuid())
  nodeId   String   @db.ForeignKey(references: [id])
  level    LogLevel
  message  String
  timestamp DateTime @default(now())
  
  node   Node @relation(fields: [nodeId], references: [id])
}
```

---

## 🧪 Testing

### Écrire des Tests

```typescript
// tests/nodeManager.test.ts
import { NodeManager } from '@core/managers/nodeManager';

describe('NodeManager', () => {
  describe('createNode', () => {
    it('should create a node with valid config', async () => {
      const config = { blockchain: 'bitcoin', mode: 'full' };
      const node = await nodeManager.createNode(config);
      
      expect(node.id).toBeDefined();
      expect(node.blockchain).toBe('bitcoin');
    });

    it('should throw on invalid blockchain', async () => {
      const config = { blockchain: 'invalid', mode: 'full' };
      
      await expect(nodeManager.createNode(config))
        .rejects
        .toThrow('Unknown blockchain');
    });
  });
});
```

### Couverture de Tests

```bash
# Générer coverage report
npm run test:coverage

# Vérifier coverage
# Goal: > 80% pour nouvelles features
```

### Types de Tests

```typescript
// Unit tests (rapides, isolés)
test('sanitizeInput removes tags', () => {
  const result = sanitizeInput('<script>alert(1)</script>');
  expect(result).not.toContain('<script>');
});

// Integration tests (tests fonctionnalités complètes)
test('can create and start a Bitcoin node', async () => {
  const node = await nodeManager.createNode({ blockchain: 'bitcoin' });
  await nodeManager.startNode(node.id);
  expect(node.state).toBe('RUNNING');
});

// Security tests (injection, XSS, etc.)
test('prevents Docker command injection', () => {
  const dangerous = '--image=\"$(rm -rf /)\"';
  expect(() => validateNodeConfig({ image: dangerous }))
    .toThrow('Invalid image');
});
```

---

## 🔀 Pull Requests

### Avant de Soumettre

```bash
# 1. Fetch latest from upstream
git fetch upstream
git rebase upstream/main

# 2. Exécute tous les tests
npm test

# 3. Lint
npm run lint

# 4. Type check
npm run typecheck

# 5. Build
npm run build

# 6. Test manuel
npm run start:dev
# ... teste la feature
```

### Template PR

```markdown
## Description
Courte description de la change

## Type de Change
- [ ] Feature
- [ ] Bugfix
- [ ] Documentation
- [ ] Security
- [ ] Refactor

## Motivation et Contexte
Pourquoi ce changement? Quel problème résout-il?

## Screenshots (si UI change)
[Images ici]

## Checklist
- [ ] Tests ajoutés/updatés
- [ ] Tests passent (`npm test`)
- [ ] Lint OK (`npm run lint`)
- [ ] Types OK (`npm run typecheck`)
- [ ] Documentation updatée
- [ ] Pas de changements breaking

## Issues
Closes #123

## Notes Additionnelles
Tout ce qui aide à reviewer la PR
```

### Processus de Review

1. **Checklist automatique** (linting, tests, build)
2. **Review de sécurité** (si touching security.ts, Docker, crypto)
3. **Review de code** (architecture, standards, performance)
4. **Tests manuels** (si UI/feature change)
5. **Merge** (par mainteneurs après approval)

---

## 📚 Ressources

### Documentation Interne

- [ROADMAP_v2.0.md](ROADMAP_v2.0.md) - Plan détaillé v2.0
- [README.md](README.md) - Overview & features
- [package.json](package.json) - Scripts disponibles

### Technologies

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Electron**: https://www.electronjs.org/docs
- **React**: https://react.dev/
- **Prisma**: https://www.prisma.io/docs/
- **Docker**: https://docs.docker.com/
- **Jest**: https://jestjs.io/docs/getting-started

### Blockchains

- **Bitcoin**: https://developer.bitcoin.org/reference/
- **Ethereum**: https://ethereum.org/en/developers/docs/
- **BIP39**: https://github.com/trezor/python-mnemonic
- **BIP32/BIP44/BIP84**: https://github.com/bitcoinjs/bip32

### Sécurité

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Docker Security**: https://docs.docker.com/engine/security/
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/

---

## 💬 Questions?

### Discord Community
[![Discord](https://img.shields.io/badge/Discord-Join-7289DA?style=flat)](https://discord.gg/AH93eHVQGU)

### GitHub Discussions
https://github.com/greenbynox/universal-orchestrator-node/discussions

### Issues & Bugs
https://github.com/greenbynox/universal-orchestrator-node/issues

---

## 📝 Bonus: Checklist pour Nouvelle Blockchain

Tu veux ajouter une blockchain? Voici la checklist complète:

- [ ] Blockchain a une image Docker officielle
- [ ] Crée `src/templates/blockchain_name.yaml`
- [ ] Ajoute image Docker à whitelist (`src/core/security.ts`)
- [ ] Test local: `npm run start:dev`
- [ ] Crée le node dans l'UI
- [ ] Vérifie que le container démarre
- [ ] Ajoute healthcheck pour vérifier que le node sync
- [ ] Écris un test (`tests/blockchain_name.test.ts`)
- [ ] Documente dans `ROADMAP_v2.0.md` (sous "blockchains")
- [ ] Soumet PR avec title: `feat: Add [Blockchain] support`

**Temps estimé**: 30-45 min pour un contributeur expérimenté!

---

<div align="center">

**Merci de contribuer à Node Orchestrator! 🎉**

Made with ❤️ for the blockchain community

</div>
