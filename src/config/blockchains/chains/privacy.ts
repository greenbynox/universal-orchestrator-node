/**
 * ============================================================
 * PRIVACY CHAINS - Coins de confidentialité
 * ============================================================
 * Monero, Zcash, Dash, etc.
 */

import { BlockchainDefinition } from '../types';

export const PRIVACY_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // MONERO
  // ============================================================
  {
    id: 'monero',
    name: 'Monero',
    symbol: 'XMR',
    aliases: ['xmr'],
    category: 'privacy',
    chainType: 'cryptonote',
    consensus: 'pow',
    color: '#FF6600',
    icon: 'ɱ',
    mainnet: {
      name: 'Monero Mainnet',
      defaultPorts: { rpc: 18081, p2p: 18080 },
    },
    docker: {
      images: {
        full: 'sethsimmons/simple-monerod:latest',
        pruned: 'sethsimmons/simple-monerod:latest',
      },
      requirements: {
        full: { diskGB: 180, memoryGB: 4, syncDays: 3 },
        pruned: { diskGB: 50, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/128'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
      addressPrefix: '4',
    },
    explorers: [
      { name: 'XMRChain', url: 'https://xmrchain.net' },
      { name: 'Monero Explorer', url: 'https://www.exploremonero.com' },
    ],
    website: 'https://getmonero.org',
    coingeckoId: 'monero',
    isActive: true,
    features: {
      privacy: true,
    },
  },

  // ============================================================
  // ZCASH
  // ============================================================
  {
    id: 'zcash',
    name: 'Zcash',
    symbol: 'ZEC',
    aliases: ['zec'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#ECB244',
    mainnet: {
      name: 'Zcash Mainnet',
      defaultPorts: { rpc: 8232, p2p: 8233 },
    },
    docker: {
      images: {
        full: 'electriccoinco/zcashd:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 4, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/133'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Zcash Explorer', url: 'https://zcashblockexplorer.com' },
    ],
    website: 'https://z.cash',
    coingeckoId: 'zcash',
    isActive: true,
    features: {
      privacy: true,
    },
  },

  // ============================================================
  // DASH
  // ============================================================
  {
    id: 'dash',
    name: 'Dash',
    symbol: 'DASH',
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'hybrid',
    color: '#008CE7',
    mainnet: {
      name: 'Dash Mainnet',
      defaultPorts: { rpc: 9998, p2p: 9999 },
    },
    docker: {
      images: {
        full: 'dashpay/dashd:latest',
      },
      requirements: {
        full: { diskGB: 50, memoryGB: 4, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/5'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Dash Explorer', url: 'https://insight.dash.org' },
    ],
    website: 'https://dash.org',
    coingeckoId: 'dash',
    isActive: true,
    features: {
      privacy: true,
    },
  },

  // ============================================================
  // HORIZEN
  // ============================================================
  {
    id: 'horizen',
    name: 'Horizen',
    symbol: 'ZEN',
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#00A79D',
    mainnet: {
      name: 'Horizen Mainnet',
      defaultPorts: { rpc: 8231, p2p: 9033 },
    },
    wallet: {
      derivationPath: "m/44'/121'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Horizen Explorer', url: 'https://explorer.horizen.io' },
    ],
    website: 'https://horizen.io',
    coingeckoId: 'zencash',
    isActive: true,
    features: {
      privacy: true,
      smartContracts: true,
    },
  },

  // ============================================================
  // PIRATE CHAIN
  // ============================================================
  {
    id: 'piratechain',
    name: 'Pirate Chain',
    symbol: 'ARRR',
    aliases: ['arrr'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#FFD700',
    mainnet: {
      name: 'Pirate Chain Mainnet',
      defaultPorts: { rpc: 45453, p2p: 7770 },
    },
    wallet: {
      derivationPath: "m/44'/141'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Pirate Explorer', url: 'https://explorer.pirate.black' },
    ],
    website: 'https://pirate.black',
    coingeckoId: 'pirate-chain',
    isActive: true,
    features: {
      privacy: true,
    },
  },

  // ============================================================
  // SECRET NETWORK
  // ============================================================
  {
    id: 'secret',
    name: 'Secret Network',
    symbol: 'SCRT',
    category: 'privacy',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#1B1B1B',
    mainnet: {
      name: 'Secret Network',
      rpcUrls: ['https://lcd-secret.whispernode.com'],
    },
    wallet: {
      derivationPath: "m/44'/529'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Mintscan', url: 'https://www.mintscan.io/secret' },
    ],
    website: 'https://scrt.network',
    coingeckoId: 'secret',
    isActive: true,
    features: {
      privacy: true,
      smartContracts: true,
    },
  },

  // ============================================================
  // DECRED
  // ============================================================
  {
    id: 'decred',
    name: 'Decred',
    symbol: 'DCR',
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'hybrid',
    color: '#2ED6A1',
    mainnet: {
      name: 'Decred Mainnet',
      defaultPorts: { rpc: 9109, p2p: 9108 },
    },
    docker: {
      images: {
        full: 'decred/dcrd:latest',
      },
      requirements: {
        full: { diskGB: 20, memoryGB: 4, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/42'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'dcrdata', url: 'https://dcrdata.decred.org' },
    ],
    website: 'https://decred.org',
    coingeckoId: 'decred',
    isActive: true,
    features: {
      privacy: true,
      governance: true,
      staking: true,
    },
  },

  // ============================================================
  // FIRO (ex-Zcoin)
  // ============================================================
  {
    id: 'firo',
    name: 'Firo',
    symbol: 'FIRO',
    aliases: ['zcoin', 'xzc'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'hybrid',
    color: '#9B1C2E',
    mainnet: {
      name: 'Firo Mainnet',
      defaultPorts: { rpc: 8888, p2p: 8168 },
    },
    wallet: {
      derivationPath: "m/44'/136'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Firo Explorer', url: 'https://explorer.firo.org' },
    ],
    website: 'https://firo.org',
    coingeckoId: 'firo',
    isActive: true,
    features: {
      privacy: true,
    },
  },
];
