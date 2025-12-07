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
import { BLOCKCHAIN_CONFIGS } from '../config';
import { logger } from './logger';

/**
 * Obtenir les ressources système actuelles
 */
export async function getSystemResources(): Promise<SystemResources> {
  try {
    console.log('[getSystemResources] ========== STARTING ==========');
    
    let cpu, mem, disk;
    try {
      console.log('[getSystemResources] Calling si.cpu()...');
      cpu = await si.cpu();
      console.log('[getSystemResources] si.cpu() returned successfully. Type:', typeof cpu, 'Keys:', cpu ? Object.keys(cpu) : 'NULL');
    } catch (cpuErr) {
      console.error('[getSystemResources] Error getting CPU:', cpuErr);
      throw cpuErr;
    }

    try {
      console.log('[getSystemResources] Calling si.mem()...');
      mem = await si.mem();
      console.log('[getSystemResources] si.mem() returned successfully. Type:', typeof mem, 'Keys:', mem ? Object.keys(mem) : 'NULL');
    } catch (memErr) {
      console.error('[getSystemResources] Error getting memory:', memErr);
      throw memErr;
    }

    try {
      console.log('[getSystemResources] Calling si.fsSize()...');
      disk = await si.fsSize();
      console.log('[getSystemResources] si.fsSize() returned successfully. Type:', typeof disk, 'IsArray:', Array.isArray(disk), 'Length:', disk ? disk.length : 'N/A');
    } catch (diskErr) {
      console.error('[getSystemResources] Error getting disk:', diskErr);
      throw diskErr;
    }

    // Vérifier que on a bien les propriétés attendues
    console.log('[getSystemResources] Validating CPU data: cpu.cores=' + (cpu ? cpu.cores : 'undefined'));
    if (!cpu || typeof cpu.cores === 'undefined') {
      console.error('[getSystemResources] Invalid CPU data - missing cores property. CPU object:', JSON.stringify(cpu));
      throw new Error('Invalid CPU data from systeminformation - missing cores property');
    }
    
    console.log('[getSystemResources] Validating memory data: mem.total=' + (mem ? mem.total : 'undefined'));
    if (!mem || typeof mem.total === 'undefined') {
      console.error('[getSystemResources] Invalid memory data - missing total property. Memory object:', JSON.stringify(mem));
      throw new Error('Invalid memory data from systeminformation - missing total property');
    }
    
    console.log('[getSystemResources] Validating disk data: Array.isArray=' + Array.isArray(disk) + ', length=' + (disk ? disk.length : 'N/A'));
    if (!Array.isArray(disk) || disk.length === 0) {
      console.error('[getSystemResources] Invalid disk data - not an array or empty. Disk:', JSON.stringify(disk));
      throw new Error('Invalid disk data from systeminformation - not an array or empty');
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
  const config = BLOCKCHAIN_CONFIGS[blockchain];
  const requirements = config.requirements;

  // Vérifier si le système peut supporter un full node
  if (
    resources.availableDiskGB >= requirements.full.diskGB &&
    resources.availableMemoryGB >= requirements.full.memoryGB
  ) {
    return {
      blockchain,
      recommendedMode: 'full',
      reason: 'Votre système a assez de ressources pour un full node.',
      requirements: requirements.full,
    };
  }

  // Vérifier pour pruned
  if (
    resources.availableDiskGB >= requirements.pruned.diskGB &&
    resources.availableMemoryGB >= requirements.pruned.memoryGB
  ) {
    return {
      blockchain,
      recommendedMode: 'pruned',
      reason: 'Mode pruned recommandé pour économiser l\'espace disque.',
      requirements: requirements.pruned,
    };
  }

  // Par défaut, light node
  return {
    blockchain,
    recommendedMode: 'light',
    reason: 'Mode light recommandé car ressources limitées.',
    requirements: requirements.light,
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
  const config = BLOCKCHAIN_CONFIGS[blockchain];
  const requirements = config.requirements[mode];

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
