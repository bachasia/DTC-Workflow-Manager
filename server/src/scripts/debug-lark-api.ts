import { getLarkClient } from '../services/lark/client.js';

/**
 * Debug: Show raw response from Lark API
 */

async function debugLarkUser() {
    const email = process.argv[2] || 'bakvnn@gmail.com';

    console.log(`🔍 Debugging Lark API for: ${email}\n`);

    try {
        const client = getLarkClient();

        const userRes = await client.contact.user.batchGetId({
            data: {
                emails: [email],
            },
        });

        console.log('📋 Full API Response:');
        console.log(JSON.stringify(userRes, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugLarkUser();
