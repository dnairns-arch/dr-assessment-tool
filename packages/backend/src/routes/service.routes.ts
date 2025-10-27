import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createServiceSchema, updateServiceSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new ServiceController();

router.use(authenticate);

/**
 * @openapi
 * /api/components/{componentId}/services:
 *   get:
 *     tags: [Services]
 *     summary: List services for a component
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/components/:componentId/services', (req, res, next) =>
  controller.list(req, res).catch(next)
);

/**
 * @openapi
 * /api/components/{componentId}/services:
 *   post:
 *     tags: [Services]
 *     summary: Create new service
 *     description: Creates a running service/process within a component
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
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
 *                 example: "api-service"
 *               version:
 *                 type: string
 *                 example: "1.2.3"
 *               containerImage:
 *                 type: string
 *                 example: "myorg/api:latest"
 *               port:
 *                 type: integer
 *                 example: 8080
 *               protocol:
 *                 type: string
 *                 example: "HTTP"
 *               healthCheckUrl:
 *                 type: string
 *                 example: "/health"
 *     responses:
 *       201:
 *         description: Service created
 */
router.post('/components/:componentId/services', validateRequest(createServiceSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get service details
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
 *         description: Service details
 */
router.get('/services/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/services/{id}:
 *   patch:
 *     tags: [Services]
 *     summary: Update service
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
 *         description: Service updated
 */
router.patch('/services/:id', validateRequest(updateServiceSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/services/{id}:
 *   delete:
 *     tags: [Services]
 *     summary: Delete service
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
 *         description: Service deleted
 */
router.delete('/services/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
