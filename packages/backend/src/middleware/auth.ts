import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { JWTPayload, UserRole } from '@dr-assessment/shared';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
    }
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'Insufficient permissions to access this resource')
      );
    }

    next();
  };
}

// Middleware to extract organization ID from authenticated user
export function attachOrganizationId(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user) {
    // Attach to request for easy access
    (req as any).organizationId = req.user.organizationId;
  }
  next();
}
