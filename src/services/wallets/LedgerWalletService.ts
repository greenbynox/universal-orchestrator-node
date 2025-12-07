import { logger } from '../../utils/logger';
import alertManager from '../../core/AlertManager';
import { HardwareWalletService } from '../../types';

type SupportedChain = 'bitcoin' | 'ethereum' | 'solana' | 'cosmos';

export class LedgerWalletService implements HardwareWalletService {
  private transport: any | null = null;

  private async loadTransport(): Promise<any> {
    try {
      const mod = await import('@ledgerhq/hw-transport-node-hid');
      return (mod as any).default || mod;
    } catch (error) {
      await alertManager.trigger({
        type: 'CUSTOM',
        severity: 'CRITICAL',
        message: 'Hardware Wallet (Ledger) non disponible. Veuillez installer les dépendances nécessaires.',
        timestamp: new Date(),
        metadata: { error: (error as Error).message },
      });
      throw new Error('Hardware Wallet (Ledger) non disponible. Veuillez installer les dépendances nécessaires.');
    }
  }

  async connect(): Promise<void> {
    const TransportNodeHid = await this.loadTransport();
    this.transport = await TransportNodeHid.create();
    logger.info('Ledger connecté');
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  private ensureConnected(): void {
    if (!this.transport) {
      throw new Error('Ledger non connecté');
    }
  }

  async getAddress(blockchain: SupportedChain, derivationPath: string): Promise<string> {
    this.ensureConnected();
    logger.info(`Lecture adresse Ledger ${blockchain} sur ${derivationPath}`);
    // Placeholder for MVP
    return `ledger-${blockchain}-${derivationPath}`;
  }

  async signTransaction(_tx: unknown): Promise<string> {
    this.ensureConnected();
    return 'ledger-signature-placeholder';
  }
}

export const ledgerWalletService = new LedgerWalletService();
export default ledgerWalletService;
