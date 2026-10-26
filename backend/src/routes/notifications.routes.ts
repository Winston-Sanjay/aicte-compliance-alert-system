import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// List Notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unreadOnly } = req.query;
    const where: any = { userId: req.user!.id };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = await prisma.notification.count({ where });

    res.json({ notifications, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark Single Notification as Read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, userId: req.user!.id },
      data: { isRead: true },
    });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark All Notifications as Read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

export default router;
