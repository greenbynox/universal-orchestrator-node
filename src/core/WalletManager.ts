/**
 * ============================================================
 * NODE ORCHESTRATOR - Wallet Manager
 * ============================================================
 * Gestion des wallets HD (BIP39/BIP44) pour chaque blockchain
 */

import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  WalletConfig,
  WalletSecureData,
  WalletInfo,
  BlockchainType,
  CreateWalletRequest,
} from '../types';
import { config, BLOCKCHAIN_CONFIGS } from '../config';
import { logger } from '../utils/logger';
import { encrypt, decrypt, generateSecureId } from '../utils/crypto';

// Initialize bip32
const bip32 = BIP32Factory(ecc);

// ============================================================
// WALLET DATA INTERFACE
// ============================================================

interface StoredWallet {
  config: WalletConfig;
  secureData: WalletSecureData;
}

// ============================================================
// WALLET MANAGER CLASS
// ============================================================

export class WalletManager extends EventEmitter {
  private wallets: Map<string, StoredWallet> = new Map();
  private walletsFile: string;

  constructor() {
    super();
    this.walletsFile = path.join(config.paths.wallets, 'wallets.enc');
    this.ensureDirectories();
    this.loadWallets();
    logger.info('WalletManager initialisé');
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  private ensureDirectories(): void {
    if (!fs.existsSync(config.paths.wallets)) {
      fs.mkdirSync(config.paths.wallets, { recursive: true, mode: 0o700 });
    }
  }

  private loadWallets(): void {
    if (fs.existsSync(this.walletsFile)) {
      try {
        const encryptedData = fs.readFileSync(this.walletsFile, 'utf-8');
        const decryptedData = decrypt(encryptedData);
        const walletsList: StoredWallet[] = JSON.parse(decryptedData);
        
        walletsList.forEach(wallet => {
          this.wallets.set(wallet.config.id, wallet);
        });
        
        logger.info(`${this.wallets.size} wallet(s) chargé(s)`);
      } catch (error) {
        logger.error('Erreur lors du chargement des wallets', { error });
      }
    }
  }

  private saveWallets(): void {
    try {
      const walletsList = Array.from(this.wallets.values());
      const jsonData = JSON.stringify(walletsList);
      const encryptedData = encrypt(jsonData);
      fs.writeFileSync(this.walletsFile, encryptedData, { mode: 0o600 });
      logger.debug('Wallets sauvegardés');
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des wallets', { error });
      throw error;
    }
  }

  // ============================================================
  // CRÉATION DE WALLETS
  // ============================================================

  /**
   * Créer un nouveau wallet HD
   */
  async createWallet(request: CreateWalletRequest): Promise<WalletInfo> {
    const { name, blockchain, importSeed } = request;
    
    // Générer ou utiliser la seed fournie
    let mnemonic: string;
    if (importSeed) {
      if (!bip39.validateMnemonic(importSeed)) {
        throw new Error('Seed phrase invalide');
      }
      mnemonic = importSeed;
    } else {
      mnemonic = bip39.generateMnemonic(256); // 24 mots
    }

    // Dériver les clés selon la blockchain
    const derivationPath = BLOCKCHAIN_CONFIGS[blockchain].derivationPath;
    const { address, publicKey, privateKey } = await this.deriveKeys(
      mnemonic,
      blockchain,
      derivationPath
    );

    // Créer la configuration
    const walletId = `wallet-${blockchain}-${generateSecureId().slice(0, 8)}`;
    const walletConfig: WalletConfig = {
      id: walletId,
      name: name || `${BLOCKCHAIN_CONFIGS[blockchain].displayName} Wallet`,
      blockchain,
      type: importSeed ? 'imported' : 'hd',
      derivationPath,
      createdAt: new Date(),
    };

    // Données sécurisées (chiffrées)
    const secureData: WalletSecureData = {
      encryptedSeed: encrypt(mnemonic),
      encryptedPrivateKey: encrypt(privateKey),
      publicKey,
      address,
    };

    // Sauvegarder
    const storedWallet: StoredWallet = { config: walletConfig, secureData };
    this.wallets.set(walletId, storedWallet);
    this.saveWallets();

    logger.info(`Wallet créé: ${walletId}`, { blockchain });
    this.emit('wallet:created', walletConfig);

    return {
      id: walletId,
      name: walletConfig.name,
      blockchain,
      address,
      createdAt: walletConfig.createdAt,
    };
  }

  /**
   * Dériver les clés depuis une seed
   */
  private async deriveKeys(
    mnemonic: string,
    blockchain: BlockchainType,
    derivationPath: string
  ): Promise<{ address: string; publicKey: string; privateKey: string }> {
    switch (blockchain) {
      case 'ethereum':
      case 'bnb':
        return this.deriveEVMKeys(mnemonic, derivationPath);

      case 'bitcoin':
        return this.deriveBitcoinKeys(mnemonic, derivationPath);

      case 'solana':
        return this.deriveSolanaKeys(mnemonic, derivationPath);

      case 'monero':
        return this.deriveMoneroKeys(mnemonic);

      default:
        throw new Error(`Blockchain non supportée: ${blockchain}`);
    }
  }

  /**
   * Dériver les clés pour les blockchains EVM (ETH, BNB)
   */
  private deriveEVMKeys(
    mnemonic: string,
    derivationPath: string
  ): { address: string; publicKey: string; privateKey: string } {
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
    
    return {
      address: hdNode.address,
      publicKey: hdNode.publicKey,
      privateKey: hdNode.privateKey,
    };
  }

  /**
   * Dériver les clés Bitcoin
   */
  private deriveBitcoinKeys(
    mnemonic: string,
    derivationPath: string
  ): { address: string; publicKey: string; privateKey: string } {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const network = bitcoin.networks.bitcoin;
    
    // Créer le noeud HD avec bip32
    const root = bip32.fromSeed(seed, network);
    const child = root.derivePath(derivationPath.replace("m/", ""));
    
    // Générer l'adresse P2WPKH (SegWit natif)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network,
    });

    return {
      address: address!,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      privateKey: child.toWIF(),
    };
  }

  /**
   * Dériver les clés Solana
   * Note: Simplifié pour le MVP - en production, utiliser @solana/web3.js
   */
  private deriveSolanaKeys(
    mnemonic: string,
    _derivationPath: string
  ): { address: string; publicKey: string; privateKey: string } {
    // Pour le MVP, on utilise une dérivation simplifiée
    // En production, utiliser ed25519 avec le bon path Solana
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keyPair = seed.slice(0, 32);
    
    // Placeholder - en production, utiliser la vraie dérivation Solana
    const publicKeyHex = keyPair.toString('hex');
    
    return {
      address: `SOL${publicKeyHex.slice(0, 40)}`, // Placeholder
      publicKey: publicKeyHex,
      privateKey: seed.slice(0, 64).toString('hex'),
    };
  }

  /**
   * Dériver les clés Monero
   * Note: Simplifié pour le MVP - Monero utilise un format différent
   */
  private deriveMoneroKeys(
    mnemonic: string
  ): { address: string; publicKey: string; privateKey: string } {
    // Monero utilise un format de seed différent (25 mots)
    // Pour le MVP, on génère des clés placeholder
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keyHex = seed.slice(0, 32).toString('hex');
    
    return {
      address: `4${keyHex.slice(0, 94)}`, // Format Monero placeholder
      publicKey: keyHex,
      privateKey: seed.slice(0, 64).toString('hex'),
    };
  }

  // ============================================================
  // GESTION DES WALLETS
  // ============================================================

  /**
   * Obtenir tous les wallets (infos publiques uniquement)
   */
  getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values()).map(wallet => ({
      id: wallet.config.id,
      name: wallet.config.name,
      blockchain: wallet.config.blockchain,
      address: wallet.secureData.address,
      createdAt: wallet.config.createdAt,
    }));
  }

  /**
   * Obtenir un wallet par ID
   */
  getWallet(walletId: string): WalletInfo | null {
    const wallet = this.wallets.get(walletId);
    if (!wallet) return null;

    return {
      id: wallet.config.id,
      name: wallet.config.name,
      blockchain: wallet.config.blockchain,
      address: wallet.secureData.address,
      createdAt: wallet.config.createdAt,
    };
  }

  /**
   * Obtenir les wallets par blockchain
   */
  getWalletsByBlockchain(blockchain: BlockchainType): WalletInfo[] {
    return this.getAllWallets().filter(w => w.blockchain === blockchain);
  }

  /**
   * Exporter la seed phrase (ATTENTION: opération sensible)
   */
  exportSeed(walletId: string, password: string): string {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet non trouvé');
    }

    // Vérification du mot de passe
    // TODO: Implémenter une vraie vérification avec hash stocké
    if (!password || password.length < 8) {
      throw new Error('Mot de passe requis (minimum 8 caractères)');
    }

    // Déchiffrer la seed
    const seed = decrypt(wallet.secureData.encryptedSeed!);
    
    logger.warn(`Seed exportée pour wallet ${walletId}`);
    this.emit('wallet:seed-exported', walletId);

    return seed;
  }

  /**
   * Obtenir l'adresse d'un wallet
   */
  getAddress(walletId: string): string {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet non trouvé');
    }
    return wallet.secureData.address;
  }

  /**
   * Supprimer un wallet
   */
  deleteWallet(walletId: string): void {
    if (!this.wallets.has(walletId)) {
      throw new Error('Wallet non trouvé');
    }

    this.wallets.delete(walletId);
    this.saveWallets();

    logger.info(`Wallet supprimé: ${walletId}`);
    this.emit('wallet:deleted', walletId);
  }

  /**
   * Renommer un wallet
   */
  renameWallet(walletId: string, newName: string): WalletInfo {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet non trouvé');
    }

    wallet.config.name = newName;
    this.saveWallets();

    return {
      id: wallet.config.id,
      name: newName,
      blockchain: wallet.config.blockchain,
      address: wallet.secureData.address,
      createdAt: wallet.config.createdAt,
    };
  }

  // ============================================================
  // BALANCE & TRANSACTIONS (Placeholders pour MVP)
  // ============================================================

  /**
   * Obtenir le solde d'un wallet
   * Note: Nécessite connexion RPC au node ou API externe
   */
  async getBalance(walletId: string): Promise<string> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet non trouvé');
    }

    // TODO: Implémenter les appels RPC pour chaque blockchain
    // Pour le MVP, on retourne une valeur placeholder
    return '0.00';
  }

  /**
   * Nombre total de wallets
   */
  get count(): number {
    return this.wallets.size;
  }

  /**
   * Vérifier si un wallet existe
   */
  exists(walletId: string): boolean {
    return this.wallets.has(walletId);
  }
}

// Singleton
export const walletManager = new WalletManager();
export default walletManager;
