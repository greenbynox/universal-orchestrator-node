import axios from 'axios';
import { Alert } from '../../types';
import { logger } from '../../utils/logger';

export class TelegramNotifier {
  private botToken?: string;
  private chatId?: string;

  constructor(token?: string, chatId?: string) {
    this.botToken = token || process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = chatId || process.env.TELEGRAM_CHAT_ID;
  }

  async send(alert: Alert): Promise<void> {
    const token = this.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = this.chatId || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      logger.debug('Telegram non configuré');
      return;
    }

    const text = `${this.prefix(alert.severity)} ${alert.severity}: ${alert.message}`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, { chat_id: chatId, text }, { timeout: 5000 });
  }

  private prefix(severity: string): string {
    if (severity === 'CRITICAL') return '🔴';
    if (severity === 'WARNING') return '🟠';
    return '🔵';
  }
}

export default TelegramNotifier;
