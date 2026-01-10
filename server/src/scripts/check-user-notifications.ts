import prisma from '../lib/prisma.js';

async function checkNotifications() {
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: 'mr.ngohoan@outlook.com' }
        });

        console.log('=== USER INFO ===');
        if (user) {
            console.log(`Found user: ${user.name} (${user.email})`);
            console.log(`Role: ${user.role}`);
            console.log(`ID: ${user.id}`);
        } else {
            console.log('User not found!');
            await prisma.$disconnect();
            return;
        }

        // Find notifications
        console.log('\n=== NOTIFICATIONS ===');
        const notifications = await prisma.larkNotification.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20,
            include: {
                task: {
                    select: {
                        title: true,
                        status: true
                    }
                }
            }
        });

        console.log(`Total notifications: ${notifications.length}\n`);

        console.log(`\nTotal notifications: ${notifications.length}\n`);

        notifications.forEach((notif, index) => {
            const time = notif.createdAt.toLocaleTimeString();
            console.log(`${index + 1}. [${time}] Sent: ${notif.sent ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   Task: ${notif.task?.title}`);
            if (notif.error) console.log(`   Error: ${notif.error}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotifications();
