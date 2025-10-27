import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class ComponentController {
  async list(req: AuthRequest, res: Response) {
    const { systemId } = req.params;
    const organizationId = req.user!.organizationId;

    const system = await prisma.system.findFirst({
      where: { id: systemId, site: { assessment: { organizationId } } }
    });

    if (!system) {
      throw new AppError(404, 'NOT_FOUND', 'System not found');
    }

    const components = await prisma.component.findMany({
      where: { systemId },
      include: {
        _count: {
          select: { services: true, dependenciesFrom: true, dependenciesTo: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: components,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async create(req: AuthRequest, res: Response) {
    const { systemId } = req.params;
    const organizationId = req.user!.organizationId;

    const system = await prisma.system.findFirst({
      where: { id: systemId, site: { assessment: { organizationId } } }
    });

    if (!system) {
      throw new AppError(404, 'NOT_FOUND', 'System not found');
    }

    const {
      name,
      description,
      componentType,
      providerService,
      configuration,
      capacity,
      scalingConfig,
      isRedundant,
      redundancyLevel,
      hasHealthCheck,
      metadata,
      position
    } = req.body;

    const component = await prisma.component.create({
      data: {
        systemId,
        name,
        description,
        componentType,
        providerService,
        configuration,
        capacity,
        scalingConfig,
        isRedundant: isRedundant || false,
        redundancyLevel,
        hasHealthCheck: hasHealthCheck || false,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: component,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const component = await prisma.component.findFirst({
      where: {
        id,
        system: { site: { assessment: { organizationId } } }
      },
      include: {
        system: { select: { id: true, name: true } },
        services: true,
        dependenciesFrom: {
          include: {
            target: { select: { id: true, name: true, componentType: true } }
          }
        },
        dependenciesTo: {
          include: {
            source: { select: { id: true, name: true, componentType: true } }
          }
        }
      }
    });

    if (!component) {
      throw new AppError(404, 'NOT_FOUND', 'Component not found');
    }

    const response: ApiResponse = {
      success: true,
      data: component,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.component.findFirst({
      where: { id, system: { site: { assessment: { organizationId } } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Component not found');
    }

    const {
      name,
      description,
      componentType,
      providerService,
      configuration,
      capacity,
      scalingConfig,
      isRedundant,
      redundancyLevel,
      hasHealthCheck,
      metadata,
      position
    } = req.body;

    const component = await prisma.component.update({
      where: { id },
      data: {
        name,
        description,
        componentType,
        providerService,
        configuration,
        capacity,
        scalingConfig,
        isRedundant,
        redundancyLevel,
        hasHealthCheck,
        metadata,
        position
      }
    });

    const response: ApiResponse = {
      success: true,
      data: component,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.component.findFirst({
      where: { id, system: { site: { assessment: { organizationId } } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Component not found');
    }

    await prisma.component.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Component deleted successfully (cascade)' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
