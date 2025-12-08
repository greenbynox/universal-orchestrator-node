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

/**
 * Obtenir les ressources système actuelles
 */
export async function getSystemResources(): Promise<SystemResources> {
  try {
    console.log('[getSystemResources] ========== STARTING ==========');
    
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
      console.log('[getSystemResources] Calling si.cpu() with 5s timeout...');
      cpu = await withTimeout(si.cpu(), 5000);
      console.log('[getSystemResources] si.cpu() returned successfully. Type:', typeof cpu, 'Keys:', cpu ? Object.keys(cpu) : 'NULL');
    } catch (cpuErr) {
      console.error('[getSystemResources] Error getting CPU:', cpuErr);
      // Fallback to defaults if si.cpu() fails
      console.warn('[getSystemResources] Using fallback CPU values');
      cpu = { cores: os.cpus().length, model: os.cpus()[0]?.model || 'Unknown CPU' };
    }

    try {
      console.log('[getSystemResources] Calling si.mem() with 5s timeout...');
      mem = await withTimeout(si.mem(), 5000);
      console.log('[getSystemResources] si.mem() returned successfully. Type:', typeof mem, 'Keys:', mem ? Object.keys(mem) : 'NULL');
    } catch (memErr) {
      console.error('[getSystemResources] Error getting memory:', memErr);
      // Fallback to defaults if si.mem() fails
      console.warn('[getSystemResources] Using fallback memory values');
      mem = { total: os.totalmem(), free: os.freemem(), available: os.freemem() };
    }

    try {
      console.log('[getSystemResources] Calling si.fsSize() with 5s timeout...');
      disk = await withTimeout(si.fsSize(), 5000);
      console.log('[getSystemResources] si.fsSize() returned successfully. Type:', typeof disk, 'IsArray:', Array.isArray(disk), 'Length:', disk ? disk.length : 'N/A');
    } catch (diskErr) {
      console.error('[getSystemResources] Error getting disk:', diskErr);
      // Fallback to empty array if si.fsSize() fails
      console.warn('[getSystemResources] Using fallback disk values');
      disk = [{ size: 1000000000000, used: 500000000000 }]; // 1TB total, 500GB used
    }

    // Vérifier que on a bien les propriétés attendues
    console.log('[getSystemResources] Validating CPU data: cpu.cores=' + (cpu ? cpu.cores : 'undefined'));
    if (!cpu || typeof cpu.cores === 'undefined') {
      console.error('[getSystemResources] Invalid CPU data - missing cores property. CPU object:', JSON.stringify(cpu));
      throw new Error('Invalid CPU data - missing cores property');
    }
    
    console.log('[getSystemResources] Validating memory data: mem.total=' + (mem ? mem.total : 'undefined'));
    if (!mem || typeof mem.total === 'undefined') {
      console.error('[getSystemResources] Invalid memory data - missing total property. Memory object:', JSON.stringify(mem));
      throw new Error('Invalid memory data - missing total property');
    }
    
    console.log('[getSystemResources] Validating disk data: Array.isArray=' + Array.isArray(disk) + ', length=' + (disk ? disk.length : 'N/A'));
    if (!Array.isArray(disk) || disk.length === 0) {
      console.error('[getSystemResources] Invalid disk data - not an array or empty. Disk:', JSON.stringify(disk));
      throw new Error('Invalid disk data - not an array or empty');
    }

    // Calculer l'espace disque total disponible
    console.log('[getSystemResources] Computing disk values...');
    const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);
    const availableDisk = totalDisk - usedDisk;
    console.log('[getSystemResources] Disk values computed: totalDisk=' + totalDisk + ' bytes, availableDisk=' + availableDisk + ' bytes');

    console.log('[getSystemResources] Creating result object...');
    const result: SystemResources = {
      cpuCores: cpu.cores || 999, // DEFAULT FOR DEBUGGING
      cpuModel: `${cpu.manufacturer || 'UNK'} ${cpu.brand || 'UNK'} [TRANSFORMED]`,
      totalMemoryGB: Math.round(mem.total / (1024 * 1024 * 1024) * 100) / 100,
      availableMemoryGB: Math.round(mem.available / (1024 * 1024 * 1024) * 100) / 100,
      totalDiskGB: Math.round(totalDisk / (1024 * 1024 * 1024) * 100) / 100,
      availableDiskGB: Math.round(availableDisk / (1024 * 1024 * 1024) * 100) / 100,
      platform: os.platform() as 'windows' | 'darwin' | 'linux',
      arch: os.arch(),
    };

    console.log('[getSystemResources] Result object keys:', Object.keys(result));
    console.log('[getSystemResources] Result object:', JSON.stringify(result));
    console.log('[getSystemResources] ========== ABOUT TO RETURN ==========');
    return result;
  } catch (error) {
    console.error('[getSystemResources] FATAL ERROR:', error);
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
  const chain = blockchainRegistry.get(blockchain);
  if (!chain?.docker?.requirements) {
    // Fallback defaults if blockchain has no requirements
    const defaultRequirements = { 
      full: { diskGB: 500, memoryGB: 8, cpuCores: 2, syncDays: 7 },
      pruned: { diskGB: 100, memoryGB: 4, cpuCores: 2, syncDays: 3 },
      light: { diskGB: 10, memoryGB: 2, cpuCores: 1, syncDays: 0 },
    };
    return {
      blockchain,
      recommendedMode: 'light',
      reason: 'Mode light recommandé (blockchain requirements non trouvées).',
      requirements: defaultRequirements.light,
    };
  }
  const requirements = chain.docker.requirements;

  // Vérifier si le système peut supporter un full node
  if (
    resources.availableDiskGB >= (requirements.full?.diskGB || 500) &&
    resources.availableMemoryGB >= (requirements.full?.memoryGB || 8)
  ) {
    return {
      blockchain,
      recommendedMode: 'full',
      reason: 'Votre système a assez de ressources pour un full node.',
      requirements: requirements.full || { diskGB: 500, memoryGB: 8, cpuCores: 2, syncDays: 7 },
    };
  }

  // Vérifier pour pruned
  if (
    resources.availableDiskGB >= (requirements.pruned?.diskGB || 100) &&
    resources.availableMemoryGB >= (requirements.pruned?.memoryGB || 4)
  ) {
    return {
      blockchain,
      recommendedMode: 'pruned',
      reason: 'Mode pruned recommandé pour économiser l\'espace disque.',
      requirements: requirements.pruned || { diskGB: 100, memoryGB: 4, cpuCores: 2, syncDays: 3 },
    };
  }

  // Par défaut, light node
  return {
    blockchain,
    recommendedMode: 'light',
    reason: 'Mode light recommandé car ressources limitées.',
    requirements: requirements.light || { diskGB: 10, memoryGB: 2, cpuCores: 1, syncDays: 0 },
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
