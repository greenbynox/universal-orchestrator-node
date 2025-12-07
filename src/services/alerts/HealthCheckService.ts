import si from 'systeminformation';
import { NodeManager } from '../../core/NodeManager';
import alertManager from '../../core/AlertManager';
import { AlertSeverity, AlertType } from '../../types';
import { logger } from '../../utils/logger';

interface HealthCheckOptions {
  intervalMs?: number;
  nodeDownThresholdMs?: number;
  syncDelayHours?: number;
  cpuThreshold?: number;
  memThresholdPercent?: number;
  diskThresholdPercent?: number;
}

export class HealthCheckService {
  private interval?: NodeJS.Timeout;
  private lastSyncMap: Map<string, { progress: number; timestamp: number }> = new Map();

  constructor(private nodeManager: NodeManager, private options: HealthCheckOptions = {}) {}

  start(): void {
    if (this.interval) return;
    const every = this.options.intervalMs ?? 30000;
    this.interval = setInterval(() => this.runChecks().catch((err) => logger.error('Health check error', { err })), every);
    void this.runChecks();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
  }

  private async runChecks(): Promise<void> {
    await Promise.all([
      this.checkResources(),
      this.checkNodes(),
    ]);
  }

  private async checkResources(): Promise<void> {
    const [load, mem, disks] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    const cpuUsage = Math.round(load.currentLoad);
    const memUsagePercent = Math.round(((mem.total - mem.available) / mem.total) * 100);
    const totalDisk = disks.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = disks.reduce((acc, d) => acc + d.used, 0);
    const diskUsagePercent = totalDisk === 0 ? 0 : Math.round((usedDisk / totalDisk) * 100);

    const cpuThreshold = this.options.cpuThreshold ?? 80;
    const memThreshold = this.options.memThresholdPercent ?? 95;
    const diskThreshold = this.options.diskThresholdPercent ?? 90;

    if (cpuUsage > cpuThreshold) {
      await alertManager.trigger({
        type: 'CPU_HIGH',
        severity: 'WARNING',
        message: `CPU usage high: ${cpuUsage}%`,
        timestamp: new Date(),
      });
    } else {
      await alertManager.resolveByType('CPU_HIGH');
    }

    if (memUsagePercent > memThreshold) {
      await alertManager.trigger({
        type: 'MEMORY_CRITICAL',
        severity: 'CRITICAL',
        message: `Memory usage critical: ${memUsagePercent}%`,
        timestamp: new Date(),
      });
    } else {
      await alertManager.resolveByType('MEMORY_CRITICAL');
    }

    if (diskUsagePercent > diskThreshold) {
      await alertManager.trigger({
        type: 'DISK_FULL',
        severity: 'CRITICAL',
        message: `Disk usage high: ${diskUsagePercent}%`,
        timestamp: new Date(),
        metadata: { diskUsagePercent },
      });
    } else {
      await alertManager.resolveByType('DISK_FULL');
    }
  }

  private async checkNodes(): Promise<void> {
    const nodes = this.nodeManager.getAllNodes();
    const now = Date.now();
    const downThreshold = this.options.nodeDownThresholdMs ?? 60000;
    const syncDelayHours = this.options.syncDelayHours ?? 12;

    for (const node of nodes) {
      const state = node.state;

      if (state.status === 'error' || state.status === 'stopped') {
        const lastSeen = this.lastSyncMap.get(node.config.id);
        if (!lastSeen || now - lastSeen.timestamp > downThreshold) {
          await alertManager.trigger({
            type: 'NODE_DOWN',
            severity: 'CRITICAL',
            nodeId: node.config.id,
            message: `${node.config.name} (${node.config.blockchain}) indisponible`,
            timestamp: new Date(),
          });
        }
      } else {
        await alertManager.resolveByType('NODE_DOWN', node.config.id);
      }

      // Sync progress tracking
      const prev = this.lastSyncMap.get(node.config.id);
      const progress = state.syncProgress ?? 0;
      if (!prev || progress !== prev.progress) {
        this.lastSyncMap.set(node.config.id, { progress, timestamp: now });
        await alertManager.resolveByType('SYNC_DELAYED', node.config.id);
      } else {
        const hoursStuck = (now - prev.timestamp) / (1000 * 60 * 60);
        if (hoursStuck >= syncDelayHours) {
          await alertManager.trigger({
            type: 'SYNC_DELAYED',
            severity: 'WARNING',
            nodeId: node.config.id,
            message: `${node.config.name} synchronisation bloquée depuis ${hoursStuck.toFixed(1)}h`,
            timestamp: new Date(),
          });
        }
      }
    }
  }
}

export default HealthCheckService;
