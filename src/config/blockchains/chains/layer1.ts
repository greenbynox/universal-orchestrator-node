/**
 * ============================================================
 * LAYER 1 CHAINS - Principales blockchains
 * ============================================================
 * Bitcoin, Ethereum, Solana, Cardano, Polkadot, Avalanche, etc.
 */

import { BlockchainDefinition } from '../types';

export const LAYER1_CHAINS: BlockchainDefinition[] = [
  // ============================================================
  // BITCOIN
  // ============================================================
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    aliases: ['btc', 'xbt', 'satoshi'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#F7931A',
    icon: '₿',
    mainnet: {
      name: 'Bitcoin Mainnet',
      defaultPorts: { rpc: 8332, p2p: 8333 },
    },
    testnet: {
      name: 'Bitcoin Testnet',
      defaultPorts: { rpc: 18332, p2p: 18333 },
    },
    docker: {
      images: {
        full: 'kylemanna/bitcoind:latest',
        pruned: 'kylemanna/bitcoind:latest',
        light: 'lncm/neutrino:latest',
      },
      requirements: {
        full: { diskGB: 600, memoryGB: 4, syncDays: 7 },
        pruned: { diskGB: 10, memoryGB: 2, syncDays: 3 },
        light: { diskGB: 1, memoryGB: 1, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/84'/0'/0'/0/0",
      addressPrefix: 'bc1',
      supportsHD: true,
      supportsMnemonic: true,
      defaultAddressType: 'bech32',
    },
    explorers: [
      { name: 'Blockchain.com', url: 'https://www.blockchain.com/btc' },
      { name: 'Blockstream', url: 'https://blockstream.info' },
      { name: 'Mempool', url: 'https://mempool.space' },
    ],
    website: 'https://bitcoin.org',
    coingeckoId: 'bitcoin',
    isActive: true,
    launchDate: '2009-01-03',
    features: {
      segwit: true,
      taproot: true,
    },
  },

  // ============================================================
  // ETHEREUM
  // ============================================================
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    aliases: ['eth', 'ether'],
    category: 'layer1',
    chainType: 'evm',
    consensus: 'pos',
    color: '#627EEA',
    icon: 'Ξ',
    chainId: 1,
    mainnet: {
      name: 'Ethereum Mainnet',
      rpcUrls: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
      defaultPorts: { rpc: 8545, p2p: 30303, ws: 8546 },
    },
    testnet: {
      name: 'Sepolia',
      rpcUrls: ['https://rpc.sepolia.org'],
      defaultPorts: { rpc: 8545, p2p: 30303, ws: 8546 },
    },
    docker: {
      images: {
        full: 'ethereum/client-go:latest',
        pruned: 'ethereum/client-go:latest',
        light: 'ethereum/client-go:latest',
        archive: 'ethereum/client-go:latest',
      },
      requirements: {
        full: { diskGB: 1000, memoryGB: 16, syncDays: 7 },
        pruned: { diskGB: 250, memoryGB: 8, syncDays: 2 },
        light: { diskGB: 1, memoryGB: 2, syncDays: 0.1 },
        archive: { diskGB: 15000, memoryGB: 32, syncDays: 30 },
      },
    },
    wallet: {
      derivationPath: "m/44'/60'/0'/0/0",
      addressPrefix: '0x',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Etherscan', url: 'https://etherscan.io', apiUrl: 'https://api.etherscan.io' },
      { name: 'Blockscout', url: 'https://eth.blockscout.com' },
    ],
    website: 'https://ethereum.org',
    github: 'https://github.com/ethereum',
    coingeckoId: 'ethereum',
    isActive: true,
    launchDate: '2015-07-30',
    features: {
      smartContracts: true,
      nft: true,
      defi: true,
      staking: true,
      eip1559: true,
    },
  },

  // ============================================================
  // SOLANA
  // ============================================================
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    aliases: ['sol'],
    category: 'layer1',
    chainType: 'solana',
    consensus: 'pos',
    color: '#14F195',
    icon: '◎',
    mainnet: {
      name: 'Solana Mainnet',
      rpcUrls: ['https://api.mainnet-beta.solana.com'],
      defaultPorts: { rpc: 8899, p2p: 8001, ws: 8900 },
    },
    testnet: {
      name: 'Solana Devnet',
      rpcUrls: ['https://api.devnet.solana.com'],
    },
    docker: {
      images: {
        full: 'solanalabs/solana:latest',
        light: 'solanalabs/solana:latest',
      },
      requirements: {
        full: { diskGB: 2000, memoryGB: 128, syncDays: 1 },
        light: { diskGB: 50, memoryGB: 16, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/501'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Solscan', url: 'https://solscan.io' },
      { name: 'Solana Explorer', url: 'https://explorer.solana.com' },
    ],
    website: 'https://solana.com',
    coingeckoId: 'solana',
    isActive: true,
    launchDate: '2020-03-16',
    features: {
      smartContracts: true,
      nft: true,
      defi: true,
      staking: true,
    },
  },

  // ============================================================
  // CARDANO
  // ============================================================
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    aliases: ['ada'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'pos',
    color: '#0033AD',
    icon: '₳',
    mainnet: {
      name: 'Cardano Mainnet',
      defaultPorts: { rpc: 3001, p2p: 3000 },
    },
    docker: {
      images: {
        full: 'inputoutput/cardano-node:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 16, syncDays: 3 },
      },
    },
    wallet: {
      derivationPath: "m/1852'/1815'/0'/0/0",
      addressPrefix: 'addr1',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Cardanoscan', url: 'https://cardanoscan.io' },
      { name: 'Cexplorer', url: 'https://cexplorer.io' },
    ],
    website: 'https://cardano.org',
    coingeckoId: 'cardano',
    isActive: true,
    launchDate: '2017-09-29',
    features: {
      smartContracts: true,
      staking: true,
      governance: true,
    },
  },

  // ============================================================
  // POLKADOT
  // ============================================================
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    aliases: ['dot'],
    category: 'layer1',
    chainType: 'substrate',
    consensus: 'pos',
    color: '#E6007A',
    icon: '●',
    mainnet: {
      name: 'Polkadot Relay Chain',
      rpcUrls: ['wss://rpc.polkadot.io'],
      defaultPorts: { rpc: 9933, p2p: 30333, ws: 9944 },
    },
    docker: {
      images: {
        full: 'parity/polkadot:latest',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 8, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/354'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Subscan', url: 'https://polkadot.subscan.io' },
      { name: 'Polkascan', url: 'https://polkascan.io/polkadot' },
    ],
    website: 'https://polkadot.network',
    coingeckoId: 'polkadot',
    isActive: true,
    launchDate: '2020-05-26',
    features: {
      staking: true,
      governance: true,
      crossChain: true,
    },
  },

  // ============================================================
  // AVALANCHE
  // ============================================================
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    aliases: ['avax'],
    category: 'layer1',
    chainType: 'evm',
    consensus: 'pos',
    color: '#E84142',
    icon: '🔺',
    chainId: 43114,
    mainnet: {
      name: 'Avalanche C-Chain',
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      defaultPorts: { rpc: 9650, p2p: 9651 },
    },
    docker: {
      images: {
        full: 'avaplatform/avalanchego:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 3 },
      },
    },
    wallet: {
      derivationPath: "m/44'/60'/0'/0/0",
      addressPrefix: '0x',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Snowtrace', url: 'https://snowtrace.io' },
      { name: 'Avascan', url: 'https://avascan.info' },
    ],
    website: 'https://avax.network',
    coingeckoId: 'avalanche-2',
    isActive: true,
    launchDate: '2020-09-21',
    features: {
      smartContracts: true,
      defi: true,
      staking: true,
      crossChain: true,
    },
  },

  // ============================================================
  // COSMOS
  // ============================================================
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    aliases: ['atom', 'cosmos-hub'],
    category: 'layer1',
    chainType: 'cosmos',
    consensus: 'pos',
    color: '#2E3148',
    icon: '⚛',
    mainnet: {
      name: 'Cosmos Hub',
      rpcUrls: ['https://cosmos-rpc.polkachu.com'],
      defaultPorts: { rpc: 26657, p2p: 26656 },
    },
    docker: {
      images: {
        full: 'cosmoshub/gaia:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 16, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/118'/0'/0/0",
      addressPrefix: 'cosmos',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Mintscan', url: 'https://www.mintscan.io/cosmos' },
    ],
    website: 'https://cosmos.network',
    coingeckoId: 'cosmos',
    isActive: true,
    launchDate: '2019-03-14',
    features: {
      staking: true,
      governance: true,
      crossChain: true,
    },
  },

  // ============================================================
  // NEAR PROTOCOL
  // ============================================================
  {
    id: 'near',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    aliases: ['near-protocol'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'pos',
    color: '#00C08B',
    icon: 'Ⓝ',
    mainnet: {
      name: 'NEAR Mainnet',
      rpcUrls: ['https://rpc.mainnet.near.org'],
      defaultPorts: { rpc: 3030, p2p: 24567 },
    },
    docker: {
      images: {
        full: 'nearprotocol/nearcore:latest',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 8, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/397'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'NEAR Explorer', url: 'https://explorer.near.org' },
      { name: 'Nearblocks', url: 'https://nearblocks.io' },
    ],
    website: 'https://near.org',
    coingeckoId: 'near',
    isActive: true,
    launchDate: '2020-04-22',
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // ALGORAND
  // ============================================================
  {
    id: 'algorand',
    name: 'Algorand',
    symbol: 'ALGO',
    aliases: ['algo'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'pos',
    color: '#000000',
    icon: 'Ⱥ',
    mainnet: {
      name: 'Algorand Mainnet',
      rpcUrls: ['https://mainnet-api.algonode.cloud'],
      defaultPorts: { rpc: 8080, p2p: 4160 },
    },
    docker: {
      images: {
        full: 'algorand/algod:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 4, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/283'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Algoexplorer', url: 'https://algoexplorer.io' },
    ],
    website: 'https://algorand.com',
    coingeckoId: 'algorand',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // TEZOS
  // ============================================================
  {
    id: 'tezos',
    name: 'Tezos',
    symbol: 'XTZ',
    aliases: ['xtz'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'pos',
    color: '#2C7DF7',
    icon: 'ꜩ',
    mainnet: {
      name: 'Tezos Mainnet',
      rpcUrls: ['https://mainnet.api.tez.ie'],
      defaultPorts: { rpc: 8732, p2p: 9732 },
    },
    docker: {
      images: {
        full: 'tezos/tezos:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 8, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/1729'/0'/0'",
      addressPrefix: 'tz1',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'TzKT', url: 'https://tzkt.io' },
      { name: 'TzStats', url: 'https://tzstats.com' },
    ],
    website: 'https://tezos.com',
    coingeckoId: 'tezos',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
      governance: true,
    },
  },

  // ============================================================
  // APTOS
  // ============================================================
  {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    aliases: ['apt'],
    category: 'layer1',
    chainType: 'move',
    consensus: 'pos',
    color: '#2DD8A7',
    mainnet: {
      name: 'Aptos Mainnet',
      rpcUrls: ['https://fullnode.mainnet.aptoslabs.com'],
      defaultPorts: { rpc: 8080, p2p: 6182 },
    },
    docker: {
      images: {
        full: 'aptoslabs/validator:mainnet',
      },
      requirements: {
        full: { diskGB: 300, memoryGB: 32, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/637'/0'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Aptos Explorer', url: 'https://explorer.aptoslabs.com' },
    ],
    website: 'https://aptoslabs.com',
    coingeckoId: 'aptos',
    isActive: true,
    launchDate: '2022-10-17',
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // SUI
  // ============================================================
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    category: 'layer1',
    chainType: 'move',
    consensus: 'pos',
    color: '#6FBCF0',
    mainnet: {
      name: 'Sui Mainnet',
      rpcUrls: ['https://fullnode.mainnet.sui.io'],
      defaultPorts: { rpc: 9000, p2p: 8084 },
    },
    docker: {
      images: {
        full: 'mysten/sui-node:mainnet',
      },
      requirements: {
        full: { diskGB: 500, memoryGB: 32, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/784'/0'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Suiscan', url: 'https://suiscan.xyz' },
      { name: 'Sui Explorer', url: 'https://explorer.sui.io' },
    ],
    website: 'https://sui.io',
    coingeckoId: 'sui',
    isActive: true,
    launchDate: '2023-05-03',
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // TON (The Open Network)
  // ============================================================
  {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    aliases: ['toncoin', 'the-open-network'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'pos',
    color: '#0088CC',
    icon: '💎',
    mainnet: {
      name: 'TON Mainnet',
      defaultPorts: { rpc: 80, p2p: 30310 },
    },
    docker: {
      images: {
        full: 'ton-blockchain/ton:latest',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 8, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/607'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Tonscan', url: 'https://tonscan.org' },
      { name: 'TON Explorer', url: 'https://explorer.toncoin.org' },
    ],
    website: 'https://ton.org',
    coingeckoId: 'the-open-network',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // HEDERA
  // ============================================================
  {
    id: 'hedera',
    name: 'Hedera',
    symbol: 'HBAR',
    aliases: ['hbar', 'hedera-hashgraph'],
    category: 'layer1',
    chainType: 'dag',
    consensus: 'pbft',
    color: '#222222',
    mainnet: {
      name: 'Hedera Mainnet',
      defaultPorts: { rpc: 50211, p2p: 50111 },
    },
    wallet: {
      derivationPath: "m/44'/3030'/0'/0'/0'",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'HashScan', url: 'https://hashscan.io' },
    ],
    website: 'https://hedera.com',
    coingeckoId: 'hedera-hashgraph',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
    },
  },

  // ============================================================
  // INTERNET COMPUTER (ICP)
  // ============================================================
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    aliases: ['dfinity', 'internet-computer'],
    category: 'layer1',
    chainType: 'other',
    consensus: 'other',
    color: '#29ABE2',
    mainnet: {
      name: 'Internet Computer',
      rpcUrls: ['https://ic0.app'],
    },
    wallet: {
      derivationPath: "m/44'/223'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'IC Dashboard', url: 'https://dashboard.internetcomputer.org' },
    ],
    website: 'https://internetcomputer.org',
    coingeckoId: 'internet-computer',
    isActive: true,
    features: {
      smartContracts: true,
      staking: true,
    },
  },
];
