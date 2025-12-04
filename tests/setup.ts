/**
 * Jest Test Setup
 * Configuration globale pour les tests
 */

// Augmenter le timeout pour les tests lents
jest.setTimeout(30000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
