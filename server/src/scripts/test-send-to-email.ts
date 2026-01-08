import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { sendMessageToUser, sendCardMessage } from '../services/lark/client.js';

/**
 * Simple test to send a message to a specific email
 * Usage: npx tsx src/scripts/test-send-to-email.ts <email>
 */

async function testSendToEmail() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Please provide an email address');
        console.log('Usage: npx tsx src/scripts/test-send-to-email.ts <email>');
        process.exit(1);
    }

    console.log(`🚀 Testing Lark notification to: ${email}\n`);

    try {
        // Test 1: Simple message
        console.log('📋 Test 1: Sending simple message...');
        const message = `🧪 **Test Message**\n\nHi! This is a test notification from DTC Workflow Manager.\n\nTime: ${new Date().toLocaleString('vi-VN')}`;

        const messageSent = await sendMessageToUser(email, message);

        if (messageSent) {
            console.log('✅ Simple message sent successfully!');
        } else {
            console.log('❌ Simple message failed to send');
            console.log('   Check the logs above for details');
        }
        console.log('');

        // Test 2: Card message
        console.log('📋 Test 2: Sending card message...');
        const card = {
            config: {
                wide_screen_mode: true,
            },
            header: {
                title: {
                    tag: 'plain_text',
                    content: '🧪 Test Card',
                },
                template: 'blue',
            },
            elements: [
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**Hello!**\n\nThis is a test card message.`,
                    },
                },
                {
                    tag: 'note',
                    elements: [
                        {
                            tag: 'plain_text',
                            content: 'Testing Lark integration',
                        },
                    ],
                },
            ],
        };

        const cardSent = await sendCardMessage(email, card);

        if (cardSent) {
            console.log('✅ Card message sent successfully!');
        } else {
            console.log('❌ Card message failed to send');
            console.log('   Check the logs above for details');
        }
        console.log('');

        console.log('🎉 Test complete!');
        console.log('\nIf messages failed:');
        console.log('1. Check that the email matches your Lark/Feishu account');
        console.log('2. Verify LARK_APP_ID and LARK_APP_SECRET are correct');
        console.log('3. Ensure the app has required permissions');
        console.log('4. Check that you are in the same organization as the app');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSendToEmail();
