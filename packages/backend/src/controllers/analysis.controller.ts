import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';
import { AnalysisService } from '../services/analysis.service';

export class AnalysisController {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService(prisma);
  }

  /**
   * Run comprehensive DR analysis on an assessment
   */
  async analyze(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Run analysis
    const analysisResult = await this.analysisService.analyzeAssessment(assessmentId, organizationId);

    // Update assessment status
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        lastAnalyzedAt: new Date()
      }
    });

    const response: ApiResponse = {
      success: true,
      data: analysisResult,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * List all risks for an assessment
   */
  async listRisks(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const riskType = req.query.riskType as string;
    const severity = req.query.severity as string;

    const where: any = { assessmentId };
    if (riskType) where.riskType = riskType;
    if (severity) where.severity = severity;

    const risks = await prisma.risk.findMany({
      where,
      include: {
        component: {
          select: {
            id: true,
            name: true,
            componentType: true,
            system: {
              select: {
                id: true,
                name: true,
                businessCriticality: true
              }
            }
          }
        }
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }]
    });

    const response: ApiResponse = {
      success: true,
      data: risks,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Get single risk details
   */
  async getRisk(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const risk = await prisma.risk.findFirst({
      where: {
        id,
        assessment: { organizationId }
      },
      include: {
        component: {
          include: {
            system: {
              include: {
                site: true
              }
            }
          }
        }
      }
    });

    if (!risk) {
      throw new AppError(404, 'NOT_FOUND', 'Risk not found');
    }

    const response: ApiResponse = {
      success: true,
      data: risk,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update risk status and notes
   */
  async updateRiskStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { status, notes } = req.body;

    const existing = await prisma.risk.findFirst({
      where: {
        id,
        assessment: { organizationId }
      }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Risk not found');
    }

    const risk = await prisma.risk.update({
      where: { id },
      data: {
        status,
        notes
      }
    });

    const response: ApiResponse = {
      success: true,
      data: risk,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Get Single Points of Failure for an assessment
   */
  async getSPOFs(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Get all non-redundant components with dependencies
    const spofs = await prisma.component.findMany({
      where: {
        isRedundant: false,
        system: {
          site: {
            assessmentId
          }
        },
        dependenciesTo: {
          some: {}
        }
      },
      include: {
        system: {
          include: {
            site: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        dependenciesTo: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                componentType: true
              }
            }
          }
        }
      },
      orderBy: {
        system: {
          businessCriticality: 'desc'
        }
      }
    });

    // Format SPOF data
    const spofData = spofs.map((component) => ({
      componentId: component.id,
      componentName: component.name,
      componentType: component.componentType,
      systemName: component.system.name,
      systemCriticality: component.system.businessCriticality,
      siteName: component.system.site.name,
      dependentComponents: component.dependenciesTo.length,
      dependentComponentNames: component.dependenciesTo.map((d) => d.source.name),
      hasHealthCheck: component.hasHealthCheck
    }));

    const response: ApiResponse = {
      success: true,
      data: spofData,
      meta: {
        timestamp: new Date().toISOString(),
        total: spofData.length,
        critical: spofData.filter((s) => s.systemCriticality === 'CRITICAL').length
      }
    };

    res.json(response);
  }

  /**
   * List all recommendations for an assessment
   */
  async listRecommendations(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const priority = req.query.priority as string;
    const status = req.query.status as string;

    const where: any = { assessmentId };
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        component: {
          select: {
            id: true,
            name: true,
            componentType: true,
            system: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    const response: ApiResponse = {
      success: true,
      data: recommendations,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Get single recommendation details
   */
  async getRecommendation(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        assessment: { organizationId }
      },
      include: {
        component: {
          include: {
            system: {
              include: {
                site: true
              }
            }
          }
        }
      }
    });

    if (!recommendation) {
      throw new AppError(404, 'NOT_FOUND', 'Recommendation not found');
    }

    const response: ApiResponse = {
      success: true,
      data: recommendation,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update recommendation status (accept/reject/defer)
   */
  async updateRecommendationStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { status, userResponse } = req.body;

    const existing = await prisma.recommendation.findFirst({
      where: {
        id,
        assessment: { organizationId }
      }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Recommendation not found');
    }

    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        status,
        userResponse,
        respondedAt: status !== 'PENDING' ? new Date() : null
      }
    });

    const response: ApiResponse = {
      success: true,
      data: recommendation,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
