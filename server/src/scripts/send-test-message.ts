import * as lark from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Test sending actual message to Lark user
 */

async function sendTestMessage() {
    const email = process.argv[2] || 'mr.ngohoan@outlook.com';

    console.log('🚀 Sending test message to:', email);
    console.log('');

    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;

    if (!appId || !appSecret) {
        console.error('❌ Lark credentials not configured!');
        return;
    }

    try {
        const client = new lark.Client({
            appId,
            appSecret,
            appType: lark.AppType.SelfBuild,
            domain: lark.Domain.Feishu,
        });

        // Step 1: Get user ID
        console.log('📋 Step 1: Getting user ID...');
        const userRes = await client.contact.user.batchGetId({
            data: {
                emails: [email],
            },
        });

        if (!userRes.data?.user_list || userRes.data.user_list.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const userId = (userRes.data.user_list[0] as any).user_id;
        console.log(`✅ Found user ID: ${userId}`);
        console.log('');

        // Step 2: Send message
        console.log('📋 Step 2: Sending message...');
        const messageRes = await client.im.message.create({
            params: {
                receive_id_type: 'user_id',
            },
            data: {
                receive_id: userId,
                msg_type: 'text',
                content: JSON.stringify({
                    text: `🧪 Test Message from DTC Workflow Manager\n\nHi! This is a test notification.\n\nTime: ${new Date().toLocaleString('vi-VN')}`,
                }),
            },
        });

        console.log('Response Code:', messageRes.code);
        console.log('Response Message:', messageRes.msg);
        console.log('');

        if (messageRes.code === 0) {
            console.log('✅ Message sent successfully!');
            console.log('Message ID:', (messageRes.data as any)?.message_id);
            console.log('');
            console.log('🎉 Check your Lark/Feishu app to see the message!');
        } else {
            console.log('❌ Failed to send message');
            console.log('Full response:', JSON.stringify(messageRes, null, 2));
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message || String(error));
        if (error.response) {
            console.log('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

sendTestMessage();
