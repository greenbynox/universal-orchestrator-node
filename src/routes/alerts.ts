import { Router } from 'express';
import { alertService } from '../services/alerts/AlertService';

const router: Router = Router();

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const resolvedParam = req.query.resolved as string | undefined;
  const resolved = resolvedParam === undefined || resolvedParam === 'null'
    ? null
    : resolvedParam === 'true';

  try {
    const result = await alertService.list({ limit, offset, resolved });
    res.json({
      success: true,
      total: result.total,
      items: result.items,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/resolve', async (req, res) => {
  try {
    const updated = await alertService.resolve(req.params.id);
    if (!updated) return res.status(404).json({ success: false, error: 'Alerte introuvable' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
