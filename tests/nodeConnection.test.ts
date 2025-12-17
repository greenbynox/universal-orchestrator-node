import type { NodeConfig } from '../src/types';
import { buildRpcProbe, computeLocalConnectionInfo, getRpcAuthFromCustomConfig } from '../src/utils/nodeConnection';

describe('nodeConnection utils', () => {
  const baseConfig: NodeConfig = {
    id: 'bitcoin-abc12345',
    name: 'Bitcoin Node',
    blockchain: 'bitcoin',
    mode: 'pruned',
    dataPath: '/tmp/bitcoin',
    rpcPort: 18443,
    p2pPort: 18444,
    wsPort: undefined,
    customConfig: { rpcAuth: { username: 'u', password: 'p' } },
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  test('computeLocalConnectionInfo builds localhost URLs', () => {
    const info = computeLocalConnectionInfo(baseConfig);
    expect(info.rpcUrl).toBe('http://127.0.0.1:18443');
    expect(info.wsUrl).toBeUndefined();
    expect(info.p2pPort).toBe(18444);
    expect(info.localOnly).toBe(true);
  });

  test('computeLocalConnectionInfo uses WSL IP on Windows when Docker runs in WSL2', () => {
    const oldEnv = process.env;
    try {
      process.env = {
        ...oldEnv,
        WSL_DOCKER_IP: '172.20.0.1',
        DOCKER_HOST: 'tcp://172.20.0.1:2375',
      };

      const info = computeLocalConnectionInfo(baseConfig);
      expect(info.rpcUrl).toBe('http://172.20.0.1:18443');
      expect(info.localOnly).toBe(false);
    } finally {
      process.env = oldEnv;
    }
  });

  test('getRpcAuthFromCustomConfig reads rpcAuth', () => {
    const auth = getRpcAuthFromCustomConfig(baseConfig.customConfig);
    expect(auth).toEqual({ username: 'u', password: 'p' });
  });

  test('buildRpcProbe for bitcoin uses getblockchaininfo and auth', () => {
    const probe = buildRpcProbe(baseConfig);
    expect(probe.url).toBe('http://127.0.0.1:18443');
    expect(probe.method).toBe('POST');
    expect(probe.auth).toEqual({ username: 'u', password: 'p' });
    expect(probe.data?.method).toBe('getblockchaininfo');
  });

  test('buildRpcProbe for ethereum uses web3_clientVersion', () => {
    const cfg: NodeConfig = { ...baseConfig, blockchain: 'ethereum', customConfig: undefined };
    const probe = buildRpcProbe(cfg);
    expect(probe.data?.method).toBe('web3_clientVersion');
    expect(probe.auth).toBeUndefined();
  });

  test('buildRpcProbe for monero targets /json_rpc', () => {
    const cfg: NodeConfig = { ...baseConfig, blockchain: 'monero', customConfig: undefined };
    const probe = buildRpcProbe(cfg);
    expect(probe.url).toBe('http://127.0.0.1:18443/json_rpc');
    expect(probe.data?.method).toBe('get_info');
  });
});
