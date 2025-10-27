import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createSystemSchema, updateSystemSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new SystemController();

router.use(authenticate);

/**
 * @openapi
 * /api/sites/{siteId}/systems:
 *   get:
 *     tags: [Systems]
 *     summary: List systems for a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of systems
 */
router.get('/sites/:siteId/systems', (req, res, next) => controller.list(req, res).catch(next));

/**
 * @openapi
 * /api/sites/{siteId}/systems:
 *   post:
 *     tags: [Systems]
 *     summary: Create new system
 *     description: Creates a new system (application/service group) within a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, businessCriticality]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Customer API"
 *               description:
 *                 type: string
 *               systemType:
 *                 type: string
 *                 example: "Web Application"
 *               businessCriticality:
 *                 type: string
 *                 enum: [TIER_1, TIER_2, TIER_3, TIER_4]
 *                 example: "TIER_1"
 *                 description: "TIER_1=Mission Critical, TIER_2=Business Critical, TIER_3=Important, TIER_4=Low Priority"
 *               rpoMinutes:
 *                 type: integer
 *                 example: 15
 *                 description: "Recovery Point Objective in minutes"
 *               rtoMinutes:
 *                 type: integer
 *                 example: 60
 *                 description: "Recovery Time Objective in minutes"
 *               complianceReqs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SOC 2", "HIPAA"]
 *               operationalHours:
 *                 type: string
 *                 example: "24/7"
 *     responses:
 *       201:
 *         description: System created
 */
router.post('/sites/:siteId/systems', validateRequest(createSystemSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/systems/{id}:
 *   get:
 *     tags: [Systems]
 *     summary: Get single system with components
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
 *         description: System details
 */
router.get('/systems/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/systems/{id}:
 *   patch:
 *     tags: [Systems]
 *     summary: Update system
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
 *         description: System updated
 */
router.patch('/systems/:id', validateRequest(updateSystemSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/systems/{id}:
 *   delete:
 *     tags: [Systems]
 *     summary: Delete system (cascade)
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
 *         description: System deleted
 */
router.delete('/systems/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
