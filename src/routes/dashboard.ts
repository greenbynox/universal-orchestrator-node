import { Router } from 'express';
import si from 'systeminformation';
import { nodeManager } from '../core/NodeManager';
import { alertService } from '../services/alerts/AlertService';
import { getCurrentMetrics } from '../utils/system';

const router: Router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const nodes = nodeManager.getAllNodes();
    const totalNodes = nodes.length;
    const nodesRunning = nodes.filter((n) => ['ready', 'syncing', 'starting'].includes(n.state.status)).length;
    const nodesStopped = nodes.filter((n) => n.state.status === 'stopped').length;
    const nodesFailing = nodes.filter((n) => n.state.status === 'error').length;
    const activeSyncingNodes = nodes.filter((n) => n.state.status === 'syncing').length;

    const byBlockchain: Record<string, { count: number; syncing: number }> = {};
    nodes.forEach((n) => {
      const key = n.config.blockchain;
      if (!byBlockchain[key]) byBlockchain[key] = { count: 0, syncing: 0 };
      byBlockchain[key].count += 1;
      if (n.state.status === 'syncing') byBlockchain[key].syncing += 1;
    });

    const metrics = await getCurrentMetrics();
    const disk = await si.fsSize();
    const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);
    const diskUsage = {
      total: Math.round(totalDisk / (1024 * 1024 * 1024)),
      used: Math.round(usedDisk / (1024 * 1024 * 1024)),
      free: Math.round((totalDisk - usedDisk) / (1024 * 1024 * 1024)),
    };

    const recentAlerts = await alertService.getRecent(5);

    res.json({
      totalNodes,
      nodesRunning,
      nodesStopped,
      nodesFailing,
      totalCPU: metrics.cpuUsage,
      totalMemory: metrics.memoryUsage,
      totalDisk: metrics.diskUsage,
      activeSyncingNodes,
      byBlockchain,
      recentAlerts,
      diskUsage,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
