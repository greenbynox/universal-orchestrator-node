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
  permissions?: {
    localOnly?: boolean;
  };
}

class TemplateManager {
  private templates: NodeTemplate[] = [];
  private templatesByBlockchain: Map<string, NodeTemplate[]> = new Map();
  private resolvedTemplatesDir: string;
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'templates');
    this.resolvedTemplatesDir = this.templatesDir;
    this.loadTemplates();
  }

  private addTemplate(template: NodeTemplate, source: string): void {
    const normalizedChain = template.blockchain.toLowerCase();
    const normalizedMode = template.mode?.toLowerCase();
    const normalizedCategory = template.category?.toLowerCase();
    const normalizedTemplate: NodeTemplate = {
      ...template,
      blockchain: normalizedChain,
      mode: normalizedMode,
      category: normalizedCategory,
    };

    this.templates.push(normalizedTemplate);

    const list = this.templatesByBlockchain.get(normalizedChain) || [];
    list.push(normalizedTemplate);
    this.templatesByBlockchain.set(normalizedChain, list);

    logger.info('Template loaded', { template: template.id || source, blockchain: normalizedChain, mode: normalizedMode, category: normalizedCategory });
  }

  private ensureLocalPermission(): boolean {
    if (!fs.existsSync(this.templatesDir)) {
      logger.warn('Templates directory not found', { dir: this.templatesDir });
      return false;
    }

    try {
      const realDir = fs.realpathSync(this.templatesDir);
      this.resolvedTemplatesDir = realDir;
      const projectRoot = fs.realpathSync(process.cwd());
      if (!realDir.startsWith(projectRoot)) {
        logger.error('Templates directory escapes project root', { realDir, projectRoot });
        return false;
      }
      fs.accessSync(realDir, fs.constants.R_OK);
      return true;
    } catch (error) {
      logger.error('Unable to access templates directory', { dir: this.templatesDir, error });
      return false;
    }
  }

  private loadTemplates(): void {
    this.templates = [];
    this.templatesByBlockchain.clear();

    if (!this.ensureLocalPermission()) {
      return;
    }

    const files = fs.readdirSync(this.templatesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      try {
        const fullPath = path.join(this.templatesDir, file);
        const resolvedFile = fs.realpathSync(fullPath);

        // Interdire les liens symboliques ou chemins hors du dossier autorisé
        if (!resolvedFile.startsWith(this.resolvedTemplatesDir)) {
          logger.warn('Template ignoré (chemin hors dossier autorisé)', { file, resolvedFile });
          continue;
        }

        const raw = fs.readFileSync(resolvedFile, 'utf-8');
        const parsed = yaml.load(raw) as NodeTemplate;
        if (parsed && parsed.blockchain) {
          if (parsed.permissions?.localOnly === true) {
            try {
              fs.accessSync(resolvedFile, fs.constants.R_OK);
            } catch (error) {
              logger.warn('Template ignoré (permission locale requise)', { file, error });
              continue;
            }
          }
          this.addTemplate(parsed, file);
        } else {
          logger.warn('Template ignoré (missing blockchain)', { file });
        }
      } catch (error) {
        logger.error('Failed to load template', { file, error });
      }
    }
  }

  getTemplate(blockchain: string, mode?: string, category?: string): NodeTemplate | undefined {
    const targetChain = blockchain.toLowerCase();
    const targetMode = mode?.toLowerCase();
    const targetCategory = category?.toLowerCase();
    const templatesForChain = this.templatesByBlockchain.get(targetChain) || [];

    const prioritized = templatesForChain.filter(t =>
      (targetMode ? t.mode === targetMode : true) &&
      (targetCategory ? t.category === targetCategory : true)
    );
    if (prioritized.length > 0) {
      return prioritized[0];
    }

    const fallbackByMode = targetMode ? templatesForChain.find(t => t.mode === targetMode) : undefined;
    if (fallbackByMode) return fallbackByMode;

    return templatesForChain[0] || this.templates.find(t => t.blockchain?.toLowerCase() === targetChain);
  }

  getTemplates(category?: string): NodeTemplate[] {
    if (!category) {
      return [...this.templates];
    }
    const normalizedCategory = category.toLowerCase();
    return this.templates.filter(t => t.category?.toLowerCase() === normalizedCategory);
  }

  getTemplatesByCategory(category: string): NodeTemplate[] {
    return this.getTemplates(category);
  }
}

export const templateManager = new TemplateManager();
export default templateManager;
