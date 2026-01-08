import { getLarkClient } from '../services/lark/client.js';

/**
 * Simple test: Get your own user info from Lark
 * This will show you the format of emails in your organization
 */

async function getMyInfo() {
    console.log('🔍 Getting current user info from Lark...\n');

    try {
        const client = getLarkClient();

        // Try to get current app info
        const appInfo = await client.auth.tenantAccessToken.internal({
            data: {
                app_id: process.env.LARK_APP_ID || '',
                app_secret: process.env.LARK_APP_SECRET || '',
            },
        });

        if (appInfo.code === 0) {
            console.log('✅ App authenticated successfully!');
            console.log(`   Tenant Access Token: ${(appInfo as any).tenant_access_token?.substring(0, 20)}...`);
            console.log('');
        }

        console.log('💡 To find emails in your organization:');
        console.log('');
        console.log('1. Go to Lark Admin Console:');
        console.log('   https://feishu.cn/admin (China)');
        console.log('   https://www.larksuite.com/admin (International)');
        console.log('');
        console.log('2. Navigate to: 通讯录 → 成员管理');
        console.log('   (Address Book → Member Management)');
        console.log('');
        console.log('3. You will see all members with their emails');
        console.log('');
        console.log('4. Common email formats in organizations:');
        console.log('   - name@company.com');
        console.log('   - firstname.lastname@company.com');
        console.log('   - username@feishu.cn');
        console.log('');
        console.log('5. Once you find an email, test with:');
        console.log('   npx tsx src/scripts/test-send-to-email.ts <email>');

    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    }
}

getMyInfo();
