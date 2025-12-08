# Installation de Node Orchestrator

## 📦 Nouvelle Installation avec Détection Smart des Outils C++

### Vue d'ensemble

L'installer NSIS a été amélioré pour :
- ✅ **Détecter automatiquement** si VS Build Tools est déjà installé
- ✅ **Proposer l'option** uniquement si nécessaire
- ✅ **Télécharger la dernière version** de VS Build Tools
- ✅ Installation rapide (~2-3 minutes pour 100 MB)

### 🎯 Étapes d'installation

1. **Télécharger l'installer**
   - Téléchargez `Node-Orchestrator-2.2.0-Setup.exe` depuis la page de release

2. **Lancer l'installation**
   - Double-cliquez sur le fichier .exe
   - Suivez l'assistant d'installation standard (chemin, raccourcis, etc.)

3. **Écran "Dépendances Hardware Wallet"**
   
   **Cas A : VS Build Tools n'est pas installé**
   - Vous verrez une checkbox : "Installer Visual Studio Build Tools (Recommandé)"
   - ☑️ Coché par défaut
   - ☐ Décoché (si vous préférez installer manuellement plus tard)
   
   **Cas B : VS Build Tools est déjà détecté**
   - L'écran affichera ✅ "Visual Studio Build Tools détecté"
   - Aucune action n'est requise
   - Vous pouvez continuer directement

### ✅ Si vous cochez la checkbox (Recommandé)

- Visual Studio Build Tools (dernière version) sera **téléchargé et installé automatiquement**
- Téléchargement : **~5-10 MB** (très rapide)
- Installation : environ **5-10 minutes**
- Espace disque requis : **~300-400 MB** (C++ minimal pour node-gyp)
- À la fin, vous pourrez utiliser :
  - ✅ Ledger Hardware Wallet
  - ✅ Trezor Hardware Wallet
  - ✅ Toutes les autres fonctionnalités

### ❌ Si vous décochez la checkbox

- L'application s'installe rapidement (< 1 minute)
- ✅ Vous pouvez utiliser **tous les features sauf** :
  - ❌ Ledger Hardware Wallet
  - ❌ Trezor Hardware Wallet
- 🔧 Vous pourrez installer les outils C++ plus tard manuellement si besoin

### 🔧 Installation Manuelle des Outils C++ (Optionnel)

Si vous n'aviez pas coché la checkbox lors de l'installation, vous pouvez l'installer plus tard :

1. Téléchargez Visual Studio Build Tools
   ```
   https://visualstudio.microsoft.com/downloads/
   ```

2. Sélectionnez **"Desktop development with C++"** lors de l'installation

3. Après l'installation, lancez la commande dans le répertoire du projet :
   ```bash
   npm install
   ```

### 📋 Prérequis

- **Windows 10/11** (64-bit)
- **Connexion Internet** (pour le téléchargement des outils C++ si option cochée - ~5 MB)
- **~300-400 MB d'espace disque** (juste le C++ minimal pour node-gyp)

### 🆘 Dépannage

#### L'installation des outils C++ a échoué
- Vérifiez votre connexion internet
- Essayez de télécharger manuellement depuis https://visualstudio.microsoft.com/downloads/
- Installez **"Desktop development with C++"**

#### J'ai oublié d'installer les outils C++
- Vous pouvez relancer l'installer et cocher la checkbox cette fois
- Ou installer manuellement VS Build Tools

#### L'application ne veut pas se lancer
- Vérifiez que Node.js 18+ est installé
- Redémarrez votre ordinateur après l'installation

---

**Version**: 2.2.0  
**Dernière mise à jour**: Décembre 2024
