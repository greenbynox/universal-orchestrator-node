import { EventEmitter } from 'events';
import { Alert, AlertSeverity, AlertType } from '../types';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { config } from '../config';

export type AlertHandler = (alert: Alert) => Promise<void> | void;

export class AlertManager extends EventEmitter {
  private handlers: Map<AlertType, AlertHandler[]> = new Map();

  registerAlert(type: AlertType, handler: AlertHandler): void {
    const current = this.handlers.get(type) || [];
    this.handlers.set(type, [...current, handler]);
  }

  private async persistAlert(alert: Omit<Alert, 'id'>): Promise<Alert | null> {
    try {
      // Ensure node exists before persisting (avoid FK violations)
      if (alert.nodeId) {
        const nodeExists = await prisma.node.findUnique({ where: { id: alert.nodeId } });
        if (!nodeExists) {
          logger.warn(`Node ${alert.nodeId} not found for alert ${alert.type}, skipping persistence`);
          return null;
        }
      }

      const created = await prisma.alert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          nodeId: alert.nodeId,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          resolvedAt: alert.resolvedAt,
          metadata: alert.metadata ? JSON.stringify(alert.metadata) : undefined,
        },
      });

      return {
        id: created.id,
        type: created.type as AlertType,
        severity: created.severity as AlertSeverity,
        nodeId: created.nodeId || undefined,
        message: created.message,
        timestamp: created.timestamp,
        resolved: created.resolved,
        resolvedAt: created.resolvedAt || undefined,
        metadata: created.metadata ? JSON.parse(created.metadata as unknown as string) : undefined,
      };
    } catch (error: any) {
      // Foreign key constraint error - node doesn't exist anymore
      if (error.code === 'P2003') {
        logger.warn(`Node ${alert.nodeId} not found for alert ${alert.type}, skipping persistence`, { 
          error: error.message,
          nodeId: alert.nodeId 
        });
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  async trigger(input: Omit<Alert, 'id' | 'timestamp' | 'resolved'> & { timestamp?: Date; resolved?: boolean }): Promise<Alert> {
    const timestamp = input.timestamp || new Date();
    const resolved = input.resolved ?? false;

    // Dedup: avoid duplicate unresolved alerts of same type/node
    try {
      const existing = await prisma.alert.findFirst({
        where: {
          type: input.type,
          nodeId: input.nodeId ?? undefined,
          resolved: false,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (existing) {
        logger.debug(`Alerte déjà existante pour ${input.type} ${input.nodeId ?? ''}`);
        return {
          id: existing.id,
          type: existing.type as AlertType,
          severity: existing.severity as AlertSeverity,
          nodeId: existing.nodeId || undefined,
          message: existing.message,
          timestamp: existing.timestamp,
          resolved: existing.resolved,
          resolvedAt: existing.resolvedAt || undefined,
          metadata: existing.metadata ? JSON.parse(existing.metadata as unknown as string) : undefined,
        };
      }
    } catch (error: any) {
      logger.warn('Error checking existing alerts', { error: error.message });
      // Continue anyway
    }

    // Try to persist, but don't fail if node doesn't exist
    const persistedAlert = await this.persistAlert({
      ...input,
      timestamp,
      resolved,
    });

    // If we couldn't persist (FK error), create a in-memory alert to emit anyway
    const alert = persistedAlert || {
      id: `temp-${Date.now()}-${Math.random()}`,
      type: input.type,
      severity: input.severity,
      nodeId: input.nodeId,
      message: input.message,
      timestamp,
      resolved,
      resolvedAt: input.resolvedAt,
      metadata: input.metadata,
    };

    this.emit('alert', alert);

    // Filtrage par sévérité minimale
    const normalize = (s: string): AlertSeverity => {
      const v = s.toLowerCase();
      if (v === 'info') return 'INFO';
      if (v === 'critical') return 'CRITICAL';
      return 'WARNING';
    };

    const minSeverity = normalize(config.alerts.minSeverity || 'WARNING');
    const severityOrder: Record<AlertSeverity, number> = { INFO: 1, WARNING: 2, CRITICAL: 3 } as const;
    const handlers = this.handlers.get(alert.type) || [];

    if (severityOrder[alert.severity] >= severityOrder[minSeverity]) {
      await Promise.allSettled(
        handlers.map(async (handler) => {
          try {
            await handler(alert);
          } catch (error) {
            logger.error('Erreur dans handler d\'alerte', { error });
          }
        })
      );
    } else {
      logger.debug('Alerte ignorée (sous le seuil minimal)', { alertType: alert.type, severity: alert.severity, minSeverity });
    }

    return alert;
  }

  async resolve(alertId: string): Promise<Alert | null> {
    const existing = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!existing) return null;

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { resolved: true, resolvedAt: new Date() },
    });

    const alert: Alert = {
      id: updated.id,
      type: updated.type as AlertType,
      severity: updated.severity as AlertSeverity,
      nodeId: updated.nodeId || undefined,
      message: updated.message,
      timestamp: updated.timestamp,
      resolved: updated.resolved,
      resolvedAt: updated.resolvedAt || undefined,
      metadata: updated.metadata ? JSON.parse(updated.metadata as unknown as string) : undefined,
    };

    this.emit('alert:resolved', alert);
    return alert;
  }

  async resolveByType(type: AlertType, nodeId?: string): Promise<number> {
    const result = await prisma.alert.updateMany({
      where: { type, nodeId: nodeId ?? undefined, resolved: false },
      data: { resolved: true, resolvedAt: new Date() },
    });
    return result.count;
  }

  async listActive(limit = 50): Promise<Alert[]> {
    const rows = await prisma.alert.findMany({
      where: { resolved: false },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return rows.map((a) => ({
      id: a.id,
      type: a.type as AlertType,
      severity: a.severity as AlertSeverity,
      nodeId: a.nodeId || undefined,
      message: a.message,
      timestamp: a.timestamp,
      resolved: a.resolved,
      resolvedAt: a.resolvedAt || undefined,
      metadata: a.metadata ? JSON.parse(a.metadata as unknown as string) : undefined,
    }));
  }

  async listAll(params: { limit?: number; offset?: number; resolved?: boolean | null } = {}): Promise<{ total: number; items: Alert[] }> {
    const { limit = 50, offset = 0, resolved = null } = params;
    const where = resolved === null ? {} : { resolved };
    const [total, items] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      total,
      items: items.map((a) => ({
        id: a.id,
        type: a.type as AlertType,
        severity: a.severity as AlertSeverity,
        nodeId: a.nodeId || undefined,
        message: a.message,
        timestamp: a.timestamp,
        resolved: a.resolved,
        resolvedAt: a.resolvedAt || undefined,
        metadata: a.metadata ? JSON.parse(a.metadata as unknown as string) : undefined,
      })),
    };
  }
}

export const alertManager = new AlertManager();
export default alertManager;
