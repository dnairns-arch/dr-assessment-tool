import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class SystemController {
  /**
   * List systems for a site
   */
  async list(req: AuthRequest, res: Response) {
    const { siteId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, assessment: { organizationId } }
    });

    if (!site) {
      throw new AppError(404, 'NOT_FOUND', 'Site not found');
    }

    const systems = await prisma.system.findMany({
      where: { siteId },
      include: {
        _count: { select: { components: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: systems,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Create new system
   */
  async create(req: AuthRequest, res: Response) {
    const { siteId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, assessment: { organizationId } }
    });

    if (!site) {
      throw new AppError(404, 'NOT_FOUND', 'Site not found');
    }

    const {
      name,
      description,
      systemType,
      businessCriticality,
      rpoMinutes,
      rtoMinutes,
      complianceReqs,
      operationalHours,
      metadata,
      position
    } = req.body;

    const system = await prisma.system.create({
      data: {
        siteId,
        name,
        description,
        systemType,
        businessCriticality,
        rpoMinutes,
        rtoMinutes,
        complianceReqs: complianceReqs || [],
        operationalHours,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: system,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Get single system with components
   */
  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const system = await prisma.system.findFirst({
      where: {
        id,
        site: { assessment: { organizationId } }
      },
      include: {
        site: { select: { id: true, name: true } },
        components: {
          include: {
            _count: { select: { services: true, dependenciesFrom: true, dependenciesTo: true } }
          }
        }
      }
    });

    if (!system) {
      throw new AppError(404, 'NOT_FOUND', 'System not found');
    }

    const response: ApiResponse = {
      success: true,
      data: system,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update system
   */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.system.findFirst({
      where: { id, site: { assessment: { organizationId } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'System not found');
    }

    const {
      name,
      description,
      systemType,
      businessCriticality,
      rpoMinutes,
      rtoMinutes,
      complianceReqs,
      operationalHours,
      metadata,
      position
    } = req.body;

    const system = await prisma.system.update({
      where: { id },
      data: {
        name,
        description,
        systemType,
        businessCriticality,
        rpoMinutes,
        rtoMinutes,
        complianceReqs,
        operationalHours,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: system,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Delete system (cascade to components, services)
   */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify ownership
    const existing = await prisma.system.findFirst({
      where: { id, site: { assessment: { organizationId } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'System not found');
    }

    await prisma.system.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'System deleted successfully (cascade)' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
