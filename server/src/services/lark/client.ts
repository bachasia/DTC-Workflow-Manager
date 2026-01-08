import * as lark from '@larksuiteoapi/node-sdk';
import logger from '../../lib/logger.js';

// Initialize Lark client
const client = new lark.Client({
    appId: process.env.LARK_APP_ID || '',
    appSecret: process.env.LARK_APP_SECRET || '',
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Feishu, // Use Feishu for China, Lark for international
});

/**
 * Get Lark client instance
 */
export const getLarkClient = () => {
    if (!process.env.LARK_APP_ID || !process.env.LARK_APP_SECRET) {
        logger.warn('Lark credentials not configured');
    }
    return client;
};

/**
 * Send message to user by email
 */
export const sendMessageToUser = async (
    userEmail: string,
    messageContent: string
): Promise<boolean> => {
    try {
        // Get user's open_id by email
        const userRes = await client.contact.user.batchGetId({
            data: {
                emails: [userEmail],
            },
        });

        if (!userRes.data?.user_list || userRes.data.user_list.length === 0) {
            logger.warn(`Lark user not found for email: ${userEmail}`);
            return false;
        }

        const userId = userRes.data.user_list[0].user_id;

        // Send message
        const messageRes = await client.im.message.create({
            params: {
                receive_id_type: 'user_id',
            },
            data: {
                receive_id: userId,
                msg_type: 'text',
                content: JSON.stringify({
                    text: messageContent,
                }),
            },
        });

        if (messageRes.code === 0) {
            logger.info(`Lark message sent to ${userEmail}`);
            return true;
        } else {
            logger.error(`Failed to send Lark message: ${messageRes.msg}`);
            return false;
        }
    } catch (error) {
        logger.error('Lark send message error:', error);
        return false;
    }
};

/**
 * Send interactive card message
 */
export const sendCardMessage = async (
    userEmail: string,
    card: any
): Promise<boolean> => {
    try {
        const userRes = await client.contact.user.batchGetId({
            data: {
                emails: [userEmail],
            },
        });

        if (!userRes.data?.user_list || userRes.data.user_list.length === 0) {
            logger.warn(`Lark user not found for email: ${userEmail}`);
            return false;
        }

        const userId = userRes.data.user_list[0].user_id;

        const messageRes = await client.im.message.create({
            params: {
                receive_id_type: 'user_id',
            },
            data: {
                receive_id: userId,
                msg_type: 'interactive',
                content: JSON.stringify(card),
            },
        });

        if (messageRes.code === 0) {
            logger.info(`Lark card message sent to ${userEmail}`);
            return true;
        } else {
            logger.error(`Failed to send Lark card: ${messageRes.msg}`);
            return false;
        }
    } catch (error) {
        logger.error('Lark send card error:', error);
        return false;
    }
};

/**
 * Send message to group chat
 */
export const sendMessageToGroup = async (
    chatId: string,
    messageContent: string
): Promise<boolean> => {
    try {
        const messageRes = await client.im.message.create({
            params: {
                receive_id_type: 'chat_id',
            },
            data: {
                receive_id: chatId,
                msg_type: 'text',
                content: JSON.stringify({
                    text: messageContent,
                }),
            },
        });

        if (messageRes.code === 0) {
            logger.info(`Lark message sent to group ${chatId}`);
            return true;
        } else {
            logger.error(`Failed to send group message: ${messageRes.msg}`);
            return false;
        }
    } catch (error) {
        logger.error('Lark send group message error:', error);
        return false;
    }
};

export default client;
