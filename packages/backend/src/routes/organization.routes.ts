import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createOrganizationSchema, updateOrganizationSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new OrganizationController();

router.use(authenticate);

/**
 * @openapi
 * /api/organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: List all organizations (SUPER_ADMIN only)
 *     description: Returns a paginated list of all organizations in the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, subdomain, or custom domain
 *     responses:
 *       200:
 *         description: List of organizations with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Only super admins can list all organizations
 */
router.get('/organizations', (req, res, next) => controller.list(req, res).catch(next));

/**
 * @openapi
 * /api/organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: Create new organization (SUPER_ADMIN only)
 *     description: Creates a new organization with optional subdomain and custom domain
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: "Acme Corporation"
 *               subdomain:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "acme"
 *                 description: "Lowercase letters, numbers, and hyphens only"
 *               customDomain:
 *                 type: string
 *                 maxLength: 200
 *                 example: "acme.example.com"
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       403:
 *         description: Only super admins can create organizations
 *       409:
 *         description: Subdomain or custom domain already exists
 */
router.post('/organizations', validateRequest(createOrganizationSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/organizations/{id}:
 *   get:
 *     tags: [Organizations]
 *     summary: Get organization details
 *     description: Returns organization details with branding config and counts. Users can only view their own organization unless SUPER_ADMIN
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Organization details
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
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     subdomain:
 *                       type: string
 *                     customDomain:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     branding:
 *                       type: object
 *                     _count:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: integer
 *                         assessments:
 *                           type: integer
 *       403:
 *         description: You can only view your own organization
 *       404:
 *         description: Organization not found
 */
router.get('/organizations/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/organizations/{id}:
 *   patch:
 *     tags: [Organizations]
 *     summary: Update organization
 *     description: Updates organization details. SUPER_ADMIN can update any org and change isActive. ADMIN can only update their own org (except isActive)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               subdomain:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *                 minLength: 3
 *                 maxLength: 50
 *               customDomain:
 *                 type: string
 *                 maxLength: 200
 *               isActive:
 *                 type: boolean
 *                 description: "Only SUPER_ADMIN can modify this field"
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Organization not found
 *       409:
 *         description: Subdomain or custom domain already exists
 */
router.patch('/organizations/:id', validateRequest(updateOrganizationSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/organizations/{id}:
 *   delete:
 *     tags: [Organizations]
 *     summary: Delete organization (SUPER_ADMIN only)
 *     description: Deletes an organization and all related data (cascade). This action cannot be undone.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *       403:
 *         description: Only super admins can delete organizations
 *       404:
 *         description: Organization not found
 */
router.delete('/organizations/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
