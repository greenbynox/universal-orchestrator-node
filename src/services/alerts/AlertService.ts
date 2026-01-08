import { Alert, AlertType, AlertSeverity } from '../../types';
import { alertManager } from '../../core/AlertManager';
import prisma from '../../utils/prisma';

export interface CreateAlertInput {
  type: AlertType;
  severity: AlertSeverity;
  nodeId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class AlertService {
  async create(input: CreateAlertInput): Promise<Alert> {
    return alertManager.trigger({
      ...input,
      timestamp: new Date(),
      resolved: false,
    });
  }

  async resolve(id: string): Promise<Alert | null> {
    return alertManager.resolve(id);
  }

  async listActive(limit = 100): Promise<Alert[]> {
    return alertManager.listActive(limit);
  }

  async list(params: { limit?: number; offset?: number; resolved?: boolean | null }): Promise<{ total: number; items: Alert[] }> {
    return alertManager.listAll(params);
  }

  async getRecent(count = 5): Promise<Alert[]> {
    const items = await prisma.alert.findMany({
      where: { resolved: false },
      orderBy: { timestamp: 'desc' },
      take: count,
    });
    return items.map((a) => ({
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
  async clearAll(): Promise<number> {
    return alertManager.clearAll();
  }
}

export const alertService = new AlertService();
export default alertService;
