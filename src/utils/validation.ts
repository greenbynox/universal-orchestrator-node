import { BLOCKCHAIN_CONFIGS } from '../config';
import { blockchainRegistry } from '../config/blockchains';

// Sets des blockchains supportées
const SUPPORTED_CONFIG_BLOCKCHAINS = new Set(Object.keys(BLOCKCHAIN_CONFIGS));
const SUPPORTED_REGISTRY_BLOCKCHAINS = new Set(blockchainRegistry.listIds());
/**
 * ============================================================
 * NODE ORCHESTRATOR - Input Validation Utilities
 * ============================================================
 * Validation et sanitization des entrées utilisateur
 */

/**
 * Sanitize une chaîne de caractères
 * Supprime les caractères dangereux et limite la longueur
 */
export function sanitizeInput(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Supprimer les caractères de contrôle et les balises HTML
  let sanitized = input
    .replace(/[<>]/g, '') // Pas de balises HTML
    .replace(/[\x00-\x1F\x7F]/g, '') // Pas de caractères de contrôle
    .trim();
  
  // Limiter la longueur
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Valider un ID de node
 * Format: blockchain-xxxxxxxx (ex: bitcoin-a1b2c3d4)
 */
export function validateNodeId(nodeId: string): boolean {
  if (!nodeId || typeof nodeId !== 'string') {
    return false;
  }

  // Pattern: blockchain-8chars hexadecimaux
  const pattern = /^([a-z0-9-]+)-([a-f0-9]{8})$/;
  const match = nodeId.match(pattern);
  if (!match) {
    return false;
  }

  const blockchain = match[1];

  // Vérifier que la blockchain est supportée (registry ou config déclarative)
  if (!SUPPORTED_REGISTRY_BLOCKCHAINS.has(blockchain) && !SUPPORTED_CONFIG_BLOCKCHAINS.has(blockchain)) {
    return false;
  }

  return true;
}

/**
 * Valider un ID de wallet
 * Format: wallet-blockchain-xxxxxxxx
 */
export function validateWalletId(walletId: string): boolean {
  if (!walletId || typeof walletId !== 'string') {
    return false;
  }
  
  const pattern = /^wallet-[a-z0-9-]+-[a-f0-9]{8}$/;
  return pattern.test(walletId);
}

/**
 * Valider un type de blockchain
 */
export function validateBlockchain(blockchain: string): boolean {
  // Vérifie le format (lettres minuscules, chiffres, tirets)
  if (!/^[a-z0-9-]+$/.test(blockchain)) {
    return false;
  }

  // Vérifie l'existence dans les blockchains supportées par la configuration (conservé pour compatibilité tests)
  return SUPPORTED_CONFIG_BLOCKCHAINS.has(blockchain);
}

/**
 * Valider un mode de node
 */
export function validateNodeMode(mode: string): boolean {
  const validModes = ['full', 'pruned', 'light'];
  return validModes.includes(mode);
}

/**
 * Valider une seed phrase BIP39
 */
export function validateSeedPhrase(seed: string): boolean {
  if (!seed || typeof seed !== 'string') {
    return false;
  }
  
  const words = seed.trim().split(/\s+/);
  // BIP39: 12, 15, 18, 21 ou 24 mots
  return [12, 15, 18, 21, 24].includes(words.length);
}

/**
 * Valider un mot de passe
 * Minimum 8 caractères, au moins une lettre et un chiffre
 */
export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Mot de passe requis' };
  }
  
  if (password.length < 8) {
    return { valid: false, reason: 'Minimum 8 caractères requis' };
  }
  
  if (password.length > 128) {
    return { valid: false, reason: 'Maximum 128 caractères autorisés' };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, reason: 'Au moins une lettre requise' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Au moins un chiffre requis' };
  }
  
  return { valid: true };
}

/**
 * Échapper les caractères spéciaux pour les logs
 */
export function escapeForLog(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Valider et parser un nombre entier positif
 */
export function parsePositiveInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  
  return defaultValue;
}
