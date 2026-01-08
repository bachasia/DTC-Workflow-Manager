import * as lark from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Test Lark API with specific email
 */

async function testLarkEmail() {
    const email = process.argv[2] || 'mr.ngohoan@outlook.com';

    console.log('🔍 Testing Lark API with email:', email);
    console.log('');

    // Check credentials
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;

    console.log('📋 Credentials:');
    console.log(`   LARK_APP_ID: ${appId ? appId.substring(0, 10) + '...' : '❌ NOT SET'}`);
    console.log(`   LARK_APP_SECRET: ${appSecret ? '✅ SET' : '❌ NOT SET'}`);
    console.log('');

    if (!appId || !appSecret) {
        console.error('❌ Lark credentials not configured!');
        console.log('Please check your .env file in server directory');
        return;
    }

    try {
        // Create client
        const client = new lark.Client({
            appId,
            appSecret,
            appType: lark.AppType.SelfBuild,
            domain: lark.Domain.Feishu,
        });

        console.log('🔄 Calling Lark API to lookup email...');

        // Try to get user by email
        const userRes = await client.contact.user.batchGetId({
            data: {
                emails: [email],
            },
        });

        console.log('');
        console.log('📊 API Response:');
        console.log('   Code:', userRes.code);
        console.log('   Message:', userRes.msg);
        console.log('');

        if (userRes.code === 0) {
            if (userRes.data?.user_list && userRes.data.user_list.length > 0) {
                console.log('✅ User found in Lark organization!');
                console.log('');

                const user = userRes.data.user_list[0];
                console.log('User Details:');
                console.log('   Email:', (user as any).email);
                console.log('   User ID:', (user as any).user_id || 'N/A');
                console.log('   Open ID:', (user as any).open_id || 'N/A');
                console.log('   Union ID:', (user as any).union_id || 'N/A');
                console.log('');
                console.log('🎉 You can send notifications to this email!');
            } else {
                console.log('❌ Email NOT found in Lark organization');
                console.log('');
                console.log('Possible reasons:');
                console.log('1. Email does not belong to any user in your organization');
                console.log('2. User has not activated their Lark account');
                console.log('3. Email is not the primary email in Lark profile');
                console.log('');
                console.log('💡 Solutions:');
                console.log('1. Check Lark Admin Console for actual member emails');
                console.log('2. Invite this email to your Lark organization');
                console.log('3. Use an email that already exists in the organization');
            }
        } else {
            console.log('❌ API Error:', userRes.msg);
        }

    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    }
}

testLarkEmail();
