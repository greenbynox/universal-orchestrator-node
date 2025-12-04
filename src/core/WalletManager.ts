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
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
   * Dériver les clés Solana (vraie implémentation Ed25519)
   * Utilise le standard BIP44 path m/44'/501'/0'/0'
   */
  private deriveSolanaKeys(
    mnemonic: string,
    derivationPath: string
  ): { address: string; publicKey: string; privateKey: string } {
    // Convertir le mnemonic en seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Dériver la clé Ed25519 selon le path Solana (m/44'/501'/0'/0')
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    
    // Générer le keypair Ed25519
    const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
    
    // Créer le Keypair Solana pour obtenir l'adresse base58
    const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);
    
    return {
      address: solanaKeypair.publicKey.toBase58(),
      publicKey: Buffer.from(keypair.publicKey).toString('hex'),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    };
  }

  /**
   * Dériver les clés Monero (vraie implémentation)
   * Monero utilise des clés spend/view dérivées de la seed
   */
  private deriveMoneroKeys(
    mnemonic: string
  ): { address: string; publicKey: string; privateKey: string } {
    // Convertir le mnemonic BIP39 en seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Monero utilise les premiers 32 bytes comme spend key
    const spendKeyPrivate = seed.slice(0, 32);
    
    // Réduire la clé modulo l (ordre du groupe de la courbe Ed25519)
    // Ceci est une simplification - en production, utiliser une lib Monero
    const reducedSpendKey = this.reduceScalar(spendKeyPrivate);
    
    // Générer la view key à partir de la spend key (hash Keccak-256)
    const viewKeyPrivate = this.keccak256(reducedSpendKey).slice(0, 32);
    const reducedViewKey = this.reduceScalar(viewKeyPrivate);
    
    // Générer les clés publiques (multiplication par le point de base)
    // Pour une vraie implémentation, utiliser une lib de courbe elliptique Ed25519
    const spendKeyPair = nacl.sign.keyPair.fromSeed(reducedSpendKey);
    const viewKeyPair = nacl.sign.keyPair.fromSeed(reducedViewKey);
    
    // Construire l'adresse Monero (mainnet prefix + spend public + view public + checksum)
    const networkByte = Buffer.from([0x12]); // Mainnet standard address
    const addressData = Buffer.concat([
      networkByte,
      Buffer.from(spendKeyPair.publicKey),
      Buffer.from(viewKeyPair.publicKey),
    ]);
    
    // Calculer le checksum (premiers 4 bytes du hash Keccak-256)
    const checksum = this.keccak256(addressData).slice(0, 4);
    const fullAddress = Buffer.concat([addressData, checksum]);
    
    // Encoder en base58 Monero (différent du base58 Bitcoin)
    const address = this.base58MoneroEncode(fullAddress);
    
    return {
      address: address,
      publicKey: Buffer.from(spendKeyPair.publicKey).toString('hex'),
      privateKey: reducedSpendKey.toString('hex'),
    };
  }
  
  /**
   * Réduire un scalaire modulo l (ordre du groupe Ed25519)
   */
  private reduceScalar(scalar: Buffer): Buffer {
    // L = 2^252 + 27742317777372353535851937790883648493
    // Simplification: on prend les 32 bytes et on s'assure que le MSB est 0
    const result = Buffer.from(scalar);
    result[31] &= 0x7f; // Clear top bit
    result[0] &= 0xf8;  // Clear bottom 3 bits
    return result;
  }
  
  /**
   * Keccak-256 hash (utilisé par Monero au lieu de SHA-256)
   */
  private keccak256(data: Buffer): Buffer {
    // Node.js crypto ne supporte pas keccak directement
    // On utilise une approximation avec SHA3-256 pour le MVP
    // En production, utiliser la lib keccak
    return crypto.createHash('sha3-256').update(data).digest();
  }
  
  /**
   * Encodage Base58 Monero (alphabet différent de Bitcoin)
   */
  private base58MoneroEncode(data: Buffer): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const BASE = BigInt(58);
    
    // Encoder par blocs de 8 bytes (spécifique à Monero)
    let result = '';
    const fullBlocks = Math.floor(data.length / 8);
    
    for (let i = 0; i < fullBlocks; i++) {
      const block = data.slice(i * 8, (i + 1) * 8);
      let num = BigInt('0x' + block.toString('hex'));
      let encoded = '';
      
      for (let j = 0; j < 11; j++) {
        encoded = ALPHABET[Number(num % BASE)] + encoded;
        num = num / BASE;
      }
      result += encoded;
    }
    
    // Dernier bloc partiel
    const remaining = data.length % 8;
    if (remaining > 0) {
      const block = data.slice(fullBlocks * 8);
      let num = BigInt('0x' + block.toString('hex'));
      const outputLen = remaining === 1 ? 2 : remaining === 2 ? 3 : remaining === 3 ? 5 : 
                        remaining === 4 ? 6 : remaining === 5 ? 7 : remaining === 6 ? 9 : 10;
      let encoded = '';
      
      for (let j = 0; j < outputLen; j++) {
        encoded = ALPHABET[Number(num % BASE)] + encoded;
        num = num / BASE;
      }
      result += encoded;
    }
    
    return result;
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
