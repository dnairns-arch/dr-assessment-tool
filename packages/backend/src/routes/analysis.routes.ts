import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { updateRiskStatusSchema, respondToRecommendationSchema } from '@dr-assessment/shared';

const router = Router();
const controller = new AnalysisController();

router.use(authenticate);

/**
 * @openapi
 * /api/assessments/{assessmentId}/analyze:
 *   post:
 *     tags: [Analysis]
 *     summary: Run comprehensive DR analysis
 *     description: |
 *       Performs comprehensive disaster recovery analysis on an assessment, including:
 *       - SPOF (Single Point of Failure) detection
 *       - Risk identification across 7+ categories
 *       - Automated recommendation generation
 *       - Impact assessment
 *       Results are saved to the database for later retrieval.
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
 *         description: Analysis completed successfully
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
 *                     risks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     spofs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRisks:
 *                           type: integer
 *                         criticalRisks:
 *                           type: integer
 *                         highRisks:
 *                           type: integer
 *                         totalSpofs:
 *                           type: integer
 *                         criticalSpofs:
 *                           type: integer
 *                         totalRecommendations:
 *                           type: integer
 *       404:
 *         description: Assessment not found
 */
router.post('/assessments/:assessmentId/analyze', (req, res, next) =>
  controller.analyze(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/risks:
 *   get:
 *     tags: [Analysis]
 *     summary: List all risks for an assessment
 *     description: Returns all identified risks with optional filtering by type and severity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: riskType
 *         schema:
 *           type: string
 *           enum: [SPOF, AVAILABILITY, DATA_LOSS, SECURITY, PERFORMANCE, COMPLIANCE, RECOVERY, DEPENDENCY]
 *         description: Filter by risk type
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [CRITICAL, HIGH, MEDIUM, LOW]
 *         description: Filter by severity
 *     responses:
 *       200:
 *         description: List of risks
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       riskType:
 *                         type: string
 *                       severity:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       likelihood:
 *                         type: string
 *                       impact:
 *                         type: string
 *                       status:
 *                         type: string
 *                       component:
 *                         type: object
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/risks', (req, res, next) =>
  controller.listRisks(req, res).catch(next)
);

/**
 * @openapi
 * /api/risks/{id}:
 *   get:
 *     tags: [Analysis]
 *     summary: Get risk details
 *     description: Returns detailed information about a specific risk
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
 *         description: Risk details
 *       404:
 *         description: Risk not found
 */
router.get('/risks/:id', (req, res, next) => controller.getRisk(req, res).catch(next));

/**
 * @openapi
 * /api/risks/{id}/status:
 *   patch:
 *     tags: [Analysis]
 *     summary: Update risk status
 *     description: Updates the status and adds notes to a risk
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IDENTIFIED, ACKNOWLEDGED, IN_PROGRESS, MITIGATED, ACCEPTED]
 *                 example: "ACKNOWLEDGED"
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Team is reviewing this risk for mitigation"
 *     responses:
 *       200:
 *         description: Risk status updated
 *       404:
 *         description: Risk not found
 */
router.patch('/risks/:id/status', validateRequest(updateRiskStatusSchema), (req, res, next) =>
  controller.updateRiskStatus(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/spofs:
 *   get:
 *     tags: [Analysis]
 *     summary: Get Single Points of Failure
 *     description: Returns all identified SPOFs (non-redundant components with dependencies)
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
 *         description: List of SPOFs
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
 *                     properties:
 *                       componentId:
 *                         type: string
 *                       componentName:
 *                         type: string
 *                       componentType:
 *                         type: string
 *                       systemName:
 *                         type: string
 *                       systemCriticality:
 *                         type: string
 *                       siteName:
 *                         type: string
 *                       dependentComponents:
 *                         type: integer
 *                       dependentComponentNames:
 *                         type: array
 *                         items:
 *                           type: string
 *                       hasHealthCheck:
 *                         type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     critical:
 *                       type: integer
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/spofs', (req, res, next) =>
  controller.getSPOFs(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/recommendations:
 *   get:
 *     tags: [Analysis]
 *     summary: List all recommendations
 *     description: Returns all recommendations with optional filtering by priority and status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [CRITICAL, HIGH, MEDIUM, LOW]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, DEFERRED]
 *     responses:
 *       200:
 *         description: List of recommendations
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       category:
 *                         type: string
 *                       effort:
 *                         type: string
 *                       impact:
 *                         type: string
 *                       status:
 *                         type: string
 *                       actionItems:
 *                         type: array
 *                         items:
 *                           type: string
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/recommendations', (req, res, next) =>
  controller.listRecommendations(req, res).catch(next)
);

/**
 * @openapi
 * /api/recommendations/{id}:
 *   get:
 *     tags: [Analysis]
 *     summary: Get recommendation details
 *     description: Returns detailed information about a specific recommendation
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
 *         description: Recommendation details
 *       404:
 *         description: Recommendation not found
 */
router.get('/recommendations/:id', (req, res, next) =>
  controller.getRecommendation(req, res).catch(next)
);

/**
 * @openapi
 * /api/recommendations/{id}/respond:
 *   patch:
 *     tags: [Analysis]
 *     summary: Respond to recommendation
 *     description: Accept, reject, defer, or update status of a recommendation
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, DEFERRED]
 *                 example: "ACCEPTED"
 *               userResponse:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Scheduled for Q2 implementation"
 *     responses:
 *       200:
 *         description: Recommendation status updated
 *       404:
 *         description: Recommendation not found
 */
router.patch(
  '/recommendations/:id/respond',
  validateRequest(respondToRecommendationSchema),
  (req, res, next) => controller.updateRecommendationStatus(req, res).catch(next)
);

export default router;
