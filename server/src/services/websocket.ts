import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import logger from '../lib/logger.js';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    userEmail?: string;
}

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export const initializeWebSocket = (server: Server): void => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
        logger.info('New WebSocket connection attempt');

        // Extract token from query params
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            ws.close(1008, 'No authentication token provided');
            return;
        }

        try {
            // Verify JWT token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }

            const decoded = jwt.verify(token, secret) as { id: string; email: string };
            ws.userId = decoded.id;
            ws.userEmail = decoded.email;

            logger.info(`WebSocket authenticated: ${decoded.email}`);

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'WebSocket connection established',
                userId: decoded.id,
            }));

            // Handle incoming messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    handleWebSocketMessage(ws, message);
                } catch (error) {
                    logger.error('WebSocket message parse error:', error);
                }
            });

            // Handle disconnect
            ws.on('close', () => {
                logger.info(`WebSocket disconnected: ${decoded.email}`);
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
            });

        } catch (error) {
            logger.error('WebSocket authentication failed:', error);
            ws.close(1008, 'Authentication failed');
        }
    });

    logger.info('✅ WebSocket server initialized');
};

/**
 * Handle incoming WebSocket messages
 */
const handleWebSocketMessage = (ws: AuthenticatedWebSocket, message: any): void => {
    switch (message.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'subscribe':
            // Client can subscribe to specific channels
            logger.info(`User ${ws.userEmail} subscribed to ${message.channel}`);
            break;

        default:
            logger.warn(`Unknown WebSocket message type: ${message.type}`);
    }
};

/**
 * Broadcast message to all connected clients
 */
export const broadcastToAll = (message: any): void => {
    if (!wss) {
        logger.warn('WebSocket server not initialized');
        return;
    }

    const payload = JSON.stringify(message);
    let sentCount = 0;

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
            sentCount++;
        }
    });

    logger.info(`Broadcast sent to ${sentCount} clients`);
};

/**
 * Send message to specific user
 */
export const sendToUser = (userId: string, message: any): void => {
    if (!wss) {
        logger.warn('WebSocket server not initialized');
        return;
    }

    const payload = JSON.stringify(message);
    let sent = false;

    wss.clients.forEach((client) => {
        const authClient = client as AuthenticatedWebSocket;
        if (authClient.userId === userId && client.readyState === WebSocket.OPEN) {
            client.send(payload);
            sent = true;
        }
    });

    if (sent) {
        logger.info(`Message sent to user ${userId}`);
    } else {
        logger.warn(`User ${userId} not connected via WebSocket`);
    }
};

/**
 * Notify about task update
 */
export const notifyTaskUpdate = (task: any, action: 'created' | 'updated' | 'deleted'): void => {
    broadcastToAll({
        type: 'task_update',
        action,
        task,
        timestamp: Date.now(),
    });
};

/**
 * Notify about new daily report
 */
export const notifyReportSubmitted = (report: any): void => {
    broadcastToAll({
        type: 'report_submitted',
        report,
        timestamp: Date.now(),
    });
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = (): number => {
    if (!wss) return 0;
    return wss.clients.size;
};
