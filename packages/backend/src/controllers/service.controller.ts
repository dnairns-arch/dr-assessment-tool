import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class ServiceController {
  async list(req: AuthRequest, res: Response) {
    const { componentId } = req.params;
    const organizationId = req.user!.organizationId;

    const component = await prisma.component.findFirst({
      where: { id: componentId, system: { site: { assessment: { organizationId } } } }
    });

    if (!component) {
      throw new AppError(404, 'NOT_FOUND', 'Component not found');
    }

    const services = await prisma.service.findMany({
      where: { componentId },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: services,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async create(req: AuthRequest, res: Response) {
    const { componentId } = req.params;
    const organizationId = req.user!.organizationId;

    const component = await prisma.component.findFirst({
      where: { id: componentId, system: { site: { assessment: { organizationId } } } }
    });

    if (!component) {
      throw new AppError(404, 'NOT_FOUND', 'Component not found');
    }

    const {
      name,
      version,
      description,
      containerImage,
      vmImage,
      resourceRequirements,
      healthCheckUrl,
      port,
      protocol,
      environmentVars,
      metadata
    } = req.body;

    const service = await prisma.service.create({
      data: {
        componentId,
        name,
        version,
        description,
        containerImage,
        vmImage,
        resourceRequirements,
        healthCheckUrl,
        port,
        protocol,
        environmentVars,
        metadata
      }
    });

    const response: ApiResponse = {
      success: true,
      data: service,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const service = await prisma.service.findFirst({
      where: {
        id,
        component: { system: { site: { assessment: { organizationId } } } }
      },
      include: {
        component: { select: { id: true, name: true, componentType: true } }
      }
    });

    if (!service) {
      throw new AppError(404, 'NOT_FOUND', 'Service not found');
    }

    const response: ApiResponse = {
      success: true,
      data: service,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.service.findFirst({
      where: { id, component: { system: { site: { assessment: { organizationId } } } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Service not found');
    }

    const {
      name,
      version,
      description,
      containerImage,
      vmImage,
      resourceRequirements,
      healthCheckUrl,
      port,
      protocol,
      environmentVars,
      metadata
    } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        version,
        description,
        containerImage,
        vmImage,
        resourceRequirements,
        healthCheckUrl,
        port,
        protocol,
        environmentVars,
        metadata
      }
    });

    const response: ApiResponse = {
      success: true,
      data: service,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.service.findFirst({
      where: { id, component: { system: { site: { assessment: { organizationId } } } } }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Service not found');
    }

    await prisma.service.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Service deleted successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
