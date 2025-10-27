import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';
import { ScoringService } from '../services/scoring.service';
import { HIGH_LEVEL_QUESTIONS } from '../config/highLevelQuestions';

const scoringService = new ScoringService();

export class AssessmentController {
  /**
   * List assessments for current organization (with pagination)
   */
  async list(req: AuthRequest, res: Response) {
    const organizationId = req.user!.organizationId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Filters
    const where: any = { organizationId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;

    const [assessments, totalCount] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { sites: true, risks: true, recommendations: true } }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.assessment.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const response: ApiResponse = {
      success: true,
      data: assessments,
      meta: {
        pagination: { page, pageSize, totalPages, totalCount },
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  }

  /**
   * Create new assessment
   */
  async create(req: AuthRequest, res: Response) {
    const { name, description, type } = req.body;
    const organizationId = req.user!.organizationId;
    const createdById = req.user!.userId;

    const assessment = await prisma.assessment.create({
      data: {
        name,
        description,
        type,
        organizationId,
        createdById,
        status: 'DRAFT'
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } }
    });

    // Auto-create high-level response records if HIGH_LEVEL type
    if (type === 'HIGH_LEVEL' || type === 'HYBRID') {
      await this.initializeHighLevelResponses(assessment.id);
    }

    const response: ApiResponse = {
      success: true,
      data: assessment,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Get single assessment with all related data
   */
  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assessment = await prisma.assessment.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        sites: {
          include: {
            systems: {
              include: {
                components: { include: { services: true } }
              }
            }
          }
        },
        highLevelResponses: true,
        risks: { orderBy: { severity: 'asc' } },
        recommendations: { orderBy: { priority: 'asc' } }
      }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const response: ApiResponse = {
      success: true,
      data: assessment,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update assessment
   */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { name, description, status } = req.body;

    // Verify ownership
    const existing = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const assessment = await prisma.assessment.update({
      where: { id },
      data: { name, description, status }
    });

    const response: ApiResponse = {
      success: true,
      data: assessment,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Delete assessment
   */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    await prisma.assessment.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Assessment deleted successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Submit assessment for analysis
   */
  async submit(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assessment = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    if (assessment.status === 'SUBMITTED' || assessment.status === 'ANALYZED') {
      throw new AppError(400, 'INVALID_STATUS', 'Assessment already submitted');
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    const response: ApiResponse = {
      success: true,
      data: updated,
      meta: {
        message: 'Assessment submitted successfully. Analysis will begin shortly.',
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  }

  /**
   * Get high-level responses for assessment
   */
  async getHighLevelResponses(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assessment = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const responses = await prisma.highLevelResponse.findMany({
      where: { assessmentId: id },
      orderBy: { questionId: 'asc' }
    });

    const response: ApiResponse = {
      success: true,
      data: responses,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update high-level responses (bulk)
   */
  async updateHighLevelResponses(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { responses } = req.body;

    const assessment = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Upsert responses
    const updates = Object.entries(responses).map(([questionId, responseValue]) => {
      const question = HIGH_LEVEL_QUESTIONS.find((q) => q.id === questionId);
      if (!question) return null;

      return prisma.highLevelResponse.upsert({
        where: {
          assessmentId_questionId: { assessmentId: id, questionId }
        },
        update: { response: responseValue as boolean | null },
        create: {
          assessmentId: id,
          questionId,
          category: question.category,
          questionText: question.text,
          response: responseValue as boolean | null,
          weight: question.weight
        }
      });
    });

    await Promise.all(updates.filter(Boolean));

    const response: ApiResponse = {
      success: true,
      data: { message: 'Responses updated successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Calculate high-level score
   */
  async calculateScore(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assessment = await prisma.assessment.findFirst({ where: { id, organizationId } });
    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const scoreResult = await scoringService.calculateHighLevelScore(id);
    const rating = scoringService.getScoreRating(scoreResult.overallScore);

    const response: ApiResponse = {
      success: true,
      data: { ...scoreResult, rating },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Initialize high-level response records
   */
  private async initializeHighLevelResponses(assessmentId: string) {
    const responses = HIGH_LEVEL_QUESTIONS.map((q) => ({
      assessmentId,
      questionId: q.id,
      category: q.category,
      questionText: q.text,
      response: null,
      weight: q.weight
    }));

    await prisma.highLevelResponse.createMany({ data: responses });
  }
}
