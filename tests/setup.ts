/**
 * Jest Test Setup
 * Configuration globale pour les tests
 */

// Augmenter le timeout pour les tests lents
jest.setTimeout(30000);

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32ch';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!';

// Supprimer les logs pendant les tests (optionnel)
// jest.mock('../src/utils/logger', () => ({
//   logger: {
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
//     debug: jest.fn(),
//   },
//   getNodeLogger: jest.fn(() => ({
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
//     debug: jest.fn(),
//   })),
// }));

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
