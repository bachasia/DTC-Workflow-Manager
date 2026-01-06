import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { TaskStatus, Role } from '@prisma/client';
import {
    sendDeadlineReminderNotification,
    sendTaskOverdueNotification,
    sendDailyReportReminder,
} from '../services/lark/notifications.js';
import { syncReportToLarkBase } from '../services/lark/base.js';

/**
 * Check for overdue tasks and update status
 * Runs every hour
 */
export const scheduleOverdueChecker = () => {
    cron.schedule('0 * * * *', async () => {
        logger.info('Running overdue task checker...');

        try {
            const now = new Date();

            // Find tasks that are overdue but not marked as OVERDUE or DONE
            const overdueTasks = await prisma.task.findMany({
                where: {
                    deadline: {
                        lt: now,
                    },
                    status: {
                        notIn: [TaskStatus.OVERDUE, TaskStatus.DONE],
                    },
                },
                include: {
                    assignedTo: true,
                },
            });

            for (const task of overdueTasks) {
                // Update task status to OVERDUE
                await prisma.task.update({
                    where: { id: task.id },
                    data: {
                        status: TaskStatus.OVERDUE,
                        updateLogs: {
                            create: {
                                field: 'Status',
                                oldValue: task.status,
                                newValue: TaskStatus.OVERDUE,
                                details: 'System: Automatically marked as overdue',
                            },
                        },
                    },
                });

                // Send notification
                await sendTaskOverdueNotification(task);
            }

            logger.info(`Overdue checker completed: ${overdueTasks.length} tasks marked as overdue`);
        } catch (error) {
            logger.error('Overdue checker error:', error);
        }
    });

    logger.info('✅ Overdue checker scheduled (every hour)');
};

/**
 * Send deadline reminders for tasks due in 2 hours
 * Runs every 30 minutes
 */
export const scheduleDeadlineReminders = () => {
    cron.schedule('*/30 * * * *', async () => {
        logger.info('Running deadline reminder checker...');

        try {
            const now = new Date();
            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            // Find tasks due in the next 2 hours
            const upcomingTasks = await prisma.task.findMany({
                where: {
                    deadline: {
                        gte: now,
                        lte: twoHoursLater,
                    },
                    status: {
                        notIn: [TaskStatus.DONE, TaskStatus.OVERDUE],
                    },
                },
                include: {
                    assignedTo: true,
                },
            });

            for (const task of upcomingTasks) {
                // Check if reminder already sent in the last hour
                const recentNotification = await prisma.larkNotification.findFirst({
                    where: {
                        taskId: task.id,
                        type: 'DEADLINE_APPROACHING',
                        createdAt: {
                            gte: new Date(now.getTime() - 60 * 60 * 1000),
                        },
                    },
                });

                if (!recentNotification) {
                    await sendDeadlineReminderNotification(task);
                }
            }

            logger.info(`Deadline reminders sent: ${upcomingTasks.length} tasks`);
        } catch (error) {
            logger.error('Deadline reminder error:', error);
        }
    });

    logger.info('✅ Deadline reminders scheduled (every 30 minutes)');
};

/**
 * Send daily report reminders at 5 PM
 * Runs at 17:00 every day
 */
export const scheduleDailyReportReminders = () => {
    cron.schedule('0 17 * * *', async () => {
        logger.info('Sending daily report reminders...');

        try {
            // Get all non-manager users
            const users = await prisma.user.findMany({
                where: {
                    role: {
                        not: Role.MANAGER,
                    },
                },
            });

            for (const user of users) {
                await sendDailyReportReminder(user);
            }

            logger.info(`Daily report reminders sent to ${users.length} users`);
        } catch (error) {
            logger.error('Daily report reminder error:', error);
        }
    });

    logger.info('✅ Daily report reminders scheduled (5 PM daily)');
};

/**
 * Sync pending reports to Lark Base
 * Runs every 30 minutes
 */
export const scheduleLarkBaseSync = () => {
    cron.schedule('*/30 * * * *', async () => {
        logger.info('Running Lark Base sync...');

        try {
            // Find reports not yet synced
            const pendingReports = await prisma.dailyReport.findMany({
                where: {
                    syncedToLark: false,
                },
                include: {
                    user: true,
                },
                take: 50, // Limit to 50 per run
            });

            for (const report of pendingReports) {
                const success = await syncReportToLarkBase(report);

                if (success) {
                    await prisma.dailyReport.update({
                        where: { id: report.id },
                        data: {
                            syncedToLark: true,
                        },
                    });
                }
            }

            logger.info(`Lark Base sync completed: ${pendingReports.length} reports processed`);
        } catch (error) {
            logger.error('Lark Base sync error:', error);
        }
    });

    logger.info('✅ Lark Base sync scheduled (every 30 minutes)');
};

/**
 * Morning task reminder at 9 AM
 * Runs at 09:00 every day
 */
export const scheduleMorningReminders = () => {
    cron.schedule('0 9 * * *', async () => {
        logger.info('Sending morning task reminders...');

        try {
            const users = await prisma.user.findMany({
                where: {
                    role: {
                        not: Role.MANAGER,
                    },
                },
            });

            for (const user of users) {
                const pendingTasks = await prisma.task.findMany({
                    where: {
                        assignedToId: user.id,
                        status: {
                            notIn: [TaskStatus.DONE],
                        },
                    },
                    orderBy: {
                        deadline: 'asc',
                    },
                    take: 5,
                });

                if (pendingTasks.length > 0) {
                    // This would require implementing in notifications.ts
                    logger.info(`Morning reminder for ${user.email}: ${pendingTasks.length} pending tasks`);
                }
            }
        } catch (error) {
            logger.error('Morning reminder error:', error);
        }
    });

    logger.info('✅ Morning reminders scheduled (9 AM daily)');
};

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduler = () => {
    logger.info('🕐 Initializing scheduled jobs...');

    scheduleOverdueChecker();
    scheduleDeadlineReminders();
    scheduleDailyReportReminders();
    scheduleLarkBaseSync();
    scheduleMorningReminders();

    logger.info('✅ All scheduled jobs initialized');
};
