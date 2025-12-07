import alertManager from '../../core/AlertManager';
import webhookService from './WebhookService';
import DiscordNotifier from './DiscordNotifier';
import TelegramNotifier from './TelegramNotifier';
import { logger } from '../../utils/logger';

const discordNotifier = new DiscordNotifier();
const telegramNotifier = new TelegramNotifier();

alertManager.on('alert', async (alert) => {
  try {
    await Promise.all([
      webhookService.sendWebhook(alert),
      discordNotifier.send(alert),
      telegramNotifier.send(alert),
    ]);
  } catch (error) {
    logger.error('Erreur lors de l\'envoi des notifications', { error });
  }
});

export { webhookService, discordNotifier, telegramNotifier };
