/**
 * Tests unitaires - WalletManager Types & Configuration
 * Note: Tests de l'API WalletManager avec mocking des dépendances
 */

import {
  BlockchainType,
  WalletType,
  WalletConfig,
  WalletInfo,
  CreateWalletRequest,
} from '../src/types';
import { BLOCKCHAIN_CONFIGS } from '../src/config';
import * as bip39 from 'bip39';

describe('Wallet Types & Configuration', () => {

  describe('WalletType', () => {
    it('should support all expected wallet types', () => {
      const supportedTypes: WalletType[] = ['hd', 'imported', 'hardware'];
      
      supportedTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('CreateWalletRequest interface', () => {
    it('should create minimal request', () => {
      const request: CreateWalletRequest = {
        blockchain: 'bitcoin',
      };

      expect(request.blockchain).toBe('bitcoin');
      expect(request.name).toBeUndefined();
      expect(request.importSeed).toBeUndefined();
    });

    it('should create complete request with seed import', () => {
      const validSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      const request: CreateWalletRequest = {
        blockchain: 'ethereum',
        name: 'My ETH Wallet',
        importSeed: validSeed,
      };

      expect(request.blockchain).toBe('ethereum');
      expect(request.name).toBe('My ETH Wallet');
      expect(request.importSeed).toBe(validSeed);
    });
  });

  describe('WalletConfig interface', () => {
    it('should create valid wallet configuration', () => {
      const config: WalletConfig = {
        id: 'wallet-bitcoin-abc123',
        name: 'Test Bitcoin Wallet',
        blockchain: 'bitcoin',
        type: 'hd',
        derivationPath: "m/84'/0'/0'/0/0",
        createdAt: new Date(),
      };

      expect(config.id).toBe('wallet-bitcoin-abc123');
      expect(config.blockchain).toBe('bitcoin');
      expect(config.type).toBe('hd');
    });
  });

  describe('WalletInfo interface', () => {
    it('should create valid wallet info', () => {
      const info: WalletInfo = {
        id: 'wallet-ethereum-xyz789',
        name: 'Ethereum Wallet',
        blockchain: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20',
        createdAt: new Date(),
      };

      expect(info.id).toBe('wallet-ethereum-xyz789');
      expect(info.address).toContain('0x');
    });
  });

  describe('Derivation Paths', () => {
    it('should have derivation paths for all blockchains', () => {
      const blockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
      
      blockchains.forEach(blockchain => {
        expect(BLOCKCHAIN_CONFIGS[blockchain].derivationPath).toBeDefined();
        expect(typeof BLOCKCHAIN_CONFIGS[blockchain].derivationPath).toBe('string');
      });
    });

    it('should use BIP84 for Bitcoin (Native SegWit)', () => {
      expect(BLOCKCHAIN_CONFIGS.bitcoin.derivationPath).toContain("84'");
    });

    it('should use BIP44 for Ethereum', () => {
      expect(BLOCKCHAIN_CONFIGS.ethereum.derivationPath).toContain("44'");
      expect(BLOCKCHAIN_CONFIGS.ethereum.derivationPath).toContain("60'");
    });
  });
});

describe('BIP39 Mnemonic Utilities', () => {
  
  describe('generateMnemonic', () => {
    it('should generate valid 24-word mnemonic', () => {
      const mnemonic = bip39.generateMnemonic(256);
      const words = mnemonic.split(' ');
      
      expect(words.length).toBe(24);
      expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should generate valid 12-word mnemonic', () => {
      const mnemonic = bip39.generateMnemonic(128);
      const words = mnemonic.split(' ');
      
      expect(words.length).toBe(12);
      expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate correct mnemonic', () => {
      const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      expect(bip39.validateMnemonic(validMnemonic)).toBe(true);
    });

    it('should reject invalid mnemonic', () => {
      expect(bip39.validateMnemonic('invalid seed phrase')).toBe(false);
      expect(bip39.validateMnemonic('word1 word2 word3')).toBe(false);
      expect(bip39.validateMnemonic('')).toBe(false);
    });

    it('should reject mnemonic with invalid checksum', () => {
      // Valid words but invalid checksum
      const invalidChecksum = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
      
      expect(bip39.validateMnemonic(invalidChecksum)).toBe(false);
    });
  });

  describe('mnemonicToSeedSync', () => {
    it('should generate consistent seed from mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      const seed1 = bip39.mnemonicToSeedSync(mnemonic);
      const seed2 = bip39.mnemonicToSeedSync(mnemonic);
      
      expect(seed1).toEqual(seed2);
      expect(seed1.length).toBe(64); // 512 bits
    });

    it('should generate different seeds for different mnemonics', () => {
      const mnemonic1 = bip39.generateMnemonic(128);
      const mnemonic2 = bip39.generateMnemonic(128);
      
      const seed1 = bip39.mnemonicToSeedSync(mnemonic1);
      const seed2 = bip39.mnemonicToSeedSync(mnemonic2);
      
      expect(seed1).not.toEqual(seed2);
    });
  });
});
