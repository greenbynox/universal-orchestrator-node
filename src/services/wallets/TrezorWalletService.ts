import { logger } from '../../utils/logger';
import alertManager from '../../core/AlertManager';
import { HardwareWalletService } from '../../types';

type SupportedChain = 'bitcoin' | 'ethereum' | 'solana' | 'cosmos';

export class TrezorWalletService implements HardwareWalletService {
  private trezor: any | null = null;
  private connected = false;

  private async loadTrezor(): Promise<any> {
    try {
      const mod = await import('@trezor/connect');
      return (mod as any).default || mod;
    } catch (error) {
      await alertManager.trigger({
        type: 'CUSTOM',
        severity: 'CRITICAL',
        message: 'Hardware Wallet (Trezor) non disponible. Veuillez installer les dépendances nécessaires.',
        timestamp: new Date(),
        metadata: { error: (error as Error).message },
      });
      throw new Error('Hardware Wallet (Trezor) non disponible. Veuillez installer les dépendances nécessaires.');
    }
  }

  async connect(): Promise<void> {
    this.trezor = await this.loadTrezor();
    await this.trezor.init({ manifest: { email: 'support@example.com', appUrl: 'https://orchestrator.local' } });
    this.connected = true;
    logger.info('Trezor connecté');
  }

  async disconnect(): Promise<void> {
    if (this.trezor) {
      await this.trezor.dispose();
    }
    this.connected = false;
  }

  private ensureConnected(): void {
    if (!this.connected) throw new Error('Trezor non connecté');
  }

  async getAddress(blockchain: SupportedChain, derivationPath: string): Promise<string> {
    this.ensureConnected();
    if (!this.trezor) throw new Error('Trezor non connecté');
    logger.info(`Deriving address from Trezor for ${blockchain} on ${derivationPath}`);

    try {
      switch (blockchain) {
        case 'bitcoin': {
          const result = await this.trezor.getAddress({ path: derivationPath, coin: 'btc' });
          if (!result.success) throw new Error(result.payload?.error || 'Erreur Trezor');
          logger.info(`Address derived from Trezor for bitcoin: ${result.payload.address.substring(0, 10)}...`);
          return result.payload.address;
        }
        case 'ethereum': {
          const result = await this.trezor.ethereumGetAddress({ path: derivationPath });
          if (!result.success) throw new Error(result.payload?.error || 'Erreur Trezor');
          logger.info(`Address derived from Trezor for ethereum: ${result.payload.address.substring(0, 10)}...`);
          return result.payload.address;
        }
        case 'solana': {
          const result = await this.trezor.solanaGetAddress({ path: derivationPath });
          if (!result.success) throw new Error(result.payload?.error || 'Erreur Trezor');
          logger.info(`Address derived from Trezor for solana: ${result.payload.address.substring(0, 10)}...`);
          return result.payload.address;
        }
        case 'cosmos': {
          const result = await this.trezor.cosmosGetAddress({ path: derivationPath });
          if (!result.success) throw new Error(result.payload?.error || 'Erreur Trezor');
          logger.info(`Address derived from Trezor for cosmos: ${result.payload.address.substring(0, 10)}...`);
          return result.payload.address;
        }
        default:
          throw new Error(`Blockchain ${blockchain} not supported by Trezor`);
      }
    } catch (error) {
      logger.error(`Failed to derive address from Trezor`, error);
      throw new Error(`Cannot derive address from Trezor: ${(error as Error).message}`);
    }
  }

  async signTransaction(tx: unknown): Promise<string> {
    this.ensureConnected();
    if (!this.trezor) throw new Error('Trezor non connecté');
    logger.info('Signing transaction with Trezor...');

    try {
      // Serialize the transaction
      const txData = typeof tx === 'string' ? tx : JSON.stringify(tx);
      
      // Call Trezor sign method
      const result = await this.trezor.signTransaction({
        inputs: (tx as any).inputs,
        outputs: (tx as any).outputs,
        coin: (tx as any).coin || 'btc',
      });

      if (!result.success) {
        throw new Error(result.payload?.error || 'Erreur de signature Trezor');
      }

      const signature = result.payload.serialized || result.payload.signature;
      logger.info(`Transaction signed by Trezor: ${typeof signature === 'string' ? signature.substring(0, 16) : 'binary'}...`);
      
      return typeof signature === 'string' ? signature : Buffer.from(signature).toString('hex');
    } catch (error) {
      logger.error('Failed to sign transaction with Trezor', error);
      throw new Error(`Cannot sign with Trezor: ${(error as Error).message}`);
    }
  }
}

export const trezorWalletService = new TrezorWalletService();
export default trezorWalletService;
