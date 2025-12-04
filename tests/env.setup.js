// Environment setup for Jest tests
// This file runs before Jest environment is set up
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32ch';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!!';
