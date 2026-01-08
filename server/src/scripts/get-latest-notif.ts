import prisma from '../lib/prisma.js';

async function getLatestNotification() {
    const notif = await prisma.larkNotification.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            },
            task: {
                select: {
                    title: true,
                    status: true
                }
            }
        }
    });

    console.log(JSON.stringify(notif, null, 2));
    await prisma.$disconnect();
}

getLatestNotification();
