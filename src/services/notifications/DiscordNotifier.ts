import axios from 'axios';
import { Alert } from '../../types';
import { logger } from '../../utils/logger';

const severityColor: Record<string, number> = {
  CRITICAL: 0xff4d4f,
  WARNING: 0xfaad14,
  INFO: 0x1890ff,
};

export class DiscordNotifier {
  constructor(private webhookUrl?: string) {}

  async send(alert: Alert): Promise<void> {
    const url = this.webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
      logger.debug('Discord webhook non configuré');
      return;
    }

    const embed = {
      title: `[${alert.severity}] ${this.getTitle(alert.type)}`,
      description: alert.message,
      color: severityColor[alert.severity] || severityColor.INFO,
      fields: [
        alert.nodeId ? { name: 'Node', value: alert.nodeId, inline: true } : null,
        { name: 'Timestamp', value: new Date(alert.timestamp).toISOString(), inline: true },
      ].filter(Boolean),
    };

    await axios.post(url, { embeds: [embed] }, { timeout: 5000 });
  }

  private getTitle(type: string): string {
    switch (type) {
      case 'NODE_DOWN':
        return 'Node Down';
      case 'DISK_FULL':
        return 'Disk Almost Full';
      case 'MEMORY_CRITICAL':
        return 'Memory Critical';
      case 'SYNC_DELAYED':
        return 'Sync Delayed';
      case 'CPU_HIGH':
        return 'CPU High';
      default:
        return 'Alert';
    }
  }
}

export default DiscordNotifier;
