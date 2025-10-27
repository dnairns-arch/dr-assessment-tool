import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { loginSchema, registerSchema, refreshTokenSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new AuthController();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user and organization
 *     description: Creates a new user account and organization. The first user becomes ORG_ADMIN.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, organizationName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *                 description: Must contain uppercase, lowercase, and number
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               organizationName:
 *                 type: string
 *                 example: Acme Corporation
 *     responses:
 *       201:
 *         description: User and organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (15min expiry)
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token (7 days expiry)
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [SUPER_ADMIN, ORG_ADMIN, ASSESSOR, VIEWER]
 *                         organization:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User with email already exists
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  (req, res, next) => controller.register(req, res).catch(next)
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Authenticates user and returns access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts (5 per 15 minutes)
 */
router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema),
  (req, res, next) => controller.login(req, res).catch(next)
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token from login/register
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  (req, res, next) => controller.refresh(req, res).catch(next)
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Logout user (primarily client-side token removal)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, (req, res, next) => controller.logout(req, res).catch(next));

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile and organization details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     mfaEnabled:
 *                       type: boolean
 *                     organization:
 *                       type: object
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, (req, res, next) => controller.me(req, res).catch(next));

export default router;
