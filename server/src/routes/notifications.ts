import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { limit = '10', offset = '0' } = req.query;

        const notifications = await prisma.larkNotification.findMany({
            where: {
                userId: user.id,
                // Show all notifications, regardless of Lark delivery status
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        // Get unread count (all notifications are considered unread for now)
        const unreadCount = await prisma.larkNotification.count({
            where: {
                userId: user.id,
            },
        });

        res.json({
            notifications,
            unreadCount,
            total: notifications.length,
        });
    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read (placeholder - we'll track read status later)
 */
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        const notification = await prisma.larkNotification.findUnique({
            where: { id },
        });

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        if (notification.userId !== user.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // For now, we don't have a 'read' field in the schema
        // This is a placeholder for future implementation
        logger.info(`Notification ${id} marked as read by ${user.email}`);

        res.json({ success: true });
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        // Placeholder for future implementation
        logger.info(`All notifications marked as read for ${user.email}`);

        res.json({ success: true });
    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

export default router;
