import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  WalletIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../store';
import { useLanguage } from '../i18n';
import { walletsApi } from '../services/api';
import { 
  COMPLETE_BLOCKCHAIN_LIST, 
  BLOCKCHAIN_CATEGORIES,
  BlockchainInfo,
  searchBlockchains,
  getBlockchainById,
} from '../config/blockchains';
import toast from 'react-hot-toast';

// Type d'adresse Bitcoin
interface BitcoinAddressType {
  type: string;
  prefix: string;
  bip: string;
  fees: string;
}

export default function WalletsPage() {
  const { t } = useLanguage();
  const { wallets, addWallet, removeWallet } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState<string | null>(null);
  const [hardwareAddress, setHardwareAddress] = useState<string | null>(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainInfo | null>(null);
  const [selectedAddressType, setSelectedAddressType] = useState<BitcoinAddressType | null>(null);
  const [walletName, setWalletName] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState<{id: string; seed: string} | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['major']);

  // Filter blockchains based on search
  const filteredBlockchains = useMemo(() => {
    if (searchTerm.length > 0) {
      return searchBlockchains(searchTerm);
    }
    return COMPLETE_BLOCKCHAIN_LIST;
  }, [searchTerm]);

  // Group by category
  const groupedBlockchains = useMemo(() => {
    const groups: Record<string, BlockchainInfo[]> = {};
    filteredBlockchains.forEach(bc => {
      if (!groups[bc.category]) {
        groups[bc.category] = [];
      }
      groups[bc.category].push(bc);
    });
    return groups;
  }, [filteredBlockchains]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectBlockchain = (bc: BlockchainInfo) => {
    setSelectedBlockchain(bc);
    // Pour Bitcoin, présélectionner Native SegWit
    if (bc.id === 'bitcoin' && bc.addressTypes) {
      setSelectedAddressType(bc.addressTypes[2]); // Native SegWit par défaut
    } else {
      setSelectedAddressType(null);
    }
  };

  const handleCreate = async () => {
    if (!selectedBlockchain) {
      toast.error(t('wallets.create.selectBlockchain'));
      return;
    }

    if (walletPassword.length < 8) {
      toast.error(t('wallets.create.passwordLength'));
      return;
    }

    if (walletPassword !== confirmPassword) {
      toast.error(t('wallets.create.passwordMismatch'));
      return;
    }

    setIsCreating(true);
    try {
      const wallet = await walletsApi.create({
        name: walletName || `${selectedBlockchain.name} Wallet`,
        blockchain: selectedBlockchain.id,
        addressType: selectedAddressType?.bip,
        password: walletPassword,
      });
      
      addWallet(wallet);
      
      // Afficher directement la seed phrase si elle existe
      if (wallet.mnemonic) {
        setShowSeedModal({ id: wallet.id, seed: wallet.mnemonic });
        toast.success(t('wallets.create.successSeed'));
      } else {
        toast.success(t('wallets.create.successSimple'));
      }
      
      setShowCreateModal(false);
      setWalletName('');
      setWalletPassword('');
      setConfirmPassword('');
      setSelectedBlockchain(null);
      setSelectedAddressType(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const connectHardware = async (kind: 'ledger' | 'trezor') => {
    setHardwareStatus(`Connecting to ${kind} hardware wallet...`);
    setHardwareAddress(null);
    try {
      // Call real backend endpoint
      const endpoint = kind === 'ledger' ? '/api/wallets/hardware/ledger/connect' : '/api/wallets/hardware/trezor/connect';
      const response = await fetch(endpoint, {
        method: kind === 'trezor' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const serverMessage = errorBody?.error || response.statusText;
        throw new Error(`Failed to connect to ${kind}: ${serverMessage}`);
      }

      const data = await response.json();
      
      // Now get an address from the connected device
      const addressEndpoint = kind === 'ledger' 
        ? '/api/wallets/hardware/ledger/address' 
        : '/api/wallets/hardware/trezor/address';
      
      const addressResponse = await fetch(addressEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchain: 'bitcoin',
          derivationPath: "m/44'/0'/0'/0/0", // BIP44 Bitcoin mainnet path
        }),
      });

      if (!addressResponse.ok) {
        const errorBody = await addressResponse.json().catch(() => null);
        const serverMessage = errorBody?.error || addressResponse.statusText;
        throw new Error(`Failed to get address from ${kind}: ${serverMessage}`);
      }

      const addressData = await addressResponse.json();
      setHardwareAddress(addressData.address);
      setHardwareStatus(`Connected to ${kind.toUpperCase()}`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setHardwareStatus(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (walletId: string) => {
    if (!confirm(t('wallets.delete.confirm'))) return;
    
    try {
      await walletsApi.delete(walletId);
      removeWallet(walletId);
      toast.success(t('wallets.delete.success'));
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRequestSeed = (walletId: string) => {
    setShowPasswordModal(walletId);
    setDecryptPassword('');
  };

  const handleDecryptSeed = async () => {
    if (!showPasswordModal) return;
    
    if (!decryptPassword) {
      toast.error(t('wallets.decrypt.enterPassword'));
      return;
    }

    setIsDecrypting(true);
    try {
      const seed = await walletsApi.getSeed(showPasswordModal, decryptPassword);
      if (seed) {
        setShowPasswordModal(null);
        setDecryptPassword('');
        setShowSeedModal({ id: showPasswordModal, seed });
      } else {
        toast.error(t('wallets.decrypt.noSeed'));
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('wallets.copy.success'));
  };

  // Get blockchain info for a wallet
  const getWalletBlockchainInfo = (blockchainId: string): BlockchainInfo => {
    return getBlockchainById(blockchainId) || {
      id: blockchainId,
      name: blockchainId,
      symbol: blockchainId.toUpperCase(),
      icon: '🔗',
      color: '#888888',
      category: 'other'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('wallets.title')}</h1>
          <p className="text-dark-400 mt-1">
            {t('wallets.subtitle', { count: wallets.length, chains: COMPLETE_BLOCKCHAIN_LIST.length })}
          </p>
        </div>
        <button
          onClick={() => setShowTypeModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          {t('wallets.newWallet')}
        </button>
      </div>

      {/* Security Info */}
      <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 font-medium">{t('wallets.security.title')}</p>
          <p className="text-dark-300 text-sm mt-1">
            {t('wallets.security.desc')}
          </p>
        </div>
      </div>

      {/* Liste des wallets */}
      {wallets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <WalletIcon className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('wallets.empty.title')}
          </h3>
          <p className="text-dark-400 mb-6">
            {t('wallets.empty.desc', { chains: COMPLETE_BLOCKCHAIN_LIST.length })}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wallets.map((wallet, index) => {
            const bcInfo = getWalletBlockchainInfo(wallet.blockchain);
            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden"
              >
                {/* Header coloré */}
                <div
                  className="h-2"
                  style={{ backgroundColor: bcInfo.color }}
                />

                <div className="p-5">
                  {/* Titre */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${bcInfo.color}20` }}
                      >
                        {bcInfo.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{wallet.name}</h3>
                        <p className="text-sm text-dark-400">{bcInfo.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 rounded text-green-400 text-xs">
                      <LockClosedIcon className="w-3 h-3" />
                      {t('wallets.encrypted')}
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="bg-dark-900 rounded-lg p-3 mb-4">
                    <p className="text-xs text-dark-400 mb-1">{t('wallets.address')}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-mono truncate flex-1">
                        {wallet.address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className="p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
                        title={t('common.copy')}
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-dark-400" />
                      </button>
                    </div>
                  </div>

                  {/* Balance - fetched from blockchain */}
                  <div className="bg-dark-900 rounded-lg p-3 mb-4">
                    <p className="text-xs text-dark-400 mb-1">{t('wallets.balance')}</p>
                    <p className="text-lg font-semibold text-white">
                      {wallet.balance || t('wallets.loading')} {bcInfo.symbol}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestSeed(wallet.id)}
                      className="flex-1 btn-secondary text-sm justify-center"
                    >
                      <KeyIcon className="w-4 h-4" />
                      {t('wallets.viewSeed')}
                    </button>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      className="btn-danger text-sm"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de sélection du type de wallet */}
      <AnimatePresence>
        {showTypeModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeModal(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">{t('wallets.type.modalTitle')}</h3>
                  <button onClick={() => setShowTypeModal(false)} className="p-2 rounded-lg hover:bg-dark-700">
                    <XMarkIcon className="w-5 h-5 text-dark-400" />
                  </button>
                </div>
                <div className="space-y-3">
                  <button
                    className="w-full p-4 rounded-xl border-2 border-dark-700 hover:border-primary-500 text-left"
                    onClick={() => {
                      setShowTypeModal(false);
                      setShowCreateModal(true);
                    }}
                  >
                    <div className="font-semibold text-white">{t('wallets.type.generateLocal')}</div>
                    <p className="text-sm text-dark-400">{t('wallets.type.generateLocalDesc')}</p>
                  </button>
                  <button
                    className="w-full p-4 rounded-xl border-2 border-dark-700 hover:border-primary-500 text-left"
                    onClick={() => {
                      setShowTypeModal(false);
                      void connectHardware('ledger');
                    }}
                  >
                    <div className="font-semibold text-white">{t('wallets.type.ledger')}</div>
                    <p className="text-sm text-dark-400">{t('wallets.type.ledgerDesc')}</p>
                  </button>
                  <button
                    className="w-full p-4 rounded-xl border-2 border-dark-700 hover:border-primary-500 text-left"
                    onClick={() => {
                      setShowTypeModal(false);
                      void connectHardware('trezor');
                    }}
                  >
                    <div className="font-semibold text-white">{t('wallets.type.trezor')}</div>
                    <p className="text-sm text-dark-400">{t('wallets.type.trezorDesc')}</p>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal feedback hardware */}
      <AnimatePresence>
        {(hardwareStatus || hardwareAddress) && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setHardwareStatus(null); setHardwareAddress(null); }} />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{t('wallets.hardware.modalTitle')}</h3>
                  <button onClick={() => { setHardwareStatus(null); setHardwareAddress(null); }} className="p-2 hover:bg-dark-700 rounded">
                    <XMarkIcon className="w-5 h-5 text-dark-400" />
                  </button>
                </div>
                {hardwareStatus && <p className="text-dark-300">{hardwareStatus}</p>}
                {hardwareAddress && (
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-3">
                    <p className="text-xs text-dark-400 mb-1">{t('wallets.hardware.detectedAddress')}</p>
                    <p className="text-white font-mono break-all">{hardwareAddress}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal création wallet */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-800 rounded-2xl w-full max-w-2xl border border-dark-700 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-dark-700">
                  <h2 className="text-xl font-semibold text-white">
                    {t('wallets.create.modalTitle')}
                  </h2>
                  <p className="text-sm text-dark-400 mt-1">
                    {t('wallets.create.chooseBlockchain', { chains: COMPLETE_BLOCKCHAIN_LIST.length })}
                  </p>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        {t('wallets.create.nameLabel')}
                      </label>
                      <input
                        type="text"
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                        placeholder={t('wallets.create.namePlaceholder')}
                        className="input-base"
                      />
                    </div>

                    {/* Mot de passe */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          <LockClosedIcon className="w-4 h-4 inline mr-1" />
                          {t('wallets.create.passwordLabel')}
                        </label>
                        <input
                          type="password"
                          value={walletPassword}
                          onChange={(e) => setWalletPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          {t('wallets.create.confirmLabel')}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`input-base ${confirmPassword && walletPassword !== confirmPassword ? 'border-red-500' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-sm">
                      <p className="text-yellow-400">
                        ⚠️ {t('wallets.security.warning')}
                      </p>
                    </div>

                    {/* Recherche */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        {t('wallets.create.searchLabel')}
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={t('wallets.create.searchPlaceholder')}
                          className="input-base pl-10"
                        />
                      </div>
                    </div>

                    {/* Blockchain sélectionnée */}
                    {selectedBlockchain && (
                      <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{selectedBlockchain.icon}</span>
                          <div>
                            <p className="font-medium text-white">{selectedBlockchain.name}</p>
                            <p className="text-sm text-dark-400">{selectedBlockchain.symbol}</p>
                          </div>
                          <button
                            onClick={() => setSelectedBlockchain(null)}
                            className="ml-auto text-dark-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Sélection du type d'adresse Bitcoin */}
                        {selectedBlockchain.id === 'bitcoin' && selectedBlockchain.addressTypes && (
                          <div className="mt-4 pt-4 border-t border-primary-500/20">
                            <p className="text-sm font-medium text-dark-300 mb-3">
                              {t('wallets.create.btcAddressType')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedBlockchain.addressTypes.map((addrType) => (
                                <button
                                  key={addrType.bip}
                                  type="button"
                                  onClick={() => setSelectedAddressType(addrType)}
                                  className={`p-3 rounded-lg border text-left transition-all ${
                                    selectedAddressType?.bip === addrType.bip
                                      ? 'border-primary-500 bg-primary-500/10'
                                      : 'border-dark-600 hover:border-dark-500'
                                  }`}
                                >
                                  <p className="font-medium text-white text-sm">{addrType.type}</p>
                                  <p className="text-xs text-dark-400 mt-1">{addrType.prefix}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-primary-400">{addrType.bip}</span>
                                    <span className={`text-xs ${
                                      addrType.fees === 'Très bas' ? 'text-green-400' :
                                      addrType.fees === 'Bas' ? 'text-green-500' :
                                      addrType.fees === 'Moyens' ? 'text-yellow-400' :
                                      'text-orange-400'
                                    }`}>
                                      Frais: {addrType.fees}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Liste par catégories */}
                    {!selectedBlockchain && (
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                        {BLOCKCHAIN_CATEGORIES.map((cat) => {
                          const chains = groupedBlockchains[cat.id] || [];
                          if (chains.length === 0) return null;
                          
                          const isExpanded = expandedCategories.includes(cat.id);
                          
                          return (
                            <div key={cat.id} className="border border-dark-700 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between p-3 hover:bg-dark-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4 text-dark-400" />
                                  ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-dark-400" />
                                  )}
                                  <span className="font-medium text-white">{cat.name}</span>
                                  <span className="text-xs text-dark-400">({chains.length})</span>
                                </div>
                              </button>
                              
                              {isExpanded && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 pt-0">
                                  {chains.map((bc) => (
                                    <button
                                      key={bc.id}
                                      type="button"
                                      onClick={() => handleSelectBlockchain(bc)}
                                      className="p-2 rounded-lg border border-dark-600 hover:border-primary-500 hover:bg-dark-700/50 transition-all flex flex-col items-center gap-1"
                                      title={`${bc.name} (${bc.symbol})`}
                                    >
                                      <span
                                        className="text-xl"
                                        style={{ color: bc.color }}
                                      >
                                        {bc.icon}
                                      </span>
                                      <span className="text-xs text-dark-300 truncate w-full text-center">
                                        {bc.symbol}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-dark-700 flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedBlockchain(null);
                      setSelectedAddressType(null);
                      setWalletName('');
                      setWalletPassword('');
                      setConfirmPassword('');
                      setSearchTerm('');
                    }}
                    className="flex-1 btn-secondary justify-center"
                  >
                    {t('wallets.create.cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !selectedBlockchain || walletPassword.length < 8 || walletPassword !== confirmPassword}
                    className="flex-1 btn-primary justify-center disabled:opacity-50"
                  >
                    {isCreating ? t('wallets.create.creating') : t('wallets.create.submit')}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal demande de mot de passe pour décrypter */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setShowPasswordModal(null);
                setDecryptPassword('');
              }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {t('wallets.decrypt.title')}
                    </h2>
                    <p className="text-sm text-dark-400">{t('wallets.decrypt.subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      {t('wallets.decrypt.passwordLabel')}
                    </label>
                    <input
                      type="password"
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleDecryptSeed()}
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleDecryptSeed}
                    disabled={isDecrypting || !decryptPassword}
                    className="w-full btn-primary justify-center disabled:opacity-50"
                  >
                    {isDecrypting ? t('wallets.decrypt.decrypting') : t('wallets.decrypt.submit')}
                  </button>

                  <button
                    onClick={() => {
                      setShowPasswordModal(null);
                      setDecryptPassword('');
                    }}
                    className="w-full btn-secondary justify-center"
                  >
                    {t('wallets.create.cancel')}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal affichage seed - après déchiffrement */}
      <AnimatePresence>
        {showSeedModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSeedModal(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {t('wallets.seed.title')}
                    </h2>
                    <p className="text-sm text-dark-400">{t('wallets.seed.subtitle')}</p>
                  </div>
                </div>

                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-400">
                    ⚠️ <strong>{t('wallets.seed.warning')}</strong>
                  </p>
                </div>

                <div className="bg-dark-900 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {showSeedModal.seed.split(' ').map((word, index) => (
                      <div 
                        key={index}
                        className="bg-dark-800 rounded px-2 py-1.5 text-sm"
                      >
                        <span className="text-dark-500 mr-1">{index + 1}.</span>
                        <span className="text-white font-mono">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(showSeedModal.seed)}
                  className="w-full btn-secondary justify-center mb-3"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                  {t('wallets.seed.copy')}
                </button>

                <button
                  onClick={() => setShowSeedModal(null)}
                  className="w-full btn-primary justify-center"
                >
                  {t('wallets.seed.saved')}
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
