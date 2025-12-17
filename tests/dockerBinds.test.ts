import { buildNodeBinds } from '../src/utils/dockerBinds';

describe('dockerBinds (WSL2 engine)', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it('should keep Windows-style bind source for Windows Docker', () => {
    delete process.env.DOCKER_HOST;
    delete process.env.WSL_DOCKER_IP;

    const binds = buildNodeBinds(
      {
        id: 'bitcoin-test',
        name: 'test',
        blockchain: 'bitcoin',
        mode: 'pruned',
        dataPath: 'C:\\Users\\me\\data\\nodes\\bitcoin-test',
        rpcPort: 8332,
        p2pPort: 8333,
      } as any,
      undefined,
      'win32'
    );

    expect(binds).toContain('C:/Users/me/data/nodes/bitcoin-test:/data');
  });

  it('should translate Windows drive path to /mnt/<drive>/ when targeting WSL2 Docker', () => {
    process.env.WSL_DOCKER_IP = '192.168.50.10';
    process.env.DOCKER_HOST = 'tcp://192.168.50.10:2375';

    const binds = buildNodeBinds(
      {
        id: 'bitcoin-test',
        name: 'test',
        blockchain: 'bitcoin',
        mode: 'pruned',
        dataPath: 'C:\\Users\\me\\data\\nodes\\bitcoin-test',
        rpcPort: 8332,
        p2pPort: 8333,
      } as any,
      undefined,
      'win32'
    );

    expect(binds).toContain('/mnt/c/Users/me/data/nodes/bitcoin-test:/data');
  });
});
