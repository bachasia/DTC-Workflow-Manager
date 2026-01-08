import prisma from '../lib/prisma.js';

/**
 * Check Lark notification logs
 */

async function checkNotificationLogs() {
    console.log('📊 Checking Lark Notification Logs...\n');

    try {
        // Get all notifications
        const notifications = await prisma.larkNotification.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 20,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                task: {
                    select: {
                        title: true
                    }
                }
            }
        });

        if (notifications.length === 0) {
            console.log('❌ No notifications found in database');
            return;
        }

        console.log(`Found ${notifications.length} notifications:\n`);

        notifications.forEach((notif, index) => {
            const status = notif.sent ? '✅ Sent' : '❌ Failed';
            const sentAt = notif.sentAt ? new Date(notif.sentAt).toLocaleString('vi-VN') : 'N/A';

            console.log(`${index + 1}. ${status} | ${notif.type}`);
            console.log(`   User: ${notif.user.name} (${notif.user.email})`);
            console.log(`   Message: ${notif.message.substring(0, 80)}...`);
            if (notif.task) {
                console.log(`   Task: ${notif.task.title}`);
            }
            console.log(`   Sent at: ${sentAt}`);
            if (notif.error) {
                console.log(`   ❌ Error: ${notif.error}`);
            }
            console.log('');
        });

        // Summary
        const sentCount = notifications.filter(n => n.sent).length;
        const failedCount = notifications.filter(n => !n.sent).length;

        console.log('Summary:');
        console.log(`✅ Successfully sent: ${sentCount}`);
        console.log(`❌ Failed: ${failedCount}`);
        console.log(`📊 Total: ${notifications.length}`);

    } catch (error) {
        console.error('❌ Error checking logs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkNotificationLogs();
