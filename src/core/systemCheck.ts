/**
 * ============================================================
 * NODE ORCHESTRATOR - System Check Module
 * ============================================================
 * Vérifications des ressources système avant lancement de nodes
 * Protection contre les crashs par manque de ressources
 * 
 * Ce module vérifie:
 * - Espace disque disponible
 * - Mémoire RAM disponible
 * - Charge CPU actuelle
 * - Santé de Docker
 * ============================================================
 */

import si from 'systeminformation';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { BLOCKCHAIN_CONFIGS, config } from '../config';
import { BlockchainType, NodeMode } from '../types';
import { logger } from '../utils/logger';
import { isNodeModeSupported } from './nodeSupport';

// ============================================================
// TYPES
// ============================================================

export interface SystemCheckResult {
  passed: boolean;
  checks: {
    disk: CheckDetail;
    memory: CheckDetail;
    cpu: CheckDetail;
    docker: CheckDetail;
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface CheckDetail {
  passed: boolean;
  current: number;
  required: number;
  unit: string;
  message: string;
}

export interface NodeRequirements {
  diskGB: number;
  memoryGB: number;
  syncDays: number;
}

// ============================================================
// CONSTANTES
// ============================================================

/**
 * Marge de sécurité pour l'espace disque (20GB minimum libre après node)
 */
const DISK_SAFETY_MARGIN_GB = 20;

/**
 * Seuil d'alerte CPU (%)
 */
const CPU_WARNING_THRESHOLD = 80;

/**
 * Seuil critique CPU (%)
 */
const CPU_CRITICAL_THRESHOLD = 95;

/**
 * Seuil d'alerte mémoire (% utilisé)
 */
const MEMORY_WARNING_THRESHOLD = 85;

// ============================================================
// FONCTIONS DE VÉRIFICATION
// ============================================================

/**
 * Vérifie l'espace disque disponible
 */
async function checkDiskSpace(requiredGB: number): Promise<CheckDetail> {
  try {
    const disks = await si.fsSize();
    
    // Trouver le disque principal (ou celui avec le chemin de données)
    let targetDisk = disks[0];
    const dataPath = config.paths.data;
    
    // Sur Windows, vérifier la lettre du lecteur
    if (os.platform() === 'win32') {
      const driveLetter = path.parse(dataPath).root;
      const matchingDisk = disks.find(d => d.mount.toLowerCase().startsWith(driveLetter.toLowerCase()));
      if (matchingDisk) targetDisk = matchingDisk;
    }
    
    const availableGB = (targetDisk.available || targetDisk.size - targetDisk.used) / (1024 * 1024 * 1024);
    const requiredWithMargin = requiredGB + DISK_SAFETY_MARGIN_GB;
    
    const passed = availableGB >= requiredWithMargin;
    
    return {
      passed,
      current: Math.round(availableGB * 100) / 100,
      required: requiredWithMargin,
      unit: 'GB',
      message: passed
        ? `Espace disque suffisant: ${Math.round(availableGB)}GB disponibles`
        : `⚠️ Espace disque insuffisant pour ce node. Requis: ${requiredWithMargin}GB (${requiredGB}GB pour le node + ${DISK_SAFETY_MARGIN_GB}GB marge de sécurité). Disponible: ${Math.round(availableGB)}GB`,
    };
  } catch (error) {
    logger.error('Erreur lors de la vérification du disque', { error });
    return {
      passed: false,
      current: 0,
      required: requiredGB,
      unit: 'GB',
      message: 'Impossible de vérifier l\'espace disque',
    };
  }
}

/**
 * Vérifie la mémoire RAM disponible
 */
async function checkMemory(requiredGB: number): Promise<CheckDetail> {
  try {
    const mem = await si.mem();
    const totalGB = mem.total / (1024 * 1024 * 1024);
    const availableGB = mem.available / (1024 * 1024 * 1024);
    const usedPercent = (mem.used / mem.total) * 100;
    
    // On vérifie la RAM totale (le système peut libérer de la RAM si nécessaire)
    const passed = totalGB >= requiredGB;
    const hasEnoughAvailable = availableGB >= requiredGB * 0.5;
    
    let message: string;
    if (!passed) {
      message = `⚠️ Mémoire RAM insuffisante. Requis: ${requiredGB}GB. Votre système: ${Math.round(totalGB * 10) / 10}GB total`;
    } else if (!hasEnoughAvailable) {
      message = `RAM totale suffisante (${Math.round(totalGB)}GB) mais ${Math.round(usedPercent)}% utilisée. Fermez des applications pour de meilleures performances.`;
    } else {
      message = `Mémoire suffisante: ${Math.round(availableGB * 10) / 10}GB disponibles sur ${Math.round(totalGB)}GB`;
    }
    
    return {
      passed,
      current: Math.round(totalGB * 100) / 100,
      required: requiredGB,
      unit: 'GB',
      message,
    };
  } catch (error) {
    logger.error('Erreur lors de la vérification de la mémoire', { error });
    return {
      passed: false,
      current: 0,
      required: requiredGB,
      unit: 'GB',
      message: 'Impossible de vérifier la mémoire',
    };
  }
}

/**
 * Vérification rapide disque + RAM avant lancement d'un node
 * Lève une erreur explicite si une ressource est insuffisante
 */
export async function checkDiskSpaceAndRAM(requiredDiskGB: number, requiredRAMGB: number): Promise<boolean> {
  const [diskCheck, memoryCheck] = await Promise.all([
    checkDiskSpace(requiredDiskGB),
    checkMemory(requiredRAMGB),
  ]);

  const errors: string[] = [];

  if (!diskCheck.passed) {
    errors.push(diskCheck.message);
  }

  if (!memoryCheck.passed) {
    errors.push(memoryCheck.message);
  }

  if (errors.length > 0) {
    logger.warn('checkDiskSpaceAndRAM failed', {
      requiredDiskGB,
      requiredRAMGB,
      errors,
    });
    throw new Error(errors.join(' | '));
  }

  return true;
}

/**
 * Vérifie la charge CPU actuelle
 */
async function checkCPU(): Promise<CheckDetail> {
  try {
    const load = await si.currentLoad();
    const cpuUsage = load.currentLoad;
    
    const passed = cpuUsage < CPU_CRITICAL_THRESHOLD;
    const warning = cpuUsage >= CPU_WARNING_THRESHOLD;
    
    let message: string;
    if (!passed) {
      message = `⚠️ CPU surchargé (${Math.round(cpuUsage)}%). Attendez que la charge diminue avant de lancer un node.`;
    } else if (warning) {
      message = `CPU chargé à ${Math.round(cpuUsage)}%. Le node pourrait être lent au démarrage.`;
    } else {
      message = `CPU disponible: ${Math.round(100 - cpuUsage)}% libre`;
    }
    
    return {
      passed,
      current: Math.round(cpuUsage),
      required: 100 - CPU_CRITICAL_THRESHOLD,
      unit: '%',
      message,
    };
  } catch (error) {
    logger.error('Erreur lors de la vérification du CPU', { error });
    return {
      passed: true, // Ne pas bloquer si on ne peut pas vérifier
      current: 0,
      required: 0,
      unit: '%',
      message: 'Impossible de vérifier la charge CPU',
    };
  }
}

/**
 * Vérifie que Docker est disponible et fonctionnel
 */
async function checkDocker(): Promise<CheckDetail> {
  // Mode développement: permettre de continuer sans Docker en localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = process.env.HOST === '127.0.0.1' || process.env.HOST === 'localhost' || !process.env.HOST;
  const skipDockerCheck = process.env.SKIP_DOCKER_CHECK === 'true' || (isDevelopment && isLocalhost);

  if (skipDockerCheck) {
    logger.warn('Mode développement: vérification Docker ignorée');
    return {
      passed: true,
      current: 1,
      required: 1,
      unit: 'status',
      message: `[Mode Dev] Docker check ignoré (mode localhost)`,
    };
  }

  try {
    const Docker = require('dockerode');
    const { getDockerConnectionAttempts } = require('../utils/dockerConnection');
    const attempts = getDockerConnectionAttempts();

    let docker: any = null;
    let lastErr: any = null;
    for (const a of attempts) {
      try {
        docker = new Docker(a.opts);
        const pingPromise = docker.ping();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Docker ping timeout')), 2500));
        await Promise.race([pingPromise, timeoutPromise]);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        docker = null;
      }
    }

    if (!docker) {
      throw lastErr || new Error('Docker indisponible');
    }
    
    // Tenter de ping Docker
    await docker.ping();
    
    // Vérifier l'espace disque Docker
    const info = await docker.info();
    
    return {
      passed: true,
      current: 1,
      required: 1,
      unit: 'status',
      message: `Docker opérationnel (${info.Containers || 0} containers, ${info.Images || 0} images)`,
    };
  } catch (error: any) {
    logger.error('Erreur lors de la vérification de Docker', { error: error.message });
    
    let message = '⚠️ Docker non disponible. ';
    if (error.code === 'ENOENT') {
      message += 'Socket Docker inaccessible. Vérifiez que Docker est installé et démarré (Docker Desktop OU Docker Engine dans WSL2).';
    } else if (error.code === 'ECONNREFUSED') {
      message += 'Docker ne répond pas. Démarrez le daemon (Docker Desktop OU Docker Engine dans WSL2).';
    } else {
      message += error.message;
    }
    
    return {
      passed: false,
      current: 0,
      required: 1,
      unit: 'status',
      message,
    };
  }
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

/**
 * Effectue toutes les vérifications système avant de lancer un node
 * 
 * @param blockchain - Type de blockchain
 * @param mode - Mode du node (full, pruned, light)
 * @returns Résultat complet des vérifications
 */
export async function performSystemCheck(
  blockchain: BlockchainType,
  mode: NodeMode
): Promise<SystemCheckResult> {
  logger.info('Vérification des ressources système', { blockchain, mode });
  
  const blockchainConfig = BLOCKCHAIN_CONFIGS[blockchain];
  if (!blockchainConfig) {
    return {
      passed: false,
      checks: {
        disk: { passed: false, current: 0, required: 0, unit: 'GB', message: 'Blockchain inconnue' },
        memory: { passed: false, current: 0, required: 0, unit: 'GB', message: 'Blockchain inconnue' },
        cpu: { passed: false, current: 0, required: 0, unit: '%', message: 'Blockchain inconnue' },
        docker: { passed: false, current: 0, required: 0, unit: 'status', message: 'Blockchain inconnue' },
      },
      errors: [`Blockchain non supportée: ${blockchain}`],
      warnings: [],
      recommendations: [],
    };
  }
  
  const requirements = blockchainConfig.requirements[mode];
  
  // Exécuter toutes les vérifications en parallèle
  const [diskCheck, memoryCheck, cpuCheck, dockerCheck] = await Promise.all([
    checkDiskSpace(requirements.diskGB),
    checkMemory(requirements.memoryGB),
    checkCPU(),
    checkDocker(),
  ]);
  
  // Collecter les erreurs et warnings
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Analyser les résultats
  if (!diskCheck.passed) {
    errors.push(diskCheck.message);
    recommendations.push(`Libérez au moins ${requirements.diskGB + DISK_SAFETY_MARGIN_GB}GB d'espace disque`);
  }
  
  if (!memoryCheck.passed) {
    errors.push(memoryCheck.message);
    if (mode !== 'light' && isNodeModeSupported(blockchain, 'light')) {
      recommendations.push(`Essayez le mode "light" qui nécessite moins de RAM`);
    }
  }
  
  if (!cpuCheck.passed) {
    warnings.push(cpuCheck.message);
    recommendations.push('Fermez les applications gourmandes en CPU');
  } else if (cpuCheck.current > CPU_WARNING_THRESHOLD) {
    warnings.push(cpuCheck.message);
  }
  
  if (!dockerCheck.passed) {
    errors.push(dockerCheck.message);
    recommendations.push('Installez ou démarrez Docker Desktop');
  }
  
  // Déterminer le résultat global
  const passed = diskCheck.passed && memoryCheck.passed && dockerCheck.passed;
  
  const result: SystemCheckResult = {
    passed,
    checks: {
      disk: diskCheck,
      memory: memoryCheck,
      cpu: cpuCheck,
      docker: dockerCheck,
    },
    errors,
    warnings,
    recommendations,
  };
  
  // Logger le résultat
  if (passed) {
    logger.info('Vérification système réussie', { blockchain, mode });
  } else {
    logger.warn('Vérification système échouée', { blockchain, mode, errors });
  }
  
  return result;
}

/**
 * Vérifie rapidement si on peut lancer un node (version simplifiée)
 * 
 * @param blockchain - Type de blockchain
 * @param mode - Mode du node
 * @returns true si le node peut être lancé
 */
export async function canLaunchNode(
  blockchain: BlockchainType,
  mode: NodeMode
): Promise<{ canLaunch: boolean; error?: string }> {
  const result = await performSystemCheck(blockchain, mode);
  
  if (result.passed) {
    return { canLaunch: true };
  }
  
  return {
    canLaunch: false,
    error: result.errors.join('\n'),
  };
}

/**
 * Obtenir les requirements d'une blockchain/mode
 */
export function getNodeRequirements(
  blockchain: BlockchainType,
  mode: NodeMode
): NodeRequirements | null {
  const blockchainConfig = BLOCKCHAIN_CONFIGS[blockchain];
  if (!blockchainConfig) return null;
  
  return blockchainConfig.requirements[mode];
}

/**
 * Estimer le temps de synchronisation
 */
export function estimateSyncTime(
  blockchain: BlockchainType,
  mode: NodeMode
): { days: number; message: string } {
  const requirements = getNodeRequirements(blockchain, mode);
  if (!requirements) {
    return { days: 0, message: 'Impossible d\'estimer' };
  }
  
  const days = requirements.syncDays;
  
  let message: string;
  if (days < 0.1) {
    message = 'Quelques minutes';
  } else if (days < 0.5) {
    message = 'Quelques heures';
  } else if (days < 1) {
    message = 'Moins d\'un jour';
  } else if (days === 1) {
    message = 'Environ 1 jour';
  } else {
    message = `Environ ${Math.ceil(days)} jours`;
  }
  
  return { days, message };
}

export default {
  performSystemCheck,
  checkDiskSpaceAndRAM,
  canLaunchNode,
  getNodeRequirements,
  estimateSyncTime,
};
