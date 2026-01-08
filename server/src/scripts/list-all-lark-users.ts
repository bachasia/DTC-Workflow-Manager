import { getLarkClient } from '../services/lark/client.js';
import prisma from '../lib/prisma.js';

/**
 * List all users in Lark organization
 * This helps you find which emails actually exist in your Lark org
 */

async function listAllLarkUsers() {
    console.log('🔍 Fetching all users from Lark organization...\n');

    try {
        const client = getLarkClient();

        // Method 1: Try to get department users (most common)
        console.log('📋 Attempting to fetch organization users...\n');

        try {
            // Get root department ID first
            const deptRes = await client.contact.department.list({
                params: {
                    fetch_child: true,
                    page_size: 50,
                },
            });

            if (deptRes.data?.items && deptRes.data.items.length > 0) {
                console.log(`✅ Found ${deptRes.data.items.length} departments\n`);

                // Get users from each department
                for (const dept of deptRes.data.items) {
                    const deptId = (dept as any).department_id || (dept as any).open_department_id;
                    const deptName = (dept as any).name;

                    console.log(`📁 Department: ${deptName} (${deptId})`);

                    try {
                        const userRes = await client.contact.user.findByDepartment({
                            params: {
                                department_id: deptId,
                                page_size: 50,
                            },
                        });

                        if (userRes.data?.items && userRes.data.items.length > 0) {
                            console.log(`   Found ${userRes.data.items.length} users:`);

                            for (const user of userRes.data.items) {
                                const name = (user as any).name;
                                const email = (user as any).email || (user as any).enterprise_email;
                                const userId = (user as any).user_id;
                                const openId = (user as any).open_id;

                                console.log(`   👤 ${name}`);
                                console.log(`      Email: ${email || 'N/A'}`);
                                console.log(`      User ID: ${userId || 'N/A'}`);
                                console.log(`      Open ID: ${openId || 'N/A'}`);
                                console.log('');
                            }
                        } else {
                            console.log('   No users found in this department\n');
                        }
                    } catch (error) {
                        console.log(`   ⚠️  Could not fetch users: ${error instanceof Error ? error.message : String(error)}\n`);
                    }
                }
            } else {
                console.log('⚠️  No departments found or insufficient permissions\n');
            }
        } catch (error) {
            console.log('⚠️  Could not fetch departments:', error instanceof Error ? error.message : String(error));
            console.log('\nThis might be due to insufficient permissions.');
            console.log('Required permission: contact:contact:readonly or contact:department.user:readonly\n');
        }

        // Compare with database users
        console.log('\n📊 Comparing with database users...\n');
        const dbUsers = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                role: true,
            },
        });

        console.log(`Database has ${dbUsers.length} users:`);
        for (const user of dbUsers) {
            console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
        }

        console.log('\n💡 Next Steps:');
        console.log('1. If you see Lark users above, update your database emails to match');
        console.log('2. If no Lark users shown, you may need additional permissions:');
        console.log('   - contact:contact:readonly');
        console.log('   - contact:department.user:readonly');
        console.log('3. Alternatively, check Lark Admin Console: https://feishu.cn/admin');
        console.log('4. Or invite your database users to the Lark organization');

    } catch (error) {
        console.error('\n❌ Error:', error);
        console.log('\n💡 Alternative methods:');
        console.log('1. Check Lark Admin Console: https://feishu.cn/admin');
        console.log('2. Go to 通讯录 (Address Book) → 成员管理 (Member Management)');
        console.log('3. Export the member list to see all emails');
    } finally {
        await prisma.$disconnect();
    }
}

listAllLarkUsers();
