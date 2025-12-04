/**
 * ============================================================
 * LAYER 2 CHAINS - Solutions de scaling
 * ============================================================
 * Arbitrum, Optimism, Base, etc.
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const LAYER2_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // ARBITRUM ONE
  // ============================================================
  createEVMChain({
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    aliases: ['arb', 'arbitrum-one'],
    category: 'layer2',
    consensus: 'pos',
    color: '#28A0F0',
    chainId: 42161,
    mainnet: {
      name: 'Arbitrum One',
      rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com'],
      defaultPorts: { rpc: 8547, p2p: 8548 },
    },
    docker: {
      images: {
        full: 'offchainlabs/nitro-node:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 3 },
      },
    },
    explorers: [
      { name: 'Arbiscan', url: 'https://arbiscan.io', apiUrl: 'https://api.arbiscan.io' },
    ],
    website: 'https://arbitrum.io',
    coingeckoId: 'arbitrum',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
      nft: true,
    },
  }),

  // ============================================================
  // OPTIMISM
  // ============================================================
  createEVMChain({
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    aliases: ['op', 'optimistic-ethereum'],
    category: 'layer2',
    consensus: 'pos',
    color: '#FF0420',
    chainId: 10,
    mainnet: {
      name: 'Optimism Mainnet',
      rpcUrls: ['https://mainnet.optimism.io', 'https://optimism.llamarpc.com'],
      defaultPorts: { rpc: 8545, p2p: 30303 },
    },
    docker: {
      images: {
        full: 'ethereumoptimism/op-node:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 3 },
      },
    },
    explorers: [
      { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
    ],
    website: 'https://optimism.io',
    coingeckoId: 'optimism',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // BASE
  // ============================================================
  createEVMChain({
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    aliases: ['base-mainnet', 'coinbase-l2'],
    category: 'layer2',
    consensus: 'pos',
    color: '#0052FF',
    chainId: 8453,
    mainnet: {
      name: 'Base Mainnet',
      rpcUrls: ['https://mainnet.base.org', 'https://base.llamarpc.com'],
      defaultPorts: { rpc: 8545, p2p: 30303 },
    },
    docker: {
      images: {
        full: 'coinbase/base-node:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 2 },
      },
    },
    explorers: [
      { name: 'Basescan', url: 'https://basescan.org', apiUrl: 'https://api.basescan.org' },
    ],
    website: 'https://base.org',
    coingeckoId: 'base',
    isActive: true,
    launchDate: '2023-08-09',
    features: {
      smartContracts: true,
      defi: true,
      nft: true,
    },
  }),

  // ============================================================
  // ARBITRUM NOVA
  // ============================================================
  createEVMChain({
    id: 'arbitrum-nova',
    name: 'Arbitrum Nova',
    symbol: 'ETH',
    category: 'layer2',
    consensus: 'pos',
    color: '#E57310',
    chainId: 42170,
    mainnet: {
      name: 'Arbitrum Nova',
      rpcUrls: ['https://nova.arbitrum.io/rpc'],
    },
    explorers: [
      { name: 'Nova Arbiscan', url: 'https://nova.arbiscan.io' },
    ],
    website: 'https://arbitrum.io',
    isActive: true,
    features: {
      smartContracts: true,
      gaming: true,
    },
  }),

  // ============================================================
  // STARKNET
  // ============================================================
  {
    id: 'starknet',
    name: 'StarkNet',
    symbol: 'STRK',
    aliases: ['strk'],
    category: 'layer2',
    chainType: 'other',
    consensus: 'pos',
    color: '#0C0C4F',
    mainnet: {
      name: 'StarkNet Mainnet',
      rpcUrls: ['https://starknet-mainnet.public.blastapi.io'],
    },
    wallet: {
      derivationPath: "m/44'/9004'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Starkscan', url: 'https://starkscan.co' },
      { name: 'Voyager', url: 'https://voyager.online' },
    ],
    website: 'https://starknet.io',
    coingeckoId: 'starknet',
    isActive: true,
    features: {
      smartContracts: true,
    },
  },

  // ============================================================
  // IMMUTABLE X
  // ============================================================
  createEVMChain({
    id: 'immutable-x',
    name: 'Immutable X',
    symbol: 'IMX',
    aliases: ['imx'],
    category: 'layer2',
    consensus: 'pos',
    color: '#00C9A7',
    chainId: 13371,
    mainnet: {
      name: 'Immutable zkEVM',
      rpcUrls: ['https://rpc.immutable.com'],
    },
    explorers: [
      { name: 'Immutable Explorer', url: 'https://explorer.immutable.com' },
    ],
    website: 'https://www.immutable.com',
    coingeckoId: 'immutable-x',
    isActive: true,
    features: {
      smartContracts: true,
      nft: true,
      gaming: true,
    },
  }),

  // ============================================================
  // LOOPRING
  // ============================================================
  createEVMChain({
    id: 'loopring',
    name: 'Loopring',
    symbol: 'LRC',
    category: 'layer2',
    consensus: 'pos',
    color: '#1C60FF',
    chainId: 1,
    mainnet: {
      name: 'Loopring',
      rpcUrls: ['https://api3.loopring.io'],
    },
    explorers: [
      { name: 'Loopring Explorer', url: 'https://explorer.loopring.io' },
    ],
    website: 'https://loopring.org',
    coingeckoId: 'loopring',
    isActive: true,
    features: {
      defi: true,
      nft: true,
    },
  }),

  // ============================================================
  // BLAST
  // ============================================================
  createEVMChain({
    id: 'blast',
    name: 'Blast',
    symbol: 'ETH',
    category: 'layer2',
    consensus: 'pos',
    color: '#FCFC03',
    chainId: 81457,
    mainnet: {
      name: 'Blast Mainnet',
      rpcUrls: ['https://rpc.blast.io'],
    },
    explorers: [
      { name: 'Blastscan', url: 'https://blastscan.io' },
    ],
    website: 'https://blast.io',
    coingeckoId: 'blast',
    isActive: true,
    launchDate: '2024-02-29',
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // MODE
  // ============================================================
  createEVMChain({
    id: 'mode',
    name: 'Mode Network',
    symbol: 'MODE',
    category: 'layer2',
    consensus: 'pos',
    color: '#DFFE00',
    chainId: 34443,
    mainnet: {
      name: 'Mode Mainnet',
      rpcUrls: ['https://mainnet.mode.network'],
    },
    explorers: [
      { name: 'Mode Explorer', url: 'https://explorer.mode.network' },
    ],
    website: 'https://www.mode.network',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // MANTA PACIFIC
  // ============================================================
  createEVMChain({
    id: 'manta',
    name: 'Manta Pacific',
    symbol: 'MANTA',
    category: 'layer2',
    consensus: 'pos',
    color: '#00AEEF',
    chainId: 169,
    mainnet: {
      name: 'Manta Pacific',
      rpcUrls: ['https://pacific-rpc.manta.network/http'],
    },
    explorers: [
      { name: 'Manta Explorer', url: 'https://pacific-explorer.manta.network' },
    ],
    website: 'https://manta.network',
    coingeckoId: 'manta-network',
    isActive: true,
    features: {
      smartContracts: true,
      privacy: true,
    },
  }),

  // ============================================================
  // TAIKO
  // ============================================================
  createEVMChain({
    id: 'taiko',
    name: 'Taiko',
    symbol: 'TAIKO',
    category: 'layer2',
    consensus: 'pos',
    color: '#E81899',
    chainId: 167000,
    mainnet: {
      name: 'Taiko Mainnet',
      rpcUrls: ['https://rpc.mainnet.taiko.xyz'],
    },
    explorers: [
      { name: 'Taikoscan', url: 'https://taikoscan.io' },
    ],
    website: 'https://taiko.xyz',
    coingeckoId: 'taiko',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // ZORA
  // ============================================================
  createEVMChain({
    id: 'zora',
    name: 'Zora Network',
    symbol: 'ETH',
    category: 'layer2',
    consensus: 'pos',
    color: '#000000',
    chainId: 7777777,
    mainnet: {
      name: 'Zora Mainnet',
      rpcUrls: ['https://rpc.zora.energy'],
    },
    explorers: [
      { name: 'Zora Explorer', url: 'https://explorer.zora.energy' },
    ],
    website: 'https://zora.co',
    isActive: true,
    features: {
      smartContracts: true,
      nft: true,
    },
  }),
];
