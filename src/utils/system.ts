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
    const [cpu, mem, disk] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
    ]);

    // Calculer l'espace disque total disponible
    const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);
    const availableDisk = totalDisk - usedDisk;

    return {
      cpuCores: cpu.cores,
      cpuModel: `${cpu.manufacturer} ${cpu.brand}`,
      totalMemoryGB: Math.round(mem.total / (1024 * 1024 * 1024) * 100) / 100,
      availableMemoryGB: Math.round(mem.available / (1024 * 1024 * 1024) * 100) / 100,
      totalDiskGB: Math.round(totalDisk / (1024 * 1024 * 1024) * 100) / 100,
      availableDiskGB: Math.round(availableDisk / (1024 * 1024 * 1024) * 100) / 100,
      platform: os.platform() as 'windows' | 'darwin' | 'linux',
      arch: os.arch(),
    };
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
 */
export async function canRunNode(
  blockchain: BlockchainType,
  mode: NodeMode
): Promise<{ canRun: boolean; reason?: string }> {
  const resources = await getSystemResources();
  const config = BLOCKCHAIN_CONFIGS[blockchain];
  const requirements = config.requirements[mode];

  if (resources.availableDiskGB < requirements.diskGB) {
    return {
      canRun: false,
      reason: `Espace disque insuffisant. Requis: ${requirements.diskGB}GB, Disponible: ${resources.availableDiskGB}GB`,
    };
  }

  if (resources.availableMemoryGB < requirements.memoryGB) {
    return {
      canRun: false,
      reason: `Mémoire insuffisante. Requis: ${requirements.memoryGB}GB, Disponible: ${resources.availableMemoryGB}GB`,
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
