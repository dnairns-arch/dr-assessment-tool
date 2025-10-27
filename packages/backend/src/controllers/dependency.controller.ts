import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class DependencyController {
  /**
   * List all dependencies for an assessment
   */
  async list(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Get all dependencies for components in this assessment
    const dependencies = await prisma.dependency.findMany({
      where: {
        source: {
          system: {
            site: { assessmentId }
          }
        }
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            componentType: true,
            system: { select: { id: true, name: true } }
          }
        },
        target: {
          select: {
            id: true,
            name: true,
            componentType: true,
            system: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: dependencies,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Create new dependency
   */
  async create(req: AuthRequest, res: Response) {
    const organizationId = req.user!.organizationId;
    const { sourceId, targetId, dependencyType, protocol, isRequired, description, metadata } =
      req.body;

    // Prevent self-dependencies
    if (sourceId === targetId) {
      throw new AppError(400, 'INVALID_DEPENDENCY', 'A component cannot depend on itself');
    }

    // Verify both components exist and belong to the same organization
    const [source, target] = await Promise.all([
      prisma.component.findFirst({
        where: { id: sourceId, system: { site: { assessment: { organizationId } } } }
      }),
      prisma.component.findFirst({
        where: { id: targetId, system: { site: { assessment: { organizationId } } } }
      })
    ]);

    if (!source) {
      throw new AppError(404, 'NOT_FOUND', 'Source component not found');
    }

    if (!target) {
      throw new AppError(404, 'NOT_FOUND', 'Target component not found');
    }

    // Check for existing dependency
    const existing = await prisma.dependency.findUnique({
      where: { sourceId_targetId: { sourceId, targetId } }
    });

    if (existing) {
      throw new AppError(409, 'DUPLICATE_DEPENDENCY', 'Dependency already exists');
    }

    const dependency = await prisma.dependency.create({
      data: {
        sourceId,
        targetId,
        dependencyType,
        protocol,
        isRequired: isRequired !== undefined ? isRequired : true,
        description,
        metadata
      },
      include: {
        source: { select: { id: true, name: true, componentType: true } },
        target: { select: { id: true, name: true, componentType: true } }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: dependency,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Delete dependency
   */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.dependency.findFirst({
      where: {
        id,
        source: { system: { site: { assessment: { organizationId } } } }
      }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Dependency not found');
    }

    await prisma.dependency.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Dependency deleted successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
