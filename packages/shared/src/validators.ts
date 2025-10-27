import { z } from 'zod';
import {
  UserRole,
  AssessmentType,
  AssessmentStatus,
  SiteType,
  Criticality,
  ComponentType,
  DependencyType,
  RiskType,
  Severity,
  RiskStatus,
  Priority,
  RecommendationStatus
} from './types';

// Auth Validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  organizationName: z.string().min(1, 'Organization name is required').max(200)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Assessment Validators
export const createAssessmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(AssessmentType)
});

export const updateAssessmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.nativeEnum(AssessmentStatus).optional()
});

// High-Level Assessment Validators
export const highLevelResponseSchema = z.object({
  questionId: z.string(),
  response: z.boolean().nullable(),
  notes: z.string().max(500).optional()
});

export const updateHighLevelResponsesSchema = z.object({
  responses: z.record(z.string(), z.boolean().nullable())
});

// Site Validators
export const createSiteSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  siteType: z.nativeEnum(SiteType),
  provider: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  availabilityZone: z.string().max(100).optional(),
  geographicLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().max(500).optional()
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional()
});

export const updateSiteSchema = createSiteSchema.partial();

// System Validators
export const createSystemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  systemType: z.string().max(100).optional(),
  businessCriticality: z.nativeEnum(Criticality),
  rpoMinutes: z.number().int().positive().optional(),
  rtoMinutes: z.number().int().positive().optional(),
  complianceReqs: z.array(z.string()).default([]),
  operationalHours: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional()
});

export const updateSystemSchema = createSystemSchema.partial();

// Component Validators
export const createComponentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  componentType: z.nativeEnum(ComponentType),
  providerService: z.string().max(100).optional(),
  configuration: z.record(z.any()).optional(),
  capacity: z.record(z.any()).optional(),
  scalingConfig: z.record(z.any()).optional(),
  isRedundant: z.boolean().default(false),
  redundancyLevel: z.number().int().positive().optional(),
  hasHealthCheck: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional()
});

export const updateComponentSchema = createComponentSchema.partial();

// Service Validators
export const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  version: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  containerImage: z.string().max(500).optional(),
  vmImage: z.string().max(500).optional(),
  resourceRequirements: z.record(z.any()).optional(),
  healthCheckUrl: z.string().url().optional().or(z.literal('')),
  port: z.number().int().min(1).max(65535).optional(),
  protocol: z.string().max(50).optional(),
  environmentVars: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export const updateServiceSchema = createServiceSchema.partial();

// Dependency Validators
export const createDependencySchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  dependencyType: z.nativeEnum(DependencyType),
  protocol: z.string().max(50).optional(),
  isRequired: z.boolean().default(true),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional()
});

// Risk Validators
export const updateRiskStatusSchema = z.object({
  status: z.nativeEnum(RiskStatus),
  notes: z.string().max(1000).optional()
});

// Recommendation Validators
export const respondToRecommendationSchema = z.object({
  status: z.nativeEnum(RecommendationStatus),
  userResponse: z.string().max(1000).optional()
});

// Branding Validators
export const createBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.string().max(200),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  pdfFooter: z.string().max(500).optional(),
  emailSignature: z.string().max(1000).optional()
});

export const updateBrandingSchema = createBrandingSchema.partial();

// Organization Validators
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  subdomain: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  customDomain: z.string().max(200).optional()
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// User Validators
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole)
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional()
});

// Pagination Validators
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
});

// Query Validators
export const querySchema = z.object({
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  ...paginationSchema.shape
});
