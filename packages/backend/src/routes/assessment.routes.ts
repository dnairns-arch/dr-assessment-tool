import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { validateRequest, validateQuery } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  updateHighLevelResponsesSchema,
  querySchema
} from '@dr-assessment/shared';

const router = Router();
const controller = new AssessmentController();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/assessments:
 *   get:
 *     tags: [Assessments]
 *     summary: List assessments for current organization
 *     description: Returns paginated list of assessments with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, IN_PROGRESS, SUBMITTED, ANALYZED, COMPLETED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HIGH_LEVEL, DEEP_DIVE, HYBRID]
 *     responses:
 *       200:
 *         description: List of assessments
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', validateQuery(querySchema), (req, res, next) =>
  controller.list(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments:
 *   post:
 *     tags: [Assessments]
 *     summary: Create new assessment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Q1 2025 DR Assessment"
 *               description:
 *                 type: string
 *                 example: "Quarterly disaster recovery readiness assessment"
 *               type:
 *                 type: string
 *                 enum: [HIGH_LEVEL, DEEP_DIVE, HYBRID]
 *                 example: "HIGH_LEVEL"
 *     responses:
 *       201:
 *         description: Assessment created successfully
 */
router.post('/', validateRequest(createAssessmentSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{id}:
 *   get:
 *     tags: [Assessments]
 *     summary: Get single assessment with all related data
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
 *         description: Assessment details
 *       404:
 *         description: Assessment not found
 */
router.get('/:id', (req, res, next) => controller.get(req, res).catch(next));

/**
 * @openapi
 * /api/assessments/{id}:
 *   patch:
 *     tags: [Assessments]
 *     summary: Update assessment
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
 *               status:
 *                 type: string
 *                 enum: [DRAFT, IN_PROGRESS, SUBMITTED, ANALYZED, COMPLETED]
 *     responses:
 *       200:
 *         description: Assessment updated
 */
router.patch('/:id', validateRequest(updateAssessmentSchema), (req, res, next) =>
  controller.update(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{id}:
 *   delete:
 *     tags: [Assessments]
 *     summary: Delete assessment (cascade deletes all related data)
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
 *         description: Assessment deleted
 */
router.delete('/:id', (req, res, next) => controller.delete(req, res).catch(next));

/**
 * @openapi
 * /api/assessments/{id}/submit:
 *   post:
 *     tags: [Assessments]
 *     summary: Submit assessment for analysis
 *     description: Changes status to SUBMITTED and triggers analysis
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
 *         description: Assessment submitted
 */
router.post('/:id/submit', (req, res, next) => controller.submit(req, res).catch(next));

/**
 * @openapi
 * /api/assessments/{id}/high-level:
 *   get:
 *     tags: [High-Level Assessment]
 *     summary: Get high-level assessment responses
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
 *         description: High-level responses
 */
router.get('/:id/high-level', (req, res, next) =>
  controller.getHighLevelResponses(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{id}/high-level:
 *   put:
 *     tags: [High-Level Assessment]
 *     summary: Update high-level assessment responses (bulk)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responses:
 *                 type: object
 *                 additionalProperties:
 *                   type: boolean
 *                   nullable: true
 *                 example:
 *                   bcp_001: true
 *                   bcp_002: false
 *                   bcp_003: null
 *     responses:
 *       200:
 *         description: Responses updated
 */
router.put('/:id/high-level', validateRequest(updateHighLevelResponsesSchema), (req, res, next) =>
  controller.updateHighLevelResponses(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{id}/high-level/calculate:
 *   post:
 *     tags: [High-Level Assessment]
 *     summary: Calculate high-level assessment score
 *     description: Calculates overall score (0-100) and category scores
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
 *         description: Score calculated
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
 *                     overallScore:
 *                       type: number
 *                       example: 78.5
 *                     categoryScores:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     rating:
 *                       type: object
 *                       properties:
 *                         label:
 *                           type: string
 *                           example: "Good"
 *                         color:
 *                           type: string
 *                         description:
 *                           type: string
 */
router.post('/:id/high-level/calculate', (req, res, next) =>
  controller.calculateScore(req, res).catch(next)
);

export default router;
