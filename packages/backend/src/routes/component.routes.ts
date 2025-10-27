import { Router } from 'express';
import { ComponentController } from '../controllers/component.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createComponentSchema, updateComponentSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new ComponentController();

router.use(authenticate);

/**
 * @openapi
 * /api/systems/{systemId}/components:
 *   get:
 *     tags: [Components]
 *     summary: List components for a system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of components
 */
router.get('/systems/:systemId/components', (req, res, next) =>
  controller.list(req, res).catch(next)
);

/**
 * @openapi
 * /api/systems/{systemId}/components:
 *   post:
 *     tags: [Components]
 *     summary: Create new component
 *     description: Creates infrastructure component (compute, storage, database, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, componentType]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Primary Database"
 *               componentType:
 *                 type: string
 *                 enum: [COMPUTE, STORAGE, DATABASE, NETWORK, LOAD_BALANCER, CACHE, MESSAGE_QUEUE, CDN, DNS, FIREWALL, OTHER]
 *                 example: "DATABASE"
 *               providerService:
 *                 type: string
 *                 example: "RDS PostgreSQL"
 *               isRedundant:
 *                 type: boolean
 *                 example: true
 *               redundancyLevel:
 *                 type: integer
 *                 example: 2
 *                 description: "N+1, N+2, etc"
 *               hasHealthCheck:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Component created
 */
router.post('/systems/:systemId/components', validateRequest(createComponentSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/components/{id}:
 *   get:
 *     tags: [Components]
 *     summary: Get component with services and dependencies
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
 *         description: Component details
 */
router.get('/components/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/components/{id}:
 *   patch:
 *     tags: [Components]
 *     summary: Update component
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
 *     responses:
 *       200:
 *         description: Component updated
 */
router.patch('/components/:id', validateRequest(updateComponentSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/components/{id}:
 *   delete:
 *     tags: [Components]
 *     summary: Delete component (cascade)
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
 *         description: Component deleted
 */
router.delete('/components/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
