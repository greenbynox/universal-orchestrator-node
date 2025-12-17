/**
 * ============================================================
 * NODE ORCHESTRATOR - Security Module
 * ============================================================
 * Fonctions de sécurité pour la validation et le nettoyage des entrées
 * Protection contre les injections et les abus Docker
 * 
 * IMPORTANT: Ce module est critique pour la sécurité de l'application
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { getNodeSupportedModes, isNodeModeSupported } from './nodeSupport';
import { blockchainRegistry } from '../config/blockchains';
import { BlockchainType, NodeMode } from '../types';

// ============================================================
// WHITELIST DES IMAGES DOCKER AUTORISÉES
// ============================================================

/**
 * Génère la whitelist des images Docker à partir de blockchainRegistry
 * Cela permet une whitelist dynamique qui s'adapte automatiquement
 * quand on ajoute des blockchains
 */
function generateDockerImageWhitelist(): Set<string> {
  const whitelist = new Set<string>();
  
  // Ajouter les images de base (registries courantes)
  const commonImages = [
    // Registries officielles courantes
    'kylemanna/bitcoind:latest',
    'kylemanna/bitcoind:stable',
    'ethereum/client-go:latest',
    'ethereum/client-go:stable',
    'solanalabs/solana:latest',
    'parity/polkadot:latest',
    'inputoutput/cardano-node:latest',
    'cosmos/gaia:latest',
  ];
  
  commonImages.forEach(img => whitelist.add(img));
  
  // Ajouter toutes les images des blockchains configurées
  try {
    const { blockchainRegistry } = require('../config/blockchains');
    const chains = blockchainRegistry.getAll();
    
    chains.forEach((chain: any) => {
      if (chain.docker?.images) {
        Object.values(chain.docker.images).forEach((image: any) => {
          if (typeof image === 'string' && image.trim()) {
            whitelist.add(image.toLowerCase());
          }
        });
      }
    });
  } catch (error) {
    console.warn('Could not load blockchainRegistry for whitelist generation', error);
  }
  
  return whitelist;
}

export const DOCKER_IMAGE_WHITELIST: Set<string> = generateDockerImageWhitelist();

// Registries / prefixes autorisés (patterns)
export const DOCKER_REGISTRY_WHITELIST: string[] = [
  'ghcr.io/universal-orchestrator/',
  'kylemanna/',
];

/**
 * Patterns d'images autorisés (regex pour flexibilité)
 * Utilisé pour les versions spécifiques
 */
export const DOCKER_IMAGE_PATTERNS: RegExp[] = [
  /^kylemanna\/bitcoind:v?\d+\.\d+(\.\d+)?$/,
  /^ethereum\/client-go:v?\d+\.\d+(\.\d+)?$/,
  /^solanalabs\/solana:v?\d+\.\d+(\.\d+)?$/,
  /^parity\/polkadot:v?\d+\.\d+(\.\d+)?$/,
  /^inputoutput\/cardano-node:\d+\.\d+(\.\d+)?$/,
  /^cosmos\/gaia:v?\d+\.\d+(\.\d+)?$/,
];

// ============================================================
// VALIDATION DES IMAGES DOCKER
// ============================================================

/**
 * Vérifie si une image Docker est autorisée
 * 
 * @param image - Nom de l'image Docker (ex: 'ethereum/client-go:latest')
 * @returns true si l'image est dans la whitelist
 */
export function isImageAllowed(image: string): boolean {
  // Normaliser l'image (lowercase, trim)
  const normalizedImage = image.toLowerCase().trim();

  // Rejeter immédiatement les caractères dangereux ou espaces
  if (!normalizedImage || /\s/.test(normalizedImage) || /["'`$]/.test(normalizedImage)) {
    logger.warn('Image Docker invalide (caractères interdits)', { image });
    return false;
  }

  // Exiger un tag explicite pour éviter les pulls implicites
  if (!normalizedImage.includes(':')) {
    logger.warn('Image Docker sans tag rejetée', { image });
    return false;
  }
  
  // Vérifier la whitelist exacte
  if (DOCKER_IMAGE_WHITELIST.has(normalizedImage)) {
    return true;
  }
  
  // Vérifier les patterns (pour les versions spécifiques)
  for (const pattern of DOCKER_IMAGE_PATTERNS) {
    if (pattern.test(normalizedImage)) {
      return true;
    }
  }

  // Vérifier les registries whitelistees
  const registryAllowed = DOCKER_REGISTRY_WHITELIST.some(prefix => normalizedImage.startsWith(prefix));
  if (registryAllowed) {
    return true;
  }
  
  logger.warn('Image Docker non autorisée tentée', { image, normalizedImage });
  return false;
}

/**
 * Valide une image Docker avant utilisation
 * Lance une erreur si l'image n'est pas autorisée
 * 
 * @param image - Nom de l'image Docker
 * @throws Error si l'image n'est pas dans la whitelist
 */
export function validateDockerImage(image: string): void {
  if (!isImageAllowed(image)) {
    const error = `Image Docker non autorisée: "${image}". Seules les images de la whitelist sont acceptées.`;
    logger.error('Tentative d\'utilisation d\'image non autorisée', { image });
    throw new Error(error);
  }
}

/**
 * Obtenir l'image Docker validée pour une blockchain/mode
 * 
 * @param blockchain - Type de blockchain
 * @param mode - Mode du node (full, pruned, light)
 * @returns Image Docker validée
 * @throws Error si la blockchain n'est pas supportée ou l'image non autorisée
 */
export function getValidatedDockerImage(blockchain: BlockchainType, mode: NodeMode): string {
  const chain = blockchainRegistry.get(blockchain);
  
  if (!chain) {
    throw new Error(`Blockchain non supportée: ${blockchain}`);
  }
  
  if (!chain.docker?.images) {
    throw new Error(`Blockchain non supportée en tant que node: ${blockchain}`);
  }
  
  const image = chain.docker.images[mode];
  
  if (!image) {
    throw new Error(`Mode "${mode}" non supporté pour ${blockchain}`);
  }
  
  // Valider que l'image est dans la whitelist
  validateDockerImage(image);
  
  return image;
}

// ============================================================
// SANITIZATION DES ENTRÉES
// ============================================================

/**
 * Caractères dangereux à supprimer des entrées utilisateur
 * Prévient les injections shell/SQL/path traversal
 */
const DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\'"!#%^*\n\r\t\x00-\x1f]/g;

// Ports système ou réservés à éviter
const RESERVED_PORTS = new Set([
  22, // SSH
  25, 465, 587, // SMTP
  53, // DNS
  80, 443, // HTTP/HTTPS
  3000, 3001, // App interne
  3306, 5432, // Bases SQL
  6379, // Redis
  27017, // Mongo
]);

/**
 * Pattern pour les noms valides (alphanumeric, tirets, underscores)
 */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/;

/**
 * Pattern pour les chemins de fichiers sûrs
 */
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;

/**
 * Nettoie une entrée utilisateur en supprimant les caractères dangereux
 * 
 * @param input - Chaîne à nettoyer
 * @returns Chaîne nettoyée
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Supprimer les caractères dangereux
  let sanitized = input.replace(DANGEROUS_CHARS, '');
  
  // Limiter la longueur
  sanitized = sanitized.substring(0, 256);
  
  // Trim
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Valide et nettoie un nom de node
 * 
 * @param name - Nom proposé pour le node
 * @returns Nom validé et nettoyé
 * @throws Error si le nom est invalide
 */
export function sanitizeNodeName(name: string): string {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Le nom du node est requis');
  }
  
  if (sanitized.length > 63) {
    throw new Error('Le nom du node ne doit pas dépasser 63 caractères');
  }
  
  if (!VALID_NAME_PATTERN.test(sanitized)) {
    throw new Error('Le nom du node ne peut contenir que des lettres, chiffres, tirets et underscores');
  }
  
  return sanitized;
}

/**
 * Valide et nettoie un chemin de fichier
 * Prévient les attaques path traversal
 * 
 * @param filePath - Chemin à valider
 * @param basePath - Chemin de base autorisé
 * @returns Chemin validé
 * @throws Error si le chemin est invalide ou tente un path traversal
 */
export function sanitizePath(filePath: string, basePath: string): string {
  if (!basePath) {
    throw new Error('Chemin de base manquant');
  }

  const normalizedBase = path.resolve(basePath);
  if (normalizedBase === path.parse(normalizedBase).root) {
    throw new Error('Chemin de base non sécurisé (root)');
  }

  try {
    fs.accessSync(normalizedBase, fs.constants.R_OK);
  } catch (error) {
    logger.error('Accès refusé au chemin de base', { basePath: normalizedBase, error });
    throw new Error('Permissions insuffisantes sur le chemin de base');
  }

  const sanitized = sanitizeInput(filePath);
  if (!sanitized) {
    throw new Error('Chemin de fichier vide ou invalide');
  }
  
  // Vérifier les tentatives de path traversal
  if (sanitized.includes('..') || sanitized.includes('//')) {
    logger.warn('Tentative de path traversal détectée', { filePath, basePath });
    throw new Error('Chemin de fichier invalide: path traversal détecté');
  }
  
  // Vérifier le pattern
  if (!SAFE_PATH_PATTERN.test(sanitized)) {
    throw new Error('Chemin de fichier invalide: caractères non autorisés');
  }
  
  // S'assurer que le chemin reste dans le basePath
  const resolvedPath = path.resolve(normalizedBase, sanitized);
  const resolvedBase = fs.realpathSync(normalizedBase);
  const resolvedTargetDir = path.resolve(resolvedPath, '..');

  if (!resolvedPath.startsWith(resolvedBase)) {
    logger.warn('Tentative d\'accès hors du dossier autorisé', { 
      filePath, 
      basePath, 
      resolvedPath 
    });
    throw new Error('Accès au chemin non autorisé');
  }

  // Vérifier que le dossier cible est accessible en lecture/écriture
  try {
    fs.accessSync(resolvedTargetDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    logger.warn('Permissions insuffisantes sur le dossier cible', { resolvedTargetDir });
    throw new Error('Permissions insuffisantes sur le dossier cible');
  }
  
  return resolvedPath;
}

/**
 * Valide un port réseau
 * 
 * @param port - Numéro de port
 * @returns Port validé
 * @throws Error si le port est invalide
 */
export function validatePort(port: number): number {
  const portNum = Math.floor(Number(port));
  
  if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
    throw new Error('Port invalide. Doit être entre 1024 et 65535');
  }
  
  // Ports réservés à éviter
  if (RESERVED_PORTS.has(portNum)) {
    throw new Error(`Port ${portNum} réservé par le système`);
  }
  
  return portNum;
}

/**
 * Valide une adresse IP ou hostname
 * 
 * @param host - Adresse à valider
 * @returns Adresse validée
 * @throws Error si l'adresse est invalide
 */
export function validateHost(host: string): string {
  const sanitized = sanitizeInput(host);
  
  // Pattern pour IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // Pattern pour hostname simple
  const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (ipv4Pattern.test(sanitized)) {
    // Valider les octets IPv4
    const octets = sanitized.split('.').map(Number);
    const isValidRange = octets.every(o => o >= 0 && o <= 255);
    const isReserved = sanitized === '0.0.0.0' || sanitized === '255.255.255.255';
    if (isValidRange && !isReserved) {
      return sanitized;
    }
  }
  
  if (hostnamePattern.test(sanitized) && sanitized.length <= 253) {
    return sanitized;
  }
  
  throw new Error('Adresse hôte invalide');
}

/**
 * Valide un type de blockchain
 * 
 * @param blockchain - Type de blockchain à valider
 * @returns Type validé
 * @throws Error si le type est invalide
 */
export function validateBlockchainType(blockchain: string): BlockchainType {
  const sanitized = sanitizeInput(blockchain).toLowerCase();
  
  if (!blockchainRegistry.get(sanitized)) {
    throw new Error(`Blockchain non supportee: ${blockchain}`);
  }
  
  return sanitized as BlockchainType;
}

/**
 * Valide un mode de node
 * 
 * @param mode - Mode à valider
 * @returns Mode validé
 * @throws Error si le mode est invalide
 */
export function validateNodeMode(mode: string): NodeMode {
  const sanitized = sanitizeInput(mode).toLowerCase();
  const validModes: NodeMode[] = ['full', 'pruned', 'light'];
  
  if (!validModes.includes(sanitized as NodeMode)) {
    throw new Error(`Mode de node invalide: ${mode}. Modes valides: ${validModes.join(', ')}`);
  }
  
  return sanitized as NodeMode;
}

// ============================================================
// AUDIT & LOGGING DE SÉCURITÉ
// ============================================================

/**
 * Log une action sensible pour audit
 * 
 * @param action - Type d'action
 * @param details - Détails de l'action
 */
export function auditLog(action: string, details: Record<string, unknown>): void {
  logger.info(`[SECURITY AUDIT] ${action}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Valide toutes les entrées d'une requête de création de node
 * 
 * @param request - Requête de création
 * @returns Requête validée et nettoyée
 */
export function validateCreateNodeRequest(request: {
  name?: string;
  blockchain?: string;
  mode?: string;
  rpcPort?: number;
  p2pPort?: number;
  wsPort?: number;
}): {
  name: string;
  blockchain: BlockchainType;
  mode: NodeMode;
  rpcPort?: number;
  p2pPort?: number;
  wsPort?: number;
} {
  // Valider la blockchain
  const blockchain = validateBlockchainType(request.blockchain || '');

  // Déterminer le mode (si non fourni, choisir un défaut supporté pour éviter de créer un node invalide)
  const supported = getNodeSupportedModes(blockchain);
  const requestedMode = request.mode ? validateNodeMode(request.mode) : undefined;
  const mode: NodeMode = requestedMode
    || (supported.includes('pruned') ? 'pruned' : supported.includes('full') ? 'full' : supported.includes('light') ? 'light' : 'pruned');

  // Valider que cette blockchain/mode est réellement supportée par l'orchestrateur
  if (!isNodeModeSupported(blockchain, mode)) {
    const supportedText = supported.length ? supported.join(', ') : 'aucun';
    throw new Error(
      `Blockchain "${blockchain}" non supportée pour l'orchestration en mode "${mode}". Modes supportés: ${supportedText}`
    );
  }

  // Valider le nom (optionnel). Si aucun nom fourni, on génère un nom par défaut.
  const defaultName = `${blockchain.charAt(0).toUpperCase()}${blockchain.slice(1)} Node`;
  const name = request.name ? sanitizeNodeName(request.name) : defaultName;
  
  // Valider l'image Docker associée
  getValidatedDockerImage(blockchain, mode);
  
  // Valider les ports si fournis
  const result: {
    name: string;
    blockchain: BlockchainType;
    mode: NodeMode;
    rpcPort?: number;
    p2pPort?: number;
    wsPort?: number;
  } = { name, blockchain, mode };
  
  if (request.rpcPort !== undefined) {
    result.rpcPort = validatePort(request.rpcPort);
  }
  
  if (request.p2pPort !== undefined) {
    result.p2pPort = validatePort(request.p2pPort);
  }
  
  if (request.wsPort !== undefined) {
    result.wsPort = validatePort(request.wsPort);
  }
  
  // Audit log
  auditLog('CREATE_NODE_VALIDATED', { name, blockchain, mode });
  
  return result;
}

export default {
  // Docker security
  isImageAllowed,
  validateDockerImage,
  getValidatedDockerImage,
  DOCKER_IMAGE_WHITELIST,
  
  // Input sanitization
  sanitizeInput,
  sanitizeNodeName,
  sanitizePath,
  
  // Validation
  validatePort,
  validateHost,
  validateBlockchainType,
  validateNodeMode,
  validateCreateNodeRequest,
  
  // Audit
  auditLog,
};
