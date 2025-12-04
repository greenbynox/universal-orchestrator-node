/**
 * ============================================================
 * ORACLE CHAINS - Oracle Networks & Data Providers
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const ORACLE_CHAINS: BlockchainDefinition[] = [
  // Chainlink - Leading oracle network
  createEVMChain({
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    category: 'oracle',
    consensus: 'other',
    color: '#375BD2',
    chainId: 1,
    mainnet: {
      name: 'LINK (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, defi: true, crossChain: true },
    website: 'https://chain.link',
    coingeckoId: 'chainlink',
    isActive: true,
  }),

  // Band Protocol - Cross-chain oracle
  createEVMChain({
    id: 'band-protocol',
    name: 'Band Protocol',
    symbol: 'BAND',
    category: 'oracle',
    consensus: 'dpos',
    color: '#516FFA',
    chainId: 1,
    mainnet: {
      name: 'BAND (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, crossChain: true },
    website: 'https://bandprotocol.com',
    coingeckoId: 'band-protocol',
    isActive: true,
  }),

  // API3 - First-party oracles
  createEVMChain({
    id: 'api3',
    name: 'API3',
    symbol: 'API3',
    category: 'oracle',
    consensus: 'other',
    color: '#10B981',
    chainId: 1,
    mainnet: {
      name: 'API3 (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, governance: true },
    website: 'https://api3.org',
    coingeckoId: 'api3',
    isActive: true,
  }),

  // UMA - Optimistic oracle
  createEVMChain({
    id: 'uma',
    name: 'UMA',
    symbol: 'UMA',
    category: 'oracle',
    consensus: 'other',
    color: '#FF4A4A',
    chainId: 1,
    mainnet: {
      name: 'UMA (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, defi: true },
    website: 'https://umaproject.org',
    coingeckoId: 'uma',
    isActive: true,
  }),

  // Pyth Network - High-fidelity data oracle
  createEVMChain({
    id: 'pyth',
    name: 'Pyth Network',
    symbol: 'PYTH',
    category: 'oracle',
    consensus: 'other',
    color: '#7C3AED',
    chainId: 1,
    mainnet: {
      name: 'PYTH (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, crossChain: true },
    website: 'https://pyth.network',
    coingeckoId: 'pyth-network',
    isActive: true,
  }),

  // Tellor - Decentralized oracle
  createEVMChain({
    id: 'tellor',
    name: 'Tellor',
    symbol: 'TRB',
    category: 'oracle',
    consensus: 'pos',
    color: '#20C997',
    chainId: 1,
    mainnet: {
      name: 'TRB (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, staking: true },
    website: 'https://tellor.io',
    coingeckoId: 'tellor',
    isActive: true,
  }),

  // DIA - Open-source oracle platform
  createEVMChain({
    id: 'dia',
    name: 'DIA',
    symbol: 'DIA',
    category: 'oracle',
    consensus: 'other',
    color: '#FB2B8A',
    chainId: 1,
    mainnet: {
      name: 'DIA (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { oracle: true, governance: true },
    website: 'https://diadata.org',
    coingeckoId: 'dia-data',
    isActive: true,
  }),

  // Winklink - TRON oracle
  createEVMChain({
    id: 'winklink',
    name: 'WINkLink',
    symbol: 'WIN',
    category: 'oracle',
    consensus: 'other',
    color: '#EC0623',
    chainId: 1,
    mainnet: {
      name: 'WIN (TRON)',
      rpcUrls: [],
    },
    features: { oracle: true },
    website: 'https://winklink.org',
    coingeckoId: 'winklink',
    isActive: true,
  }),
];
