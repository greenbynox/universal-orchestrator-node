/**
 * ============================================================
 * NODE ORCHESTRATOR - System Utilities
 * ============================================================
 * Détection des ressources système et recommandations
 */

import si from 'systeminformation';
import os from 'os';
import { 
  SystemResources, 
  NodeModeRecommendation, 
  BlockchainType, 
  NodeMode 
} from '../types';
import { blockchainRegistry } from '../config/blockchains';
import { logger } from './logger';
import { getNodeSupportedModes, isNodeModeSupported } from '../core/nodeSupport';

/**
 * Obtenir les ressources système actuelles
 */
export async function getSystemResources(): Promise<SystemResources> {
  try {
    // Helper function with timeout
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };
    
    let cpu, mem, disk;
    try {
      cpu = await withTimeout(si.cpu(), 5000);
    } catch {
      cpu = { cores: os.cpus().length, model: os.cpus()[0]?.model || 'Unknown CPU' };
    }

    try {
      mem = await withTimeout(si.mem(), 5000);
    } catch {
      mem = { total: os.totalmem(), free: os.freemem(), available: os.freemem() };
    }

    try {
      disk = await withTimeout(si.fsSize(), 5000);
    } catch {
      disk = [{ size: 1000000000000, used: 500000000000 }]; // 1TB total, 500GB used fallback
    }

    // Validate data
    if (!cpu || typeof cpu.cores === 'undefined') {
      throw new Error('Invalid CPU data - missing cores property');
    }
    if (!mem || typeof mem.total === 'undefined') {
      throw new Error('Invalid memory data - missing total property');
    }
    if (!Array.isArray(disk) || disk.length === 0) {
      throw new Error('Invalid disk data - not an array or empty');
    }

    // Calculate disk space
    const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);
    const availableDisk = totalDisk - usedDisk;

    const result: SystemResources = {
      cpuCores: cpu.cores || os.cpus().length,
      cpuModel: `${cpu.manufacturer || ''} ${cpu.brand || 'Unknown CPU'}`.trim(),
      totalMemoryGB: Math.round(mem.total / (1024 * 1024 * 1024) * 100) / 100,
      availableMemoryGB: Math.round(mem.available / (1024 * 1024 * 1024) * 100) / 100,
      totalDiskGB: Math.round(totalDisk / (1024 * 1024 * 1024) * 100) / 100,
      availableDiskGB: Math.round(availableDisk / (1024 * 1024 * 1024) * 100) / 100,
      platform: os.platform() as 'windows' | 'darwin' | 'linux',
      arch: os.arch(),
    };

    return result;
  } catch (error) {
    logger.error('Erreur lors de la détection des ressources système', { error });
    throw error;
  }
}

/**
 * Obtenir les métriques système en temps réel
 */
export async function getCurrentMetrics(): Promise<{
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}> {
  const [cpuLoad, mem, disk] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);

  const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
  const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);

  return {
    cpuUsage: Math.round(cpuLoad.currentLoad * 100) / 100,
    memoryUsage: Math.round((mem.used / mem.total) * 100 * 100) / 100,
    diskUsage: Math.round((usedDisk / totalDisk) * 100 * 100) / 100,
  };
}

/**
 * Recommander le meilleur mode pour un node basé sur les ressources
 */
export async function recommendNodeMode(
  blockchain: BlockchainType
): Promise<NodeModeRecommendation> {
  const resources = await getSystemResources();

  const supportedModes = getNodeSupportedModes(blockchain);
  if (supportedModes.length === 0) {
    return {
      blockchain,
      recommendedMode: 'pruned',
      reason: `Aucun mode de node n'est supporté pour "${blockchain}" (catalogue uniquement).`,
      requirements: { diskGB: 0, memoryGB: 0, syncDays: 0 },
    };
  }

  const chain = blockchainRegistry.get(blockchain);
  if (!chain?.docker?.requirements) {
    // No requirements: pick the lightest supported mode.
    const preferred: NodeMode[] = ['light', 'pruned', 'full'];
    const recommendedMode = preferred.find(m => supportedModes.includes(m)) || supportedModes[0];
    return {
      blockchain,
      recommendedMode,
      reason: `Mode "${recommendedMode}" recommandé (requirements non trouvées, fallback).`,
      requirements: { diskGB: 0, memoryGB: 0, syncDays: 0 },
    };
  }
  const requirements = chain.docker.requirements;

  // Try modes from heaviest to lightest, but only among supported modes.
  const ordered: NodeMode[] = ['full', 'pruned', 'light'];
  const candidates = ordered.filter(m => supportedModes.includes(m));

  for (const m of candidates) {
    const req = (requirements as any)[m] || (m === 'full'
      ? { diskGB: 500, memoryGB: 8, cpuCores: 2, syncDays: 7 }
      : m === 'pruned'
        ? { diskGB: 100, memoryGB: 4, cpuCores: 2, syncDays: 3 }
        : { diskGB: 10, memoryGB: 2, cpuCores: 1, syncDays: 0 }
    );

    if (resources.availableDiskGB >= req.diskGB && resources.availableMemoryGB >= req.memoryGB) {
      return {
        blockchain,
        recommendedMode: m,
        reason: m === 'full'
          ? 'Votre système a assez de ressources pour un full node.'
          : m === 'pruned'
            ? 'Mode pruned recommandé pour économiser l\'espace disque.'
            : 'Mode light recommandé car ressources limitées.',
        requirements: req,
      };
    }
  }

  // Nothing fits: pick the lightest supported mode.
  const preferred: NodeMode[] = ['light', 'pruned', 'full'];
  const fallbackMode = preferred.find(m => supportedModes.includes(m)) || supportedModes[supportedModes.length - 1];
  const fallbackReq = (requirements as any)[fallbackMode] || { diskGB: 0, memoryGB: 0, syncDays: 0 };
  return {
    blockchain,
    recommendedMode: fallbackMode,
    reason: `Ressources limitées. Mode "${fallbackMode}" recommandé parmi les modes supportés.`,
    requirements: fallbackReq,
  };
}

/**
 * Vérifier si le système peut supporter un node
 * Note: On vérifie la RAM TOTALE du système, pas la RAM disponible actuellement
 * car Windows peut libérer de la RAM quand nécessaire
 */
export async function canRunNode(
  blockchain: BlockchainType,
  mode: NodeMode
): Promise<{ canRun: boolean; reason?: string; warning?: string }> {
  if (!isNodeModeSupported(blockchain, mode)) {
    const supported = getNodeSupportedModes(blockchain);
    const supportedText = supported.length ? supported.join(', ') : 'aucun';
    return {
      canRun: false,
      reason: `Mode "${mode}" non supporté pour "${blockchain}". Modes supportés: ${supportedText}`,
    };
  }

  const resources = await getSystemResources();
  const chain = blockchainRegistry.get(blockchain);
  if (!chain?.docker?.requirements?.[mode]) {
    // Fallback defaults if blockchain requirements not found
    const defaults = { full: { diskGB: 500, memoryGB: 8 }, pruned: { diskGB: 100, memoryGB: 4 }, light: { diskGB: 10, memoryGB: 2 } };
    const defaultReqs = defaults[mode as keyof typeof defaults] || { diskGB: 10, memoryGB: 2 };
    
    if (resources.availableDiskGB < defaultReqs.diskGB) {
      return {
        canRun: false,
        reason: `Espace disque insuffisant. Requis: ${defaultReqs.diskGB}GB, Disponible: ${resources.availableDiskGB}GB`,
      };
    }
    if (resources.totalMemoryGB < defaultReqs.memoryGB) {
      return {
        canRun: false,
        reason: `Mémoire RAM totale insuffisante. Requis: ${defaultReqs.memoryGB}GB, Votre système: ${resources.totalMemoryGB}GB`,
      };
    }
    if (resources.availableMemoryGB < defaultReqs.memoryGB * 0.5) {
      return {
        canRun: true,
        warning: `RAM disponible faible (${resources.availableMemoryGB}GB). Fermez des applications pour de meilleures performances.`,
      };
    }
    return { canRun: true };
  }

  const requirements = chain.docker.requirements[mode]!;

  if (resources.availableDiskGB < requirements.diskGB) {
    return {
      canRun: false,
      reason: `Espace disque insuffisant. Requis: ${requirements.diskGB}GB, Disponible: ${resources.availableDiskGB}GB`,
    };
  }

  // Vérifier la RAM TOTALE du système (pas la RAM disponible actuellement)
  if (resources.totalMemoryGB < requirements.memoryGB) {
    return {
      canRun: false,
      reason: `Mémoire RAM totale insuffisante. Requis: ${requirements.memoryGB}GB, Votre système: ${resources.totalMemoryGB}GB`,
    };
  }

  // Si la RAM disponible est faible, on avertit mais on ne bloque pas
  if (resources.availableMemoryGB < requirements.memoryGB * 0.5) {
    return {
      canRun: true,
      warning: `RAM disponible faible (${resources.availableMemoryGB}GB). Fermez des applications pour de meilleures performances.`,
    };
  }

  return { canRun: true };
}

/**
 * Obtenir les recommandations pour toutes les blockchains
 */
export async function getAllRecommendations(): Promise<NodeModeRecommendation[]> {
  const blockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
  
  return Promise.all(
    blockchains.map(blockchain => recommendNodeMode(blockchain))
  );
}
