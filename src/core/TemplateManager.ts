import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { logger } from '../utils/logger';

export interface NodeTemplate {
  id: string;
  blockchain: string;
  mode?: string;
  name: string;
  category?: string;
  docker: {
    image: string;
    ports?: {
      rpc?: number;
      p2p?: number;
      ws?: number;
    };
    volumes?: string[];
  };
  resources?: {
    ram?: string;
    cpu?: string;
    disk?: string;
  };
  ai_ops?: {
    log_patterns?: Array<{ pattern: string; action: string }>;
  };
  health_check?: {
    endpoint: string;
    interval: number;
  };
  pruning_command?: string[];
}

class TemplateManager {
  private templates: NodeTemplate[] = [];
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'templates');
    this.loadTemplates();
  }

  private loadTemplates(): void {
    if (!fs.existsSync(this.templatesDir)) {
      logger.warn('Templates directory not found', { dir: this.templatesDir });
      return;
    }

    const files = fs.readdirSync(this.templatesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      try {
        const fullPath = path.join(this.templatesDir, file);
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const parsed = yaml.load(raw) as NodeTemplate;
        if (parsed && parsed.blockchain) {
          this.templates.push(parsed);
          logger.info('Template loaded', { template: parsed.id || file, blockchain: parsed.blockchain });
        } else {
          logger.warn('Template ignored (missing blockchain)', { file });
        }
      } catch (error) {
        logger.error('Failed to load template', { file, error });
      }
    }
  }

  getTemplate(blockchain: string, mode?: string): NodeTemplate | undefined {
    const targetChain = blockchain.toLowerCase();
    const targetMode = mode?.toLowerCase();

    const matchWithMode = this.templates.find(t =>
      t.blockchain?.toLowerCase() === targetChain &&
      (t.mode ? t.mode.toLowerCase() === targetMode : true)
    );

    if (matchWithMode) return matchWithMode;

    return this.templates.find(t => t.blockchain?.toLowerCase() === targetChain);
  }
}

export const templateManager = new TemplateManager();
export default templateManager;
