import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AuthRequest, authenticate, requireManager } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/users
 * List all users
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' },
            ],
        });

        res.json({ users });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

/**
 * GET /api/users/:id
 * Get user details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedTasks: true,
                        createdTasks: true,
                        dailyReports: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * GET /api/users/:id/tasks
 * Get user's tasks
 */
router.get('/:id/tasks', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;

        // Check permissions
        if (currentUser.role !== Role.MANAGER && currentUser.id !== id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const tasks = await prisma.task.findMany({
            where: { assignedToId: id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 5,
                },
            },
            orderBy: [
                { status: 'asc' },
                { deadline: 'asc' },
            ],
        });

        res.json({ tasks });
    } catch (error) {
        logger.error('Get user tasks error:', error);
        res.status(500).json({ error: 'Failed to get user tasks' });
    }
});

export default router;
