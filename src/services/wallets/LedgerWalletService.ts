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
    logger.info(`Reading address from Ledger ${blockchain} on ${derivationPath}`);
    
    try {
      // Ledger HID communication for address derivation
      // The transport object provides low-level communication with the Ledger device
      const response = await (this.transport as any).send(0x80, 0x02, 0x00, 0x00);
      
      if (!response) {
        throw new Error('No response from Ledger device');
      }
      
      // Extract the address from the response
      // Ledger returns address data in a specific format depending on the app
      const address = response.toString('hex').slice(0, 66);
      
      logger.info(`Address derived from Ledger for ${blockchain}: ${address.substring(0, 10)}...`);
      return address;
    } catch (error) {
      logger.error(`Failed to derive address from Ledger`, error);
      throw new Error(`Cannot derive address from Ledger: ${(error as Error).message}`);
    }
  }

  async signTransaction(tx: unknown): Promise<string> {
    this.ensureConnected();
    logger.info('Signing transaction with Ledger...');
    
    try {
      // Serialize the transaction
      const txData = JSON.stringify(tx);
      const txBuffer = Buffer.from(txData, 'utf-8');
      
      // Send to Ledger for signing
      // Use APDU format: CLA=0x80, INS=0x04 (sign)
      const response = await (this.transport as any).send(0x80, 0x04, 0x00, 0x00, txBuffer);
      
      if (!response) {
        throw new Error('No signature returned from Ledger');
      }
      
      const signature = response.toString('hex');
      logger.info(`Transaction signed by Ledger: ${signature.substring(0, 16)}...`);
      
      return signature;
    } catch (error) {
      logger.error('Failed to sign transaction with Ledger', error);
      throw new Error(`Cannot sign with Ledger: ${(error as Error).message}`);
    }
  }
}

export const ledgerWalletService = new LedgerWalletService();
export default ledgerWalletService;
