/**
 * ============================================================
 * INFRASTRUCTURE CHAINS - Cross-chain & Infrastructure
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const INFRASTRUCTURE_CHAINS: BlockchainDefinition[] = [
  // Polkadot - Interoperability
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    category: 'infrastructure',
    chainType: 'substrate',
    consensus: 'pos',
    color: '#E6007A',
    mainnet: {
      name: 'Polkadot Relay Chain',
      rpcUrls: ['wss://rpc.polkadot.io'],
      explorerUrls: ['https://polkadot.subscan.io'],
    },
    wallet: {
      derivationPath: "m/44'/354'/0'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { staking: true, crossChain: true, governance: true },
    website: 'https://polkadot.network',
    coingeckoId: 'polkadot',
    isActive: true,
  },

  // Cosmos - Internet of Blockchains
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    category: 'infrastructure',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#2E3148',
    mainnet: {
      name: 'Cosmos Hub',
      rpcUrls: ['https://cosmos-rpc.polkachu.com'],
      explorerUrls: ['https://www.mintscan.io/cosmos'],
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      addressPrefix: 'cosmos',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { staking: true, crossChain: true, governance: true },
    website: 'https://cosmos.network',
    coingeckoId: 'cosmos',
    isActive: true,
  },

  // Axelar - Cross-chain messaging
  {
    id: 'axelar',
    name: 'Axelar',
    symbol: 'AXL',
    category: 'infrastructure',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#1B1F2D',
    mainnet: {
      name: 'Axelar Network',
      rpcUrls: ['https://axelar-rpc.polkachu.com'],
      explorerUrls: ['https://axelarscan.io'],
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      addressPrefix: 'axelar',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { crossChain: true, governance: true },
    website: 'https://axelar.network',
    coingeckoId: 'axelar',
    isActive: true,
  },

  // LayerZero - Omnichain messaging
  createEVMChain({
    id: 'layerzero',
    name: 'LayerZero',
    symbol: 'ZRO',
    category: 'infrastructure',
    consensus: 'other',
    color: '#000000',
    chainId: 1,
    mainnet: {
      name: 'ZRO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { crossChain: true },
    website: 'https://layerzero.network',
    coingeckoId: 'layerzero',
    isActive: true,
  }),

  // Wormhole - Cross-chain bridge
  createEVMChain({
    id: 'wormhole',
    name: 'Wormhole',
    symbol: 'W',
    category: 'infrastructure',
    consensus: 'other',
    color: '#00C3FF',
    chainId: 1,
    mainnet: {
      name: 'W (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { crossChain: true },
    website: 'https://wormhole.com',
    coingeckoId: 'wormhole',
    isActive: true,
  }),

  // Celestia - Modular blockchain
  {
    id: 'celestia',
    name: 'Celestia',
    symbol: 'TIA',
    category: 'infrastructure',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#7B2BF9',
    mainnet: {
      name: 'Celestia Mainnet',
      rpcUrls: ['https://celestia-rpc.polkachu.com'],
      explorerUrls: ['https://celenium.io'],
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      addressPrefix: 'celestia',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { staking: true },
    website: 'https://celestia.org',
    coingeckoId: 'celestia',
    isActive: true,
  },

  // Eigenlayer - Restaking
  createEVMChain({
    id: 'eigenlayer',
    name: 'EigenLayer',
    symbol: 'EIGEN',
    category: 'infrastructure',
    consensus: 'pos',
    color: '#1A0F3C',
    chainId: 1,
    mainnet: {
      name: 'EIGEN (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { staking: true },
    website: 'https://eigenlayer.xyz',
    coingeckoId: 'eigenlayer',
    isActive: true,
  }),

  // The Graph - Indexing protocol
  createEVMChain({
    id: 'thegraph',
    name: 'The Graph',
    symbol: 'GRT',
    category: 'infrastructure',
    consensus: 'other',
    color: '#6F4CFF',
    chainId: 1,
    mainnet: {
      name: 'GRT (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { staking: true, governance: true },
    website: 'https://thegraph.com',
    coingeckoId: 'the-graph',
    isActive: true,
  }),

  // Ondo - RWA Tokenization
  createEVMChain({
    id: 'ondo',
    name: 'Ondo',
    symbol: 'ONDO',
    category: 'infrastructure',
    consensus: 'other',
    color: '#02182C',
    chainId: 1,
    mainnet: {
      name: 'ONDO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true },
    website: 'https://ondo.finance',
    coingeckoId: 'ondo-finance',
    isActive: true,
  }),

  // Pendle - Yield trading
  createEVMChain({
    id: 'pendle',
    name: 'Pendle',
    symbol: 'PENDLE',
    category: 'infrastructure',
    consensus: 'other',
    color: '#3AFFD8',
    chainId: 1,
    mainnet: {
      name: 'PENDLE (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true, staking: true },
    website: 'https://pendle.finance',
    coingeckoId: 'pendle',
    isActive: true,
  }),

  // Ethena - Synthetic dollar
  createEVMChain({
    id: 'ethena',
    name: 'Ethena',
    symbol: 'ENA',
    category: 'infrastructure',
    consensus: 'other',
    color: '#1E1E1E',
    chainId: 1,
    mainnet: {
      name: 'ENA (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true, staking: true },
    website: 'https://ethena.fi',
    coingeckoId: 'ethena',
    isActive: true,
  }),

  // Injective - DeFi L1
  {
    id: 'injective',
    name: 'Injective',
    symbol: 'INJ',
    category: 'infrastructure',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#00F2EA',
    mainnet: {
      name: 'Injective Mainnet',
      rpcUrls: ['https://injective-rpc.polkachu.com'],
      explorerUrls: ['https://explorer.injective.network'],
    },
    wallet: {
      derivationPath: "m/44'/60'/0'/0/0",
      addressPrefix: 'inj',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { smartContracts: true, defi: true, staking: true },
    website: 'https://injective.com',
    coingeckoId: 'injective-protocol',
    isActive: true,
  },

  // Sei - Trading-focused L1
  {
    id: 'sei',
    name: 'Sei',
    symbol: 'SEI',
    category: 'infrastructure',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#9B1C1C',
    mainnet: {
      name: 'Sei Network',
      rpcUrls: ['https://sei-rpc.polkachu.com'],
      explorerUrls: ['https://seistream.app'],
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      addressPrefix: 'sei',
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { smartContracts: true, defi: true, staking: true },
    website: 'https://sei.io',
    coingeckoId: 'sei-network',
    isActive: true,
  },
  // ============================================================
  // ETHEREUM NAME SERVICE
  // ============================================================
  createEVMChain({
    id: 'ens',
    name: 'Ethereum Name Service',
    symbol: 'ENS',
    category: 'infrastructure',
    consensus: 'other',
    color: '#5298FF',
    chainId: 1,
    mainnet: {
      name: 'ENS (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://ens.domains',
    coingeckoId: 'ethereum-name-service',
    isActive: true,
  }),

  // ============================================================
  // SSV NETWORK
  // ============================================================
  createEVMChain({
    id: 'ssv',
    name: 'SSV Network',
    symbol: 'SSV',
    category: 'infrastructure',
    consensus: 'other',
    color: '#111111',
    chainId: 1,
    mainnet: {
      name: 'SSV (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://ssv.network',
    coingeckoId: 'ssv-network',
    isActive: true,
  }),

  // ============================================================
  // ALTLAYER
  // ============================================================
  createEVMChain({
    id: 'altlayer',
    name: 'AltLayer',
    symbol: 'ALT',
    category: 'infrastructure',
    consensus: 'other',
    color: '#6452F6',
    chainId: 1,
    mainnet: {
      name: 'ALT (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://altlayer.io',
    coingeckoId: 'altlayer',
    isActive: true,
  }),
];
