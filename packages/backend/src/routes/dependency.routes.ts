import { Router } from 'express';
import { DependencyController } from '../controllers/dependency.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { createDependencySchema } from '@dr-assessment/shared';

const router = Router();
const controller = new DependencyController();

router.use(authenticate);

/**
 * @openapi
 * /api/assessments/{assessmentId}/dependencies:
 *   get:
 *     tags: [Dependencies]
 *     summary: List all dependencies for an assessment
 *     description: Returns all component dependencies with source and target details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of dependencies
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
router.get('/assessments/:assessmentId/dependencies', (req, res, next) =>
  controller.list(req, res).catch(next)
);

/**
 * @openapi
 * /api/dependencies:
 *   post:
 *     tags: [Dependencies]
 *     summary: Create new dependency
 *     description: Creates a dependency relationship between two components
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceId, targetId, dependencyType]
 *             properties:
 *               sourceId:
 *                 type: string
 *                 format: uuid
 *                 description: Component that depends on another
 *               targetId:
 *                 type: string
 *                 format: uuid
 *                 description: Component being depended upon
 *               dependencyType:
 *                 type: string
 *                 enum: [SYNC, ASYNC, DATA, CONTROL]
 *                 example: "SYNC"
 *                 description: "SYNC=Synchronous call, ASYNC=Queue/async, DATA=Data flow, CONTROL=Control plane"
 *               protocol:
 *                 type: string
 *                 example: "HTTP"
 *               isRequired:
 *                 type: boolean
 *                 default: true
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dependency created
 *       400:
 *         description: Invalid dependency (self-reference)
 *       409:
 *         description: Dependency already exists
 */
router.post('/dependencies', validateRequest(createDependencySchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/dependencies/{id}:
 *   delete:
 *     tags: [Dependencies]
 *     summary: Delete dependency
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
 *         description: Dependency deleted
 */
router.delete('/dependencies/:id', (req, res, next) => controller.delete(req, res).catch(next));

export default router;
