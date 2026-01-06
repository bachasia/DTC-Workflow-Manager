import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AuthRequest, authenticate, requireManager } from '../middleware/auth.js';
import { Role, TaskStatus } from '@prisma/client';

const router = Router();

// Validation schema
const createReportSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    content: z.string().min(10),
    completedTasks: z.array(z.string()),
    analytics: z.any().optional(),
});

/**
 * POST /api/reports
 * Submit daily report
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const data = createReportSchema.parse(req.body);

        // Check if report already exists for this date
        const existing = await prisma.dailyReport.findUnique({
            where: {
                userId_date: {
                    userId: user.id,
                    date: new Date(data.date),
                },
            },
        });

        if (existing) {
            res.status(409).json({ error: 'Report already submitted for this date' });
            return;
        }

        const report = await prisma.dailyReport.create({
            data: {
                userId: user.id,
                date: new Date(data.date),
                content: data.content,
                completedTasks: data.completedTasks,
                analytics: data.analytics || {},
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        logger.info(`Daily report submitted: ${report.id} by ${user.email} for ${data.date}`);

        // TODO: Sync to Lark Base

        res.status(201).json({ report });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        logger.error('Create report error:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

/**
 * GET /api/reports
 * Get reports with filtering
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { userId, startDate, endDate } = req.query;

        const where: any = {};

        // Non-managers can only see their own reports
        if (user.role !== Role.MANAGER) {
            where.userId = user.id;
        } else if (userId) {
            where.userId = userId as string;
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const reports = await prisma.dailyReport.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        res.json({ reports });
    } catch (error) {
        logger.error('Get reports error:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
});

/**
 * GET /api/reports/analytics
 * Get analytics data (Manager only)
 */
router.get('/analytics', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate as string);
        if (endDate) dateFilter.lte = new Date(endDate as string);

        // Get all tasks
        const tasks = await prisma.task.findMany({
            where: dateFilter.gte || dateFilter.lte ? {
                createdAt: dateFilter,
            } : undefined,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // Calculate analytics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
        const overdueTasks = tasks.filter(t => t.status === TaskStatus.OVERDUE).length;
        const blockedTasks = tasks.filter(t => t.status === TaskStatus.BLOCKER).length;

        const tasksByRole = {
            DESIGNER: tasks.filter(t => t.role === Role.DESIGNER).length,
            SELLER: tasks.filter(t => t.role === Role.SELLER).length,
            CS: tasks.filter(t => t.role === Role.CS).length,
        };

        const tasksByStatus = {
            TODO: tasks.filter(t => t.status === TaskStatus.TODO).length,
            IN_PROGRESS: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
            BLOCKER: blockedTasks,
            DONE: completedTasks,
            OVERDUE: overdueTasks,
        };

        const tasksByPriority = {
            HIGH: tasks.filter(t => t.priority === 'HIGH').length,
            MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
            LOW: tasks.filter(t => t.priority === 'LOW').length,
        };

        // Staff performance
        const users = await prisma.user.findMany({
            where: { role: { not: Role.MANAGER } },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        const staffPerformance = await Promise.all(
            users.map(async (user) => {
                const userTasks = tasks.filter(t => t.assignedTo.id === user.id);
                const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
                const total = userTasks.length;
                const completionRate = total > 0 ? (completed / total) * 100 : 0;

                return {
                    userId: user.id,
                    name: user.name,
                    role: user.role,
                    totalTasks: total,
                    completedTasks: completed,
                    completionRate: Math.round(completionRate),
                };
            })
        );

        res.json({
            summary: {
                totalTasks,
                completedTasks,
                overdueTasks,
                blockedTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            },
            tasksByRole,
            tasksByStatus,
            tasksByPriority,
            staffPerformance,
        });
    } catch (error) {
        logger.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

export default router;
