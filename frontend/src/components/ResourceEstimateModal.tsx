import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { systemApi } from '../services/api';
import type { BlockchainType, NodeMode, SystemResources } from '../types';

const REQUIREMENTS: Record<string, Record<NodeMode, { disk: number; memory: number; cpu: number; syncTime: string }>> = {
  bitcoin: {
    full: { disk: 600, memory: 4, cpu: 1, syncTime: '~7 days' },
    pruned: { disk: 50, memory: 2, cpu: 1, syncTime: '~2 days' },
    light: { disk: 5, memory: 1, cpu: 1, syncTime: 'hours' },
  },
  ethereum: {
    full: { disk: 1000, memory: 8, cpu: 4, syncTime: '~5 days' },
    pruned: { disk: 200, memory: 4, cpu: 2, syncTime: '~2 days' },
    light: { disk: 10, memory: 2, cpu: 1, syncTime: 'hours' },
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (blockchain: BlockchainType, mode: NodeMode) => void;
}

export default function ResourceEstimateModal({ isOpen, onClose, onProceed }: Props) {
  const [blockchain, setBlockchain] = useState<BlockchainType>('bitcoin');
  const [mode, setMode] = useState<NodeMode>('full');
  const [resources, setResources] = useState<SystemResources | null>(null);

  useEffect(() => {
    if (isOpen) {
      systemApi.getResources().then(setResources).catch(() => setResources(null));
    }
  }, [isOpen]);

  const req = REQUIREMENTS[blockchain]?.[mode];
  const diskOk = resources && req ? resources.availableDiskGB >= req.disk : true;
  const memOk = resources && req ? resources.availableMemoryGB >= req.memory : true;
  const cpuOk = true;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Estimation des ressources</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark-400">Blockchain</label>
                  <select className="select-base w-full" value={blockchain} onChange={(e) => setBlockchain(e.target.value as BlockchainType)}>
                    <option value="bitcoin">Bitcoin</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-dark-400">Mode</label>
                  <select className="select-base w-full" value={mode} onChange={(e) => setMode(e.target.value as NodeMode)}>
                    <option value="full">Full</option>
                    <option value="pruned">Pruned</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>

              {req && (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-2">
                  <div className="font-semibold text-white">Estimated Requirements</div>
                  <p className="text-dark-300">Disk: {req.disk} GB</p>
                  <p className="text-dark-300">Memory: {req.memory} GB</p>
                  <p className="text-dark-300">CPU: {req.cpu} core(s)</p>
                  <p className="text-dark-300">Sync Time: {req.syncTime}</p>
                </div>
              )}

              {resources && (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-2">
                  <div className="font-semibold text-white">Your System</div>
                  <p className={`text-dark-300 ${diskOk ? 'text-green-400' : 'text-amber-400'}`}>
                    Free Disk: {resources.availableDiskGB.toFixed(0)} GB {diskOk ? '✅' : '⚠️'}
                  </p>
                  <p className={`text-dark-300 ${memOk ? 'text-green-400' : 'text-amber-400'}`}>
                    Free Memory: {resources.availableMemoryGB.toFixed(1)} GB {memOk ? '✅' : '⚠️'}
                  </p>
                  <p className={`text-dark-300 ${cpuOk ? 'text-green-400' : 'text-amber-400'}`}>
                    CPU Available: {resources.cpuCores} cores ✅
                  </p>
                </div>
              )}

              {!diskOk && <p className="text-amber-400 text-sm">⚠️ WARNING: Insufficient disk space for this node.</p>}

              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Annuler</button>
                <button className="btn-primary flex-1 justify-center" onClick={() => onProceed(blockchain, mode)}>
                  Continuer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
