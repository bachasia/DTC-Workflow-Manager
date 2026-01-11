import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import crypto from 'crypto';

const router = Router();

// Encryption key - in production, this should be from environment variable
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'dtc-workflow-manager-secret-key-32b';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * GET /api/settings
 * Get current user's settings
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user || !user.settings) {
            res.json({ settings: {} });
            return;
        }

        const settings = user.settings as any;

        // Decrypt API key if it exists
        if (settings.geminiApiKey) {
            try {
                settings.geminiApiKey = decrypt(settings.geminiApiKey);
            } catch (error) {
                logger.error('Failed to decrypt API key:', error);
                settings.geminiApiKey = '';
            }
        }

        res.json({ settings });
    } catch (error) {
        logger.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * PATCH /api/settings
 * Update user settings
 */
router.patch('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { geminiApiKey } = req.body;

        const settings: any = {};

        // Encrypt API key if provided
        if (geminiApiKey) {
            if (typeof geminiApiKey !== 'string' || geminiApiKey.trim().length === 0) {
                res.status(400).json({ error: 'Invalid API key format' });
                return;
            }
            settings.geminiApiKey = encrypt(geminiApiKey.trim());
        }

        // Update user settings
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { settings }
        });

        logger.info(`Settings updated for user ${req.user!.email}`);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        logger.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
