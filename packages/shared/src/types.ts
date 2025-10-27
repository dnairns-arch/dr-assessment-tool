// User & Organization Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  ASSESSOR = 'ASSESSOR',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Organization {
  id: string;
  name: string;
  subdomain?: string;
  customDomain?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingConfig {
  id: string;
  organizationId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  pdfFooter?: string;
  emailSignature?: string;
}

// Assessment Types
export enum AssessmentType {
  HIGH_LEVEL = 'HIGH_LEVEL',
  DEEP_DIVE = 'DEEP_DIVE',
  HYBRID = 'HYBRID'
}

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  ANALYZED = 'ANALYZED',
  COMPLETED = 'COMPLETED'
}

export interface Assessment {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  overallScore?: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

export interface HighLevelResponse {
  id: string;
  assessmentId: string;
  category: string;
  questionId: string;
  questionText: string;
  response?: boolean;
  notes?: string;
  score?: number;
  weight?: number;
}

// Deep-Dive Types
export enum SiteType {
  CLOUD = 'CLOUD',
  ON_PREMISE = 'ON_PREMISE',
  HYBRID = 'HYBRID',
  EDGE = 'EDGE'
}

export interface Site {
  id: string;
  assessmentId: string;
  name: string;
  description?: string;
  siteType: SiteType;
  provider?: string;
  region?: string;
  availabilityZone?: string;
  geographicLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  isActive: boolean;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

export enum Criticality {
  TIER_1 = 'TIER_1', // Mission Critical
  TIER_2 = 'TIER_2', // Business Critical
  TIER_3 = 'TIER_3', // Important
  TIER_4 = 'TIER_4' // Low Priority
}

export interface System {
  id: string;
  siteId: string;
  name: string;
  description?: string;
  systemType?: string;
  businessCriticality: Criticality;
  rpoMinutes?: number;
  rtoMinutes?: number;
  complianceReqs: string[];
  operationalHours?: string;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

export enum ComponentType {
  COMPUTE = 'COMPUTE',
  STORAGE = 'STORAGE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  LOAD_BALANCER = 'LOAD_BALANCER',
  CACHE = 'CACHE',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  CDN = 'CDN',
  DNS = 'DNS',
  FIREWALL = 'FIREWALL',
  OTHER = 'OTHER'
}

export interface Component {
  id: string;
  systemId: string;
  name: string;
  description?: string;
  componentType: ComponentType;
  providerService?: string;
  configuration?: Record<string, any>;
  capacity?: Record<string, any>;
  scalingConfig?: Record<string, any>;
  isRedundant: boolean;
  redundancyLevel?: number;
  hasHealthCheck: boolean;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  componentId: string;
  name: string;
  version?: string;
  description?: string;
  containerImage?: string;
  vmImage?: string;
  resourceRequirements?: Record<string, any>;
  healthCheckUrl?: string;
  port?: number;
  protocol?: string;
  environmentVars?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum DependencyType {
  SYNC = 'SYNC',
  ASYNC = 'ASYNC',
  DATA = 'DATA',
  CONTROL = 'CONTROL'
}

export interface Dependency {
  id: string;
  sourceId: string;
  targetId: string;
  dependencyType: DependencyType;
  protocol?: string;
  isRequired: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Risk Types
export enum RiskType {
  SPOF = 'SPOF',
  CAPACITY = 'CAPACITY',
  CONFIGURATION = 'CONFIGURATION',
  NETWORK = 'NETWORK',
  DATA = 'DATA',
  COMPLIANCE = 'COMPLIANCE',
  PROVIDER_CONCENTRATION = 'PROVIDER_CONCENTRATION',
  GEOGRAPHIC_CONCENTRATION = 'GEOGRAPHIC_CONCENTRATION'
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum RiskStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  MITIGATED = 'MITIGATED',
  ACCEPTED = 'ACCEPTED',
  RESOLVED = 'RESOLVED'
}

export interface Risk {
  id: string;
  assessmentId: string;
  riskType: RiskType;
  severity: Severity;
  title: string;
  description: string;
  affectedEntities: any;
  impact?: string;
  likelihood?: string;
  mitigation?: string;
  detectedAt: Date;
  status: RiskStatus;
  resolvedAt?: Date;
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum RecommendationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Recommendation {
  id: string;
  assessmentId: string;
  category: string;
  priority: Priority;
  title: string;
  description: string;
  rationale?: string;
  implementation?: string;
  estimatedEffort?: string;
  estimatedCost?: string;
  expectedBenefit?: string;
  affectedEntities: any;
  status: RecommendationStatus;
  userResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalCount: number;
    };
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
}
