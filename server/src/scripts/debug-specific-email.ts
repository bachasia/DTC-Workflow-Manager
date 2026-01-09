import { sendMessageToUser, sendCardMessage } from '../services/lark/client.js';
import logger from '../lib/logger.js';
import * as lark from '@larksuiteoapi/node-sdk';

/**
 * Debug script to check Lark user and send notification
 */

async function debugAndSendNotification() {
    const targetEmail = 'bakvnn@gmail.com';

    console.log(`🔍 Debugging Lark notification for ${targetEmail}...\n`);

    try {
        // Initialize Lark client
        const client = new lark.Client({
            appId: process.env.LARK_APP_ID,
            appSecret: process.env.LARK_APP_SECRET,
            appType: lark.AppType.SelfBuild,
            domain: lark.Domain.Feishu,
        });

        console.log('📋 Step 1: Checking Lark configuration...');
        console.log(`   App ID: ${process.env.LARK_APP_ID?.substring(0, 8)}...`);
        console.log('');

        // Try to find user by email
        console.log('📋 Step 2: Looking up user by email...');
        try {
            const userResponse = await client.contact.user.batchGetId({
                data: {
                    emails: [targetEmail],
                },
            });

            console.log('   API Response:', JSON.stringify(userResponse, null, 2));

            if (userResponse.data?.user_list && userResponse.data.user_list.length > 0) {
                const userId = userResponse.data.user_list[0].user_id;
                console.log(`   ✅ Found user ID: ${userId}`);
                console.log('');

                // Try to send message directly to user ID
                console.log('📋 Step 3: Sending message to user ID...');
                const messageResponse = await client.im.message.create({
                    params: {
                        receive_id_type: 'user_id',
                    },
                    data: {
                        receive_id: userId,
                        msg_type: 'text',
                        content: JSON.stringify({
                            text: `🧪 Test message from DTC Workflow Manager\n\nHello! This is a debug test.\n\nTime: ${new Date().toLocaleString('vi-VN')}`,
                        }),
                    },
                });

                console.log('   Message Response:', JSON.stringify(messageResponse, null, 2));

                if (messageResponse.code === 0) {
                    console.log('   ✅ Message sent successfully!');
                } else {
                    console.log(`   ❌ Failed to send message. Code: ${messageResponse.code}, Message: ${messageResponse.msg}`);
                }
            } else {
                console.log(`   ❌ User not found with email: ${targetEmail}`);
                console.log('   Possible reasons:');
                console.log('   - Email is not registered in Lark organization');
                console.log('   - Email does not match Lark account email');
                console.log('   - Bot does not have permission to access user info');
            }
        } catch (error: any) {
            console.log('   ❌ Error looking up user:', error.message);
            console.log('   Full error:', JSON.stringify(error, null, 2));
        }

        console.log('');
        console.log('📋 Step 4: Trying alternative method (sendMessageToUser)...');
        const sent = await sendMessageToUser(targetEmail, `Test from debug script at ${new Date().toLocaleString('vi-VN')}`);
        console.log(`   Result: ${sent ? '✅ Sent' : '❌ Failed'}`);

    } catch (error: any) {
        console.error('❌ Debug failed with error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        logger.error('Debug notification error:', error);
    }
}

// Run the debug
debugAndSendNotification();
