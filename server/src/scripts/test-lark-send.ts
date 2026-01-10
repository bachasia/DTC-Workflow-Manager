import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Force load .env from current directory
const envPath = path.resolve(process.cwd(), '.env');
console.log('Current working directory:', process.cwd());
console.log('Looking for .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('❌ Error loading .env:', result.error);
    } else {
        console.log('✅ .env loaded successfully');
    }
} else {
    console.error('❌ .env file NOT found');
}

import { sendCardMessage } from '../services/lark/client.js';

async function testLarkSend() {
    console.log('\n=== ENVIROMENT CHECK ===');
    console.log('LARK_APP_ID:', process.env.LARK_APP_ID ? 'Set ✅' : 'Missing ❌');
    console.log('LARK_APP_SECRET:', process.env.LARK_APP_SECRET ? 'Set ✅' : 'Missing ❌');

    console.log('\n=== TESTING LARK SEND ===');

    // ... rest of the code ...
    const testEmail = 'mr.ngohoan@outlook.com';

    const testCard = {
        config: { wide_screen_mode: true },
        header: {
            title: { tag: 'plain_text', content: '🧪 Test Notification' },
            template: 'blue',
        },
        elements: [
            {
                tag: 'div',
                text: { tag: 'lark_md', content: '**Success!** Environment variables are working.' },
            },
        ],
    };

    console.log(`Sending to: ${testEmail}...`);

    try {
        const result = await sendCardMessage(testEmail, testCard);

        if (result) {
            console.log('✅ SUCCESS: Message sent!');
        } else {
            console.log('❌ FAILED: returned false');
        }
    } catch (error) {
        console.log('❌ ERROR:', error);
    }
}

testLarkSend();
