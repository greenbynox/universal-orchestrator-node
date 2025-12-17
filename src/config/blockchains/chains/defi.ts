/**
 * ============================================================
 * DEFI CHAINS - Tokens DeFi natifs et Oracles
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const DEFI_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // CHAINLINK
  // ============================================================
  createEVMChain({
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    category: 'defi',
    consensus: 'other',
    color: '#375BD2',
    chainId: 1, // ERC-20 sur Ethereum
    mainnet: {
      name: 'Chainlink (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    explorers: [
      { name: 'Etherscan', url: 'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca' },
    ],
    website: 'https://chain.link',
    coingeckoId: 'chainlink',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // UNISWAP
  // ============================================================
  createEVMChain({
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    category: 'defi',
    consensus: 'other',
    color: '#FF007A',
    chainId: 1,
    mainnet: {
      name: 'Uniswap (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    explorers: [
      { name: 'Etherscan', url: 'https://etherscan.io/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    ],
    website: 'https://uniswap.org',
    coingeckoId: 'uniswap',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // AAVE
  // ============================================================
  createEVMChain({
    id: 'aave',
    name: 'Aave',
    symbol: 'AAVE',
    category: 'defi',
    consensus: 'other',
    color: '#B6509E',
    chainId: 1,
    mainnet: {
      name: 'Aave (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://aave.com',
    coingeckoId: 'aave',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // MAKER
  // ============================================================
  createEVMChain({
    id: 'maker',
    name: 'Maker',
    symbol: 'MKR',
    category: 'defi',
    consensus: 'other',
    color: '#1AAB9B',
    chainId: 1,
    mainnet: {
      name: 'Maker (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://makerdao.com',
    coingeckoId: 'maker',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // COMPOUND
  // ============================================================
  createEVMChain({
    id: 'compound',
    name: 'Compound',
    symbol: 'COMP',
    category: 'defi',
    consensus: 'other',
    color: '#00D395',
    chainId: 1,
    mainnet: {
      name: 'Compound (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://compound.finance',
    coingeckoId: 'compound-governance-token',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // CURVE
  // ============================================================
  createEVMChain({
    id: 'curve',
    name: 'Curve DAO',
    symbol: 'CRV',
    category: 'defi',
    consensus: 'other',
    color: '#0066FF',
    chainId: 1,
    mainnet: {
      name: 'Curve (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://curve.fi',
    coingeckoId: 'curve-dao-token',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // SYNTHETIX
  // ============================================================
  createEVMChain({
    id: 'synthetix',
    name: 'Synthetix',
    symbol: 'SNX',
    category: 'defi',
    consensus: 'other',
    color: '#00D1FF',
    chainId: 1,
    mainnet: {
      name: 'Synthetix (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://synthetix.io',
    coingeckoId: 'havven',
    isActive: true,
    features: {
      defi: true,
      staking: true,
    },
  }),

  // ============================================================
  // 1INCH
  // ============================================================
  createEVMChain({
    id: '1inch',
    name: '1inch',
    symbol: '1INCH',
    category: 'defi',
    consensus: 'other',
    color: '#1B314F',
    chainId: 1,
    mainnet: {
      name: '1inch (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://1inch.io',
    coingeckoId: '1inch',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // LIDO
  // ============================================================
  createEVMChain({
    id: 'lido',
    name: 'Lido DAO',
    symbol: 'LDO',
    category: 'defi',
    consensus: 'other',
    color: '#00A3FF',
    chainId: 1,
    mainnet: {
      name: 'Lido (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://lido.fi',
    coingeckoId: 'lido-dao',
    isActive: true,
    features: {
      defi: true,
      staking: true,
      governance: true,
    },
  }),

  // ============================================================
  // ROCKETPOOL
  // ============================================================
  createEVMChain({
    id: 'rocketpool',
    name: 'Rocket Pool',
    symbol: 'RPL',
    category: 'defi',
    consensus: 'other',
    color: '#FF6E4A',
    chainId: 1,
    mainnet: {
      name: 'Rocket Pool (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://rocketpool.net',
    coingeckoId: 'rocket-pool',
    isActive: true,
    features: {
      defi: true,
      staking: true,
    },
  }),

  // ============================================================
  // PANCAKESWAP
  // ============================================================
  createEVMChain({
    id: 'pancakeswap',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    category: 'defi',
    consensus: 'other',
    color: '#1FC7D4',
    chainId: 56,
    mainnet: {
      name: 'PancakeSwap (BSC)',
      rpcUrls: ['https://bsc-dataseed.binance.org'],
    },
    website: 'https://pancakeswap.finance',
    coingeckoId: 'pancakeswap-token',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // SUSHI
  // ============================================================
  createEVMChain({
    id: 'sushi',
    name: 'SushiSwap',
    symbol: 'SUSHI',
    category: 'defi',
    consensus: 'other',
    color: '#FA52A0',
    chainId: 1,
    mainnet: {
      name: 'Sushi (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://sushi.com',
    coingeckoId: 'sushi',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // JUPITER (Solana DEX)
  // ============================================================
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: 'JUP',
    category: 'defi',
    chainType: 'solana',
    consensus: 'other',
    color: '#C7F284',
    mainnet: {
      name: 'Jupiter (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://jup.ag',
    coingeckoId: 'jupiter-exchange-solana',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  },

  // ============================================================
  // RAYDIUM
  // ============================================================
  {
    id: 'raydium',
    name: 'Raydium',
    symbol: 'RAY',
    category: 'defi',
    chainType: 'solana',
    consensus: 'other',
    color: '#C200FB',
    mainnet: {
      name: 'Raydium (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://raydium.io',
    coingeckoId: 'raydium',
    isActive: true,
    features: {
      defi: true,
    },
  },

  // ============================================================
  // GMX
  // ============================================================
  createEVMChain({
    id: 'gmx',
    name: 'GMX',
    symbol: 'GMX',
    category: 'defi',
    consensus: 'other',
    color: '#0D1B31',
    chainId: 42161,
    mainnet: {
      name: 'GMX (Arbitrum)',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    },
    website: 'https://gmx.io',
    coingeckoId: 'gmx',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // DYDX
  // ============================================================
  {
    id: 'dydx',
    name: 'dYdX',
    symbol: 'DYDX',
    category: 'defi',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#6966FF',
    mainnet: {
      name: 'dYdX Chain',
      rpcUrls: ['https://rpc.dydx.exchange'],
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://dydx.exchange',
    coingeckoId: 'dydx-chain',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  },

  // ============================================================
  // PENDLE
  // ============================================================
  createEVMChain({
    id: 'pendle',
    name: 'Pendle',
    symbol: 'PENDLE',
    category: 'defi',
    consensus: 'other',
    color: '#2D2D2D',
    chainId: 1,
    mainnet: {
      name: 'Pendle (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://pendle.finance',
    coingeckoId: 'pendle',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // ETHENA
  // ============================================================
  createEVMChain({
    id: 'ethena',
    name: 'Ethena',
    symbol: 'ENA',
    category: 'defi',
    consensus: 'other',
    color: '#00AEEF',
    chainId: 1,
    mainnet: {
      name: 'Ethena (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://ethena.fi',
    coingeckoId: 'ethena',
    isActive: true,
    features: {
      defi: true,
    },
  }),
  // ============================================================
  // JITO
  // ============================================================
  {
    id: 'jito',
    name: 'Jito',
    symbol: 'JTO',
    category: 'defi',
    chainType: 'solana',
    consensus: 'other',
    color: '#14F195',
    mainnet: {
      name: 'Jito (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    docker: {
      images: {
        full: 'jitolabs/jito-solana:latest',
        pruned: 'jitolabs/jito-solana:latest',
        light: 'jitolabs/jito-solana:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 2 },
        pruned: { diskGB: 100, memoryGB: 8, syncDays: 1 },
        light: { diskGB: 50, memoryGB: 4, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://jito.network',
    coingeckoId: 'jito-governance-token',
    isActive: true,
  },

  // ============================================================
  // ETHER.FI
  // ============================================================
  createEVMChain({
    id: 'ether-fi',
    name: 'Ether.fi',
    symbol: 'ETHFI',
    category: 'defi',
    consensus: 'other',
    color: '#627EEA',
    chainId: 1,
    mainnet: {
      name: 'Ether.fi (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://www.ether.fi',
    coingeckoId: 'ether-fi',
    isActive: true,
  }),

  // ============================================================
  // AEVO
  // ============================================================
  createEVMChain({
    id: 'aevo',
    name: 'Aevo',
    symbol: 'AEVO',
    category: 'defi',
    consensus: 'other',
    color: '#000000',
    chainId: 1,
    mainnet: {
      name: 'Aevo (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://www.aevo.xyz',
    coingeckoId: 'aevo-exchange',
    isActive: true,
  }),
];
