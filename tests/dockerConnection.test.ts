import { getDockerConnectionAttempts } from '../src/utils/dockerConnection';

describe('dockerConnection (WSL preference)', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it('should prefer tcp://<WSL_DOCKER_IP>:2375 over DOCKER_SOCKET when WSL_DOCKER_IP is set', () => {
    process.env.WSL_DOCKER_IP = '192.168.50.10';
    process.env.DOCKER_HOST = 'tcp://192.168.50.10:2375';
    process.env.DOCKER_SOCKET = '//./pipe/docker_engine';

    const attempts = getDockerConnectionAttempts();
    expect(attempts[0].kind).toBe('tcp');
    expect(attempts[0].label).toBe('tcp://192.168.50.10:2375');
  });
});
