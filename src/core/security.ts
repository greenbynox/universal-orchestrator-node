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

import { logger } from '../utils/logger';
import { BLOCKCHAIN_CONFIGS } from '../config';
import { BlockchainType, NodeMode } from '../types';

// ============================================================
// WHITELIST DES IMAGES DOCKER AUTORISÉES
// ============================================================

/**
 * Liste blanche stricte des images Docker autorisées
 * SEULES ces images peuvent être exécutées par l'orchestrateur
 * 
 * Format: 'registry/image:tag' ou 'image:tag'
 * 
 * Pour ajouter une nouvelle image:
 * 1. Vérifier la source officielle
 * 2. Auditer l'image pour les vulnérabilités
 * 3. Ajouter à cette liste avec un commentaire
 */
export const DOCKER_IMAGE_WHITELIST: Set<string> = new Set([
  // ==================== BITCOIN ====================
  'kylemanna/bitcoind:latest',
  'kylemanna/bitcoind:stable',
  'ruimarinho/bitcoin-core:latest',
  'lncm/neutrino:latest',
  
  // ==================== ETHEREUM ====================
  'ethereum/client-go:latest',
  'ethereum/client-go:stable',
  'ethereum/client-go:v1.13.15',
  'hyperledger/besu:latest',
  'consensys/teku:latest',
  'prysmaticlabs/prysm-beacon-chain:latest',
  
  // ==================== SOLANA ====================
  'solanalabs/solana:latest',
  'solanalabs/solana:v1.18',
  
  // ==================== MONERO ====================
  'sethsimmons/simple-monerod:latest',
  'xmrto/monero:latest',
  
  // ==================== BNB CHAIN ====================
  'ghcr.io/bnb-chain/bsc:latest',
  'bnb-chain/bsc:latest',
  
  // ==================== CARDANO ====================
  'inputoutput/cardano-node:latest',
  'ghcr.io/intersectmbo/cardano-node:latest',
  
  // ==================== POLKADOT ====================
  'parity/polkadot:latest',
  'parity/polkadot:v1.8.0',
  
  // ==================== AVALANCHE ====================
  'avaplatform/avalanchego:latest',
  
  // ==================== POLYGON ====================
  'maticnetwork/bor:latest',
  '0xpolygon/heimdall:latest',
  
  // ==================== COSMOS ====================
  'ghcr.io/cosmos/gaia:latest',
  'tendermint/tendermint:latest',
  
  // ==================== NEAR ====================
  'nearprotocol/nearcore:latest',
  
  // ==================== ALGORAND ====================
  'algorand/algod:latest',
  
  // ==================== TEZOS ====================
  'tezos/tezos:latest',
  
  // ==================== TON ====================
  'tonlabs/ton-node:latest',
  'ton-blockchain/ton:latest',
  
  // ==================== LITECOIN ====================
  'litecoin/litecoin:latest',
  'uphold/litecoin-core:latest',
  
  // ==================== DOGECOIN ====================
  'dogecoin/dogecoin:latest',
  
  // ==================== ZCASH ====================
  'electriccoinco/zcashd:latest',
  'zcashd:latest',
  
  // ==================== DASH ====================
  'dashcore/dashd:latest',
  
  // ==================== RIPPLE/XRP ====================
  'xrplf/rippled:latest',
  
  // ==================== STELLAR ====================
  'stellar/stellar-core:latest',
  
  // ==================== CHAINLINK ====================
  'smartcontract/chainlink:latest',
  
  // ==================== FILECOIN ====================
  'filecoin/lotus:latest',
  
  // ==================== ARBITRUM ====================
  'offchainlabs/nitro-node:latest',
  
  // ==================== OPTIMISM ====================
  'ethereumoptimism/op-node:latest',
  'ethereumoptimism/op-geth:latest',
  
  // ==================== BASE ====================
  'base-org/node:latest',
  
  // ==================== FANTOM ====================
  'fantomfoundation/go-opera:latest',
  
  // ==================== HEDERA ====================
  'hashgraph/hedera-mirror-node:latest',
]);

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
  const config = BLOCKCHAIN_CONFIGS[blockchain];
  
  if (!config) {
    throw new Error(`Blockchain non supportée: ${blockchain}`);
  }
  
  const image = config.dockerImages[mode];
  
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
  const sanitized = sanitizeInput(filePath);
  
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
  const path = require('path');
  const resolvedPath = path.resolve(basePath, sanitized);
  const resolvedBase = path.resolve(basePath);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    logger.warn('Tentative d\'accès hors du dossier autorisé', { 
      filePath, 
      basePath, 
      resolvedPath 
    });
    throw new Error('Accès au chemin non autorisé');
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
  const reservedPorts = [3000, 3001, 5432, 27017, 6379]; // App, DB ports
  if (reservedPorts.includes(portNum)) {
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
    if (octets.every(o => o >= 0 && o <= 255)) {
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
  
  if (!BLOCKCHAIN_CONFIGS[sanitized as BlockchainType]) {
    throw new Error(`Blockchain non supportée: ${blockchain}`);
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
  // Valider le nom
  const name = sanitizeNodeName(request.name || '');
  
  // Valider la blockchain
  const blockchain = validateBlockchainType(request.blockchain || '');
  
  // Valider le mode
  const mode = validateNodeMode(request.mode || 'pruned');
  
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
