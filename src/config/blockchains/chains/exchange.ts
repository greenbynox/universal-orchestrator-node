/**
 * ============================================================
 * EXCHANGE TOKENS - Centralized & Decentralized Exchange Tokens
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const EXCHANGE_CHAINS: BlockchainDefinition[] = [
  // Binance Coin - Binance Smart Chain
  createEVMChain({
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    category: 'exchange',
    consensus: 'pos',
    color: '#F3BA2F',
    chainId: 56,
    mainnet: {
      name: 'BNB Smart Chain',
      chainId: 56,
      rpcUrls: ['https://bsc-dataseed.binance.org', 'https://bsc-dataseed1.defibit.io'],
      explorerUrls: ['https://bscscan.com'],
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    },
    testnet: {
      name: 'BNB Testnet',
      chainId: 97,
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
    features: { smartContracts: true, nft: true, defi: true, staking: true },
    website: 'https://www.bnbchain.org',
    coingeckoId: 'binancecoin',
    isActive: true,
  }),

  // Cronos - Crypto.com
  createEVMChain({
    id: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    category: 'exchange',
    consensus: 'pos',
    color: '#002D74',
    chainId: 25,
    mainnet: {
      name: 'Cronos Mainnet',
      chainId: 25,
      rpcUrls: ['https://evm.cronos.org', 'https://cronos.blockpi.network/v1/rpc/public'],
      explorerUrls: ['https://cronoscan.com'],
      nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
    },
    features: { smartContracts: true, nft: true, defi: true, staking: true },
    website: 'https://cronos.org',
    coingeckoId: 'crypto-com-chain',
    isActive: true,
  }),

  // KuCoin Token
  createEVMChain({
    id: 'kucoin',
    name: 'KuCoin Token',
    symbol: 'KCS',
    category: 'exchange',
    consensus: 'pos',
    color: '#23AF91',
    chainId: 321,
    mainnet: {
      name: 'KCC Mainnet',
      chainId: 321,
      rpcUrls: ['https://rpc-mainnet.kcc.network'],
      explorerUrls: ['https://explorer.kcc.io'],
      nativeCurrency: { name: 'KCS', symbol: 'KCS', decimals: 18 },
    },
    features: { smartContracts: true, defi: true },
    website: 'https://www.kucoin.com',
    coingeckoId: 'kucoin-shares',
    isActive: true,
  }),

  // OKB - OKX Exchange
  createEVMChain({
    id: 'okb',
    name: 'OKB',
    symbol: 'OKB',
    category: 'exchange',
    consensus: 'pos',
    color: '#000000',
    chainId: 66,
    mainnet: {
      name: 'OKC Mainnet',
      chainId: 66,
      rpcUrls: ['https://exchainrpc.okex.org'],
      explorerUrls: ['https://www.oklink.com/okc'],
      nativeCurrency: { name: 'OKT', symbol: 'OKT', decimals: 18 },
    },
    features: { smartContracts: true, defi: true },
    website: 'https://www.okx.com',
    coingeckoId: 'okb',
    isActive: true,
  }),

  // Huobi Token
  createEVMChain({
    id: 'huobi',
    name: 'Huobi Token',
    symbol: 'HT',
    category: 'exchange',
    consensus: 'pos',
    color: '#2D6AD6',
    chainId: 128,
    mainnet: {
      name: 'HECO Mainnet',
      chainId: 128,
      rpcUrls: ['https://http-mainnet.hecochain.com'],
      explorerUrls: ['https://hecoinfo.com'],
      nativeCurrency: { name: 'HT', symbol: 'HT', decimals: 18 },
    },
    features: { smartContracts: true, defi: true },
    website: 'https://www.huobi.com',
    coingeckoId: 'huobi-token',
    isActive: true,
  }),

  // Gate Token
  createEVMChain({
    id: 'gate',
    name: 'Gate Token',
    symbol: 'GT',
    category: 'exchange',
    consensus: 'pos',
    color: '#17E6A1',
    chainId: 86,
    mainnet: {
      name: 'GateChain Mainnet',
      chainId: 86,
      rpcUrls: ['https://evm.gatenode.cc'],
      explorerUrls: ['https://gatescan.org'],
      nativeCurrency: { name: 'GT', symbol: 'GT', decimals: 18 },
    },
    features: { smartContracts: true, defi: true },
    website: 'https://www.gate.io',
    coingeckoId: 'gatechain-token',
    isActive: true,
  }),

  // Bitget Token
  createEVMChain({
    id: 'bitget',
    name: 'Bitget Token',
    symbol: 'BGB',
    category: 'exchange',
    consensus: 'other',
    color: '#00D4A8',
    chainId: 1,
    mainnet: {
      name: 'BGB (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true },
    website: 'https://www.bitget.com',
    coingeckoId: 'bitget-token',
    isActive: true,
  }),

  // Uniswap - DEX
  createEVMChain({
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    category: 'exchange',
    consensus: 'other',
    color: '#FF007A',
    chainId: 1,
    mainnet: {
      name: 'UNI (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true, governance: true },
    website: 'https://uniswap.org',
    coingeckoId: 'uniswap',
    isActive: true,
  }),

  // SushiSwap - DEX
  createEVMChain({
    id: 'sushiswap',
    name: 'SushiSwap',
    symbol: 'SUSHI',
    category: 'exchange',
    consensus: 'other',
    color: '#FA52A0',
    chainId: 1,
    mainnet: {
      name: 'SUSHI (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true, governance: true },
    website: 'https://sushi.com',
    coingeckoId: 'sushi',
    isActive: true,
  }),

  // PancakeSwap - DEX
  createEVMChain({
    id: 'pancakeswap',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    category: 'exchange',
    consensus: 'other',
    color: '#1FC7D4',
    chainId: 56,
    mainnet: {
      name: 'CAKE (BSC)',
      rpcUrls: ['https://bsc-dataseed.binance.org'],
    },
    features: { defi: true, governance: true, nft: true },
    website: 'https://pancakeswap.finance',
    coingeckoId: 'pancakeswap-token',
    isActive: true,
  }),

  // dYdX - Derivatives DEX
  createEVMChain({
    id: 'dydx',
    name: 'dYdX',
    symbol: 'DYDX',
    category: 'exchange',
    consensus: 'pos',
    color: '#6966FF',
    chainId: 1,
    mainnet: {
      name: 'DYDX (Ethereum)',
      rpcUrls: ['https://eth.llamarpc.com'],
    },
    features: { defi: true, governance: true },
    website: 'https://dydx.exchange',
    coingeckoId: 'dydx',
    isActive: true,
  }),

  // GMX - Derivatives DEX
  createEVMChain({
    id: 'gmx',
    name: 'GMX',
    symbol: 'GMX',
    category: 'exchange',
    consensus: 'other',
    color: '#2D42FC',
    chainId: 42161,
    mainnet: {
      name: 'GMX (Arbitrum)',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    },
    features: { defi: true },
    website: 'https://gmx.io',
    coingeckoId: 'gmx',
    isActive: true,
  }),

  // Jupiter - Solana DEX Aggregator
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: 'JUP',
    category: 'exchange',
    chainType: 'solana',
    consensus: 'pos',
    color: '#00FF95',
    mainnet: {
      name: 'JUP (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { defi: true, governance: true },
    website: 'https://jup.ag',
    coingeckoId: 'jupiter-exchange-solana',
    isActive: true,
  },

  // Raydium - Solana DEX
  {
    id: 'raydium',
    name: 'Raydium',
    symbol: 'RAY',
    category: 'exchange',
    chainType: 'solana',
    consensus: 'pos',
    color: '#00D18C',
    mainnet: {
      name: 'RAY (Solana)',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    features: { defi: true },
    website: 'https://raydium.io',
    coingeckoId: 'raydium',
    isActive: true,
  },
];
