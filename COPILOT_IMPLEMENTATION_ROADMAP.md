# 🤖 GitHub Copilot – Implémentation Roadmap v2.1-2.2

## 🎯 Objectif Global
Transformer Node Orchestrator v2.0 en un véritable système "set-and-forget" avec alertes intelligentes, tableau de bord unifié et support des portefeuilles matériels. Les tâches ci-dessous couvrent 3-6 mois de développement en sprints autonomes.

---

## 📋 SPRINT 1 : AI-Ops MVP – Alertes Intelligentes (Semaine 1-2)

### ✅ Tâche 1.1 : Module d'Alertes Basiques

**Fichiers à créer** :
- `src/core/AlertManager.ts`
- `src/services/alerts/AlertService.ts`
- `tests/alertManager.test.ts`

**Spécifications** :

1. **Classe AlertManager** (src/core/AlertManager.ts) :
   - Héritage de `EventEmitter`
   - Méthode `registerAlert(type: AlertType, handler: AlertHandler)` pour enregistrer des handlers d'alerte
   - Méthode `trigger(alert: Alert)` pour déclencher les alertes
   - Stockage des alertes en base Prisma (historique)
   - Types d'alertes : `NODE_DOWN`, `DISK_FULL`, `MEMORY_CRITICAL`, `SYNC_DELAYED`, `CPU_HIGH`, `CUSTOM`
   - Sévérité : `INFO`, `WARNING`, `CRITICAL`
   - Propriétés : `id`, `type`, `severity`, `nodeId`, `message`, `timestamp`, `resolved`, `metadata`

2. **Interface Alert** (src/types/index.ts) :
   ```typescript
   interface Alert {
     id: string;
     type: AlertType;
     severity: AlertSeverity;
     nodeId?: string;
     message: string;
     timestamp: Date;
     resolved: boolean;
     resolvedAt?: Date;
     metadata?: Record<string, unknown>;
   }
   
   type AlertType = 'NODE_DOWN' | 'DISK_FULL' | 'MEMORY_CRITICAL' | 'SYNC_DELAYED' | 'CPU_HIGH' | 'CUSTOM';
   type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
   ```

3. **Intégration Prisma** : Ajouter au schema.prisma :
   ```prisma
   model Alert {
     id String @id @default(cuid())
     type String
     severity String
     nodeId String?
     node Node? @relation(fields: [nodeId], references: [id])
     message String
     timestamp DateTime @default(now())
     resolved Boolean @default(false)
     resolvedAt DateTime?
     metadata Json?
     createdAt DateTime @default(now())
   
     @@index([nodeId])
     @@index([timestamp])
   }
   ```

4. **Tests** :
   - ✅ Créer une alerte et vérifier stockage en DB
   - ✅ Déclencher une alerte et vérifier le déclenchement d'événements
   - ✅ Marquer alerte comme résolue
   - ✅ Lister alertes actives vs historique

---

### ✅ Tâche 1.2 : Détecteurs d'Alertes (Health Checks)

**Fichiers à créer** :
- `src/services/alerts/HealthCheckService.ts`
- `tests/healthCheck.test.ts`

**Spécifications** :

1. **Classe HealthCheckService** :
   - Vérification toutes les 30 secondes (configurable)
   - Méthode `checkNodeDown(nodeId: string)` : teste RPC endpoint, crée alerte si pas de réponse >60s
   - Méthode `checkDiskSpace()` : lit disque libre, crée alerte si <10% disque dispo
   - Méthode `checkMemory()` : lit RAM libre, crée alerte si <5% RAM
   - Méthode `checkSyncProgress(nodeId: string)` : compare hauteur bloc actuelle vs dernière vérifiée, alerte si pas de progression >12h
   - Méthode `checkCPU()` : alerte si charge moyenne >80%
   - Intégration avec AlertManager pour déclencher les alertes

2. **Logique de déduplication** :
   - Ne pas créer d'alerte si une identique (same type + nodeId) existe déjà non-résolue
   - Résoudre automatiquement une alerte quand la condition disparaît

3. **Tests** :
   - ✅ Mock nœud down → alerte `NODE_DOWN` créée
   - ✅ Mock disque >90% → alerte `DISK_FULL` créée
   - ✅ Mock retour à normal → alerte résolue
   - ✅ Pas de doublons si condition persiste

---

### ✅ Tâche 1.3 : Webhooks & Notifications

**Fichiers à créer** :
- `src/services/notifications/WebhookService.ts`
- `src/services/notifications/DiscordNotifier.ts`
- `src/services/notifications/TelegramNotifier.ts`
- `tests/webhooks.test.ts`

**Spécifications** :

1. **Classe WebhookService** :
   - Stockage des webhooks en DB Prisma
   - Méthode `registerWebhook(url: string, events: AlertType[], options: WebhookOptions)` → crée enregistrement en DB
   - Méthode `sendWebhook(alert: Alert)` → POST JSON vers l'URL
   - Retry automatique si 5xx (max 3 tentatives, backoff exponentiel)
   - Timeout 5s, log des failures

2. **Notifieur Discord** (DiscordNotifier.ts) :
   - Parse webhook Discord URL
   - Formate alerte en embed Discord :
     ```
     Title: [CRITICAL] Node Down
     Description: bitcoin-node-1 hasn't responded for 2 hours
     Color: RED (critical) / ORANGE (warning) / BLUE (info)
     Fields: nodeId, timestamp, message
     ```
   - Envoie via WebhookService

3. **Notifieur Telegram** (TelegramNotifier.ts) :
   - Utilise bot Telegram + chat_id
   - Format simple texte avec emoji
   - Exemple : "🔴 CRITICAL: bitcoin-node-1 down since 14:30"

4. **Configuration** (via `.env`) :
   ```
   DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_CHAT_ID=...
   ```

5. **Tests** :
   - ✅ Register webhook → stocké en DB
   - ✅ Alerte créée → webhook déclenché
   - ✅ Discord format correct
   - ✅ Telegram format correct
   - ✅ Retry on 5xx
   - ✅ Timeout après 5s

---

### ✅ Tâche 1.4 : Intégration dans NodeManager

**Fichiers à modifier** :
- `src/core/NodeManager.ts`

**Spécifications** :

1. Instancier `HealthCheckService` et `AlertManager` dans le constructeur de `NodeManager`
2. Appeler `healthCheckService.checkNodeDown(nodeId)` dans `startNode()` après démarrage
3. Déclencher alerte `NODE_DOWN` si container crash
4. Déclencher alerte `SYNC_DELAYED` si pas de progression depuis 12h (dans `syncCheckInterval`)

---

## 📋 SPRINT 2 : Dashboard Cockpit (Semaine 3-4)

### ✅ Tâche 2.1 : Endpoint Dashboard Stats

**Fichiers à créer** :
- `src/routes/dashboard.ts`

**Spécifications** :

1. **Route GET /api/dashboard/stats** :
   ```typescript
   {
     "totalNodes": 5,
     "nodesRunning": 4,
     "nodesStopped": 1,
     "nodesFailing": 0,
     "totalCPU": 45,          // % usage
     "totalMemory": 62,       // % usage
     "totalDisk": 78,         // % usage
     "activeSyncingNodes": 3,
     "byBlockchain": {
       "bitcoin": { count: 2, syncing: 2 },
       "ethereum": { count: 2, syncing: 1 },
       "solana": { count: 1, syncing: 0 }
     },
     "recentAlerts": [
       { type: "DISK_FULL", severity: "CRITICAL", message: "...", timestamp: "..." }
     ],
     "diskUsage": {
       "total": 1000,
       "used": 780,
       "free": 220
     }
   }
   ```

2. Implémentation :
   - Agréger métriques de tous les nodes
   - Calculer totaux CPU/RAM/Disque
   - Récupérer alertes actives non-résolues (max 5 récentes)
   - Utiliser Prisma pour queries

---

### ✅ Tâche 2.2 : Composant Dashboard Frontend

**Fichiers à créer** :
- `frontend/src/pages/DashboardPage.tsx`

**Spécifications** :

1. **Layout** :
   - Section 1 : Cartes KPI (totalNodes, nodesRunning, CPU%, Memory%, Disk%)
   - Section 2 : Graphique en temps réel (Recharts) - historique CPU/RAM/Disque sur 1h
   - Section 3 : Tableau alertes actives avec resolved/unresolved
   - Section 4 : Breakdown par blockchain (donut chart)

2. **Interactions** :
   - Polling `/api/dashboard/stats` toutes les 5 secondes
   - Clic sur alerte → détails complets
   - Clic sur blockchain → navigate vers NodesPage filtrée

3. **Design** :
   - Responsive (mobile, tablet, desktop)
   - Dark mode compatible
   - Animations Framer Motion pour transitions

---

### ✅ Tâche 2.3 : Page Historique Alertes

**Fichiers à créer** :
- `frontend/src/pages/AlertsHistoryPage.tsx`

**Spécifications** :

1. **GET /api/alerts?limit=50&offset=0&resolved=null** :
   - Liste alertes avec pagination
   - Filter par type, severity, resolved status

2. **Composant** :
   - Tableau avec colonnes : Timestamp, Type, Severity, Node, Message, Status, ResolvedAt
   - Tri par timestamp (desc)
   - Export CSV

---

## 📋 SPRINT 3 : Resource Estimation UI (Semaine 5)

### ✅ Tâche 3.1 : Modal Estimation Ressources

**Fichiers à modifier** :
- `frontend/src/pages/NodesPage.tsx`

**Spécifications** :

1. Avant de créer un node, afficher modal avec :
   ```
   Selected: Bitcoin (Full Mode)
   
   Estimated Requirements:
   - Disk: 600 GB
   - Memory: 4 GB
   - CPU: 1 core
   - Sync Time: ~7 days
   
   Your System:
   - Free Disk: 450 GB ⚠️ (INSUFFICIENT)
   - Free Memory: 8 GB ✅
   - CPU Available: 4 cores ✅
   
   ⚠️ WARNING: Insufficient disk space for this node.
   
   [Cancel] [Proceed Anyway]
   ```

2. Logique :
   - Récupérer requirements depuis `BLOCKCHAIN_CONFIGS[blockchain][mode]`
   - Récupérer système stats via `/api/system/stats`
   - Comparer et afficher warning/error
   - Si insufficient, permettre quand même mais avec disclaimer

---

## 📋 SPRINT 4 : Auto-Pruning Intelligent (Semaine 6)

### ✅ Tâche 4.1 : Auto-Pruning Service

**Fichiers à créer** :
- `src/services/pruning/PruningService.ts`
- `tests/pruning.test.ts`

**Spécifications** :

1. **Classe PruningService** :
   - Monitor disque toutes les 5 minutes
   - Si disque >90% usage ET node supporte pruning (Bitcoin, Monero, etc.)
   - Déclencher pruning automatiquement
   - Health check post-pruning
   - Si pruning échoue, trigger alerte + rollback (restart node)
   - Log détaillé de chaque étape

2. **Logique** :
   ```
   if (diskUsagePercent > 90 && node.blockchain in PRUNABLE_BLOCKCHAINS) {
     try {
       const pruning = new PruningTask(nodeId);
       await pruning.execute();
       auditLog('AUTO_PRUNING_SUCCESS', { nodeId });
       resolveAlert('DISK_FULL', nodeId);
     } catch (error) {
       triggerAlert('PRUNING_FAILED', nodeId, error);
       await nodeManager.restartNode(nodeId);
     }
   }
   ```

3. **Tests** :
   - ✅ Disque >90% → pruning déclenché
   - ✅ Pruning succès → alerte DISK_FULL résolue
   - ✅ Pruning échoue → alerte PRUNING_FAILED + node restart

---

## 📋 SPRINT 5 : Hardware Wallets Support (Semaine 7-10)

### ✅ Tâche 5.1 : Module Ledger Integration

**Fichiers à créer** :
- `src/services/wallets/LedgerWalletService.ts`
- `tests/ledger.test.ts`

**Spécifications** :

1. **Classe LedgerWalletService** :
   - Utilise package `@ledgerhq/hw-transport-node-hid`
   - Méthode `connect()` : détecte et établit connexion Ledger
   - Méthode `getAddress(blockchain, derivationPath)` : récupère adresse sans export clé
   - Méthode `signTransaction(tx)` : signe avec Ledger (pas d'export clé)
   - Méthode `disconnect()` : ferme connexion

2. **Supported Blockchains** :
   - Bitcoin (BIP44 path m/44'/0'/0'/0/0)
   - Ethereum (BIP44 path m/44'/60'/0'/0/0)
   - Solana (BIP44 path m/44'/501'/0'/0')
   - Cosmos (BIP44 path m/44'/118'/0'/0/0)

3. **Tests** :
   - ✅ Mock Ledger device → connect successful
   - ✅ Get address → correct derivation
   - ✅ Sign transaction → correct signature

---

### ✅ Tâche 5.2 : Module Trezor Integration

**Fichiers à créer** :
- `src/services/wallets/TrezorWalletService.ts`
- `tests/trezor.test.ts`

**Spécifications** :

1. **Classe TrezorWalletService** :
   - Utilise package `@trezor/connect`
   - Même interface que LedgerWalletService pour uniformité
   - Méthode `connect()`, `getAddress()`, `signTransaction()`, `disconnect()`

2. **Tests** :
   - ✅ Même que Ledger

---

### ✅ Tâche 5.3 : UI Hardware Wallet Selection

**Fichiers à modifier** :
- `frontend/src/pages/WalletsPage.tsx`

**Spécifications** :

1. Modal "Create Wallet" :
   ```
   ○ Generate New Seed (Local)
   ○ Ledger Hardware Wallet
   ○ Trezor Hardware Wallet
   
   [Next]
   ```

2. Si Hardware Wallet selected :
   - Détection automatique du device
   - Sélection blockchain + derivation path
   - Affiche adresse depuis device
   - Sauvegarde en DB (sans clé privée, juste adresse + metadata)

---

## 📋 SPRINT 6 : Polish & Optimisations (Semaine 11-12)

### ✅ Tâche 6.1 : Performance Alerts Query

Optimiser requêtes Prisma pour alertes :
- Index sur `nodeId`, `timestamp`, `resolved`
- Cache Redis pour alertes récentes (cache 30s)

### ✅ Tâche 6.2 : Documentation

Créer `docs/ALERTS.md` :
- Tous les types d'alertes
- Configuration webhooks
- Exemples Discord/Telegram
- Escalade automatique

Créer `docs/HARDWARE_WALLETS.md` :
- Setup Ledger/Trezor
- Dérivation paths
- Sécurité (clés jamais exportées)

---

## 🛠️ **Configuration & Environment**

Ajouter au `.env.example` :
```
# Alerts
ALERT_CHECK_INTERVAL_MS=30000
DISK_USAGE_THRESHOLD=90
MEMORY_USAGE_THRESHOLD=95
SYNC_DELAY_THRESHOLD_HOURS=12

# Notifications
DISCORD_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Hardware Wallets
LEDGER_ENABLED=true
TREZOR_ENABLED=true
```

---

## 🧪 **Testing Checklist (Global)**

- [ ] Tous les nouveaux services ont 80%+ coverage
- [ ] Alertes ne dupliquent pas
- [ ] Webhooks retry correctement
- [ ] Dashboard stats corrects
- [ ] Hardware wallets sign correctement
- [ ] Auto-pruning safe (rollback on failure)
- [ ] Pas de PII dans logs
- [ ] Tests de charge (100+ alertes/min)

---

## 📊 **Metrics de Succès**

- ✅ v2.1 : Alertes + Webhooks (fin janvier 2025)
- ✅ v2.2 : Dashboard + Hardware Wallets (fin mars 2025)
- ✅ 100+ tests ajoutés
- ✅ Zero regressions

---

## 📝 **Notes pour GitHub Copilot**

1. **Cohérence** : Suivre les patterns existants (EventEmitter, async/await, error handling)
2. **Sécurité** : Log scrubbing pour alertes aussi (pas d'IP privées)
3. **Types** : Types TypeScript strict, pas de `any`
4. **DB** : Toujours utiliser Prisma, jamais SQL raw
5. **Tests** : Jest avec mocks, sinon utiliser `__mocks__` pour Prisma
6. **Frontend** : React hooks, Zustand pour state, Framer Motion pour animations

---

## 🚀 **Comment Utiliser Ce Document**

1. Copier chaque section "Tâche X.Y" dans GitHub Copilot (ou IDE Copilot)
2. Copilot implémentera le code complet
3. Review + merge en PR
4. Continuer tâche suivante

**Temps estimé total** : 12-16 semaines en mode autonome.
