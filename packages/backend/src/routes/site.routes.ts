import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createSiteSchema, updateSiteSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new SiteController();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/assessments/{assessmentId}/sites:
 *   get:
 *     tags: [Sites]
 *     summary: List sites for an assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of sites
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
 */
router.get('/assessments/:assessmentId/sites', (req, res, next) =>
  controller.list(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/sites:
 *   post:
 *     tags: [Sites]
 *     summary: Create new site
 *     description: Creates a new site (physical/logical location) within an assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, siteType]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "AWS US-East-1"
 *               description:
 *                 type: string
 *                 example: "Primary production environment"
 *               siteType:
 *                 type: string
 *                 enum: [CLOUD, ON_PREMISE, HYBRID, EDGE]
 *                 example: "CLOUD"
 *               provider:
 *                 type: string
 *                 example: "AWS"
 *               region:
 *                 type: string
 *                 example: "us-east-1"
 *               availabilityZone:
 *                 type: string
 *                 example: "us-east-1a"
 *               geographicLocation:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   address:
 *                     type: string
 *               position:
 *                 type: object
 *                 description: UI positioning for drag-and-drop
 *                 properties:
 *                   x:
 *                     type: number
 *                   y:
 *                     type: number
 *     responses:
 *       201:
 *         description: Site created successfully
 */
router.post('/assessments/:assessmentId/sites', validateRequest(createSiteSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/sites/{id}:
 *   get:
 *     tags: [Sites]
 *     summary: Get single site with systems
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site details with nested systems
 */
router.get('/sites/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/sites/{id}:
 *   patch:
 *     tags: [Sites]
 *     summary: Update site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Site updated
 */
router.patch('/sites/:id', validateRequest(updateSiteSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/sites/{id}:
 *   delete:
 *     tags: [Sites]
 *     summary: Delete site (cascade deletes systems, components, services)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site deleted
 */
router.delete('/sites/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
