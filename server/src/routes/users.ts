import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AuthRequest, authenticate, requireManager } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

/**
 * POST /api/users
 * Create new user (Manager only)
 */
router.post('/', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            res.status(400).json({ error: 'Name, email, password, and role are required' });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: 'Email already in use' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        logger.info(`User created: ${newUser.id} (${newUser.email}) by ${req.user!.email}`);
        res.status(201).json({ user: newUser });
    } catch (error) {
        logger.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * PUT /api/users/:id
 * Update user (Manager only)
 */
router.put('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, avatar } = req.body;

        // Validate input
        if (!name || !email || !role) {
            res.status(400).json({ error: 'Name, email, and role are required' });
            return;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if email is already taken by another user
        if (email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email },
            });

            if (emailTaken) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role: role as Role,
                avatar: avatar || existingUser.avatar,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        logger.info(`User updated: ${updatedUser.id} by ${req.user!.email}`);
        res.json({ user: updatedUser });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (Manager only)
 */
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;

        // Prevent self-deletion
        if (id === currentUser.id) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        assignedTasks: true,
                        createdTasks: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if user has active tasks
        if (user._count.assignedTasks > 0) {
            res.status(400).json({
                error: 'Cannot delete user with assigned tasks',
                details: `User has ${user._count.assignedTasks} assigned task(s)`,
            });
            return;
        }

        // Delete user
        await prisma.user.delete({
            where: { id },
        });

        logger.info(`User deleted: ${id} (${user.email}) by ${currentUser.email}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
