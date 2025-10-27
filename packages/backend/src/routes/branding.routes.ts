import { Router } from 'express';
import { BrandingController } from '../controllers/branding.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createBrandingSchema, updateBrandingSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new BrandingController();

/**
 * @openapi
 * /api/branding/domain/{domain}:
 *   get:
 *     tags: [Branding]
 *     summary: Get branding by domain (public endpoint)
 *     description: Returns branding configuration for a given domain. Supports both custom domains and subdomains. Used for white-label functionality.
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         example: "acme.example.com"
 *         description: "Custom domain or subdomain to lookup"
 *     responses:
 *       200:
 *         description: Branding configuration
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
 *                     organizationName:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     faviconUrl:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     accentColor:
 *                       type: string
 *                     fontFamily:
 *                       type: string
 *       400:
 *         description: Domain parameter is required
 */
router.get('/branding/domain/:domain', (req, res, next) =>
  controller.getByDomain(req, res).catch(next)
);

/**
 * @openapi
 * /api/branding:
 *   get:
 *     tags: [Branding]
 *     summary: Get current organization's branding
 *     description: Returns the branding configuration for the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding configuration
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
 *                     organizationName:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     faviconUrl:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                       pattern: "^#[0-9A-Fa-f]{6}$"
 *                     secondaryColor:
 *                       type: string
 *                       pattern: "^#[0-9A-Fa-f]{6}$"
 *                     accentColor:
 *                       type: string
 *                       pattern: "^#[0-9A-Fa-f]{6}$"
 *                     fontFamily:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                       format: email
 *                     contactPhone:
 *                       type: string
 *                     website:
 *                       type: string
 *                       format: uri
 *                     pdfFooter:
 *                       type: string
 *                     emailSignature:
 *                       type: string
 *       404:
 *         description: Organization not found
 */
router.get('/branding', authenticate, (req, res, next) => controller.getCurrent(req, res).catch(next));

/**
 * @openapi
 * /api/branding:
 *   put:
 *     tags: [Branding]
 *     summary: Create or update branding configuration
 *     description: Creates or updates branding configuration for the current organization. Only ADMIN or SUPER_ADMIN can modify.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [primaryColor, secondaryColor, accentColor, fontFamily]
 *             properties:
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               faviconUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/favicon.ico"
 *               primaryColor:
 *                 type: string
 *                 pattern: "^#[0-9A-Fa-f]{6}$"
 *                 example: "#0066CC"
 *               secondaryColor:
 *                 type: string
 *                 pattern: "^#[0-9A-Fa-f]{6}$"
 *                 example: "#333333"
 *               accentColor:
 *                 type: string
 *                 pattern: "^#[0-9A-Fa-f]{6}$"
 *                 example: "#FF6600"
 *               fontFamily:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Inter, sans-serif"
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: "contact@acme.com"
 *               contactPhone:
 *                 type: string
 *                 maxLength: 50
 *                 example: "+1-555-0123"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "https://acme.com"
 *               pdfFooter:
 *                 type: string
 *                 maxLength: 500
 *                 example: "© 2025 Acme Corp. All rights reserved."
 *               emailSignature:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Best regards,\nThe Acme Team"
 *     responses:
 *       200:
 *         description: Branding updated successfully
 *       201:
 *         description: Branding created successfully
 *       403:
 *         description: Only admins can modify branding
 */
router.put('/branding', authenticate, validateRequest(updateBrandingSchema), (req, res, next) =>
  controller.createOrUpdate(req, res).catch(next)
);

/**
 * @openapi
 * /api/branding:
 *   delete:
 *     tags: [Branding]
 *     summary: Delete branding configuration
 *     description: Deletes the branding configuration for the current organization, reverting to default. Only ADMIN or SUPER_ADMIN can delete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding deleted successfully, reverted to default
 *       403:
 *         description: Only admins can delete branding
 *       404:
 *         description: Branding configuration not found
 */
router.delete('/branding', authenticate, (req, res, next) => controller.delete(req, res).catch(next));

export default router;
