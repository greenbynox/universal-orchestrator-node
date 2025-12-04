/**
 * ============================================================
 * BITCOIN FORKS & VARIANTS
 * ============================================================
 * All Bitcoin forks, variants and related UTXO chains
 */

import { BlockchainDefinition } from '../types';

export const BITCOIN_VARIANTS: BlockchainDefinition[] = [
  // ============================================================
  // BITCOIN CASH (BCH)
  // ============================================================
  {
    id: 'bitcoin-cash',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    aliases: ['bch', 'bcash'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#8DC351',
    icon: '₿',
    mainnet: {
      name: 'Bitcoin Cash Mainnet',
      defaultPorts: { rpc: 8332, p2p: 8333 },
    },
    docker: {
      images: {
        full: 'zquestz/bitcoin-cash-node:latest',
        pruned: 'zquestz/bitcoin-cash-node:latest',
        light: 'zquestz/bitcoin-cash-node:latest',
      },
      requirements: {
        full: { diskGB: 200, memoryGB: 4, syncDays: 3 },
        pruned: { diskGB: 10, memoryGB: 2, syncDays: 1 },
        light: { diskGB: 1, memoryGB: 1, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/145'/0'/0/0",
      addressPrefix: 'bitcoincash:q',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Blockchair', url: 'https://blockchair.com/bitcoin-cash' },
    ],
    website: 'https://bitcoincash.org',
    coingeckoId: 'bitcoin-cash',
    isActive: true,
    launchDate: '2017-08-01',
  },

  // ============================================================
  // BITCOIN SV (BSV)
  // ============================================================
  {
    id: 'bitcoin-sv',
    name: 'Bitcoin SV',
    symbol: 'BSV',
    aliases: ['bsv', 'satoshi-vision'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#EAB300',
    icon: '₿',
    mainnet: {
      name: 'Bitcoin SV Mainnet',
      defaultPorts: { rpc: 8332, p2p: 8333 },
    },
    docker: {
      images: {
        full: 'bitcoinsv/bitcoin-sv:latest',
        light: 'bitcoinsv/bitcoin-sv:latest',
      },
      requirements: {
        full: { diskGB: 300, memoryGB: 4, syncDays: 5 },
        light: { diskGB: 5, memoryGB: 2, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/236'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'WhatsOnChain', url: 'https://whatsonchain.com' },
    ],
    website: 'https://bitcoinsv.io',
    coingeckoId: 'bitcoin-cash-sv',
    isActive: true,
    launchDate: '2018-11-15',
  },

  // ============================================================
  // LITECOIN (LTC)
  // ============================================================
  {
    id: 'litecoin',
    name: 'Litecoin',
    symbol: 'LTC',
    aliases: ['ltc', 'lite'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#345D9D',
    icon: 'Ł',
    mainnet: {
      name: 'Litecoin Mainnet',
      defaultPorts: { rpc: 9332, p2p: 9333 },
    },
    docker: {
      images: {
        full: 'uphold/litecoin-core:latest',
        pruned: 'uphold/litecoin-core:latest',
        light: 'uphold/litecoin-core:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 2, syncDays: 2 },
        pruned: { diskGB: 5, memoryGB: 1, syncDays: 1 },
        light: { diskGB: 1, memoryGB: 0.5, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/84'/2'/0'/0/0",
      addressPrefix: 'ltc1',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Blockchair', url: 'https://blockchair.com/litecoin' },
    ],
    website: 'https://litecoin.org',
    coingeckoId: 'litecoin',
    isActive: true,
    launchDate: '2011-10-07',
  },

  // ============================================================
  // DOGECOIN (DOGE)
  // ============================================================
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    aliases: ['doge'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#C2A633',
    icon: 'Ð',
    mainnet: {
      name: 'Dogecoin Mainnet',
      defaultPorts: { rpc: 22555, p2p: 22556 },
    },
    docker: {
      images: {
        full: 'dogecoin/dogecoin:latest',
        light: 'dogecoin/dogecoin:latest',
      },
      requirements: {
        full: { diskGB: 80, memoryGB: 2, syncDays: 2 },
        light: { diskGB: 2, memoryGB: 1, syncDays: 0.2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/3'/0'/0/0",
      addressPrefix: 'D',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Dogechain', url: 'https://dogechain.info' },
    ],
    website: 'https://dogecoin.com',
    coingeckoId: 'dogecoin',
    isActive: true,
    launchDate: '2013-12-06',
  },

  // ============================================================
  // ZCASH (ZEC)
  // ============================================================
  {
    id: 'zcash',
    name: 'Zcash',
    symbol: 'ZEC',
    aliases: ['zec', 'zerocash'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#ECB244',
    icon: 'ⓩ',
    mainnet: {
      name: 'Zcash Mainnet',
      defaultPorts: { rpc: 8232, p2p: 8233 },
    },
    docker: {
      images: {
        full: 'electriccoinco/zcashd:latest',
        light: 'electriccoinco/lightwalletd:latest',
      },
      requirements: {
        full: { diskGB: 100, memoryGB: 4, syncDays: 3 },
        light: { diskGB: 2, memoryGB: 1, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/133'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Zcash Explorer', url: 'https://explorer.zcha.in' },
    ],
    website: 'https://z.cash',
    coingeckoId: 'zcash',
    isActive: true,
    launchDate: '2016-10-28',
    features: { shieldedTransactions: true },
  },

  // ============================================================
  // DASH
  // ============================================================
  {
    id: 'dash',
    name: 'Dash',
    symbol: 'DASH',
    aliases: ['dash', 'darkcoin', 'xcoin'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#008CE7',
    icon: 'Đ',
    mainnet: {
      name: 'Dash Mainnet',
      defaultPorts: { rpc: 9998, p2p: 9999 },
    },
    docker: {
      images: {
        full: 'dashpay/dashd:latest',
        light: 'dashpay/dashd:latest',
      },
      requirements: {
        full: { diskGB: 40, memoryGB: 2, syncDays: 1 },
        light: { diskGB: 2, memoryGB: 1, syncDays: 0.1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/5'/0'/0/0",
      addressPrefix: 'X',
      supportsHD: true,
      supportsMnemonic: true,
    },
    explorers: [
      { name: 'Dash Explorer', url: 'https://explorer.dash.org' },
    ],
    website: 'https://dash.org',
    coingeckoId: 'dash',
    isActive: true,
    launchDate: '2014-01-18',
    features: { instantSend: true, privacy: true },
  },

  // ============================================================
  // BITCOIN GOLD (BTG)
  // ============================================================
  {
    id: 'bitcoin-gold',
    name: 'Bitcoin Gold',
    symbol: 'BTG',
    aliases: ['btg'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#EBA809',
    icon: '₿',
    mainnet: {
      name: 'Bitcoin Gold Mainnet',
      defaultPorts: { rpc: 8332, p2p: 8338 },
    },
    docker: {
      images: {
        full: 'bitcoingold/bgoldd:latest',
      },
      requirements: {
        full: { diskGB: 50, memoryGB: 2, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/156'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://bitcoingold.org',
    coingeckoId: 'bitcoin-gold',
    isActive: true,
    launchDate: '2017-10-24',
  },

  // ============================================================
  // RAVENCOIN (RVN)
  // ============================================================
  {
    id: 'ravencoin',
    name: 'Ravencoin',
    symbol: 'RVN',
    aliases: ['rvn', 'raven'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#384182',
    icon: '🐦',
    mainnet: {
      name: 'Ravencoin Mainnet',
      defaultPorts: { rpc: 8766, p2p: 8767 },
    },
    docker: {
      images: {
        full: 'ravencoincore/ravencore:latest',
      },
      requirements: {
        full: { diskGB: 30, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/175'/0'/0/0",
      addressPrefix: 'R',
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://ravencoin.org',
    coingeckoId: 'ravencoin',
    isActive: true,
    launchDate: '2018-01-03',
    features: { assets: true },
  },

  // ============================================================
  // DIGIBYTE (DGB)
  // ============================================================
  {
    id: 'digibyte',
    name: 'DigiByte',
    symbol: 'DGB',
    aliases: ['dgb', 'digi'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#006AD2',
    icon: 'Ɗ',
    mainnet: {
      name: 'DigiByte Mainnet',
      defaultPorts: { rpc: 14022, p2p: 12024 },
    },
    docker: {
      images: {
        full: 'digibyte/digibyted:latest',
      },
      requirements: {
        full: { diskGB: 35, memoryGB: 2, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/20'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://digibyte.io',
    coingeckoId: 'digibyte',
    isActive: true,
    launchDate: '2014-01-10',
  },

  // ============================================================
  // HORIZEN (ZEN)
  // ============================================================
  {
    id: 'horizen',
    name: 'Horizen',
    symbol: 'ZEN',
    aliases: ['zen', 'zencash'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#00EAAB',
    icon: '◎',
    mainnet: {
      name: 'Horizen Mainnet',
      defaultPorts: { rpc: 8231, p2p: 9033 },
    },
    docker: {
      images: {
        full: 'zencash/zen-node:latest',
      },
      requirements: {
        full: { diskGB: 50, memoryGB: 4, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/121'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://horizen.io',
    coingeckoId: 'zencash',
    isActive: true,
    launchDate: '2017-05-30',
  },

  // ============================================================
  // QTUM
  // ============================================================
  {
    id: 'qtum',
    name: 'Qtum',
    symbol: 'QTUM',
    aliases: ['qtum'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pos',
    color: '#2E9AD0',
    icon: 'Q',
    mainnet: {
      name: 'Qtum Mainnet',
      defaultPorts: { rpc: 3889, p2p: 3888 },
    },
    docker: {
      images: {
        full: 'qtum/qtum:latest',
      },
      requirements: {
        full: { diskGB: 40, memoryGB: 2, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/2301'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://qtum.org',
    coingeckoId: 'qtum',
    isActive: true,
    launchDate: '2017-09-13',
  },

  // ============================================================
  // DECRED (DCR)
  // ============================================================
  {
    id: 'decred',
    name: 'Decred',
    symbol: 'DCR',
    aliases: ['dcr'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'hybrid',
    color: '#2ED6A1',
    icon: 'Ð',
    mainnet: {
      name: 'Decred Mainnet',
      defaultPorts: { rpc: 9109, p2p: 9108 },
    },
    docker: {
      images: {
        full: 'decred/dcrd:latest',
      },
      requirements: {
        full: { diskGB: 15, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/42'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://decred.org',
    coingeckoId: 'decred',
    isActive: true,
    launchDate: '2016-02-08',
  },

  // ============================================================
  // PIVX
  // ============================================================
  {
    id: 'pivx',
    name: 'PIVX',
    symbol: 'PIVX',
    aliases: ['pivx'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pos',
    color: '#5E4778',
    icon: '◊',
    mainnet: {
      name: 'PIVX Mainnet',
      defaultPorts: { rpc: 51473, p2p: 51472 },
    },
    docker: {
      images: {
        full: 'pivx/pivxd:latest',
      },
      requirements: {
        full: { diskGB: 15, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/119'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://pivx.org',
    coingeckoId: 'pivx',
    isActive: true,
    launchDate: '2016-02-01',
  },

  // ============================================================
  // FIRO (XZC)
  // ============================================================
  {
    id: 'firo',
    name: 'Firo',
    symbol: 'FIRO',
    aliases: ['firo', 'xzc', 'zcoin'],
    category: 'privacy',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#9B1C2E',
    icon: '🔥',
    mainnet: {
      name: 'Firo Mainnet',
      defaultPorts: { rpc: 8888, p2p: 8168 },
    },
    docker: {
      images: {
        full: 'firoorg/firod:latest',
      },
      requirements: {
        full: { diskGB: 20, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/136'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://firo.org',
    coingeckoId: 'zcoin',
    isActive: true,
    launchDate: '2016-09-28',
  },

  // ============================================================
  // NAMECOIN (NMC)
  // ============================================================
  {
    id: 'namecoin',
    name: 'Namecoin',
    symbol: 'NMC',
    aliases: ['nmc'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#186C8E',
    icon: 'ℕ',
    mainnet: {
      name: 'Namecoin Mainnet',
      defaultPorts: { rpc: 8336, p2p: 8334 },
    },
    docker: {
      images: {
        full: 'namecoin/namecoin-core:latest',
      },
      requirements: {
        full: { diskGB: 15, memoryGB: 2, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/44'/7'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://namecoin.org',
    coingeckoId: 'namecoin',
    isActive: true,
    launchDate: '2011-04-18',
  },

  // ============================================================
  // VERTCOIN (VTC)
  // ============================================================
  {
    id: 'vertcoin',
    name: 'Vertcoin',
    symbol: 'VTC',
    aliases: ['vtc', 'vert'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#048657',
    icon: 'V',
    mainnet: {
      name: 'Vertcoin Mainnet',
      defaultPorts: { rpc: 5888, p2p: 5889 },
    },
    docker: {
      images: {
        full: 'vertcoin/vertcoind:latest',
      },
      requirements: {
        full: { diskGB: 10, memoryGB: 1, syncDays: 1 },
      },
    },
    wallet: {
      derivationPath: "m/84'/28'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://vertcoin.org',
    coingeckoId: 'vertcoin',
    isActive: true,
    launchDate: '2014-01-10',
  },

  // ============================================================
  // SYSCOIN (SYS)
  // ============================================================
  {
    id: 'syscoin',
    name: 'Syscoin',
    symbol: 'SYS',
    aliases: ['sys'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#0082C6',
    icon: 'Ş',
    mainnet: {
      name: 'Syscoin Mainnet',
      defaultPorts: { rpc: 8370, p2p: 8369 },
    },
    docker: {
      images: {
        full: 'syscoin/syscoind:latest',
      },
      requirements: {
        full: { diskGB: 30, memoryGB: 2, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/57'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://syscoin.org',
    coingeckoId: 'syscoin',
    isActive: true,
    launchDate: '2014-08-16',
  },

  // ============================================================
  // GROESTLCOIN (GRS)
  // ============================================================
  {
    id: 'groestlcoin',
    name: 'Groestlcoin',
    symbol: 'GRS',
    aliases: ['grs'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#377E96',
    icon: 'Ǥ',
    mainnet: {
      name: 'Groestlcoin Mainnet',
      defaultPorts: { rpc: 1441, p2p: 1331 },
    },
    docker: {
      images: {
        full: 'groestlcoin/groestlcoind:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/84'/17'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://groestlcoin.org',
    coingeckoId: 'groestlcoin',
    isActive: true,
    launchDate: '2014-03-22',
  },

  // ============================================================
  // VIACOIN (VIA)
  // ============================================================
  {
    id: 'viacoin',
    name: 'Viacoin',
    symbol: 'VIA',
    aliases: ['via'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#565656',
    icon: 'V',
    mainnet: {
      name: 'Viacoin Mainnet',
      defaultPorts: { rpc: 5222, p2p: 5223 },
    },
    docker: {
      images: {
        full: 'viacoin/viacoind:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/14'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://viacoin.org',
    coingeckoId: 'viacoin',
    isActive: true,
    launchDate: '2014-07-18',
  },

  // ============================================================
  // KOMODO (KMD)
  // ============================================================
  {
    id: 'komodo',
    name: 'Komodo',
    symbol: 'KMD',
    aliases: ['kmd'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'dpow',
    color: '#326464',
    icon: 'K',
    mainnet: {
      name: 'Komodo Mainnet',
      defaultPorts: { rpc: 7771, p2p: 7770 },
    },
    docker: {
      images: {
        full: 'komodo/komodod:latest',
      },
      requirements: {
        full: { diskGB: 30, memoryGB: 4, syncDays: 2 },
      },
    },
    wallet: {
      derivationPath: "m/44'/141'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://komodoplatform.com',
    coingeckoId: 'komodo',
    isActive: true,
    launchDate: '2016-09-14',
  },

  // ============================================================
  // PEERCOIN (PPC)
  // ============================================================
  {
    id: 'peercoin',
    name: 'Peercoin',
    symbol: 'PPC',
    aliases: ['ppc', 'ppcoin'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pos',
    color: '#3CB054',
    icon: 'Ᵽ',
    mainnet: {
      name: 'Peercoin Mainnet',
      defaultPorts: { rpc: 9902, p2p: 9901 },
    },
    docker: {
      images: {
        full: 'peercoin/peercoind:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/6'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://peercoin.net',
    coingeckoId: 'peercoin',
    isActive: true,
    launchDate: '2012-08-19',
  },

  // ============================================================
  // PRIMECOIN (XPM)
  // ============================================================
  {
    id: 'primecoin',
    name: 'Primecoin',
    symbol: 'XPM',
    aliases: ['xpm'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#DDC542',
    icon: 'Ψ',
    mainnet: {
      name: 'Primecoin Mainnet',
      defaultPorts: { rpc: 9912, p2p: 9911 },
    },
    docker: {
      images: {
        full: 'primecoin/primecoind:latest',
      },
      requirements: {
        full: { diskGB: 3, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/24'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://primecoin.io',
    coingeckoId: 'primecoin',
    isActive: true,
    launchDate: '2013-07-07',
  },

  // ============================================================
  // FEATHERCOIN (FTC)
  // ============================================================
  {
    id: 'feathercoin',
    name: 'Feathercoin',
    symbol: 'FTC',
    aliases: ['ftc', 'feather'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#0FA6E0',
    icon: 'F',
    mainnet: {
      name: 'Feathercoin Mainnet',
      defaultPorts: { rpc: 9337, p2p: 9336 },
    },
    docker: {
      images: {
        full: 'feathercoin/feathercoind:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/8'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://feathercoin.com',
    coingeckoId: 'feathercoin',
    isActive: true,
    launchDate: '2013-04-16',
  },

  // ============================================================
  // EINSTEINIUM (EMC2)
  // ============================================================
  {
    id: 'einsteinium',
    name: 'Einsteinium',
    symbol: 'EMC2',
    aliases: ['emc2'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#00CBFF',
    icon: 'E',
    mainnet: {
      name: 'Einsteinium Mainnet',
      defaultPorts: { rpc: 41879, p2p: 41878 },
    },
    docker: {
      images: {
        full: 'einsteinium/einsteiniumd:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/41'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://einsteiniumcoin.com',
    coingeckoId: 'einsteinium',
    isActive: true,
    launchDate: '2014-03-01',
  },

  // ============================================================
  // BLACKCOIN (BLK)
  // ============================================================
  {
    id: 'blackcoin',
    name: 'Blackcoin',
    symbol: 'BLK',
    aliases: ['blk'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pos',
    color: '#181818',
    icon: 'B',
    mainnet: {
      name: 'Blackcoin Mainnet',
      defaultPorts: { rpc: 15715, p2p: 15714 },
    },
    docker: {
      images: {
        full: 'blackcoin/blackcoind:latest',
      },
      requirements: {
        full: { diskGB: 3, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/10'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://blackcoin.org',
    coingeckoId: 'blackcoin',
    isActive: true,
    launchDate: '2014-02-24',
  },

  // ============================================================
  // MONA (MONA)
  // ============================================================
  {
    id: 'monacoin',
    name: 'MonaCoin',
    symbol: 'MONA',
    aliases: ['mona'],
    category: 'layer1',
    chainType: 'utxo',
    consensus: 'pow',
    color: '#DEC799',
    icon: 'M',
    mainnet: {
      name: 'MonaCoin Mainnet',
      defaultPorts: { rpc: 9402, p2p: 9401 },
    },
    docker: {
      images: {
        full: 'monacoin/monacoind:latest',
      },
      requirements: {
        full: { diskGB: 5, memoryGB: 1, syncDays: 0.5 },
      },
    },
    wallet: {
      derivationPath: "m/44'/22'/0'/0/0",
      supportsHD: true,
      supportsMnemonic: true,
    },
    website: 'https://monacoin.org',
    coingeckoId: 'monacoin',
    isActive: true,
    launchDate: '2014-01-01',
  },
];
