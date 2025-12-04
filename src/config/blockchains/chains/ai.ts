/**
 * ============================================================
 * AI CHAINS - AI & Machine Learning tokens
 * ============================================================
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const AI_CHAINS: BlockchainDefinition[] = [
  createEVMChain({ id: 'render', name: 'Render', symbol: 'RNDR', category: 'ai', consensus: 'other', color: '#121212', chainId: 1, mainnet: { name: 'RNDR (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://rendertoken.com', coingeckoId: 'render-token', isActive: true }),
  createEVMChain({ id: 'fetch-ai', name: 'Fetch.ai', symbol: 'FET', category: 'ai', consensus: 'other', color: '#1D2026', chainId: 1, mainnet: { name: 'FET (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://fetch.ai', coingeckoId: 'fetch-ai', isActive: true }),
  createEVMChain({ id: 'ocean', name: 'Ocean Protocol', symbol: 'OCEAN', category: 'ai', consensus: 'other', color: '#141414', chainId: 1, mainnet: { name: 'OCEAN (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://oceanprotocol.com', coingeckoId: 'ocean-protocol', isActive: true }),
  createEVMChain({ id: 'akash', name: 'Akash Network', symbol: 'AKT', category: 'ai', consensus: 'pos', color: '#E50914', chainId: 1, mainnet: { name: 'AKT (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://akash.network', coingeckoId: 'akash-network', isActive: true }),
  createEVMChain({ id: 'singularitynet', name: 'SingularityNET', symbol: 'AGIX', category: 'ai', consensus: 'other', color: '#1C1F26', chainId: 1, mainnet: { name: 'AGIX (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://singularitynet.io', coingeckoId: 'singularitynet', isActive: true }),
  createEVMChain({ id: 'bittensor', name: 'Bittensor', symbol: 'TAO', category: 'ai', consensus: 'pos', color: '#000000', chainId: 1, mainnet: { name: 'TAO', rpcUrls: [] }, website: 'https://bittensor.com', coingeckoId: 'bittensor', isActive: true }),
  createEVMChain({ id: 'worldcoin', name: 'Worldcoin', symbol: 'WLD', category: 'ai', consensus: 'other', color: '#000000', chainId: 10, mainnet: { name: 'WLD (Optimism)', rpcUrls: ['https://mainnet.optimism.io'] }, website: 'https://worldcoin.org', coingeckoId: 'worldcoin-wld', isActive: true }),
  createEVMChain({ id: 'arkham', name: 'Arkham', symbol: 'ARKM', category: 'ai', consensus: 'other', color: '#1A1A2E', chainId: 1, mainnet: { name: 'ARKM (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://arkhamintelligence.com', coingeckoId: 'arkham', isActive: true }),
  createEVMChain({ id: 'phala', name: 'Phala Network', symbol: 'PHA', category: 'ai', consensus: 'pos', color: '#00FF00', chainId: 1, mainnet: { name: 'PHA (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://phala.network', coingeckoId: 'pha', isActive: true }),
  createEVMChain({ id: 'numeraire', name: 'Numeraire', symbol: 'NMR', category: 'ai', consensus: 'other', color: '#151515', chainId: 1, mainnet: { name: 'NMR (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://numer.ai', coingeckoId: 'numeraire', isActive: true }),
  createEVMChain({ id: 'virtuals', name: 'Virtuals Protocol', symbol: 'VIRTUAL', category: 'ai', consensus: 'other', color: '#6366F1', chainId: 8453, mainnet: { name: 'VIRTUAL (Base)', rpcUrls: ['https://mainnet.base.org'] }, website: 'https://virtuals.io', coingeckoId: 'virtual-protocol', isActive: true }),
  createEVMChain({ id: 'ai16z', name: 'ai16z', symbol: 'AI16Z', category: 'ai', consensus: 'other', color: '#000000', chainId: 1, mainnet: { name: 'AI16Z (Ethereum)', rpcUrls: ['https://eth.llamarpc.com'] }, coingeckoId: 'ai16z', isActive: true }),
  createEVMChain({ id: 'grass', name: 'Grass', symbol: 'GRASS', category: 'ai', consensus: 'other', color: '#00FF00', chainId: 1, mainnet: { name: 'GRASS', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://getgrass.io', coingeckoId: 'grass', isActive: true }),
  createEVMChain({ id: 'io-net', name: 'io.net', symbol: 'IO', category: 'ai', consensus: 'other', color: '#1E1E1E', chainId: 1, mainnet: { name: 'IO', rpcUrls: ['https://eth.llamarpc.com'] }, website: 'https://io.net', coingeckoId: 'io', isActive: true }),
];
