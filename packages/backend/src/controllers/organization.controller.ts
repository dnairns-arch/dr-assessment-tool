import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';

export class OrganizationController {
  /**
   * List all organizations (SUPER_ADMIN only)
   */
  async list(req: AuthRequest, res: Response) {
    const userRole = req.user!.role;

    if (userRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only super admins can list all organizations');
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { customDomain: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              assessments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.organization.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: organizations,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    };

    res.json(response);
  }

  /**
   * Create new organization (SUPER_ADMIN only)
   */
  async create(req: AuthRequest, res: Response) {
    const userRole = req.user!.role;

    if (userRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only super admins can create organizations');
    }

    const { name, subdomain, customDomain } = req.body;

    // Check if subdomain already exists
    if (subdomain) {
      const existing = await prisma.organization.findUnique({
        where: { subdomain }
      });

      if (existing) {
        throw new AppError(409, 'DUPLICATE_SUBDOMAIN', 'Organization with this subdomain already exists');
      }
    }

    // Check if customDomain already exists
    if (customDomain) {
      const existing = await prisma.organization.findUnique({
        where: { customDomain }
      });

      if (existing) {
        throw new AppError(409, 'DUPLICATE_DOMAIN', 'Organization with this custom domain already exists');
      }
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        subdomain,
        customDomain
      }
    });

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(201).json(response);
  }

  /**
   * Get organization details
   */
  async get(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userRole = req.user!.role;

    // Users can only view their own organization unless they're SUPER_ADMIN
    if (userRole !== 'SUPER_ADMIN' && id !== organizationId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only view your own organization');
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        branding: true,
        _count: {
          select: {
            users: true,
            assessments: true
          }
        }
      }
    });

    if (!organization) {
      throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    }

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Update organization
   */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userRole = req.user!.role;

    // Only SUPER_ADMIN or ADMIN of the organization can update
    if (userRole !== 'SUPER_ADMIN' && (id !== organizationId || userRole !== 'ADMIN')) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to update organization');
    }

    const existing = await prisma.organization.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    }

    const { name, subdomain, customDomain, isActive } = req.body;

    // If subdomain is changing, check for duplicates
    if (subdomain && subdomain !== existing.subdomain) {
      const duplicate = await prisma.organization.findUnique({
        where: { subdomain }
      });

      if (duplicate) {
        throw new AppError(409, 'DUPLICATE_SUBDOMAIN', 'Organization with this subdomain already exists');
      }
    }

    // If customDomain is changing, check for duplicates
    if (customDomain && customDomain !== existing.customDomain) {
      const duplicate = await prisma.organization.findUnique({
        where: { customDomain }
      });

      if (duplicate) {
        throw new AppError(409, 'DUPLICATE_DOMAIN', 'Organization with this custom domain already exists');
      }
    }

    // Only SUPER_ADMIN can change isActive
    const updateData: any = {
      name,
      subdomain,
      customDomain
    };

    if (userRole === 'SUPER_ADMIN' && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Delete organization (SUPER_ADMIN only)
   */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userRole = req.user!.role;

    if (userRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only super admins can delete organizations');
    }

    const existing = await prisma.organization.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    }

    // Delete organization (cascade will handle related records)
    await prisma.organization.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Organization deleted successfully' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
