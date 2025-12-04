/**
 * ============================================================
 * STORAGE CHAINS - Decentralized Storage Networks
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const STORAGE_CHAINS: BlockchainDefinition[] = [
  // Filecoin - Decentralized storage network
  {
    id: 'filecoin',
    name: 'Filecoin',
    symbol: 'FIL',
    category: 'storage',
    chainType: 'evm',
    consensus: 'pos',
    color: '#0090FF',
    chainId: 314,
    features: {
      smartContracts: true,
      nft: false,
      defi: false,
      staking: true,
      privacy: false,
      evmCompatible: true,
      governance: true,
      storage: true,
    },
    mainnet: {
      name: 'Filecoin Mainnet',
      chainId: 314,
      rpcUrls: ['https://api.node.glif.io/rpc/v1', 'https://filecoin.drpc.org'],
      explorerUrls: ['https://filfox.info'],
      nativeCurrency: { name: 'Filecoin', symbol: 'FIL', decimals: 18 },
    },
    testnet: {
      name: 'Calibration Testnet',
      chainId: 314159,
      rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
    wallet: {
      derivationPath: "m/44'/461'/0'/0/0",
      addressPrefix: 'f',
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://filecoin.io',
    documentation: 'https://docs.filecoin.io',
    coingeckoId: 'filecoin',
    isActive: true,
  },

  // Arweave - Permanent data storage
  {
    id: 'arweave',
    name: 'Arweave',
    symbol: 'AR',
    category: 'storage',
    chainType: 'other',
    consensus: 'pos',
    color: '#222326',
    features: {
      smartContracts: true,
      nft: true,
      defi: false,
      staking: false,
      privacy: false,
      evmCompatible: false,
      storage: true,
    },
    mainnet: {
      name: 'Arweave Mainnet',
      rpcUrls: ['https://arweave.net'],
      explorerUrls: ['https://viewblock.io/arweave'],
      nativeCurrency: { name: 'Arweave', symbol: 'AR', decimals: 12 },
    },
    wallet: {
      derivationPath: "m/44'/472'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://arweave.org',
    documentation: 'https://docs.arweave.org',
    coingeckoId: 'arweave',
    isActive: true,
  },

  // Storj - Decentralized cloud storage
  createEVMChain({
    id: 'storj',
    name: 'Storj',
    symbol: 'STORJ',
    category: 'storage',
    consensus: 'other',
    color: '#2683FF',
    chainId: 1,
    mainnet: {
      name: 'STORJ (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { storage: true },
    website: 'https://storj.io',
    coingeckoId: 'storj',
    isActive: true,
  }),

  // Siacoin - Decentralized storage marketplace
  {
    id: 'siacoin',
    name: 'Siacoin',
    symbol: 'SC',
    category: 'storage',
    chainType: 'other',
    consensus: 'pow',
    color: '#20EE82',
    features: {
      smartContracts: true,
      nft: false,
      defi: false,
      staking: false,
      privacy: false,
      evmCompatible: false,
      storage: true,
    },
    mainnet: {
      name: 'Sia Mainnet',
      rpcUrls: [],
      explorerUrls: ['https://explore.sia.tech'],
      nativeCurrency: { name: 'Siacoin', symbol: 'SC', decimals: 24 },
    },
    wallet: {
      derivationPath: "m/44'/1991'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://sia.tech',
    documentation: 'https://sia.tech/learn',
    coingeckoId: 'siacoin',
    isActive: true,
  },

  // Bluzelle - Decentralized database
  createEVMChain({
    id: 'bluzelle',
    name: 'Bluzelle',
    symbol: 'BLZ',
    category: 'storage',
    consensus: 'pos',
    color: '#18C8FF',
    chainId: 1,
    mainnet: {
      name: 'BLZ (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { storage: true },
    website: 'https://bluzelle.com',
    coingeckoId: 'bluzelle',
    isActive: true,
  }),

  // Crust Network - Decentralized storage on Polkadot
  createEVMChain({
    id: 'crust',
    name: 'Crust Network',
    symbol: 'CRU',
    category: 'storage',
    consensus: 'pos',
    color: '#FA5B30',
    chainId: 1,
    mainnet: {
      name: 'CRU',
      rpcUrls: ['https://rpc.crust.network'],
    },
    features: { storage: true },
    website: 'https://crust.network',
    coingeckoId: 'crust-network',
    isActive: true,
  }),

  // BitTorrent Chain
  createEVMChain({
    id: 'bittorrent',
    name: 'BitTorrent',
    symbol: 'BTT',
    category: 'storage',
    consensus: 'dpos',
    color: '#000000',
    chainId: 199,
    mainnet: {
      name: 'BitTorrent Chain',
      rpcUrls: ['https://rpc.bittorrentchain.io'],
      explorerUrls: ['https://bttcscan.com'],
    },
    features: { storage: true },
    website: 'https://bt.io',
    coingeckoId: 'bittorrent',
    isActive: true,
  }),

  // Theta Network - Decentralized video
  createEVMChain({
    id: 'theta',
    name: 'Theta Network',
    symbol: 'THETA',
    category: 'storage',
    consensus: 'pos',
    color: '#2AB8E6',
    chainId: 361,
    mainnet: {
      name: 'Theta Mainnet',
      rpcUrls: ['https://eth-rpc-api.thetatoken.org/rpc'],
      explorerUrls: ['https://explorer.thetatoken.org'],
    },
    features: { storage: true },
    website: 'https://thetatoken.org',
    coingeckoId: 'theta-token',
    isActive: true,
  }),

  // Livepeer - Decentralized video transcoding
  createEVMChain({
    id: 'livepeer',
    name: 'Livepeer',
    symbol: 'LPT',
    category: 'storage',
    consensus: 'dpos',
    color: '#00EB88',
    chainId: 42161,
    mainnet: {
      name: 'LPT (Arbitrum)',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    },
    features: { storage: true },
    website: 'https://livepeer.org',
    coingeckoId: 'livepeer',
    isActive: true,
  }),

  // Audius - Decentralized music streaming
  createEVMChain({
    id: 'audius',
    name: 'Audius',
    symbol: 'AUDIO',
    category: 'storage',
    consensus: 'pos',
    color: '#CC0FE0',
    chainId: 1,
    mainnet: {
      name: 'AUDIO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { storage: true },
    website: 'https://audius.co',
    coingeckoId: 'audius',
    isActive: true,
  }),
];
