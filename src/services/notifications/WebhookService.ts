import axios from 'axios';
import { Alert, AlertType } from '../../types';
import prisma from '../../utils/prisma';
import { logger } from '../../utils/logger';

export interface WebhookOptions {
  secret?: string;
}

export class WebhookService {
  async registerWebhook(url: string, events: AlertType[], options: WebhookOptions = {}): Promise<void> {
    await prisma.webhook.create({
      data: {
        url,
        events: events.join(','),
        secret: options.secret,
      },
    });
  }

  async list(): Promise<{ id: string; url: string; events: AlertType[]; enabled: boolean }[]> {
    const hooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
    return hooks.map((h) => ({ id: h.id, url: h.url, events: h.events.split(',') as AlertType[], enabled: h.enabled }));
  }

  async sendWebhook(alert: Alert): Promise<void> {
    const hooks = await prisma.webhook.findMany({ where: { enabled: true } });
    const payload = {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      nodeId: alert.nodeId,
      message: alert.message,
      timestamp: alert.timestamp,
      metadata: alert.metadata,
    };

    await Promise.allSettled(
      hooks.map(async (hook) => {
        if (!hook.events.split(',').includes(alert.type)) return;
        await this.postWithRetry(hook.url, payload, hook.secret || undefined);
      })
    );
  }

  private async postWithRetry(url: string, payload: unknown, secret?: string, attempt = 1): Promise<void> {
    const maxAttempts = 3;
    try {
      await axios.post(url, payload, {
        timeout: 5000,
        headers: secret ? { 'x-webhook-secret': secret } : undefined,
      });
    } catch (error) {
      if (attempt >= maxAttempts) {
        logger.error('Webhook échec après retries', { url, error: (error as Error).message });
        return;
      }
      const backoff = 2 ** attempt * 200;
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return this.postWithRetry(url, payload, secret, attempt + 1);
    }
  }
}

export const webhookService = new WebhookService();
export default webhookService;
