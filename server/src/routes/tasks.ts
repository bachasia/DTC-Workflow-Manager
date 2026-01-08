import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AuthRequest, authenticate, requireManager } from '../middleware/auth.js';
import { Role, TaskStatus, Priority } from '@prisma/client';
import {
    sendTaskAssignmentNotification,
    sendStatusChangeNotification,
    sendTaskBlockedNotification
} from '../services/lark/notifications.js';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
    title: z.string().min(1),
    purpose: z.string().min(1),
    description: z.string(),
    assignedToId: z.string(),
    role: z.nativeEnum(Role),
    priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
    deadline: z.string().datetime(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    purpose: z.string().min(1).optional(),
    description: z.string().optional(),
    assignedToId: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    progress: z.number().min(0).max(100).optional(),
    deadline: z.string().datetime().optional(),
    blockerReason: z.string().optional(),
    blockerRelatedTo: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.nativeEnum(TaskStatus),
    blockerReason: z.string().optional(),
    blockerRelatedTo: z.string().optional(),
});

const addLogSchema = z.object({
    field: z.string(),
    oldValue: z.string(),
    newValue: z.string(),
    details: z.string().optional(),
});

/**
 * GET /api/tasks
 * List tasks with filtering
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { role, status, assignedTo } = req.query;
        const user = req.user!;

        // Build filter
        const where: any = {};

        // Non-managers can only see their own tasks or tasks in their department
        if (user.role !== Role.MANAGER) {
            where.OR = [
                { assignedToId: user.id },
                { role: user.role },
            ];
        }

        if (role) where.role = role as Role;
        if (status) where.status = status as TaskStatus;
        if (assignedTo) where.assignedToId = assignedTo as string;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
            orderBy: [
                { status: 'asc' },
                { deadline: 'asc' },
            ],
        });

        res.json({ tasks });
    } catch (error) {
        logger.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

/**
 * POST /api/tasks
 * Create new task (Manager only)
 */
router.post('/', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTaskSchema.parse(req.body);
        const user = req.user!;

        const task = await prisma.task.create({
            data: {
                ...data,
                createdById: user.id,
                updateLogs: {
                    create: {
                        field: 'Task',
                        oldValue: 'None',
                        newValue: 'Created',
                        details: `Created by ${user.email}`,
                    },
                },
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                updateLogs: true,
            },
        });

        logger.info(`Task created: ${task.id} by ${user.email}`);

        // Send Lark notification to assignee
        sendTaskAssignmentNotification(task as any).catch((error) => {
            logger.error('Failed to send task assignment notification:', error);
        });

        res.status(201).json({ task });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        logger.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

/**
 * GET /api/tasks/:id
 * Get task details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                },
            },
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        // Check permissions
        if (user.role !== Role.MANAGER && task.assignedToId !== user.id && task.role !== user.role) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({ task });
    } catch (error) {
        logger.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to get task' });
    }
});

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Log incoming data for debugging
        logger.info(`Update task ${id} request body:`, JSON.stringify(req.body, null, 2));

        const updates = updateTaskSchema.parse(req.body);

        // Get existing task
        const existingTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!existingTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        // Check permissions
        const canEdit = user.role === Role.MANAGER || existingTask.assignedToId === user.id;
        if (!canEdit) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Create update logs
        const logs: any[] = [];
        Object.entries(updates).forEach(([field, newValue]) => {
            const oldValue = (existingTask as any)[field];
            if (oldValue !== newValue) {
                logs.push({
                    field,
                    oldValue: String(oldValue || ''),
                    newValue: String(newValue || ''),
                    details: `Updated by ${user.email}`,
                });
            }
        });

        // Update task
        const task = await prisma.task.update({
            where: { id },
            data: {
                ...updates,
                updateLogs: {
                    create: logs,
                },
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        logger.info(`Task updated: ${task.id} by ${user.email}`);

        res.json({ task });
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error('Validation error:', JSON.stringify(error.errors, null, 2));
            logger.error('Received body:', JSON.stringify(req.body, null, 2));
            res.status(400).json({
                error: 'Invalid input',
                details: error.errors,
                received: req.body
            });
            return;
        }
        logger.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

/**
 * PATCH /api/tasks/:id/status
 * Update task status
 */
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;
        const { status, blockerReason, blockerRelatedTo } = updateStatusSchema.parse(req.body);

        const existingTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!existingTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        // Check permissions
        const canEdit = user.role === Role.MANAGER || existingTask.assignedToId === user.id;
        if (!canEdit) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                status,
                blockerReason: status === TaskStatus.BLOCKER ? blockerReason : null,
                blockerRelatedTo: status === TaskStatus.BLOCKER ? blockerRelatedTo : null,
                progress: status === TaskStatus.DONE ? 100 : existingTask.progress,
                updateLogs: {
                    create: {
                        field: 'Status',
                        oldValue: existingTask.status,
                        newValue: status,
                        details: blockerReason || `Updated by ${user.email}`,
                    },
                },
            },
            include: {
                assignedTo: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                updateLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        logger.info(`Task status updated: ${task.id} -> ${status} by ${user.email}`);

        // Send Lark notifications based on status change
        if (status === TaskStatus.BLOCKER) {
            // Send urgent blocker notification to both assignee and manager
            sendTaskBlockedNotification(task as any).catch((error) => {
                logger.error('Failed to send task blocked notification:', error);
            });
        } else {
            // Send regular status change notification for DONE and other important changes
            sendStatusChangeNotification(task as any, existingTask.status, status).catch((error) => {
                logger.error('Failed to send status change notification:', error);
            });
        }

        res.json({ task });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        logger.error('Update task status error:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

/**
 * DELETE /api/tasks/:id
 * Delete task (Manager only)
 */
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.task.delete({
            where: { id },
        });

        logger.info(`Task deleted: ${id} by ${req.user!.email}`);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        logger.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

/**
 * POST /api/tasks/:id/logs
 * Add update log to task
 */
router.post('/:id/logs', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;
        const logData = addLogSchema.parse(req.body);

        const task = await prisma.task.findUnique({
            where: { id },
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        const log = await prisma.updateLog.create({
            data: {
                taskId: id,
                ...logData,
                details: logData.details || `Updated by ${user.email}`,
            },
        });

        res.status(201).json({ log });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        logger.error('Add log error:', error);
        res.status(500).json({ error: 'Failed to add log' });
    }
});

export default router;
