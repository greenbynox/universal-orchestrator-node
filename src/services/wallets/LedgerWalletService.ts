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
      const hint = 'Installez @ledgerhq/hw-transport-node-hid puis relancez npm install avec Node 20 LTS et les outils C++/Windows SDK (Desktop development with C++).';

      await alertManager.trigger({
        type: 'CUSTOM',
        severity: 'CRITICAL',
        message: `Hardware Wallet (Ledger) non disponible. ${hint}`,
        timestamp: new Date(),
        metadata: { error: (error as Error).message },
      });
      throw new Error(`Hardware Wallet (Ledger) non disponible. ${hint}`);
    }
  }

  async connect(): Promise<void> {
    const TransportNodeHid = await this.loadTransport();

    try {
      // Add a timeout to prevent hanging forever if Ledger is not connected
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ledger connection timeout (5 seconds). Device not found or not responding.')), 5000)
      );
      
      this.transport = await Promise.race([
        TransportNodeHid.create(),
        timeoutPromise as Promise<any>
      ]);
      
      logger.info('Ledger connecté');
    } catch (error) {
      logger.error('Ledger connection failed', error);
      throw new Error(
        'Ledger non detecte. Branchez et deverrouillez votre appareil, puis ouvrez l\'application Ledger correspondante (BTC/ETH, etc.). Details: ' +
        (error as Error).message,
      );
    }
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
    try {
      // Ensure Ledger is connected
      if (!this.transport) {
        await this.connect();
      }
      
      if (!this.transport) {
        throw new Error('Ledger transport not initialized. Make sure Ledger is connected and unlocked.');
      }
      
      logger.info(`Reading address from Ledger ${blockchain} on ${derivationPath}`);
      
      // Ledger HID communication for address derivation
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
      const errorMsg = (error as Error).message;
      logger.error(`Failed to derive address from Ledger: ${errorMsg}`, error);
      
      // Provide better error message for transport issues
      if (errorMsg.includes('Transport') || errorMsg.includes('not initialized') || errorMsg.includes('No response')) {
        throw new Error('Ledger not detected. Please make sure Ledger is connected, unlocked, and the correct app is open.');
      }
      
      throw new Error(
        `Impossible de dériver l'adresse depuis Ledger. Vérifiez que l'app ${blockchain} est ouverte et que l'appareil est déverrouillé. Détails: ${errorMsg}`,
      );
    }
  }

  async signTransaction(tx: unknown): Promise<string> {
    try {
      // Ensure Ledger is connected
      if (!this.transport) {
        await this.connect();
      }
      
      if (!this.transport) {
        throw new Error('Ledger transport not initialized. Make sure Ledger is connected and unlocked.');
      }
      
      logger.info('Signing transaction with Ledger...');
      
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
      const errorMsg = (error as Error).message;
      logger.error(`Failed to sign transaction with Ledger: ${errorMsg}`, error);
      
      // Provide better error message for transport issues
      if (errorMsg.includes('Transport') || errorMsg.includes('not initialized') || errorMsg.includes('No response')) {
        throw new Error('Ledger not detected. Please make sure Ledger is connected, unlocked, and the correct app is open.');
      }
      
      throw new Error(`Cannot sign with Ledger: ${errorMsg}`);
    }
  }
}

export const ledgerWalletService = new LedgerWalletService();
export default ledgerWalletService;
