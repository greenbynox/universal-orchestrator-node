import { jest } from '@jest/globals';

describe('Hardware wallet dynamic import', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('Ledger connect succeeds when module present', async () => {
    const createMock = jest.fn(() => Promise.resolve({ close: jest.fn() } as any));
    jest.doMock('@ledgerhq/hw-transport-node-hid', () => ({
      create: createMock,
    }), { virtual: true });

    const { LedgerWalletService } = await import('../src/services/wallets/LedgerWalletService');
    const service = new LedgerWalletService();
    await expect(service.connect()).resolves.toBeUndefined();
  });

  test('Trezor connect fails and logs alert when module missing', async () => {
    jest.doMock('@trezor/connect', () => {
      throw new Error('Cannot find module');
    }, { virtual: true });

    const alertManager = (await import('../src/core/AlertManager')).default;
    const triggerSpy = jest.spyOn(alertManager, 'trigger').mockResolvedValue({} as any);

    const { TrezorWalletService } = await import('../src/services/wallets/TrezorWalletService');
    const service = new TrezorWalletService();

    await expect(service.connect()).rejects.toThrow('Hardware Wallet (Trezor) non disponible');
    expect(triggerSpy).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'CRITICAL',
      message: expect.stringContaining('Hardware Wallet (Trezor) non disponible'),
    }));
  });
});
