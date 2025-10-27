import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { DEFAULT_BRANDING } from '@dr-assessment/shared';

export class BrandingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get branding configuration by domain
   * Checks custom domain first, then subdomain, with Redis caching
   */
  async getBrandingByDomain(domain: string) {
    // Check cache first
    const cacheKey = `branding:${domain}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      // Redis error, continue without cache
      console.error('Redis error in getBrandingByDomain:', error);
    }

    // Try custom domain first
    let organization = await this.prisma.organization.findUnique({
      where: { customDomain: domain },
      include: { brandingConfig: true }
    });

    // Try subdomain
    if (!organization) {
      const subdomain = domain.split('.')[0];
      organization = await this.prisma.organization.findUnique({
        where: { subdomain },
        include: { brandingConfig: true }
      });
    }

    // Return default if not found
    if (!organization || !organization.brandingConfig) {
      return this.getDefaultBranding();
    }

    const branding = {
      organizationName: organization.name,
      ...organization.brandingConfig
    };

    // Cache for 5 minutes
    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(branding));
    } catch (error) {
      console.error('Redis error setting cache:', error);
    }

    return branding;
  }

  /**
   * Get default branding configuration
   */
  getDefaultBranding() {
    return {
      organizationName: 'DR Assessment Tool',
      logoUrl: '/assets/default-logo.svg',
      faviconUrl: '/assets/favicon.ico',
      ...DEFAULT_BRANDING
    };
  }

  /**
   * Invalidate branding cache for a domain
   */
  async invalidateCache(domain: string) {
    try {
      await redis.del(`branding:${domain}`);
    } catch (error) {
      console.error('Redis error invalidating cache:', error);
    }
  }
}
