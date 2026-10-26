import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, entityType, search, limit = '100' } = req.query;
    const where: any = {};

    if (action && action !== 'ALL') {
      where.action = action as string;
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType as string;
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { entityType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // If institution user, restrict logs to their institution's applications
    if (req.user?.role === 'INSTITUTION' && req.user.institutionId) {
      where.OR = [
        { applicationId: null, userId: req.user.id },
        { application: { institutionId: req.user.institutionId } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: true,
        application: {
          select: {
            id: true,
            applicationNo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
    });

    const total = await prisma.auditLog.count({ where });

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

export default router;
