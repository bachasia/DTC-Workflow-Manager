import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import logger from '../lib/logger.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        // Get all tasks (filter by role if not manager)
        const tasks = await prisma.task.findMany({
            where: user.role === 'MANAGER' ? {} : { role: user.role },
        });

        // Calculate statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
        const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
        const overdueTasks = tasks.filter((t: any) => t.status === 'OVERDUE').length;

        // Calculate average progress
        const avgProgress = totalTasks > 0
            ? Math.round(tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / totalTasks)
            : 0;

        // Tasks by role
        const tasksByRole = {
            DESIGNER: tasks.filter((t: any) => t.role === 'DESIGNER').length,
            SELLER: tasks.filter((t: any) => t.role === 'SELLER').length,
            CS: tasks.filter((t: any) => t.role === 'CS').length,
        };

        // Tasks by priority
        const tasksByPriority = {
            HIGH: tasks.filter((t: any) => t.priority === 'HIGH').length,
            MEDIUM: tasks.filter((t: any) => t.priority === 'MEDIUM').length,
            LOW: tasks.filter((t: any) => t.priority === 'LOW').length,
        };

        const stats = {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            avgProgress,
            tasksByRole,
            tasksByPriority,
        };

        logger.info(`Dashboard stats retrieved for user ${user.id}`);
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

export default router;
