import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

/**
 * @openapi
 * /api/assessments/{assessmentId}/report/metadata:
 *   get:
 *     tags: [Reports]
 *     summary: Get report metadata
 *     description: Returns metadata about the report including section counts and estimated page count without generating the PDF
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
 *         description: Report metadata
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
 *                     assessmentId:
 *                       type: string
 *                     assessmentName:
 *                       type: string
 *                     assessmentType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     sections:
 *                       type: object
 *                       properties:
 *                         infrastructure:
 *                           type: object
 *                           properties:
 *                             sites:
 *                               type: integer
 *                             systems:
 *                               type: integer
 *                             components:
 *                               type: integer
 *                         analysis:
 *                           type: object
 *                           properties:
 *                             risks:
 *                               type: integer
 *                             spofs:
 *                               type: integer
 *                             recommendations:
 *                               type: integer
 *                     canGenerate:
 *                       type: boolean
 *                     estimatedPages:
 *                       type: integer
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/report/metadata', (req, res, next) =>
  controller.getReportMetadata(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/report/pdf:
 *   get:
 *     tags: [Reports]
 *     summary: Generate and download full PDF report
 *     description: |
 *       Generates a comprehensive PDF report including:
 *       - Cover page with branding
 *       - Executive summary
 *       - High-level assessment scores (if applicable)
 *       - Infrastructure overview
 *       - Single Points of Failure (SPOFs)
 *       - Risk assessment
 *       - Recommendations with action items
 *       - Conclusion
 *
 *       The report is styled with the organization's branding configuration.
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
 *         name: includeExecutiveSummary
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeHighLevelScores
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeRisks
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeSpofs
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeDependencyGraph
 *         schema:
 *           type: boolean
 *           default: false
 *         description: "Future feature - not yet implemented"
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/report/pdf', (req, res, next) =>
  controller.generatePdf(req, res).catch(next)
);

/**
 * @openapi
 * /api/assessments/{assessmentId}/report/executive-summary:
 *   get:
 *     tags: [Reports]
 *     summary: Generate executive summary PDF
 *     description: |
 *       Generates a lighter version of the report suitable for executives, including:
 *       - Cover page
 *       - Executive summary with key metrics
 *       - High-level scores
 *       - SPOFs overview
 *       - Top recommendations
 *
 *       This is a condensed version without detailed risk listings.
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
 *         description: Executive summary PDF download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:assessmentId/report/executive-summary', (req, res, next) =>
  controller.generateExecutiveSummary(req, res).catch(next)
);

export default router;
