import { Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse, JWTPayload } from '@dr-assessment/shared';

export class AuthController {
  /**
   * Register new user and organization
   */
  async register(req: AuthRequest, res: Response) {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization with branding
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          brandingConfig: {
            create: {
              primaryColor: '#0066cc',
              secondaryColor: '#333333',
              accentColor: '#ff6600',
              fontFamily: 'Inter, sans-serif'
            }
          }
        },
        include: { brandingConfig: true }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'ORG_ADMIN', // First user is admin
          organizationId: organization.id
        },
        include: { organization: true }
      });

      return { user, organization };
    });

    // Generate tokens
    const payload: JWTPayload = {
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.user.organizationId,
      role: result.user.role
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          organization: {
            id: result.organization.id,
            name: result.organization.name
          }
        }
      },
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Login user
   */
  async login(req: AuthRequest, res: Response) {
    const { email, password } = req.body;

    // Find user with organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: {
            id: user.organization.id,
            name: user.organization.name
          }
        }
      },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Refresh access token
   */
  async refresh(req: AuthRequest, res: Response) {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get user to ensure still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    };
    const accessToken = generateAccessToken(newPayload);

    const response: ApiResponse = {
      success: true,
      data: { accessToken },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Logout (client-side token removal, optional server-side blacklist)
   */
  async logout(req: AuthRequest, res: Response) {
    // In a JWT system, logout is typically handled client-side
    // Optionally implement token blacklist with Redis here

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Get current user profile
   */
  async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: { include: { brandingConfig: true } } }
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          branding: user.organization.brandingConfig
        }
      },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
