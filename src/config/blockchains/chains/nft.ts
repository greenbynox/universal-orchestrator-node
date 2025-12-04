/**
 * ============================================================
 * NFT CHAINS - NFT-focused Blockchains
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const NFT_CHAINS: BlockchainDefinition[] = [
  // Immutable X - NFT scaling
  createEVMChain({
    id: 'immutable-x',
    name: 'Immutable X',
    symbol: 'IMX',
    category: 'nft',
    consensus: 'other',
    color: '#00C3FF',
    chainId: 13371,
    mainnet: {
      name: 'Immutable X Mainnet',
      chainId: 13371,
      rpcUrls: ['https://rpc.immutable.com'],
      explorerUrls: ['https://explorer.immutable.com'],
    },
    features: { nft: true, gaming: true },
    website: 'https://immutable.com',
    coingeckoId: 'immutable-x',
    isActive: true,
  }),

  // Flow - NFT & Digital collectibles
  {
    id: 'flow',
    name: 'Flow',
    symbol: 'FLOW',
    category: 'nft',
    chainType: 'other',
    consensus: 'pos',
    color: '#00EF8B',
    mainnet: {
      name: 'Flow Mainnet',
      rpcUrls: ['https://access-mainnet.onflow.org'],
      explorerUrls: ['https://flowscan.org'],
    },
    wallet: {
      derivationPath: "m/44'/539'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { smartContracts: true, nft: true, gaming: true },
    website: 'https://flow.com',
    coingeckoId: 'flow',
    isActive: true,
  },

  // Tezos - NFT arts
  {
    id: 'tezos',
    name: 'Tezos',
    symbol: 'XTZ',
    category: 'nft',
    chainType: 'other',
    consensus: 'pos',
    color: '#2C7DF7',
    mainnet: {
      name: 'Tezos Mainnet',
      rpcUrls: ['https://mainnet.api.tez.ie'],
      explorerUrls: ['https://tzstats.com'],
    },
    wallet: {
      derivationPath: "m/44'/1729'/0'/0'",
      addressPrefix: 'tz',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { smartContracts: true, nft: true, staking: true, governance: true },
    website: 'https://tezos.com',
    coingeckoId: 'tezos',
    isActive: true,
  },

  // ApeCoin - Bored Ape ecosystem
  createEVMChain({
    id: 'apecoin',
    name: 'ApeCoin',
    symbol: 'APE',
    category: 'nft',
    consensus: 'other',
    color: '#0057B7',
    chainId: 1,
    mainnet: {
      name: 'APE (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { nft: true, gaming: true, governance: true },
    website: 'https://apecoin.com',
    coingeckoId: 'apecoin',
    isActive: true,
  }),

  // Blur - NFT marketplace token
  createEVMChain({
    id: 'blur',
    name: 'Blur',
    symbol: 'BLUR',
    category: 'nft',
    consensus: 'other',
    color: '#FF6B00',
    chainId: 1,
    mainnet: {
      name: 'BLUR (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { nft: true },
    website: 'https://blur.io',
    coingeckoId: 'blur',
    isActive: true,
  }),

  // LooksRare - NFT marketplace token
  createEVMChain({
    id: 'looksrare',
    name: 'LooksRare',
    symbol: 'LOOKS',
    category: 'nft',
    consensus: 'other',
    color: '#0CE466',
    chainId: 1,
    mainnet: {
      name: 'LOOKS (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { nft: true, staking: true },
    website: 'https://looksrare.org',
    coingeckoId: 'looksrare',
    isActive: true,
  }),

  // SuperRare - Art NFT marketplace
  createEVMChain({
    id: 'superrare',
    name: 'SuperRare',
    symbol: 'RARE',
    category: 'nft',
    consensus: 'other',
    color: '#000000',
    chainId: 1,
    mainnet: {
      name: 'RARE (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { nft: true, governance: true },
    website: 'https://superrare.com',
    coingeckoId: 'superrare',
    isActive: true,
  }),

  // Magic Eden - Multi-chain NFT marketplace
  {
    id: 'magic-eden',
    name: 'Magic Eden',
    symbol: 'ME',
    category: 'nft',
    chainType: 'solana',
    consensus: 'pos',
    color: '#E42575',
    mainnet: {
      name: 'ME (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { nft: true },
    website: 'https://magiceden.io',
    coingeckoId: 'magic-eden',
    isActive: true,
  },

  // Tensor - Solana NFT trading
  {
    id: 'tensor',
    name: 'Tensor',
    symbol: 'TNSR',
    category: 'nft',
    chainType: 'solana',
    consensus: 'pos',
    color: '#1A1A2E',
    mainnet: {
      name: 'TNSR (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { nft: true },
    website: 'https://tensor.trade',
    coingeckoId: 'tensor',
    isActive: true,
  },

  // Ronin - Axie Infinity chain
  createEVMChain({
    id: 'ronin',
    name: 'Ronin',
    symbol: 'RON',
    category: 'nft',
    consensus: 'pos',
    color: '#1273EA',
    chainId: 2020,
    mainnet: {
      name: 'Ronin Mainnet',
      chainId: 2020,
      rpcUrls: ['https://api.roninchain.com/rpc'],
      explorerUrls: ['https://explorer.roninchain.com'],
      nativeCurrency: { name: 'Ronin', symbol: 'RON', decimals: 18 },
    },
    features: { nft: true, gaming: true, smartContracts: true },
    website: 'https://roninchain.com',
    coingeckoId: 'ronin',
    isActive: true,
  }),
];
