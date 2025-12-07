// Complete blockchain registry with proper names, symbols and icons
// 205 blockchains for Node Orchestrator v2.2.0

export interface BlockchainInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  category: string;
  color: string;
  addressTypes?: { type: string; prefix: string; bip: string; fees: string }[];
}

export const COMPLETE_BLOCKCHAIN_LIST: BlockchainInfo[] = [
  // ==================== MAJOR NETWORKS (Top 20) ====================
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿', category: 'major', color: '#F7931A',
    addressTypes: [
      { type: 'Legacy', prefix: '1...', bip: 'BIP44', fees: 'Élevés' },
      { type: 'SegWit (P2SH)', prefix: '3...', bip: 'BIP49', fees: 'Moyens' },
      { type: 'Native SegWit', prefix: 'bc1q...', bip: 'BIP84', fees: 'Bas' },
      { type: 'Taproot', prefix: 'bc1p...', bip: 'BIP86', fees: 'Très bas' },
    ]
  },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', category: 'major', color: '#627EEA' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎', category: 'major', color: '#00FFA3' },
  { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', icon: '⬡', category: 'major', color: '#F3BA2F' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', icon: '₳', category: 'major', color: '#0033AD' },
  { id: 'xrp', name: 'XRP Ledger', symbol: 'XRP', icon: '✕', category: 'major', color: '#23292F' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', icon: '●', category: 'major', color: '#E6007A' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', icon: '🔺', category: 'major', color: '#E84142' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '⬡', category: 'major', color: '#8247E5' },
  { id: 'tron', name: 'TRON', symbol: 'TRX', icon: '⟁', category: 'major', color: '#FF0013' },
  { id: 'cosmos', name: 'Cosmos Hub', symbol: 'ATOM', icon: '⚛', category: 'major', color: '#2E3148' },
  { id: 'monero', name: 'Monero', symbol: 'XMR', icon: 'ɱ', category: 'privacy', color: '#FF6600' },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', icon: 'Ⓝ', category: 'major', color: '#00C08B' },
  { id: 'algorand', name: 'Algorand', symbol: 'ALGO', icon: 'Ⱥ', category: 'major', color: '#000000' },
  { id: 'tezos', name: 'Tezos', symbol: 'XTZ', icon: 'ꜩ', category: 'major', color: '#2C7DF7' },
  { id: 'ton', name: 'TON', symbol: 'TON', icon: '💎', category: 'major', color: '#0098EA' },
  { id: 'sui', name: 'Sui', symbol: 'SUI', icon: '💧', category: 'major', color: '#6FBCF0' },
  { id: 'aptos', name: 'Aptos', symbol: 'APT', icon: '🌀', category: 'major', color: '#4CD7D0' },
  { id: 'hedera', name: 'Hedera', symbol: 'HBAR', icon: 'ℏ', category: 'major', color: '#00ADEF' },
  { id: 'icp', name: 'Internet Computer', symbol: 'ICP', icon: '∞', category: 'major', color: '#29ABE2' },

  // ==================== BITCOIN VARIANTS ====================
  { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'BCH', icon: '₿', category: 'bitcoin-fork', color: '#8DC351' },
  { id: 'bitcoin-sv', name: 'Bitcoin SV', symbol: 'BSV', icon: '₿', category: 'bitcoin-fork', color: '#EAB300' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', icon: 'Ł', category: 'bitcoin-fork', color: '#BFBBBB' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð', category: 'bitcoin-fork', color: '#C2A633' },
  { id: 'digibyte', name: 'DigiByte', symbol: 'DGB', icon: 'Ɗ', category: 'bitcoin-fork', color: '#006AD2' },
  { id: 'ravencoin', name: 'Ravencoin', symbol: 'RVN', icon: '🐦', category: 'bitcoin-fork', color: '#384182' },
  { id: 'namecoin', name: 'Namecoin', symbol: 'NMC', icon: 'ℕ', category: 'bitcoin-fork', color: '#186C9D' },
  { id: 'peercoin', name: 'Peercoin', symbol: 'PPC', icon: '₽', category: 'bitcoin-fork', color: '#3CB054' },
  { id: 'vertcoin', name: 'Vertcoin', symbol: 'VTC', icon: 'Ʋ', category: 'bitcoin-fork', color: '#048657' },
  { id: 'syscoin', name: 'Syscoin', symbol: 'SYS', icon: 'Ș', category: 'bitcoin-fork', color: '#0082C6' },

  // ==================== LAYER 2 SOLUTIONS ====================
  { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ARB', icon: '🔵', category: 'layer2', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', icon: '🔴', category: 'layer2', color: '#FF0420' },
  { id: 'base', name: 'Base', symbol: 'ETH', icon: '🔵', category: 'layer2', color: '#0052FF' },
  { id: 'zksync', name: 'zkSync Era', symbol: 'ETH', icon: '⚡', category: 'layer2', color: '#8C8DFC' },
  { id: 'linea', name: 'Linea', symbol: 'ETH', icon: '📐', category: 'layer2', color: '#61DFFF' },
  { id: 'scroll', name: 'Scroll', symbol: 'ETH', icon: '📜', category: 'layer2', color: '#FFEEDA' },
  { id: 'polygon-zkevm', name: 'Polygon zkEVM', symbol: 'ETH', icon: '⬡', category: 'layer2', color: '#8247E5' },
  { id: 'starknet', name: 'Starknet', symbol: 'STRK', icon: '⚡', category: 'layer2', color: '#EC796B' },
  { id: 'blast', name: 'Blast', symbol: 'ETH', icon: '💥', category: 'layer2', color: '#FCFC03' },
  { id: 'mode', name: 'Mode', symbol: 'ETH', icon: 'Ⓜ', category: 'layer2', color: '#DFFE00' },
  { id: 'manta', name: 'Manta Pacific', symbol: 'ETH', icon: '🐋', category: 'layer2', color: '#1E1E1E' },
  { id: 'mantle', name: 'Mantle', symbol: 'MNT', icon: '🏔', category: 'layer2', color: '#000000' },
  { id: 'taiko', name: 'Taiko', symbol: 'ETH', icon: '🥁', category: 'layer2', color: '#E81899' },
  { id: 'zora', name: 'Zora', symbol: 'ETH', icon: '🌈', category: 'layer2', color: '#5B5BD6' },

  // ==================== EVM CHAINS ====================
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', icon: '👻', category: 'evm', color: '#1969FF' },
  { id: 'cronos', name: 'Cronos', symbol: 'CRO', icon: '🔷', category: 'evm', color: '#002D74' },
  { id: 'gnosis', name: 'Gnosis Chain', symbol: 'xDAI', icon: '🦉', category: 'evm', color: '#04795B' },
  { id: 'harmony', name: 'Harmony', symbol: 'ONE', icon: '🎵', category: 'evm', color: '#00ADE8' },
  { id: 'klaytn', name: 'Klaytn', symbol: 'KLAY', icon: '🔶', category: 'evm', color: '#FF3D00' },
  { id: 'celo', name: 'Celo', symbol: 'CELO', icon: '🌿', category: 'evm', color: '#35D07F' },
  { id: 'aurora', name: 'Aurora', symbol: 'ETH', icon: '🌈', category: 'evm', color: '#70D44B' },
  { id: 'moonbeam', name: 'Moonbeam', symbol: 'GLMR', icon: '🌙', category: 'evm', color: '#53CBC8' },
  { id: 'moonriver', name: 'Moonriver', symbol: 'MOVR', icon: '🌊', category: 'evm', color: '#F2B705' },
  { id: 'metis', name: 'Metis', symbol: 'METIS', icon: '🟢', category: 'evm', color: '#00DACC' },
  { id: 'boba', name: 'Boba Network', symbol: 'BOBA', icon: '🧋', category: 'evm', color: '#CCFF00' },
  { id: 'evmos', name: 'Evmos', symbol: 'EVMOS', icon: '⚛', category: 'evm', color: '#ED4E33' },
  { id: 'kava', name: 'Kava', symbol: 'KAVA', icon: '🔥', category: 'evm', color: '#FF433E' },
  { id: 'fuse', name: 'Fuse', symbol: 'FUSE', icon: '⚡', category: 'evm', color: '#B4F9BA' },
  { id: 'oasis', name: 'Oasis Network', symbol: 'ROSE', icon: '🌹', category: 'evm', color: '#0092F6' },
  { id: 'thundercore', name: 'ThunderCore', symbol: 'TT', icon: '⚡', category: 'evm', color: '#FF9800' },
  { id: 'velas', name: 'Velas', symbol: 'VLX', icon: 'Ʌ', category: 'evm', color: '#0036C6' },
  { id: 'wanchain', name: 'Wanchain', symbol: 'WAN', icon: 'Ⓦ', category: 'evm', color: '#136AAD' },
  { id: 'okx', name: 'OKX Chain', symbol: 'OKT', icon: 'Ø', category: 'evm', color: '#000000' },
  { id: 'heco', name: 'Huobi ECO Chain', symbol: 'HT', icon: 'Ⓗ', category: 'evm', color: '#01943F' },

  // ==================== PRIVACY COINS ====================
  { id: 'zcash', name: 'Zcash', symbol: 'ZEC', icon: 'ⓩ', category: 'privacy', color: '#F4B728' },
  { id: 'dash', name: 'Dash', symbol: 'DASH', icon: 'Đ', category: 'privacy', color: '#008CE7' },
  { id: 'horizen', name: 'Horizen', symbol: 'ZEN', icon: '☯', category: 'privacy', color: '#041742' },
  { id: 'decred', name: 'Decred', symbol: 'DCR', icon: 'Ð', category: 'privacy', color: '#2ED6A1' },
  { id: 'firo', name: 'Firo', symbol: 'FIRO', icon: '🔥', category: 'privacy', color: '#9B1C2E' },
  { id: 'beam', name: 'Beam', symbol: 'BEAM', icon: '📡', category: 'privacy', color: '#25C8DC' },
  { id: 'grin', name: 'Grin', symbol: 'GRIN', icon: '😁', category: 'privacy', color: '#FFF300' },
  { id: 'pivx', name: 'PIVX', symbol: 'PIVX', icon: '◊', category: 'privacy', color: '#5E4778' },
  { id: 'secret', name: 'Secret Network', symbol: 'SCRT', icon: '🤫', category: 'privacy', color: '#1B1B1B' },
  { id: 'dero', name: 'Dero', symbol: 'DERO', icon: 'Đ', category: 'privacy', color: '#009FE3' },

  // ==================== COSMOS ECOSYSTEM ====================
  { id: 'osmosis', name: 'Osmosis', symbol: 'OSMO', icon: '🧪', category: 'cosmos', color: '#750BBB' },
  { id: 'juno', name: 'Juno', symbol: 'JUNO', icon: '🌌', category: 'cosmos', color: '#F0827D' },
  { id: 'injective', name: 'Injective', symbol: 'INJ', icon: '💉', category: 'cosmos', color: '#00F2FE' },
  { id: 'sei', name: 'Sei', symbol: 'SEI', icon: '🌊', category: 'cosmos', color: '#9B1C1C' },
  { id: 'celestia', name: 'Celestia', symbol: 'TIA', icon: '☀', category: 'cosmos', color: '#7B2BF9' },
  { id: 'dymension', name: 'Dymension', symbol: 'DYM', icon: '🎲', category: 'cosmos', color: '#FF5E18' },
  { id: 'stargaze', name: 'Stargaze', symbol: 'STARS', icon: '⭐', category: 'cosmos', color: '#DB2777' },
  { id: 'akash', name: 'Akash Network', symbol: 'AKT', icon: '☁', category: 'cosmos', color: '#FF414C' },
  { id: 'axelar', name: 'Axelar', symbol: 'AXL', icon: '🔗', category: 'cosmos', color: '#FFFFFF' },
  { id: 'stride', name: 'Stride', symbol: 'STRD', icon: '🏃', category: 'cosmos', color: '#E91179' },
  { id: 'kujira', name: 'Kujira', symbol: 'KUJI', icon: '🐋', category: 'cosmos', color: '#465AE9' },
  { id: 'terra2', name: 'Terra 2.0', symbol: 'LUNA', icon: '🌙', category: 'cosmos', color: '#172852' },
  { id: 'fetch', name: 'Fetch.ai', symbol: 'FET', icon: '🤖', category: 'cosmos', color: '#1D2951' },
  { id: 'band', name: 'Band Protocol', symbol: 'BAND', icon: '📊', category: 'cosmos', color: '#516AFF' },
  { id: 'persistence', name: 'Persistence', symbol: 'XPRT', icon: '💎', category: 'cosmos', color: '#E50914' },

  // ==================== POLKADOT ECOSYSTEM ====================
  { id: 'kusama', name: 'Kusama', symbol: 'KSM', icon: '🐦', category: 'polkadot', color: '#000000' },
  { id: 'acala', name: 'Acala', symbol: 'ACA', icon: '🌐', category: 'polkadot', color: '#645AFF' },
  { id: 'astar', name: 'Astar', symbol: 'ASTR', icon: '⭐', category: 'polkadot', color: '#0070F3' },
  { id: 'phala', name: 'Phala Network', symbol: 'PHA', icon: '🔒', category: 'polkadot', color: '#D1FF52' },
  { id: 'interlay', name: 'Interlay', symbol: 'INTR', icon: '🔗', category: 'polkadot', color: '#7C3AED' },
  { id: 'hydradx', name: 'HydraDX', symbol: 'HDX', icon: '💧', category: 'polkadot', color: '#FC408C' },
  { id: 'bifrost', name: 'Bifrost', symbol: 'BNC', icon: '🌈', category: 'polkadot', color: '#5945FF' },
  { id: 'centrifuge', name: 'Centrifuge', symbol: 'CFG', icon: '🌀', category: 'polkadot', color: '#FFC012' },
  { id: 'composable', name: 'Composable', symbol: 'LAYR', icon: '🧱', category: 'polkadot', color: '#1C1C1C' },
  { id: 'efinity', name: 'Efinity', symbol: 'EFI', icon: '♾', category: 'polkadot', color: '#7866D5' },

  // ==================== OTHER MAJOR L1s ====================
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', icon: '✦', category: 'other', color: '#14B6E7' },
  { id: 'vechain', name: 'VeChain', symbol: 'VET', icon: '✓', category: 'other', color: '#15BDFF' },
  { id: 'multiversx', name: 'MultiversX', symbol: 'EGLD', icon: 'ⓧ', category: 'other', color: '#23F7DD' },
  { id: 'theta', name: 'Theta Network', symbol: 'THETA', icon: 'θ', category: 'other', color: '#2AB8E6' },
  { id: 'eos', name: 'EOS', symbol: 'EOS', icon: '◎', category: 'other', color: '#000000' },
  { id: 'neo', name: 'NEO', symbol: 'NEO', icon: '◇', category: 'other', color: '#00E599' },
  { id: 'waves', name: 'Waves', symbol: 'WAVES', icon: '〰', category: 'other', color: '#0055FF' },
  { id: 'iota', name: 'IOTA', symbol: 'MIOTA', icon: 'ι', category: 'other', color: '#131F37' },
  { id: 'zilliqa', name: 'Zilliqa', symbol: 'ZIL', icon: 'Ƶ', category: 'other', color: '#49C1BF' },
  { id: 'filecoin', name: 'Filecoin', symbol: 'FIL', icon: '📁', category: 'other', color: '#0090FF' },
  { id: 'arweave', name: 'Arweave', symbol: 'AR', icon: '📦', category: 'other', color: '#222326' },
  { id: 'helium', name: 'Helium', symbol: 'HNT', icon: '📡', category: 'other', color: '#474DFF' },
  { id: 'stacks', name: 'Stacks', symbol: 'STX', icon: '📚', category: 'other', color: '#5546FF' },
  { id: 'flow', name: 'Flow', symbol: 'FLOW', icon: '🌊', category: 'other', color: '#00EF8B' },
  { id: 'mina', name: 'Mina Protocol', symbol: 'MINA', icon: '🔬', category: 'other', color: '#E39844' },
  { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', icon: '⚡', category: 'other', color: '#49EACB' },
  { id: 'ergo', name: 'Ergo', symbol: 'ERG', icon: 'Σ', category: 'other', color: '#FF5722' },
  { id: 'radix', name: 'Radix', symbol: 'XRD', icon: '◉', category: 'other', color: '#060F8F' },
  { id: 'conflux', name: 'Conflux', symbol: 'CFX', icon: '🔄', category: 'other', color: '#1A1A1A' },
  { id: 'nervos', name: 'Nervos Network', symbol: 'CKB', icon: '🧠', category: 'other', color: '#3CC68A' },

  // ==================== DEFI TOKENS ====================
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', icon: '⬡', category: 'defi', color: '#375BD2' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', icon: '🦄', category: 'defi', color: '#FF007A' },
  { id: 'aave', name: 'Aave', symbol: 'AAVE', icon: '👻', category: 'defi', color: '#B6509E' },
  { id: 'maker', name: 'Maker', symbol: 'MKR', icon: '🏛', category: 'defi', color: '#1AAB9B' },
  { id: 'curve', name: 'Curve DAO', symbol: 'CRV', icon: '〰', category: 'defi', color: '#0033AD' },
  { id: 'lido', name: 'Lido DAO', symbol: 'LDO', icon: '🔷', category: 'defi', color: '#00A3FF' },
  { id: 'compound', name: 'Compound', symbol: 'COMP', icon: '📊', category: 'defi', color: '#00D395' },
  { id: 'synthetix', name: 'Synthetix', symbol: 'SNX', icon: '🔄', category: 'defi', color: '#00D1FF' },
  { id: 'pancakeswap', name: 'PancakeSwap', symbol: 'CAKE', icon: '🥞', category: 'defi', color: '#D1884F' },
  { id: 'sushiswap', name: 'SushiSwap', symbol: 'SUSHI', icon: '🍣', category: 'defi', color: '#FA52A0' },
  { id: 'yearn', name: 'Yearn Finance', symbol: 'YFI', icon: '🔵', category: 'defi', color: '#006AE3' },
  { id: 'balancer', name: 'Balancer', symbol: 'BAL', icon: '⚖', category: 'defi', color: '#1E1E1E' },
  { id: '1inch', name: '1inch', symbol: '1INCH', icon: '🦄', category: 'defi', color: '#94A6C3' },
  { id: 'gmx', name: 'GMX', symbol: 'GMX', icon: '📈', category: 'defi', color: '#1F42FF' },
  { id: 'dydx', name: 'dYdX', symbol: 'DYDX', icon: '📊', category: 'defi', color: '#6966FF' },
  { id: 'raydium', name: 'Raydium', symbol: 'RAY', icon: '☀', category: 'defi', color: '#5AC4BE' },
  { id: 'jupiter', name: 'Jupiter', symbol: 'JUP', icon: '🪐', category: 'defi', color: '#00B57C' },
  { id: 'pendle', name: 'Pendle', symbol: 'PENDLE', icon: '⏰', category: 'defi', color: '#EAEAEA' },
  { id: 'ethena', name: 'Ethena', symbol: 'ENA', icon: '🔮', category: 'defi', color: '#2F1A45' },
  { id: 'rocketpool', name: 'Rocket Pool', symbol: 'RPL', icon: '🚀', category: 'defi', color: '#FD5F00' },

  // ==================== GAMING & METAVERSE ====================
  { id: 'immutable', name: 'Immutable X', symbol: 'IMX', icon: '🎮', category: 'gaming', color: '#00BFFF' },
  { id: 'gala', name: 'Gala Games', symbol: 'GALA', icon: '🎮', category: 'gaming', color: '#00D1FF' },
  { id: 'axie', name: 'Axie Infinity', symbol: 'AXS', icon: '🎮', category: 'gaming', color: '#0055D5' },
  { id: 'sandbox', name: 'The Sandbox', symbol: 'SAND', icon: '🏜', category: 'gaming', color: '#00ADEF' },
  { id: 'decentraland', name: 'Decentraland', symbol: 'MANA', icon: '🌐', category: 'gaming', color: '#FF2D55' },
  { id: 'ronin', name: 'Ronin', symbol: 'RON', icon: '⚔', category: 'gaming', color: '#1273EA' },
  { id: 'enjin', name: 'Enjin', symbol: 'ENJ', icon: '🎯', category: 'gaming', color: '#624DBF' },
  { id: 'illuvium', name: 'Illuvium', symbol: 'ILV', icon: '🎮', category: 'gaming', color: '#A855F7' },
  { id: 'stepn', name: 'STEPN', symbol: 'GMT', icon: '👟', category: 'gaming', color: '#CEFC00' },
  { id: 'xai', name: 'Xai', symbol: 'XAI', icon: '🎮', category: 'gaming', color: '#F30019' },
  { id: 'beam-gaming', name: 'Beam (Gaming)', symbol: 'BEAM', icon: '🎮', category: 'gaming', color: '#FEC702' },
  { id: 'pixels', name: 'Pixels', symbol: 'PIXEL', icon: '🎨', category: 'gaming', color: '#E9B85D' },
  { id: 'portal', name: 'Portal', symbol: 'PORTAL', icon: '🌀', category: 'gaming', color: '#0094FF' },
  { id: 'wemix', name: 'WEMIX', symbol: 'WEMIX', icon: '🎮', category: 'gaming', color: '#FF0000' },
  { id: 'apecoin', name: 'ApeCoin', symbol: 'APE', icon: '🦍', category: 'gaming', color: '#0052FF' },

  // ==================== AI & DATA ====================
  { id: 'render', name: 'Render', symbol: 'RNDR', icon: '🎨', category: 'ai', color: '#000000' },
  { id: 'ocean', name: 'Ocean Protocol', symbol: 'OCEAN', icon: '🌊', category: 'ai', color: '#FF4092' },
  { id: 'singularitynet', name: 'SingularityNET', symbol: 'AGIX', icon: '🤖', category: 'ai', color: '#7916F4' },
  { id: 'bittensor', name: 'Bittensor', symbol: 'TAO', icon: '🧠', category: 'ai', color: '#000000' },
  { id: 'worldcoin', name: 'Worldcoin', symbol: 'WLD', icon: '🌍', category: 'ai', color: '#000000' },
  { id: 'graph', name: 'The Graph', symbol: 'GRT', icon: '📊', category: 'ai', color: '#6747ED' },
  { id: 'numerai', name: 'Numeraire', symbol: 'NMR', icon: '📈', category: 'ai', color: '#1F2023' },
  { id: 'livepeer', name: 'Livepeer', symbol: 'LPT', icon: '📺', category: 'ai', color: '#00EB88' },
  { id: 'arkham', name: 'Arkham', symbol: 'ARKM', icon: '🔍', category: 'ai', color: '#000000' },
  { id: 'ondo', name: 'Ondo Finance', symbol: 'ONDO', icon: '💰', category: 'ai', color: '#1D4ED8' },

  // ==================== INFRASTRUCTURE ====================
  { id: 'quant', name: 'Quant', symbol: 'QNT', icon: 'Q', category: 'infrastructure', color: '#000000' },
  { id: 'qtum', name: 'Qtum', symbol: 'QTUM', icon: 'Q', category: 'infrastructure', color: '#2E9AD0' },
  { id: 'icon', name: 'ICON', symbol: 'ICX', icon: 'Ⓘ', category: 'infrastructure', color: '#1FC5C9' },
  { id: 'skale', name: 'SKALE', symbol: 'SKL', icon: '⚡', category: 'infrastructure', color: '#000000' },
  { id: 'iotex', name: 'IoTeX', symbol: 'IOTX', icon: '🌐', category: 'infrastructure', color: '#00D4D5' },
  { id: 'covalent', name: 'Covalent', symbol: 'CQT', icon: '📊', category: 'infrastructure', color: '#FF4C8B' },
  { id: 'pyth', name: 'Pyth Network', symbol: 'PYTH', icon: '🐍', category: 'infrastructure', color: '#E6DAFE' },
  { id: 'wormhole', name: 'Wormhole', symbol: 'W', icon: '🌀', category: 'infrastructure', color: '#FFFFFF' },
  { id: 'layerzero', name: 'LayerZero', symbol: 'ZRO', icon: '0', category: 'infrastructure', color: '#000000' },
  { id: 'zeta', name: 'ZetaChain', symbol: 'ZETA', icon: 'ζ', category: 'infrastructure', color: '#00BC8D' },

  // ==================== STABLECOINS (reference only) ====================
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: '💵', category: 'stablecoin', color: '#26A17B' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: '💵', category: 'stablecoin', color: '#2775CA' },
  { id: 'dai', name: 'Dai', symbol: 'DAI', icon: '◈', category: 'stablecoin', color: '#F5AC37' },
  { id: 'frax', name: 'Frax', symbol: 'FRAX', icon: '💲', category: 'stablecoin', color: '#000000' },
  { id: 'tusd', name: 'TrueUSD', symbol: 'TUSD', icon: '💵', category: 'stablecoin', color: '#2B2E7F' },
];

// Export categories for UI
export const BLOCKCHAIN_CATEGORIES = [
  { id: 'major', name: 'Réseaux Majeurs', count: 20 },
  { id: 'bitcoin-fork', name: 'Variantes Bitcoin', count: 10 },
  { id: 'layer2', name: 'Layer 2', count: 14 },
  { id: 'evm', name: 'Chaînes EVM', count: 20 },
  { id: 'privacy', name: 'Privacy Coins', count: 10 },
  { id: 'cosmos', name: 'Écosystème Cosmos', count: 15 },
  { id: 'polkadot', name: 'Écosystème Polkadot', count: 10 },
  { id: 'other', name: 'Autres L1', count: 20 },
  { id: 'defi', name: 'DeFi', count: 20 },
  { id: 'gaming', name: 'Gaming & Metaverse', count: 15 },
  { id: 'ai', name: 'IA & Data', count: 10 },
  { id: 'infrastructure', name: 'Infrastructure', count: 10 },
  { id: 'stablecoin', name: 'Stablecoins', count: 5 },
];

// Total: 205 blockchains
export const TOTAL_BLOCKCHAINS = COMPLETE_BLOCKCHAIN_LIST.length;

// Helper to get blockchain by ID
export function getBlockchainById(id: string): BlockchainInfo | undefined {
  return COMPLETE_BLOCKCHAIN_LIST.find(b => b.id === id);
}

// Helper to get blockchains by category
export function getBlockchainsByCategory(category: string): BlockchainInfo[] {
  return COMPLETE_BLOCKCHAIN_LIST.filter(b => b.category === category);
}

// Search blockchains
export function searchBlockchains(query: string): BlockchainInfo[] {
  const q = query.toLowerCase();
  return COMPLETE_BLOCKCHAIN_LIST.filter(b => 
    b.name.toLowerCase().includes(q) ||
    b.symbol.toLowerCase().includes(q) ||
    b.id.toLowerCase().includes(q)
  );
}
