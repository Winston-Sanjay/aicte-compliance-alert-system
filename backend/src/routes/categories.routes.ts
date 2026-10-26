import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (_req, res: Response): Promise<void> => {
  try {
    const categories = await prisma.applicationCategory.findMany({
      where: { isActive: true },
      include: {
        checklistRules: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

export default router;
