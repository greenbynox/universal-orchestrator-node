import si from 'systeminformation';
import { nodeManager } from '../../core/NodeManager';
import alertManager from '../../core/AlertManager';
import { logger } from '../../utils/logger';

const PRUNABLE_BLOCKCHAINS = ['bitcoin', 'monero'];

export class PruningService {
  private interval?: NodeJS.Timeout;
  private threshold = 90;

  start(intervalMinutes = 5): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.run(), intervalMinutes * 60 * 1000);
    void this.run();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
  }

  private async run(): Promise<void> {
    const disk = await si.fsSize();
    const total = disk.reduce((acc, d) => acc + d.size, 0);
    const used = disk.reduce((acc, d) => acc + d.used, 0);
    const usagePercent = total === 0 ? 0 : Math.round((used / total) * 100);

    if (usagePercent <= this.threshold) return;

    const nodes = nodeManager.getAllNodes();
    for (const node of nodes) {
      if (!PRUNABLE_BLOCKCHAINS.includes(node.config.blockchain)) continue;
      await this.pruneNode(node.config.id).catch((error) => logger.error('Auto-pruning error', { error }));
    }
  }

  private async pruneNode(nodeId: string): Promise<void> {
    logger.info(`Auto-pruning node ${nodeId}`);
    // Placeholder: execute actual pruning command per blockchain
    await alertManager.trigger({
      type: 'DISK_FULL',
      severity: 'CRITICAL',
      nodeId,
      message: 'Auto-pruning triggered due to disk usage',
      timestamp: new Date(),
      metadata: { autoPruning: true },
    });

    // Simulate success
    await alertManager.resolveByType('DISK_FULL', nodeId);
  }
}

export const pruningService = new PruningService();
export default pruningService;
