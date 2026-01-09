import { sendMessageToUser, sendCardMessage } from '../services/lark/client.js';
import logger from '../lib/logger.js';

/**
 * Test script to send notification to specific email
 */

async function sendTestNotification() {
    const targetEmail = 'bakvnn@gmail.com';

    console.log(`🚀 Sending test notification to ${targetEmail}...\n`);

    try {
        // Send simple message
        console.log('📋 Step 1: Sending simple message...');
        const simpleMessage = `🧪 **Test Message from DTC Workflow Manager**\n\nHello! This is a test notification.\n\nTimestamp: ${new Date().toLocaleString('vi-VN')}`;

        const messageSent = await sendMessageToUser(targetEmail, simpleMessage);

        if (messageSent) {
            console.log('✅ Simple message sent successfully!');
        } else {
            console.log('⚠️  Simple message failed to send (check logs for details)');
        }
        console.log('');

        // Send card message
        console.log('📋 Step 2: Sending card message...');
        const testCard = {
            config: {
                wide_screen_mode: true,
            },
            header: {
                title: {
                    tag: 'plain_text',
                    content: '🧪 Test Notification',
                },
                template: 'blue',
            },
            elements: [
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**Hello!**\n\nThis is a test card message from DTC Workflow Manager.\n\nSent to: ${targetEmail}`,
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

        const cardSent = await sendCardMessage(targetEmail, testCard);

        if (cardSent) {
            console.log('✅ Card message sent successfully!');
        } else {
            console.log('⚠️  Card message failed to send (check logs for details)');
        }
        console.log('');

        console.log('🎉 Test Complete!\n');
        console.log('Summary:');
        console.log(`- Target Email: ${targetEmail}`);
        console.log(`- Simple Message: ${messageSent ? '✅ Sent' : '❌ Failed'}`);
        console.log(`- Card Message: ${cardSent ? '✅ Sent' : '❌ Failed'}`);
        console.log(`\nCheck your Lark/Feishu app to verify you received the messages!`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        logger.error('Test notification error:', error);
    }
}

// Run the test
sendTestNotification();
