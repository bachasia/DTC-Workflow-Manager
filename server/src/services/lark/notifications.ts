import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { sendMessageToUser, sendCardMessage } from './client.js';
import { Task, User, NotificationType } from '@prisma/client';

/**
 * Create task assignment notification card
 */
const createTaskAssignmentCard = (task: Task & { assignedTo: User; createdBy: User }) => {
    const priorityEmoji = {
        HIGH: '🔴',
        MEDIUM: '🟡',
        LOW: '🟢',
    };

    return {
        config: {
            wide_screen_mode: true,
        },
        header: {
            title: {
                tag: 'plain_text',
                content: '📋 New Task Assigned!',
            },
            template: 'blue',
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**${task.title}**\n\n${task.purpose}`,
                },
            },
            {
                tag: 'hr',
            },
            {
                tag: 'div',
                fields: [
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Priority:**\n${priorityEmoji[task.priority]} ${task.priority}`,
                        },
                    },
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Deadline:**\n⏰ ${new Date(task.deadline).toLocaleString('vi-VN')}`,
                        },
                    },
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Assigned by:**\n👤 ${task.createdBy.name}`,
                        },
                    },
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Role:**\n${task.role}`,
                        },
                    },
                ],
            },
            {
                tag: 'hr',
            },
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: task.description,
                    },
                ],
            },
        ],
    };
};

/**
 * Send task assignment notification
 */
export const sendTaskAssignmentNotification = async (
    task: Task & { assignedTo: User; createdBy: User }
): Promise<void> => {
    try {
        const card = createTaskAssignmentCard(task);
        const sent = await sendCardMessage(task.assignedTo.email, card);

        // Log notification
        await prisma.larkNotification.create({
            data: {
                type: NotificationType.TASK_ASSIGNED,
                message: `Task "${task.title}" assigned to ${task.assignedTo.name}`,
                userId: task.assignedTo.id,
                taskId: task.id,
                sent,
                sentAt: sent ? new Date() : null,
            },
        });

        logger.info(`Task assignment notification sent for task ${task.id}`);
    } catch (error) {
        logger.error('Send task assignment notification error:', error);

        // Log failed notification
        await prisma.larkNotification.create({
            data: {
                type: NotificationType.TASK_ASSIGNED,
                message: `Task "${task.title}" assigned to ${task.assignedTo.name}`,
                userId: task.assignedTo.id,
                taskId: task.id,
                sent: false,
                error: String(error),
            },
        });
    }
};

/**
 * Send deadline reminder notification
 */
export const sendDeadlineReminderNotification = async (
    task: Task & { assignedTo: User }
): Promise<void> => {
    try {
        const hoursUntilDeadline = Math.round(
            (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        const message = `⏰ **Task Deadline Reminder**\n\nYour task "${task.title}" is due in ${hoursUntilDeadline} hours!\n\nCurrent status: ${task.status} (${task.progress}%)\n\n👉 Please update your progress soon.`;

        const sent = await sendMessageToUser(task.assignedTo.email, message);

        await prisma.larkNotification.create({
            data: {
                type: NotificationType.DEADLINE_APPROACHING,
                message,
                userId: task.assignedTo.id,
                taskId: task.id,
                sent,
                sentAt: sent ? new Date() : null,
            },
        });

        logger.info(`Deadline reminder sent for task ${task.id}`);
    } catch (error) {
        logger.error('Send deadline reminder error:', error);
    }
};

/**
 * Send task overdue notification
 */
export const sendTaskOverdueNotification = async (
    task: Task & { assignedTo: User }
): Promise<void> => {
    try {
        const message = `🚨 **Task Overdue Alert**\n\nYour task "${task.title}" is now OVERDUE!\n\nDeadline was: ${new Date(task.deadline).toLocaleString('vi-VN')}\nCurrent status: ${task.status} (${task.progress}%)\n\n⚠️ Please update immediately or contact your manager.`;

        const sent = await sendMessageToUser(task.assignedTo.email, message);

        await prisma.larkNotification.create({
            data: {
                type: NotificationType.TASK_OVERDUE,
                message,
                userId: task.assignedTo.id,
                taskId: task.id,
                sent,
                sentAt: sent ? new Date() : null,
            },
        });

        logger.info(`Overdue notification sent for task ${task.id}`);
    } catch (error) {
        logger.error('Send overdue notification error:', error);
    }
};

/**
 * Send status change notification
 */
export const sendStatusChangeNotification = async (
    task: Task & { assignedTo: User; createdBy: User },
    oldStatus: string,
    newStatus: string
): Promise<void> => {
    try {
        // Only notify manager on important status changes
        if (newStatus === 'BLOCKER' || newStatus === 'DONE') {
            const statusEmoji = {
                BLOCKER: '🚫',
                DONE: '✅',
            };

            const message = `${statusEmoji[newStatus as keyof typeof statusEmoji]} **Task Status Changed**\n\n"${task.title}"\n\nAssigned to: ${task.assignedTo.name}\nOld status: ${oldStatus}\nNew status: ${newStatus}\n\n${task.blockerReason ? `Blocker reason: ${task.blockerReason}` : ''}`;

            const sent = await sendMessageToUser(task.createdBy.email, message);

            await prisma.larkNotification.create({
                data: {
                    type: NotificationType.STATUS_CHANGED,
                    message,
                    userId: task.createdBy.id,
                    taskId: task.id,
                    sent,
                    sentAt: sent ? new Date() : null,
                },
            });

            logger.info(`Status change notification sent for task ${task.id}`);
        }
    } catch (error) {
        logger.error('Send status change notification error:', error);
    }
};

/**
 * Send daily report reminder
 */
export const sendDailyReportReminder = async (user: User): Promise<void> => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if report already submitted
        const existingReport = await prisma.dailyReport.findUnique({
            where: {
                userId_date: {
                    userId: user.id,
                    date: new Date(today),
                },
            },
        });

        if (existingReport) {
            return; // Already submitted
        }

        const message = `📝 **Daily Report Reminder**\n\nHi ${user.name}! 👋\n\nPlease submit your daily report for today.\n\nSummary of your tasks:\n- Total tasks: Check your dashboard\n- Pending tasks: Update your progress\n\n👉 Submit your report before end of day.`;

        const sent = await sendMessageToUser(user.email, message);

        await prisma.larkNotification.create({
            data: {
                type: NotificationType.DAILY_REPORT_REMINDER,
                message,
                userId: user.id,
                sent,
                sentAt: sent ? new Date() : null,
            },
        });

        logger.info(`Daily report reminder sent to ${user.email}`);
    } catch (error) {
        logger.error('Send daily report reminder error:', error);
    }
};

/**
 * Create task blocked notification card
 */
const createTaskBlockedCard = (task: Task & { assignedTo: User; createdBy: User }) => {
    return {
        config: {
            wide_screen_mode: true,
        },
        header: {
            title: {
                tag: 'plain_text',
                content: '🚫 Task Blocked - Urgent Attention Required!',
            },
            template: 'red',
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**${task.title}**\n\n⚠️ This task has been marked as BLOCKED`,
                },
            },
            {
                tag: 'hr',
            },
            {
                tag: 'div',
                fields: [
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Assigned to:**\n👤 ${task.assignedTo.name}`,
                        },
                    },
                    {
                        is_short: true,
                        text: {
                            tag: 'lark_md',
                            content: `**Deadline:**\n⏰ ${new Date(task.deadline).toLocaleString('vi-VN')}`,
                        },
                    },
                ],
            },
            {
                tag: 'hr',
            },
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**🔴 Blocker Reason:**\n${task.blockerReason || 'No reason provided'}`,
                },
            },
            ...(task.blockerRelatedTo ? [{
                tag: 'div' as const,
                text: {
                    tag: 'lark_md' as const,
                    content: `**Related Task:**\n${task.blockerRelatedTo}`,
                },
            }] : []),
            {
                tag: 'hr',
            },
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: '⚡ Action Required: Please resolve this blocker as soon as possible to keep the project on track.',
                    },
                ],
            },
        ],
    };
};

/**
 * Send task blocked notification to both assignee and manager
 */
export const sendTaskBlockedNotification = async (
    task: Task & { assignedTo: User; createdBy: User }
): Promise<void> => {
    try {
        const card = createTaskBlockedCard(task);

        // Send to assignee
        const sentToAssignee = await sendCardMessage(task.assignedTo.email, card);

        // Send to manager
        const sentToManager = await sendCardMessage(task.createdBy.email, card);

        // Log notifications
        await prisma.larkNotification.createMany({
            data: [
                {
                    type: NotificationType.STATUS_CHANGED,
                    message: `Task "${task.title}" blocked - sent to assignee`,
                    userId: task.assignedTo.id,
                    taskId: task.id,
                    sent: sentToAssignee,
                    sentAt: sentToAssignee ? new Date() : null,
                },
                {
                    type: NotificationType.STATUS_CHANGED,
                    message: `Task "${task.title}" blocked - sent to manager`,
                    userId: task.createdBy.id,
                    taskId: task.id,
                    sent: sentToManager,
                    sentAt: sentToManager ? new Date() : null,
                },
            ],
        });

        logger.info(`Task blocked notification sent for task ${task.id} to assignee and manager`);
    } catch (error) {
        logger.error('Send task blocked notification error:', error);

        // Log failed notification
        await prisma.larkNotification.create({
            data: {
                type: NotificationType.STATUS_CHANGED,
                message: `Task "${task.title}" blocked notification failed`,
                userId: task.assignedTo.id,
                taskId: task.id,
                sent: false,
                error: String(error),
            },
        });
    }
};

