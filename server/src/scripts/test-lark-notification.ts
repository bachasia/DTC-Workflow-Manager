import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { sendMessageToUser, sendCardMessage } from '../services/lark/client.js';
import { sendTaskAssignmentNotification } from '../services/lark/notifications.js';

/**
 * Test script to verify Lark notification integration
 * 
 * This script will:
 * 1. Check Lark configuration
 * 2. Test sending a simple message
 * 3. Test sending a card message
 * 4. Test task assignment notification
 */

async function testLarkIntegration() {
    console.log('🚀 Starting Lark Integration Test...\n');

    try {
        // Step 1: Check Lark configuration
        console.log('📋 Step 1: Checking Lark configuration...');
        const larkAppId = process.env.LARK_APP_ID;
        const larkAppSecret = process.env.LARK_APP_SECRET;

        if (!larkAppId || !larkAppSecret) {
            console.error('❌ Lark credentials not configured!');
            console.log('Please set LARK_APP_ID and LARK_APP_SECRET in .env file');
            return;
        }

        console.log('✅ Lark credentials found');
        console.log(`   App ID: ${larkAppId.substring(0, 8)}...`);
        console.log('');

        // Step 2: Get a test user
        console.log('📋 Step 2: Finding test user...');
        const testUser = await prisma.user.findFirst({
            where: {
                email: {
                    not: ''
                }
            }
        });

        if (!testUser || !testUser.email) {
            console.error('❌ No user found with email address!');
            return;
        }

        console.log(`✅ Test user found: ${testUser.name} (${testUser.email})`);
        console.log('');

        // Step 3: Test simple message
        console.log('📋 Step 3: Testing simple message...');
        const simpleMessage = `🧪 **Test Message from DTC Workflow Manager**\n\nHi ${testUser.name}! This is a test notification.\n\nTimestamp: ${new Date().toLocaleString('vi-VN')}`;

        const messageSent = await sendMessageToUser(testUser.email, simpleMessage);

        if (messageSent) {
            console.log('✅ Simple message sent successfully!');
        } else {
            console.log('⚠️  Simple message failed to send (check logs for details)');
        }
        console.log('');

        // Step 4: Test card message
        console.log('📋 Step 4: Testing card message...');
        const testCard = {
            config: {
                wide_screen_mode: true,
            },
            header: {
                title: {
                    tag: 'plain_text',
                    content: '🧪 Test Card Message',
                },
                template: 'blue',
            },
            elements: [
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**Hello ${testUser.name}!**\n\nThis is a test card message from DTC Workflow Manager.`,
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
                                content: `**Status:**\n✅ Working`,
                            },
                        },
                        {
                            is_short: true,
                            text: {
                                tag: 'lark_md',
                                content: `**Time:**\n⏰ ${new Date().toLocaleString('vi-VN')}`,
                            },
                        },
                    ],
                },
                {
                    tag: 'note',
                    elements: [
                        {
                            tag: 'plain_text',
                            content: 'This is a test notification to verify Lark integration is working correctly.',
                        },
                    ],
                },
            ],
        };

        const cardSent = await sendCardMessage(testUser.email, testCard);

        if (cardSent) {
            console.log('✅ Card message sent successfully!');
        } else {
            console.log('⚠️  Card message failed to send (check logs for details)');
        }
        console.log('');

        // Step 5: Test task assignment notification
        console.log('📋 Step 5: Testing task assignment notification...');

        // Find a manager user for createdBy
        const managerUser = await prisma.user.findFirst({
            where: {
                role: 'MANAGER'
            }
        });

        if (!managerUser) {
            console.log('⚠️  No manager found, skipping task assignment test');
        } else {
            // Find or create a test task
            let testTask = await prisma.task.findFirst({
                where: {
                    assignedToId: testUser.id
                },
                include: {
                    assignedTo: true,
                    createdBy: true
                }
            });

            if (!testTask) {
                // Create a test task
                testTask = await prisma.task.create({
                    data: {
                        title: '🧪 Test Task - Lark Integration',
                        purpose: 'Testing Lark notification integration',
                        description: 'This is a test task created to verify that Lark notifications are working correctly.',
                        assignedToId: testUser.id,
                        createdById: managerUser.id,
                        role: testUser.role,
                        priority: 'MEDIUM',
                        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    },
                    include: {
                        assignedTo: true,
                        createdBy: true
                    }
                });
                console.log(`   Created test task: ${testTask.id}`);
            }

            await sendTaskAssignmentNotification(testTask as any);
            console.log('✅ Task assignment notification sent!');
        }
        console.log('');

        // Step 6: Check notification logs
        console.log('📋 Step 6: Checking notification logs...');
        const recentNotifications = await prisma.larkNotification.findMany({
            where: {
                userId: testUser.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        console.log(`   Found ${recentNotifications.length} recent notifications:`);
        recentNotifications.forEach((notif, index) => {
            const status = notif.sent ? '✅ Sent' : '❌ Failed';
            console.log(`   ${index + 1}. ${status} - ${notif.type} - ${notif.message.substring(0, 50)}...`);
            if (notif.error) {
                console.log(`      Error: ${notif.error}`);
            }
        });
        console.log('');

        console.log('🎉 Lark Integration Test Complete!\n');
        console.log('Summary:');
        console.log(`- Configuration: ✅ Valid`);
        console.log(`- Test User: ${testUser.email}`);
        console.log(`- Simple Message: ${messageSent ? '✅ Sent' : '❌ Failed'}`);
        console.log(`- Card Message: ${cardSent ? '✅ Sent' : '❌ Failed'}`);
        console.log(`\nCheck your Lark/Feishu app to verify you received the messages!`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        logger.error('Lark integration test error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testLarkIntegration();
