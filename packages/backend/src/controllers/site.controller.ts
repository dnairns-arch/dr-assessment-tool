import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class SiteController {
  /**
   * List sites for an assessment
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

    const sites = await prisma.site.findMany({
      where: { assessmentId },
      include: {
        _count: { select: { systems: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: sites,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Create new site
   */
  async create(req: AuthRequest, res: Response) {
    const { assessmentId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify assessment ownership
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    const {
      name,
      description,
      siteType,
      provider,
      region,
      availabilityZone,
      geographicLocation,
      metadata,
      position
    } = req.body;

    const site = await prisma.site.create({
      data: {
        assessmentId,
        name,
        description,
        siteType,
        provider,
        region,
        availabilityZone,
        geographicLocation,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: site,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Get single site with systems
   */
  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const site = await prisma.site.findFirst({
      where: {
        id,
        assessment: { organizationId }
      },
      include: {
        assessment: { select: { id: true, name: true } },
        systems: {
          include: {
            _count: { select: { components: true } }
          }
        }
      }
    });

    if (!site) {
      throw new AppError(404, 'NOT_FOUND', 'Site not found');
    }

    const response: ApiResponse = {
      success: true,
      data: site,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update site
   */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.site.findFirst({
      where: { id, assessment: { organizationId } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Site not found');
    }

    const {
      name,
      description,
      siteType,
      provider,
      region,
      availabilityZone,
      geographicLocation,
      isActive,
      metadata,
      position
    } = req.body;

    const site = await prisma.site.update({
      where: { id },
      data: {
        name,
        description,
        siteType,
        provider,
        region,
        availabilityZone,
        geographicLocation,
        isActive,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: site,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Delete site (cascade to systems, components, services)
   */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.site.findFirst({
      where: { id, assessment: { organizationId } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Site not found');
    }

    await prisma.site.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Site deleted successfully (cascade)' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
