/**
 * ============================================================
 * STABLECOINS - USD-pegged et autres stables
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const STABLECOINS: BlockchainDefinition[] = [
  // ============================================================
  // USDT (Tether)
  // ============================================================
  createEVMChain({
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    aliases: ['tether'],
    category: 'stablecoin',
    consensus: 'other',
    color: '#26A17B',
    chainId: 1,
    mainnet: {
      name: 'USDT (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://tether.to',
    coingeckoId: 'tether',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // USDC (Circle)
  // ============================================================
  createEVMChain({
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    aliases: ['usd-coin'],
    category: 'stablecoin',
    consensus: 'other',
    color: '#2775CA',
    chainId: 1,
    mainnet: {
      name: 'USDC (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://www.circle.com/usdc',
    coingeckoId: 'usd-coin',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // DAI
  // ============================================================
  createEVMChain({
    id: 'dai',
    name: 'Dai',
    symbol: 'DAI',
    category: 'stablecoin',
    consensus: 'other',
    color: '#F5AC37',
    chainId: 1,
    mainnet: {
      name: 'DAI (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://makerdao.com/dai',
    coingeckoId: 'dai',
    isActive: true,
    features: {
      defi: true,
      governance: true,
    },
  }),

  // ============================================================
  // FRAX
  // ============================================================
  createEVMChain({
    id: 'frax',
    name: 'Frax',
    symbol: 'FRAX',
    category: 'stablecoin',
    consensus: 'other',
    color: '#000000',
    chainId: 1,
    mainnet: {
      name: 'FRAX (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://frax.finance',
    coingeckoId: 'frax',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // USDE (Ethena)
  // ============================================================
  createEVMChain({
    id: 'usde',
    name: 'USDe',
    symbol: 'USDe',
    category: 'stablecoin',
    consensus: 'other',
    color: '#00AEEF',
    chainId: 1,
    mainnet: {
      name: 'USDe (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://ethena.fi',
    coingeckoId: 'ethena-usde',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // TUSD
  // ============================================================
  createEVMChain({
    id: 'tusd',
    name: 'TrueUSD',
    symbol: 'TUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#002868',
    chainId: 1,
    mainnet: {
      name: 'TUSD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://trueusd.com',
    coingeckoId: 'true-usd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // BUSD
  // ============================================================
  createEVMChain({
    id: 'busd',
    name: 'Binance USD',
    symbol: 'BUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#F3BA2F',
    chainId: 56,
    mainnet: {
      name: 'BUSD (BSC)',
      rpcUrls: ['https://bsc-dataseed.binance.org'],
    },
    website: 'https://www.binance.com/busd',
    coingeckoId: 'binance-usd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // PYUSD (PayPal)
  // ============================================================
  createEVMChain({
    id: 'pyusd',
    name: 'PayPal USD',
    symbol: 'PYUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#003087',
    chainId: 1,
    mainnet: {
      name: 'PYUSD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://www.paypal.com',
    coingeckoId: 'paypal-usd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // CRVUSD
  // ============================================================
  createEVMChain({
    id: 'crvusd',
    name: 'Curve USD',
    symbol: 'crvUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#0066FF',
    chainId: 1,
    mainnet: {
      name: 'crvUSD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://curve.fi',
    coingeckoId: 'crvusd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // USDD
  // ============================================================
  createEVMChain({
    id: 'usdd',
    name: 'USDD',
    symbol: 'USDD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#00FF00',
    chainId: 1,
    mainnet: {
      name: 'USDD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://usdd.io',
    coingeckoId: 'usdd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // GHO (Aave)
  // ============================================================
  createEVMChain({
    id: 'gho',
    name: 'GHO',
    symbol: 'GHO',
    category: 'stablecoin',
    consensus: 'other',
    color: '#B6509E',
    chainId: 1,
    mainnet: {
      name: 'GHO (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://aave.com/gho',
    coingeckoId: 'gho',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // FDUSD
  // ============================================================
  createEVMChain({
    id: 'fdusd',
    name: 'First Digital USD',
    symbol: 'FDUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#00C853',
    chainId: 56,
    mainnet: {
      name: 'FDUSD (BSC)',
      rpcUrls: ['https://bsc-dataseed.binance.org'],
    },
    website: 'https://firstdigitallabs.com',
    coingeckoId: 'first-digital-usd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // sUSD
  // ============================================================
  createEVMChain({
    id: 'susd',
    name: 'sUSD',
    symbol: 'sUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#00D1FF',
    chainId: 1,
    mainnet: {
      name: 'sUSD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://synthetix.io',
    coingeckoId: 'susd',
    isActive: true,
    features: {
      defi: true,
    },
  }),

  // ============================================================
  // LUSD
  // ============================================================
  createEVMChain({
    id: 'lusd',
    name: 'Liquity USD',
    symbol: 'LUSD',
    category: 'stablecoin',
    consensus: 'other',
    color: '#2E8E84',
    chainId: 1,
    mainnet: {
      name: 'LUSD (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    website: 'https://liquity.org',
    coingeckoId: 'liquity-usd',
    isActive: true,
    features: {
      defi: true,
    },
  }),
];
