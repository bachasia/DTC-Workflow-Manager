import prisma from '../lib/prisma.js';

async function checkLarkErrors() {
    try {
        const notifs = await prisma.larkNotification.findMany({
            where: {
                user: {
                    email: 'mr.ngohoan@outlook.com'
                },
                error: {
                    not: null
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        console.log('=== NOTIFICATIONS WITH ERRORS ===\n');

        if (notifs.length === 0) {
            console.log('No notifications with errors found.');
        } else {
            notifs.forEach((n, index) => {
                console.log(`${index + 1}. ${n.message}`);
                console.log(`   Error: ${n.error}`);
                console.log(`   Created: ${n.createdAt.toLocaleString()}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLarkErrors();
