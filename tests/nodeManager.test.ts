/**
 * Tests unitaires - NodeManager
 * Note: Ces tests vérifient les types et fonctions utilitaires
 * Les tests d'intégration nécessitent Docker
 */

import {
  BlockchainType,
  NodeMode,
  NodeConfig,
  NodeState,
  NodeMetrics,
  NodeInfo,
  CreateNodeRequest,
} from '../src/types';
import { BLOCKCHAIN_CONFIGS, getNextAvailablePort } from '../src/config';

// Mock Docker pour les tests unitaires
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    createContainer: jest.fn(),
    getContainer: jest.fn(),
    listContainers: jest.fn(),
  }));
});

describe('Node Types & Configuration', () => {
  
  describe('BlockchainType', () => {
    it('should support all expected blockchains', () => {
      const supportedBlockchains: BlockchainType[] = [
        'bitcoin', 'ethereum', 'solana', 'monero', 'bnb'
      ];
      
      supportedBlockchains.forEach(blockchain => {
        expect(typeof blockchain).toBe('string');
      });
    });
  });

  describe('NodeMode', () => {
    it('should support all expected modes', () => {
      const supportedModes: NodeMode[] = ['full', 'pruned', 'light'];
      
      supportedModes.forEach(mode => {
        expect(typeof mode).toBe('string');
      });
    });
  });

  describe('BLOCKCHAIN_CONFIGS', () => {
    it('should have configuration for all blockchains', () => {
      const blockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
      
      blockchains.forEach(blockchain => {
        expect(BLOCKCHAIN_CONFIGS[blockchain]).toBeDefined();
        expect(BLOCKCHAIN_CONFIGS[blockchain].displayName).toBeDefined();
        expect(BLOCKCHAIN_CONFIGS[blockchain].dockerImages).toBeDefined();
      });
    });

    it('should have Docker images for each mode', () => {
      Object.keys(BLOCKCHAIN_CONFIGS).forEach(blockchain => {
        const config = BLOCKCHAIN_CONFIGS[blockchain as BlockchainType];
        expect(config.dockerImages).toBeDefined();
        expect(typeof config.dockerImages.full).toBe('string');
      });
    });

    it('should have default ports configured', () => {
      Object.keys(BLOCKCHAIN_CONFIGS).forEach(blockchain => {
        const config = BLOCKCHAIN_CONFIGS[blockchain as BlockchainType];
        expect(config.defaultPorts).toBeDefined();
        expect(config.defaultPorts.rpc).toBeGreaterThan(0);
        expect(config.defaultPorts.p2p).toBeGreaterThan(0);
      });
    });

    it('should have resource requirements defined', () => {
      Object.keys(BLOCKCHAIN_CONFIGS).forEach(blockchain => {
        const config = BLOCKCHAIN_CONFIGS[blockchain as BlockchainType];
        expect(config.requirements).toBeDefined();
        
        // Vérifier les ressources pour chaque mode
        const modes: NodeMode[] = ['full', 'pruned', 'light'];
        
        modes.forEach(mode => {
          const requirements = config.requirements[mode];
          if (requirements) {
            expect(requirements.diskGB).toBeGreaterThan(0);
            expect(requirements.memoryGB).toBeGreaterThan(0);
            expect(requirements.syncDays).toBeGreaterThanOrEqual(0);
          }
        });
      });
    });
  });

  describe('getNextAvailablePort', () => {
    it('should return default ports when none are used', () => {
      const ports = getNextAvailablePort('bitcoin', []);
      
      expect(ports.rpc).toBe(BLOCKCHAIN_CONFIGS.bitcoin.defaultPorts.rpc);
      expect(ports.p2p).toBe(BLOCKCHAIN_CONFIGS.bitcoin.defaultPorts.p2p);
    });

    it('should increment ports when defaults are used', () => {
      const defaultPorts = BLOCKCHAIN_CONFIGS.ethereum.defaultPorts;
      const usedPorts = [defaultPorts.rpc, defaultPorts.p2p];
      
      const ports = getNextAvailablePort('ethereum', usedPorts);
      
      expect(ports.rpc).not.toBe(defaultPorts.rpc);
      expect(ports.p2p).not.toBe(defaultPorts.p2p);
    });
  });

  describe('NodeConfig interface', () => {
    it('should create valid node configuration', () => {
      const config: NodeConfig = {
        id: 'bitcoin-test123',
        name: 'Test Bitcoin Node',
        blockchain: 'bitcoin',
        mode: 'full',
        dataPath: '/data/nodes/bitcoin-test123',
        rpcPort: 8332,
        p2pPort: 8333,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(config.id).toBe('bitcoin-test123');
      expect(config.blockchain).toBe('bitcoin');
      expect(config.mode).toBe('full');
    });
  });

  describe('NodeState interface', () => {
    it('should create valid node state', () => {
      const state: NodeState = {
        id: 'bitcoin-test123',
        status: 'stopped',
        syncProgress: 0,
        blockHeight: 0,
        latestBlock: 0,
        peers: 0,
        uptime: 0,
      };

      expect(state.status).toBe('stopped');
      expect(state.syncProgress).toBe(0);
    });

    it('should support all status values', () => {
      const statuses: NodeState['status'][] = [
        'stopped', 'starting', 'syncing', 'ready', 'error', 'stopping'
      ];
      
      statuses.forEach(status => {
        const state: NodeState = {
          id: 'test',
          status,
          syncProgress: 0,
          blockHeight: 0,
          latestBlock: 0,
          peers: 0,
          uptime: 0,
        };
        expect(state.status).toBe(status);
      });
    });
  });

  describe('NodeMetrics interface', () => {
    it('should create valid metrics', () => {
      const metrics: NodeMetrics = {
        id: 'bitcoin-test123',
        cpuUsage: 45.5,
        memoryUsage: 2048,
        memoryLimit: 4096,
        diskUsage: 500,
        networkIn: 1.5,
        networkOut: 0.8,
        timestamp: new Date(),
      };

      expect(metrics.cpuUsage).toBe(45.5);
      expect(metrics.memoryUsage).toBe(2048);
    });
  });

  describe('NodeInfo interface', () => {
    it('should combine config, state and metrics', () => {
      const nodeInfo: NodeInfo = {
        config: {
          id: 'bitcoin-test123',
          name: 'Test Node',
          blockchain: 'bitcoin',
          mode: 'full',
          dataPath: '/data',
          rpcPort: 8332,
          p2pPort: 8333,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        state: {
          id: 'bitcoin-test123',
          status: 'ready',
          syncProgress: 100,
          blockHeight: 800000,
          latestBlock: 800000,
          peers: 8,
          uptime: 3600,
        },
        metrics: {
          id: 'bitcoin-test123',
          cpuUsage: 25,
          memoryUsage: 1024,
          memoryLimit: 2048,
          diskUsage: 450,
          networkIn: 0.5,
          networkOut: 0.3,
          timestamp: new Date(),
        },
      };

      expect(nodeInfo.config.id).toBe('bitcoin-test123');
      expect(nodeInfo.state.status).toBe('ready');
      expect(nodeInfo.metrics.cpuUsage).toBe(25);
    });
  });

  describe('CreateNodeRequest interface', () => {
    it('should create minimal request', () => {
      const request: CreateNodeRequest = {
        blockchain: 'ethereum',
      };

      expect(request.blockchain).toBe('ethereum');
      expect(request.mode).toBeUndefined();
      expect(request.name).toBeUndefined();
    });

    it('should create complete request', () => {
      const request: CreateNodeRequest = {
        blockchain: 'solana',
        mode: 'full',
        name: 'Solana Validator',
        customConfig: {
          identity: 'keypair.json',
        },
      };

      expect(request.blockchain).toBe('solana');
      expect(request.mode).toBe('full');
      expect(request.name).toBe('Solana Validator');
    });
  });
});
