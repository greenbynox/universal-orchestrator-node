/**
 * ============================================================
 * EVM CHAINS - Chaînes compatibles Ethereum Virtual Machine
 * ============================================================
 * BNB Chain, Polygon, Fantom, Cronos, etc.
 */

import { BlockchainDefinition, createEVMChain } from '../types';

export const EVM_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // BNB CHAIN (BSC)
  // ============================================================
  createEVMChain({
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    aliases: ['bsc', 'binance-smart-chain', 'bnb-chain'],
    category: 'evm',
    consensus: 'pos',
    color: '#F3BA2F',
    icon: '🔶',
    chainId: 56,
    mainnet: {
      name: 'BNB Smart Chain',
      rpcUrls: ['https://bsc-dataseed.binance.org', 'https://bsc-dataseed1.defibit.io'],
      defaultPorts: { rpc: 8545, p2p: 30311, ws: 8546 },
    },
    docker: {
      images: {
        full: 'ghcr.io/bnb-chain/bsc:latest',
        pruned: 'ghcr.io/bnb-chain/bsc:latest',
      },
      requirements: {
        full: { diskGB: 2500, memoryGB: 32, syncDays: 14 },
        pruned: { diskGB: 300, memoryGB: 16, syncDays: 3 },
      },
    },
    explorers: [
      { name: 'BscScan', url: 'https://bscscan.com', apiUrl: 'https://api.bscscan.com' },
    ],
    website: 'https://www.bnbchain.org',
    coingeckoId: 'binancecoin',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
      nft: true,
    },
  }),

  // ============================================================
  // POLYGON
  // ============================================================
  createEVMChain({
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    aliases: ['matic', 'polygon-pos'],
    category: 'evm',
    consensus: 'pos',
    color: '#8247E5',
    icon: '⬡',
    chainId: 137,
    mainnet: {
      name: 'Polygon Mainnet',
      rpcUrls: ['https://polygon-rpc.com', 'https://rpc-mainnet.matic.network'],
      defaultPorts: { rpc: 8545, p2p: 30303, ws: 8546 },
    },
    docker: {
      images: {
        full: 'maticnetwork/bor:latest',
      },
      requirements: {
        full: { diskGB: 2000, memoryGB: 16, syncDays: 7 },
      },
    },
    explorers: [
      { name: 'Polygonscan', url: 'https://polygonscan.com', apiUrl: 'https://api.polygonscan.com' },
    ],
    website: 'https://polygon.technology',
    coingeckoId: 'matic-network',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
      nft: true,
    },
  }),

  // ============================================================
  // FANTOM
  // ============================================================
  createEVMChain({
    id: 'fantom',
    name: 'Fantom',
    symbol: 'FTM',
    aliases: ['ftm'],
    category: 'evm',
    consensus: 'pos',
    color: '#1969FF',
    chainId: 250,
    mainnet: {
      name: 'Fantom Opera',
      rpcUrls: ['https://rpc.ftm.tools', 'https://rpcapi.fantom.network'],
      defaultPorts: { rpc: 18545, p2p: 5050 },
    },
    docker: {
      images: {
        full: 'fantomfoundation/go-opera:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 3 },
      },
    },
    explorers: [
      { name: 'FTMScan', url: 'https://ftmscan.com', apiUrl: 'https://api.ftmscan.com' },
    ],
    website: 'https://fantom.foundation',
    coingeckoId: 'fantom',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // CRONOS
  // ============================================================
  createEVMChain({
    id: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    aliases: ['cro', 'crypto-com-chain'],
    category: 'evm',
    consensus: 'pos',
    color: '#002D74',
    chainId: 25,
    mainnet: {
      name: 'Cronos Mainnet',
      rpcUrls: ['https://evm.cronos.org', 'https://cronos-evm.publicnode.com'],
      defaultPorts: { rpc: 8545, p2p: 26656 },
    },
    docker: {
      images: {
        full: 'crypto-org-chain/cronos:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 8, syncDays: 3 },
      },
    },
    explorers: [
      { name: 'Cronoscan', url: 'https://cronoscan.com' },
    ],
    website: 'https://cronos.org',
    coingeckoId: 'crypto-com-chain',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // GNOSIS (xDai)
  // ============================================================
  createEVMChain({
    id: 'gnosis',
    name: 'Gnosis Chain',
    symbol: 'xDAI',
    aliases: ['xdai', 'gnosis-chain'],
    category: 'evm',
    consensus: 'pos',
    color: '#04795B',
    chainId: 100,
    mainnet: {
      name: 'Gnosis Chain',
      rpcUrls: ['https://rpc.gnosischain.com', 'https://gnosis.publicnode.com'],
      defaultPorts: { rpc: 8545, p2p: 30303 },
    },
    docker: {
      images: {
        full: 'nethermind/nethermind:latest',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 8, syncDays: 2 },
      },
    },
    explorers: [
      { name: 'Gnosisscan', url: 'https://gnosisscan.io' },
    ],
    website: 'https://www.gnosis.io',
    coingeckoId: 'xdai',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // CELO
  // ============================================================
  createEVMChain({
    id: 'celo',
    name: 'Celo',
    symbol: 'CELO',
    category: 'evm',
    consensus: 'pos',
    color: '#35D07F',
    chainId: 42220,
    mainnet: {
      name: 'Celo Mainnet',
      rpcUrls: ['https://forno.celo.org'],
      defaultPorts: { rpc: 8545, p2p: 30303 },
    },
    docker: {
      images: {
        full: 'us.gcr.io/celo-org/geth:mainnet',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 8, syncDays: 2 },
      },
    },
    explorers: [
      { name: 'Celoscan', url: 'https://celoscan.io' },
    ],
    website: 'https://celo.org',
    coingeckoId: 'celo',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
    },
  }),

  // ============================================================
  // MOONBEAM
  // ============================================================
  createEVMChain({
    id: 'moonbeam',
    name: 'Moonbeam',
    symbol: 'GLMR',
    category: 'evm',
    consensus: 'pos',
    color: '#53CBC8',
    chainId: 1284,
    mainnet: {
      name: 'Moonbeam',
      rpcUrls: ['https://rpc.api.moonbeam.network'],
      defaultPorts: { rpc: 9944, p2p: 30333 },
    },
    docker: {
      images: {
        full: 'purestake/moonbeam:latest',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 8, syncDays: 2 },
      },
    },
    explorers: [
      { name: 'Moonscan', url: 'https://moonscan.io' },
    ],
    website: 'https://moonbeam.network',
    coingeckoId: 'moonbeam',
    isActive: true,
    features: {
      smartContracts: true,
      crossChain: true,
    },
  }),

  // ============================================================
  // MOONRIVER
  // ============================================================
  createEVMChain({
    id: 'moonriver',
    name: 'Moonriver',
    symbol: 'MOVR',
    category: 'evm',
    consensus: 'pos',
    color: '#F2B705',
    chainId: 1285,
    mainnet: {
      name: 'Moonriver',
      rpcUrls: ['https://rpc.api.moonriver.moonbeam.network'],
    },
    explorers: [
      { name: 'Moonscan', url: 'https://moonriver.moonscan.io' },
    ],
    website: 'https://moonbeam.network/moonriver',
    coingeckoId: 'moonriver',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // AURORA
  // ============================================================
  createEVMChain({
    id: 'aurora',
    name: 'Aurora',
    symbol: 'AURORA',
    category: 'evm',
    consensus: 'pos',
    color: '#70D44B',
    chainId: 1313161554,
    mainnet: {
      name: 'Aurora Mainnet',
      rpcUrls: ['https://mainnet.aurora.dev'],
    },
    explorers: [
      { name: 'Aurorascan', url: 'https://aurorascan.dev' },
    ],
    website: 'https://aurora.dev',
    coingeckoId: 'aurora-near',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // KAVA
  // ============================================================
  createEVMChain({
    id: 'kava',
    name: 'Kava',
    symbol: 'KAVA',
    category: 'evm',
    consensus: 'pos',
    color: '#FF564F',
    chainId: 2222,
    mainnet: {
      name: 'Kava EVM',
      rpcUrls: ['https://evm.kava.io', 'https://evm2.kava.io'],
    },
    explorers: [
      { name: 'Kavascan', url: 'https://kavascan.com' },
    ],
    website: 'https://www.kava.io',
    coingeckoId: 'kava',
    isActive: true,
    features: {
      smartContracts: true,
      defi: true,
    },
  }),

  // ============================================================
  // KLAYTN
  // ============================================================
  createEVMChain({
    id: 'klaytn',
    name: 'Klaytn',
    symbol: 'KLAY',
    category: 'evm',
    consensus: 'pbft',
    color: '#FE5A1B',
    chainId: 8217,
    mainnet: {
      name: 'Klaytn Mainnet',
      rpcUrls: ['https://public-node-api.klaytnapi.com/v1/cypress'],
    },
    explorers: [
      { name: 'Klaytnscope', url: 'https://scope.klaytn.com' },
    ],
    website: 'https://klaytn.foundation',
    coingeckoId: 'klay-token',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // METIS
  // ============================================================
  createEVMChain({
    id: 'metis',
    name: 'Metis Andromeda',
    symbol: 'METIS',
    category: 'evm',
    consensus: 'pos',
    color: '#00DACC',
    chainId: 1088,
    mainnet: {
      name: 'Metis Andromeda',
      rpcUrls: ['https://andromeda.metis.io/?owner=1088'],
    },
    explorers: [
      { name: 'Andromeda Explorer', url: 'https://andromeda-explorer.metis.io' },
    ],
    website: 'https://www.metis.io',
    coingeckoId: 'metis-token',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // BOBA NETWORK
  // ============================================================
  createEVMChain({
    id: 'boba',
    name: 'Boba Network',
    symbol: 'BOBA',
    category: 'evm',
    consensus: 'pos',
    color: '#CCFF00',
    chainId: 288,
    mainnet: {
      name: 'Boba Network',
      rpcUrls: ['https://mainnet.boba.network'],
    },
    explorers: [
      { name: 'Bobascan', url: 'https://bobascan.com' },
    ],
    website: 'https://boba.network',
    coingeckoId: 'boba-network',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // EVMOS
  // ============================================================
  createEVMChain({
    id: 'evmos',
    name: 'Evmos',
    symbol: 'EVMOS',
    category: 'evm',
    consensus: 'pos',
    color: '#ED4E33',
    chainId: 9001,
    mainnet: {
      name: 'Evmos Mainnet',
      rpcUrls: ['https://evmos-evm.publicnode.com'],
    },
    explorers: [
      { name: 'Mintscan', url: 'https://www.mintscan.io/evmos' },
    ],
    website: 'https://evmos.org',
    coingeckoId: 'evmos',
    isActive: true,
    features: {
      smartContracts: true,
      crossChain: true,
    },
  }),

  // ============================================================
  // HARMONY
  // ============================================================
  createEVMChain({
    id: 'harmony',
    name: 'Harmony',
    symbol: 'ONE',
    category: 'evm',
    consensus: 'pos',
    color: '#00AEE9',
    chainId: 1666600000,
    mainnet: {
      name: 'Harmony Mainnet',
      rpcUrls: ['https://api.harmony.one', 'https://harmony.publicnode.com'],
    },
    explorers: [
      { name: 'Harmony Explorer', url: 'https://explorer.harmony.one' },
    ],
    website: 'https://www.harmony.one',
    coingeckoId: 'harmony',
    isActive: true,
    features: {
      smartContracts: true,
      crossChain: true,
    },
  }),

  // ============================================================
  // FUSE
  // ============================================================
  createEVMChain({
    id: 'fuse',
    name: 'Fuse',
    symbol: 'FUSE',
    category: 'evm',
    consensus: 'pos',
    color: '#B4F9BA',
    chainId: 122,
    mainnet: {
      name: 'Fuse Mainnet',
      rpcUrls: ['https://rpc.fuse.io'],
    },
    explorers: [
      { name: 'Fuse Explorer', url: 'https://explorer.fuse.io' },
    ],
    website: 'https://fuse.io',
    coingeckoId: 'fuse-network-token',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // OASIS
  // ============================================================
  createEVMChain({
    id: 'oasis',
    name: 'Oasis Emerald',
    symbol: 'ROSE',
    category: 'evm',
    consensus: 'pos',
    color: '#0092F6',
    chainId: 42262,
    mainnet: {
      name: 'Oasis Emerald',
      rpcUrls: ['https://emerald.oasis.dev'],
    },
    explorers: [
      { name: 'Oasis Explorer', url: 'https://explorer.emerald.oasis.dev' },
    ],
    website: 'https://oasisprotocol.org',
    coingeckoId: 'oasis-network',
    isActive: true,
    features: {
      smartContracts: true,
      privacy: true,
    },
  }),

  // ============================================================
  // ASTAR
  // ============================================================
  createEVMChain({
    id: 'astar',
    name: 'Astar',
    symbol: 'ASTR',
    category: 'evm',
    consensus: 'pos',
    color: '#0AE2FF',
    chainId: 592,
    mainnet: {
      name: 'Astar Network',
      rpcUrls: ['https://evm.astar.network'],
    },
    explorers: [
      { name: 'Astar Subscan', url: 'https://astar.subscan.io' },
    ],
    website: 'https://astar.network',
    coingeckoId: 'astar',
    isActive: true,
    features: {
      smartContracts: true,
      crossChain: true,
    },
  }),

  // ============================================================
  // MANTLE
  // ============================================================
  createEVMChain({
    id: 'mantle',
    name: 'Mantle',
    symbol: 'MNT',
    category: 'evm',
    consensus: 'pos',
    color: '#000000',
    chainId: 5000,
    mainnet: {
      name: 'Mantle Mainnet',
      rpcUrls: ['https://rpc.mantle.xyz'],
    },
    explorers: [
      { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
    ],
    website: 'https://www.mantle.xyz',
    coingeckoId: 'mantle',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // LINEA
  // ============================================================
  createEVMChain({
    id: 'linea',
    name: 'Linea',
    symbol: 'ETH',
    aliases: ['linea-mainnet'],
    category: 'evm',
    consensus: 'pos',
    color: '#61DFFF',
    chainId: 59144,
    mainnet: {
      name: 'Linea Mainnet',
      rpcUrls: ['https://rpc.linea.build'],
    },
    explorers: [
      { name: 'Lineascan', url: 'https://lineascan.build' },
    ],
    website: 'https://linea.build',
    coingeckoId: 'linea',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // SCROLL
  // ============================================================
  createEVMChain({
    id: 'scroll',
    name: 'Scroll',
    symbol: 'ETH',
    category: 'evm',
    consensus: 'pos',
    color: '#FFEEDA',
    chainId: 534352,
    mainnet: {
      name: 'Scroll Mainnet',
      rpcUrls: ['https://rpc.scroll.io'],
    },
    explorers: [
      { name: 'Scrollscan', url: 'https://scrollscan.com' },
    ],
    website: 'https://scroll.io',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // ZKSYNC ERA
  // ============================================================
  createEVMChain({
    id: 'zksync',
    name: 'zkSync Era',
    symbol: 'ETH',
    aliases: ['zksync-era'],
    category: 'evm',
    consensus: 'pos',
    color: '#8C8DFC',
    chainId: 324,
    mainnet: {
      name: 'zkSync Era Mainnet',
      rpcUrls: ['https://mainnet.era.zksync.io'],
    },
    explorers: [
      { name: 'zkSync Explorer', url: 'https://explorer.zksync.io' },
    ],
    website: 'https://zksync.io',
    coingeckoId: 'zksync',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),

  // ============================================================
  // POLYGON ZKEVM
  // ============================================================
  createEVMChain({
    id: 'polygon-zkevm',
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    category: 'evm',
    consensus: 'pos',
    color: '#8247E5',
    chainId: 1101,
    mainnet: {
      name: 'Polygon zkEVM',
      rpcUrls: ['https://zkevm-rpc.com'],
    },
    explorers: [
      { name: 'Polygon zkEVM Explorer', url: 'https://zkevm.polygonscan.com' },
    ],
    website: 'https://polygon.technology/polygon-zkevm',
    isActive: true,
    features: {
      smartContracts: true,
    },
  }),
];
