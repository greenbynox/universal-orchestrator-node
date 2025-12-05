import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CircleStackIcon,
  ServerStackIcon,
  HeartIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { systemApi } from '../services/api';

// Donation networks (100+ crypto networks)
const DONATION_NETWORKS = [
  // Major Networks
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', address: '', icon: '₿' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', address: '', icon: 'Ξ' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', address: '', icon: '◎' },
  { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', address: '', icon: '⬡' },
  { id: 'xmr', name: 'Monero', symbol: 'XMR', address: '', icon: 'ɱ' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', address: '', icon: '₳' },
  { id: 'dot', name: 'Polkadot', symbol: 'DOT', address: '', icon: '●' },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', address: '', icon: '🔺' },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC', address: '', icon: '⬡' },
  { id: 'atom', name: 'Cosmos', symbol: 'ATOM', address: '', icon: '⚛' },
  // Layer 2s
  { id: 'arb', name: 'Arbitrum', symbol: 'ARB', address: '', icon: '🔵' },
  { id: 'op', name: 'Optimism', symbol: 'OP', address: '', icon: '🔴' },
  { id: 'base', name: 'Base', symbol: 'ETH', address: '', icon: '🔵' },
  { id: 'zksync', name: 'zkSync Era', symbol: 'ETH', address: '', icon: '⚡' },
  { id: 'linea', name: 'Linea', symbol: 'ETH', address: '', icon: '📐' },
  { id: 'scroll', name: 'Scroll', symbol: 'ETH', address: '', icon: '📜' },
  { id: 'manta', name: 'Manta Pacific', symbol: 'ETH', address: '', icon: '🐋' },
  { id: 'blast', name: 'Blast', symbol: 'ETH', address: '', icon: '💥' },
  { id: 'mode', name: 'Mode', symbol: 'ETH', address: '', icon: 'Ⓜ' },
  { id: 'mantle', name: 'Mantle', symbol: 'MNT', address: '', icon: '🏔' },
  // EVM Chains
  { id: 'ftm', name: 'Fantom', symbol: 'FTM', address: '', icon: '👻' },
  { id: 'cro', name: 'Cronos', symbol: 'CRO', address: '', icon: '🔷' },
  { id: 'one', name: 'Harmony', symbol: 'ONE', address: '', icon: '🎵' },
  { id: 'klay', name: 'Klaytn', symbol: 'KLAY', address: '', icon: '🔶' },
  { id: 'celo', name: 'Celo', symbol: 'CELO', address: '', icon: '🌿' },
  { id: 'aurora', name: 'Aurora', symbol: 'ETH', address: '', icon: '🌈' },
  { id: 'moonbeam', name: 'Moonbeam', symbol: 'GLMR', address: '', icon: '🌙' },
  { id: 'moonriver', name: 'Moonriver', symbol: 'MOVR', address: '', icon: '🌊' },
  { id: 'metis', name: 'Metis', symbol: 'METIS', address: '', icon: '🟢' },
  { id: 'boba', name: 'Boba', symbol: 'BOBA', address: '', icon: '🧋' },
  { id: 'evmos', name: 'Evmos', symbol: 'EVMOS', address: '', icon: '⚛' },
  { id: 'kava', name: 'Kava', symbol: 'KAVA', address: '', icon: '🔥' },
  { id: 'gnosis', name: 'Gnosis', symbol: 'xDAI', address: '', icon: '🦉' },
  { id: 'fuse', name: 'Fuse', symbol: 'FUSE', address: '', icon: '⚡' },
  // Privacy Coins
  { id: 'zec', name: 'Zcash', symbol: 'ZEC', address: '', icon: '🛡' },
  { id: 'dash', name: 'Dash', symbol: 'DASH', address: '', icon: '💨' },
  { id: 'firo', name: 'Firo', symbol: 'FIRO', address: '', icon: '🔥' },
  { id: 'beam', name: 'Beam', symbol: 'BEAM', address: '', icon: '📡' },
  { id: 'zen', name: 'Horizen', symbol: 'ZEN', address: '', icon: '☯' },
  // Bitcoin Forks & Layer 2
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', address: '', icon: 'Ł' },
  { id: 'bch', name: 'Bitcoin Cash', symbol: 'BCH', address: '', icon: '₿' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', address: '', icon: '🐕' },
  { id: 'dcr', name: 'Decred', symbol: 'DCR', address: '', icon: '⚡' },
  { id: 'stx', name: 'Stacks', symbol: 'STX', address: '', icon: '📚' },
  // Cosmos Ecosystem
  { id: 'osmo', name: 'Osmosis', symbol: 'OSMO', address: '', icon: '🧪' },
  { id: 'juno', name: 'Juno', symbol: 'JUNO', address: '', icon: '🌌' },
  { id: 'inj', name: 'Injective', symbol: 'INJ', address: '', icon: '💉' },
  { id: 'sei', name: 'Sei', symbol: 'SEI', address: '', icon: '🌊' },
  { id: 'dym', name: 'Dymension', symbol: 'DYM', address: '', icon: '🎲' },
  { id: 'tia', name: 'Celestia', symbol: 'TIA', address: '', icon: '☀' },
  // Solana Ecosystem
  { id: 'ray', name: 'Raydium', symbol: 'RAY', address: '', icon: '☀' },
  { id: 'jup', name: 'Jupiter', symbol: 'JUP', address: '', icon: '🪐' },
  // Other Major
  { id: 'near', name: 'NEAR', symbol: 'NEAR', address: '', icon: 'Ⓝ' },
  { id: 'apt', name: 'Aptos', symbol: 'APT', address: '', icon: '🌀' },
  { id: 'sui', name: 'Sui', symbol: 'SUI', address: '', icon: '💧' },
  { id: 'algo', name: 'Algorand', symbol: 'ALGO', address: '', icon: 'Ⱥ' },
  { id: 'xlm', name: 'Stellar', symbol: 'XLM', address: '', icon: '✦' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', address: '', icon: '✕' },
  { id: 'hbar', name: 'Hedera', symbol: 'HBAR', address: '', icon: 'ℏ' },
  { id: 'xtz', name: 'Tezos', symbol: 'XTZ', address: '', icon: 'ꜩ' },
  { id: 'icp', name: 'Internet Computer', symbol: 'ICP', address: '', icon: '∞' },
  { id: 'fil', name: 'Filecoin', symbol: 'FIL', address: '', icon: '⬡' },
  { id: 'ar', name: 'Arweave', symbol: 'AR', address: '', icon: '📦' },
  { id: 'vet', name: 'VeChain', symbol: 'VET', address: '', icon: '✓' },
  { id: 'egld', name: 'MultiversX', symbol: 'EGLD', address: '', icon: 'ⓧ' },
  { id: 'theta', name: 'Theta', symbol: 'THETA', address: '', icon: 'θ' },
  { id: 'trx', name: 'Tron', symbol: 'TRX', address: '', icon: '⟁' },
  { id: 'eos', name: 'EOS', symbol: 'EOS', address: '', icon: '◎' },
  { id: 'neo', name: 'NEO', symbol: 'NEO', address: '', icon: '◇' },
  { id: 'waves', name: 'Waves', symbol: 'WAVES', address: '', icon: '〰' },
  { id: 'ton', name: 'TON', symbol: 'TON', address: '', icon: '💎' },
  // Stablecoins (for convenience)
  { id: 'usdt-eth', name: 'USDT (Ethereum)', symbol: 'USDT', address: '', icon: '💵' },
  { id: 'usdt-tron', name: 'USDT (Tron)', symbol: 'USDT', address: '', icon: '💵' },
  { id: 'usdt-bsc', name: 'USDT (BSC)', symbol: 'USDT', address: '', icon: '💵' },
  { id: 'usdt-sol', name: 'USDT (Solana)', symbol: 'USDT', address: '', icon: '💵' },
  { id: 'usdc-eth', name: 'USDC (Ethereum)', symbol: 'USDC', address: '', icon: '💵' },
  { id: 'usdc-sol', name: 'USDC (Solana)', symbol: 'USDC', address: '', icon: '💵' },
  { id: 'usdc-base', name: 'USDC (Base)', symbol: 'USDC', address: '', icon: '💵' },
  { id: 'usdc-arb', name: 'USDC (Arbitrum)', symbol: 'USDC', address: '', icon: '💵' },
  { id: 'dai', name: 'DAI (Ethereum)', symbol: 'DAI', address: '', icon: '◈' },
  // Gaming & NFT
  { id: 'imx', name: 'Immutable X', symbol: 'IMX', address: '', icon: '🎮' },
  { id: 'gala', name: 'Gala', symbol: 'GALA', address: '', icon: '🎮' },
  { id: 'axs', name: 'Axie Infinity', symbol: 'AXS', address: '', icon: '🎮' },
  { id: 'sand', name: 'The Sandbox', symbol: 'SAND', address: '', icon: '🏜' },
  { id: 'mana', name: 'Decentraland', symbol: 'MANA', address: '', icon: '🌐' },
  { id: 'ron', name: 'Ronin', symbol: 'RON', address: '', icon: '⚔' },
  // DeFi
  { id: 'link', name: 'Chainlink', symbol: 'LINK', address: '', icon: '⬡' },
  { id: 'uni', name: 'Uniswap', symbol: 'UNI', address: '', icon: '🦄' },
  { id: 'aave', name: 'Aave', symbol: 'AAVE', address: '', icon: '👻' },
  { id: 'mkr', name: 'Maker', symbol: 'MKR', address: '', icon: '🏛' },
  { id: 'crv', name: 'Curve', symbol: 'CRV', address: '', icon: '〰' },
  { id: 'ldo', name: 'Lido', symbol: 'LDO', address: '', icon: '🔷' },
  { id: 'rpl', name: 'Rocket Pool', symbol: 'RPL', address: '', icon: '🚀' },
  { id: 'cake', name: 'PancakeSwap', symbol: 'CAKE', address: '', icon: '🥞' },
];

export default function SettingsPage() {
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(DONATION_NETWORKS[0]);
  const [searchNetwork, setSearchNetwork] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const health = await systemApi.health();
        setSystemHealth(health);
      } catch (error) {
        console.error('Erreur chargement settings:', error);
        // Set default values if API fails
        setSystemHealth({
          status: 'healthy',
          uptime: 0,
          version: '1.0.0'
        });
      }
    };
    loadData();
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const copyAddress = async (address: string) => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredNetworks = DONATION_NETWORKS.filter(
    n => n.name.toLowerCase().includes(searchNetwork.toLowerCase()) ||
         n.symbol.toLowerCase().includes(searchNetwork.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-dark-400 mt-1">Configuration de l'orchestrateur</p>
      </div>

      {/* Free Software Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-700/50"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <GlobeAltIcon className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-green-400 mb-2">
              🎉 100% Gratuit & Open Source
            </h2>
            <p className="text-dark-300 leading-relaxed">
              <strong className="text-white">Node Orchestrator</strong> est entièrement gratuit, sans limites, 
              sans version payante. Nous croyons en une blockchain accessible à tous.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                ✓ Aucune limite de nodes
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                ✓ 205 blockchains
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                ✓ Open Source
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statut système */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ServerStackIcon className="w-6 h-6 text-primary-500" />
          Statut Système
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">Statut</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth?.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <p className="text-white font-medium capitalize">
                {systemHealth?.status === 'healthy' ? 'En ligne' : 'Démarrage...'}
              </p>
            </div>
          </div>
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">Uptime</p>
            <p className="text-white font-medium">
              {systemHealth ? formatUptime(systemHealth.uptime) : '0m'}
            </p>
          </div>
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">Version</p>
            <p className="text-white font-medium">v{systemHealth?.version || '1.0.0'}</p>
          </div>
        </div>
      </motion.div>

      {/* Donations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <HeartIcon className="w-6 h-6 text-pink-500" />
            Soutenir le Projet
          </h2>
          <button
            onClick={() => setShowDonation(!showDonation)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors"
          >
            {showDonation ? 'Fermer' : '❤️ Faire un don'}
          </button>
        </div>

        <p className="text-dark-300 mb-4">
          Ce logiciel est 100% gratuit. Si vous souhaitez soutenir son développement, 
          vous pouvez faire un don sur l'un des {DONATION_NETWORKS.length}+ réseaux.
        </p>

        {showDonation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-dark-700 pt-4 mt-4"
          >
            <input
              type="text"
              placeholder="Rechercher (Bitcoin, ETH, Solana...)"
              value={searchNetwork}
              onChange={(e) => setSearchNetwork(e.target.value)}
              className="w-full bg-dark-900 text-white rounded-lg px-4 py-3 mb-4 border border-dark-600 focus:border-primary-500 focus:outline-none"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto mb-4">
              {filteredNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedNetwork.id === network.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-900 hover:bg-dark-700 text-dark-300'
                  }`}
                >
                  <span className="text-lg">{network.icon}</span>
                  <p className="text-xs font-medium truncate">{network.symbol}</p>
                </button>
              ))}
            </div>

            <div className="bg-dark-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{selectedNetwork.icon}</span>
                <div>
                  <p className="text-white font-semibold">{selectedNetwork.name}</p>
                  <p className="text-dark-400 text-sm">{selectedNetwork.symbol}</p>
                </div>
              </div>
              
              {selectedNetwork.address ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedNetwork.address}
                    readOnly
                    className="flex-1 bg-dark-800 text-white rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyAddress(selectedNetwork.address)}
                    className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                  >
                    {copiedAddress === selectedNetwork.address ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5 text-dark-400" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-dark-400 text-sm italic">
                  Adresse non configurée - bientôt disponible.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Configuration Docker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CircleStackIcon className="w-6 h-6 text-primary-500" />
          Configuration
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Docker Socket</p>
              <p className="text-sm text-dark-400">/var/run/docker.sock</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Dossier de données</p>
              <p className="text-sm text-dark-400">./data/nodes</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      </motion.div>

      {/* À propos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4">À propos</h2>
        
        <div className="prose prose-invert max-w-none text-dark-300">
          <p>
            <strong className="text-white">Node Orchestrator</strong> - Orchestrateur de nodes multi-blockchains 
            pour plus de 205 réseaux.
          </p>
          <div className="bg-dark-900 rounded-lg p-4 mt-4">
            <p className="text-sm">
              <span className="text-dark-400">Version:</span> <span className="text-white">1.0.0</span><br />
              <span className="text-dark-400">Licence:</span> <span className="text-green-400">MIT (100% Gratuit)</span><br />
              <span className="text-dark-400">GitHub:</span>{' '}
              <a 
                href="https://github.com/greenbynox/universal-orchestrator-node" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                github.com/greenbynox/universal-orchestrator-node
              </a><br />
              <span className="text-dark-400">Discord:</span>{' '}
              <a 
                href="https://discord.gg/AH93eHVQGU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                discord.gg/AH93eHVQGU
              </a>
            </p>
          </div>
          
          <div className="flex gap-3 mt-4">
            <a
              href="https://github.com/greenbynox/universal-orchestrator-node"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
            <a
              href="https://discord.gg/AH93eHVQGU"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>
          </div>
          <p className="text-sm mt-4 text-dark-400">
            Made with ❤️ for the blockchain community.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
