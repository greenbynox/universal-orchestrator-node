/**
 * ============================================================
 * MEME CHAINS - Meme coins populaires
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const MEME_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // DOGECOIN
  // ============================================================
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    aliases: ['doge'],
    category: 'meme',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#C3A634',
    icon: '🐕',
    mainnet: {
      name: 'Dogecoin Mainnet',
      defaultPorts: { rpc: 22555, p2p: 22556 },
    },
    docker: {
      images: {
        full: 'dogecoin/dogecoin:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 4, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/3'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Dogechain', url: 'https://dogechain.info' },
    ],
    website: 'https://dogecoin.com',
    coingeckoId: 'dogecoin',
    isActive: true,
  },

  // ============================================================
  // SHIBA INU
  // ============================================================
  createEVMChain({
    id: 'shiba-inu',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    aliases: ['shib', 'shiba'],
    category: 'meme',
    consensus: 'other',
    color: '#F9A32A',
    icon: '🐕',
    chainId: 1,
    mainnet: {
      name: 'SHIB (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://shibatoken.com',
    coingeckoId: 'shiba-inu',
    isActive: true,
  }),

  // ============================================================
  // PEPE
  // ============================================================
  createEVMChain({
    id: 'pepe',
    name: 'Pepe',
    symbol: 'PEPE',
    category: 'meme',
    consensus: 'other',
    color: '#3D8B40',
    icon: '🐸',
    chainId: 1,
    mainnet: {
      name: 'PEPE (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://pepecoin.io',
    coingeckoId: 'pepe',
    isActive: true,
  }),

  // ============================================================
  // FLOKI
  // ============================================================
  createEVMChain({
    id: 'floki',
    name: 'Floki Inu',
    symbol: 'FLOKI',
    category: 'meme',
    consensus: 'other',
    color: '#D99100',
    chainId: 56,
    mainnet: {
      name: 'FLOKI (BSC)',
      rpcUrls: ['https://bsc-dataseed.binance.org'],
    },
    website: 'https://floki.com',
    coingeckoId: 'floki',
    isActive: true,
  }),

  // ============================================================
  // BONK
  // ============================================================
  {
    id: 'bonk',
    name: 'Bonk',
    symbol: 'BONK',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#F9A825',
    icon: '🐕',
    mainnet: {
      name: 'BONK (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://bonkcoin.com',
    coingeckoId: 'bonk',
    isActive: true,
  },

  // ============================================================
  // DOGWIFHAT
  // ============================================================
  {
    id: 'dogwifhat',
    name: 'dogwifhat',
    symbol: 'WIF',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#E91E63',
    icon: '🐕',
    mainnet: {
      name: 'WIF (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://dogwifhat.com',
    coingeckoId: 'dogwifcoin',
    isActive: true,
  },

  // ============================================================
  // BRETT
  // ============================================================
  createEVMChain({
    id: 'brett',
    name: 'Brett',
    symbol: 'BRETT',
    category: 'meme',
    consensus: 'other',
    color: '#0052FF',
    chainId: 8453,
    mainnet: {
      name: 'BRETT (Base)',
      rpcUrls: ['https://mainnet.base.org'],
    },
    website: 'https://basebrett.com',
    coingeckoId: 'based-brett',
    isActive: true,
  }),

  // ============================================================
  // MOG COIN
  // ============================================================
  createEVMChain({
    id: 'mog',
    name: 'Mog Coin',
    symbol: 'MOG',
    category: 'meme',
    consensus: 'other',
    color: '#FFA500',
    chainId: 1,
    mainnet: {
      name: 'MOG (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    coingeckoId: 'mog-coin',
    isActive: true,
  }),

  // ============================================================
  // POPCAT
  // ============================================================
  {
    id: 'popcat',
    name: 'Popcat',
    symbol: 'POPCAT',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#FF69B4',
    icon: '🐱',
    mainnet: {
      name: 'POPCAT (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    coingeckoId: 'popcat',
    isActive: true,
  },

  // ============================================================
  // BOOK OF MEME
  // ============================================================
  {
    id: 'bome',
    name: 'BOOK OF MEME',
    symbol: 'BOME',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#4CAF50',
    mainnet: {
      name: 'BOME (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    coingeckoId: 'book-of-meme',
    isActive: true,
  },

  // ============================================================
  // TURBO
  // ============================================================
  createEVMChain({
    id: 'turbo',
    name: 'Turbo',
    symbol: 'TURBO',
    category: 'meme',
    consensus: 'other',
    color: '#00BCD4',
    chainId: 1,
    mainnet: {
      name: 'TURBO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    coingeckoId: 'turbo',
    isActive: true,
  }),

  // ============================================================
  // MEMECOIN
  // ============================================================
  createEVMChain({
    id: 'memecoin',
    name: 'Memecoin',
    symbol: 'MEME',
    category: 'meme',
    consensus: 'other',
    color: '#FF1744',
    chainId: 1,
    mainnet: {
      name: 'MEME (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    coingeckoId: 'memecoin-2',
    isActive: true,
  }),

  // ============================================================
  // NEIRO
  // ============================================================
  createEVMChain({
    id: 'neiro',
    name: 'Neiro',
    symbol: 'NEIRO',
    category: 'meme',
    consensus: 'other',
    color: '#FFD700',
    icon: '🐕',
    chainId: 1,
    mainnet: {
      name: 'NEIRO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    coingeckoId: 'neiro-on-eth',
    isActive: true,
  }),

  // ============================================================
  // GOATSEUS MAXIMUS
  // ============================================================
  {
    id: 'goat',
    name: 'Goatseus Maximus',
    symbol: 'GOAT',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#8B4513',
    icon: '🐐',
    mainnet: {
      name: 'GOAT (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    coingeckoId: 'goatseus-maximus',
    isActive: true,
  },

  // ============================================================
  // CAT IN A DOGS WORLD
  // ============================================================
  {
    id: 'mew',
    name: 'cat in a dogs world',
    symbol: 'MEW',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#FF69B4',
    icon: '🐱',
    mainnet: {
      name: 'MEW (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    coingeckoId: 'cat-in-a-dogs-world',
    isActive: true,
  },
  // ============================================================
  // WEN
  // ============================================================
  {
    id: 'wen',
    name: 'Wen',
    symbol: 'WEN',
    category: 'meme',
    chainType: 'solana',
    consensus: 'other',
    color: '#FFFFFF',
    icon: '🐱',
    mainnet: {
      name: 'WEN (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    coingeckoId: 'wen',
    isActive: true,
  },
];
