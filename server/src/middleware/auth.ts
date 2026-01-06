import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
    };
}

// JWT payload interface
interface JWTPayload {
    id: string;
    email: string;
    role: Role;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, secret) as JWTPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
            return;
        }

        next();
    };
};

/**
 * Middleware to check if user is Manager
 */
export const requireManager = authorize(Role.MANAGER);

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: JWTPayload): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(user, secret, { expiresIn });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user: JWTPayload): string => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET not configured');
    }

    return jwt.sign(user, secret, { expiresIn });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET not configured');
    }

    return jwt.verify(token, secret) as JWTPayload;
};
