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

/**
 * GET /api/reports/weekly
 * Generate weekly progress report
 */
router.get('/weekly', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { userId, startDate, endDate } = req.query;

        // Determine target user for report
        let targetUserId = user.id;
        if (userId && user.role === Role.MANAGER) {
            targetUserId = userId as string;
        }

        // Calculate date range (default: last 7 days)
        const end = endDate ? new Date(endDate as string) : new Date();
        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Fetch target user info
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Fetch all tasks for the user
        const allTasks = await prisma.task.findMany({
            where: {
                assignedToId: targetUserId,
            },
            include: {
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter tasks by date range for completed tasks
        const completedTasks = allTasks.filter(task => {
            if (task.status !== TaskStatus.DONE) return false;
            // Check if task was completed within the date range
            const completionLog = task.updateLogs.find(log =>
                log.field === 'Status' && log.newValue === TaskStatus.DONE
            );
            if (!completionLog) return false;
            const completionDate = new Date(completionLog.timestamp);
            return completionDate >= start && completionDate <= end;
        });

        const inProgressTasks = allTasks.filter(task =>
            task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.TODO
        );

        const overdueTasks = allTasks.filter(task => task.status === TaskStatus.OVERDUE);
        const blockedTasks = allTasks.filter(task => task.status === TaskStatus.BLOCKER);

        // Calculate statistics
        const totalTasks = allTasks.length;
        const completedCount = completedTasks.length;
        const inProgressCount = inProgressTasks.length;
        const overdueCount = overdueTasks.length;
        const blockedCount = blockedTasks.length;

        const avgProgress = allTasks.length > 0
            ? Math.round(allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length)
            : 0;

        // Get recent updates within date range
        const recentUpdates = allTasks
            .flatMap(task =>
                task.updateLogs
                    .filter(log => {
                        const logDate = new Date(log.timestamp);
                        return logDate >= start && logDate <= end;
                    })
                    .map(log => ({
                        ...log,
                        taskTitle: task.title,
                        taskId: task.id,
                    }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        const report = {
            user: targetUser,
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
            generatedAt: new Date().toISOString(),
            statistics: {
                totalTasks,
                completedCount,
                inProgressCount,
                overdueCount,
                blockedCount,
                avgProgress,
                completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
            },
            tasks: {
                completed: completedTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    purpose: t.purpose,
                    priority: t.priority,
                    deadline: t.deadline,
                    progress: t.progress,
                })),
                inProgress: inProgressTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    purpose: t.purpose,
                    status: t.status,
                    priority: t.priority,
                    deadline: t.deadline,
                    progress: t.progress,
                })),
                overdue: overdueTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    purpose: t.purpose,
                    priority: t.priority,
                    deadline: t.deadline,
                    progress: t.progress,
                })),
                blocked: blockedTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    purpose: t.purpose,
                    priority: t.priority,
                    blockerReason: t.blockerReason,
                    blockerRelatedTo: t.blockerRelatedTo,
                    deadline: t.deadline,
                    progress: t.progress,
                })),
            },
            recentUpdates,
        };

        logger.info(`Weekly report generated for user ${targetUserId} by ${user.email}`);
        res.json({ report });
    } catch (error) {
        logger.error('Generate weekly report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

export default router;
