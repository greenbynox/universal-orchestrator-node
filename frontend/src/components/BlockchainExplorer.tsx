/**
 * ============================================================
 * BLOCKCHAIN EXPLORER - Interface pour 100+ blockchains
 * ============================================================
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Zap, 
  Shield, 
  Gamepad2,
  Brain,
  Database,
  Coins,
  Link2,
  Building2,
  ImageIcon,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  ChevronDown
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface BlockchainInfo {
  id: string;
  name: string;
  symbol: string;
  category: string;
  chainType: string;
  color: string;
  isActive: boolean;
  features?: {
    smartContracts?: boolean;
    nft?: boolean;
    defi?: boolean;
    staking?: boolean;
    privacy?: boolean;
  };
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  layer1: <Zap className="w-4 h-4" />,
  layer2: <ArrowUpDown className="w-4 h-4" />,
  evm: <Link2 className="w-4 h-4" />,
  privacy: <Shield className="w-4 h-4" />,
  defi: <Coins className="w-4 h-4" />,
  meme: <Star className="w-4 h-4" />,
  stablecoin: <Coins className="w-4 h-4" />,
  gaming: <Gamepad2 className="w-4 h-4" />,
  ai: <Brain className="w-4 h-4" />,
  storage: <Database className="w-4 h-4" />,
  oracle: <Link2 className="w-4 h-4" />,
  exchange: <Building2 className="w-4 h-4" />,
  infrastructure: <Link2 className="w-4 h-4" />,
  nft: <ImageIcon className="w-4 h-4" />,
};

const CATEGORY_NAMES: Record<string, string> = {
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  evm: 'EVM Compatible',
  privacy: 'Privacy',
  defi: 'DeFi',
  meme: 'Meme Coins',
  stablecoin: 'Stablecoins',
  gaming: 'Gaming',
  ai: 'AI & ML',
  storage: 'Storage',
  oracle: 'Oracles',
  exchange: 'Exchange',
  infrastructure: 'Infrastructure',
  nft: 'NFT',
};

// ============================================================
// BLOCKCHAIN CARD COMPONENT
// ============================================================

interface BlockchainCardProps {
  chain: BlockchainInfo;
  isSelected?: boolean;
  onClick?: () => void;
}

const BlockchainCard: React.FC<BlockchainCardProps> = ({ chain, isSelected, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all
        ${isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-500/10' 
          : 'bg-white/5 hover:bg-white/10'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: chain.color }}
        >
          {chain.symbol.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{chain.name}</h3>
          <p className="text-sm text-gray-400">{chain.symbol}</p>
        </div>
        {chain.isActive ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span 
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${chain.color}20`,
            color: chain.color 
          }}
        >
          {CATEGORY_ICONS[chain.category]}
          {CATEGORY_NAMES[chain.category] || chain.category}
        </span>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          {chain.chainType.toUpperCase()}
        </span>
      </div>

      {/* Features */}
      {chain.features && (
        <div className="flex flex-wrap gap-1">
          {chain.features.smartContracts && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
              Smart Contracts
            </span>
          )}
          {chain.features.nft && (
            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">
              NFT
            </span>
          )}
          {chain.features.defi && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
              DeFi
            </span>
          )}
          {chain.features.staking && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
              Staking
            </span>
          )}
          {chain.features.privacy && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
              Privacy
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================
// CATEGORY FILTER COMPONENT
// ============================================================

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
  counts: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  selected, 
  onSelect,
  counts 
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${selected === null 
            ? 'bg-blue-500 text-white' 
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }
        `}
      >
        All ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${selected === cat 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
        >
          {CATEGORY_ICONS[cat]}
          {CATEGORY_NAMES[cat] || cat}
          <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-xs">
            {counts[cat] || 0}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================================
// MAIN EXPLORER COMPONENT
// ============================================================

interface BlockchainExplorerProps {
  chains: BlockchainInfo[];
  onChainSelect?: (chain: BlockchainInfo) => void;
}

export const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({ 
  chains, 
  onChainSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'symbol' | 'category'>('name');

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(chains.map(c => c.category))].sort();
  }, [chains]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    chains.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [chains]);

  // Filter and sort chains
  const filteredChains = useMemo(() => {
    let result = chains;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return result;
  }, [chains, searchQuery, selectedCategory, sortBy]);

  const handleChainClick = (chain: BlockchainInfo) => {
    setSelectedChain(chain.id);
    onChainSelect?.(chain);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Chains</p>
          <p className="text-3xl font-bold text-white">{chains.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Categories</p>
          <p className="text-3xl font-bold text-white">{categories.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-3xl font-bold text-white">
            {chains.filter(c => c.isActive).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">EVM Compatible</p>
          <p className="text-3xl font-bold text-white">
            {chains.filter(c => c.chainType === 'evm').length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search blockchains by name, symbol, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="symbol">Sort by Symbol</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        counts={categoryCounts}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredChains.length} of {chains.length} blockchains
      </div>

      {/* Chains Grid/List */}
      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          }
        >
          {filteredChains.map(chain => (
            <BlockchainCard
              key={chain.id}
              chain={chain}
              isSelected={selectedChain === chain.id}
              onClick={() => handleChainClick(chain)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredChains.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No blockchains found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default BlockchainExplorer;
