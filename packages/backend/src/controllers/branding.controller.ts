import { Response, Request } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@dr-assessment/shared';
import { BrandingService } from '../services/branding.service';

export class BrandingController {
  private brandingService: BrandingService;

  constructor() {
    this.brandingService = new BrandingService(prisma);
  }

  /**
   * Get branding by domain (public endpoint for white-label)
   */
  async getByDomain(req: Request, res: Response) {
    const { domain } = req.params;

    if (!domain) {
      throw new AppError(400, 'INVALID_REQUEST', 'Domain parameter is required');
    }

    const branding = await this.brandingService.getBrandingByDomain(domain);

    const response: ApiResponse = {
      success: true,
      data: branding,
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Get current organization's branding
   */
  async getCurrent(req: AuthRequest, res: Response) {
    const organizationId = req.user!.organizationId;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { brandingConfig: true }
    });

    if (!organization) {
      throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    }

    const branding = organization.brandingConfig || this.brandingService.getDefaultBranding();

    const response: ApiResponse = {
      success: true,
      data: {
        organizationName: organization.name,
        ...branding
      },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }

  /**
   * Create or update branding for current organization (ADMIN only)
   */
  async createOrUpdate(req: AuthRequest, res: Response) {
    const organizationId = req.user!.organizationId;
    const userRole = req.user!.role;

    // Only ADMIN or SUPER_ADMIN can modify branding
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admins can modify branding configuration');
    }

    const {
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      contactEmail,
      contactPhone,
      website,
      pdfFooter,
      emailSignature
    } = req.body;

    // Check if branding config already exists
    const existing = await prisma.brandingConfig.findUnique({
      where: { organizationId }
    });

    let branding;
    if (existing) {
      // Update existing
      branding = await prisma.brandingConfig.update({
        where: { organizationId },
        data: {
          logoUrl,
          faviconUrl,
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
          contactEmail,
          contactPhone,
          website,
          pdfFooter,
          emailSignature
        }
      });
    } else {
      // Create new
      branding = await prisma.brandingConfig.create({
        data: {
          organizationId,
          logoUrl,
          faviconUrl,
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
          contactEmail,
          contactPhone,
          website,
          pdfFooter,
          emailSignature
        }
      });
    }

    // Invalidate cache for this organization's domains
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (organization?.customDomain) {
      await this.brandingService.invalidateCache(organization.customDomain);
    }
    if (organization?.subdomain) {
      await this.brandingService.invalidateCache(organization.subdomain);
    }

    const response: ApiResponse = {
      success: true,
      data: branding,
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(existing ? 200 : 201).json(response);
  }

  /**
   * Delete branding configuration (revert to default)
   */
  async delete(req: AuthRequest, res: Response) {
    const organizationId = req.user!.organizationId;
    const userRole = req.user!.role;

    // Only ADMIN or SUPER_ADMIN can delete branding
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admins can delete branding configuration');
    }

    const existing = await prisma.brandingConfig.findUnique({
      where: { organizationId }
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Branding configuration not found');
    }

    await prisma.brandingConfig.delete({
      where: { organizationId }
    });

    // Invalidate cache
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (organization?.customDomain) {
      await this.brandingService.invalidateCache(organization.customDomain);
    }
    if (organization?.subdomain) {
      await this.brandingService.invalidateCache(organization.subdomain);
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Branding configuration deleted, reverted to default' },
      meta: { timestamp: new Date().toISOString() }
    };

    res.json(response);
  }
}
