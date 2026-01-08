import { getLarkClient } from '../services/lark/client.js';
import prisma from '../lib/prisma.js';

/**
 * List all users in Lark organization and check which emails from DB exist
 */

async function listLarkUsers() {
    console.log('🔍 Checking Lark Users...\n');

    try {
        const client = getLarkClient();

        // Get all users from database
        const dbUsers = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                role: true
            }
        });

        console.log(`📊 Found ${dbUsers.length} users in database:\n`);

        for (const user of dbUsers) {
            console.log(`Testing: ${user.name} (${user.email})`);

            try {
                // Try to get user ID from Lark
                const userRes = await client.contact.user.batchGetId({
                    data: {
                        emails: [user.email],
                    },
                });

                if (userRes.data?.user_list && userRes.data.user_list.length > 0) {
                    const larkUser = userRes.data.user_list[0];
                    console.log(`  ✅ Found in Lark!`);
                    console.log(`     User ID: ${larkUser.user_id}`);
                    console.log(`     Open ID: ${larkUser.open_id || 'N/A'}`);
                    console.log(`     Union ID: ${larkUser.union_id || 'N/A'}`);
                } else {
                    console.log(`  ❌ NOT found in Lark organization`);
                }
            } catch (error) {
                console.log(`  ❌ Error checking: ${error instanceof Error ? error.message : String(error)}`);
            }
            console.log('');
        }

        console.log('\n💡 Tips:');
        console.log('- Users must be in the same Lark/Feishu organization as the app');
        console.log('- Email in database must match exactly with Lark account email');
        console.log('- Users must have activated their Lark/Feishu account');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listLarkUsers();
