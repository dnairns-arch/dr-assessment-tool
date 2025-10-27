import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PdfService } from '../services/pdf.service';

export class ReportController {
  private pdfService: PdfService;

  constructor() {
    this.pdfService = new PdfService(prisma);
  }

  /**
   * Generate and download PDF report for an assessment
   */
  async generatePdf(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Parse options from query params
    const options = {
      includeExecutiveSummary: req.query.includeExecutiveSummary !== 'false',
      includeHighLevelScores: req.query.includeHighLevelScores !== 'false',
      includeRisks: req.query.includeRisks !== 'false',
      includeRecommendations: req.query.includeRecommendations !== 'false',
      includeSpofs: req.query.includeSpofs !== 'false',
      includeDependencyGraph: req.query.includeDependencyGraph === 'true'
    };

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateAssessmentReport(
      assessmentId,
      organizationId,
      options
    );

    // Set response headers for PDF download
    const filename = `DR_Assessment_${assessment.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(pdfBuffer);
  }

  /**
   * Get assessment report metadata (without generating PDF)
   */
  async getReportMetadata(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Get counts for report sections
    const [sites, systems, components, risks, recommendations, spofs] = await Promise.all([
      prisma.site.count({ where: { assessmentId } }),
      prisma.system.count({ where: { site: { assessmentId } } }),
      prisma.component.count({ where: { system: { site: { assessmentId } } } }),
      prisma.risk.count({ where: { assessmentId } }),
      prisma.recommendation.count({ where: { assessmentId } }),
      prisma.component.count({
        where: {
          isRedundant: false,
          system: { site: { assessmentId } },
          dependenciesTo: { some: {} }
        }
      })
    ]);

    const metadata = {
      assessmentId,
      assessmentName: assessment.name,
      assessmentType: assessment.type,
      status: assessment.status,
      lastAnalyzedAt: assessment.lastAnalyzedAt,
      completedAt: assessment.completedAt,
      sections: {
        infrastructure: {
          sites,
          systems,
          components
        },
        analysis: {
          risks,
          spofs,
          recommendations
        }
      },
      canGenerate: assessment.status === 'COMPLETED' || assessment.status === 'IN_PROGRESS',
      estimatedPages: Math.ceil(
        1 + // Cover
          1 + // Executive Summary
          Math.ceil(sites / 10) + // Infrastructure
          Math.ceil(spofs / 20) + // SPOFs
          Math.ceil(risks / 25) + // Risks
          Math.ceil(recommendations / 5) + // Recommendations
          1 // Conclusion
      )
    };

    res.json({
      success: true,
      data: metadata,
      meta: { timestamp: new Date().toISOString() }
    });
  }

  /**
   * Generate executive summary report (lighter version)
   */
  async generateExecutiveSummary(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId },
      select: {
        id: true,
        name: true
      }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Generate PDF with limited sections
    const pdfBuffer = await this.pdfService.generateAssessmentReport(assessmentId, organizationId, {
      includeExecutiveSummary: true,
      includeHighLevelScores: true,
      includeRisks: false,
      includeRecommendations: true,
      includeSpofs: true,
      includeDependencyGraph: false
    });

    // Set response headers for PDF download
    const filename = `DR_Executive_Summary_${assessment.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  }
}
