# DR Assessment Tool - Implementation Guide

This guide provides step-by-step instructions for implementing each major feature of the DR Assessment Tool.

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Monorepo Configuration](#2-monorepo-configuration)
3. [Database Setup](#3-database-setup)
4. [Authentication System](#4-authentication-system)
5. [Multi-Tenant White-Label System](#5-multi-tenant-white-label-system)
6. [High-Level Assessment](#6-high-level-assessment)
7. [Deep-Dive Assessment](#7-deep-dive-assessment)
8. [Automated Analysis Engine](#8-automated-analysis-engine)
9. [PDF Report Generation](#9-pdf-report-generation)
10. [Security Implementation](#10-security-implementation)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment](#12-deployment)

---

## 1. Development Environment Setup

### Prerequisites
```bash
# Required versions
Node.js: 20.x LTS
PostgreSQL: 15+
Redis: 7+
Docker: 24+ (optional, for containerized development)
```

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd dr-assessment-tool

# Install dependencies (from root)
npm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Start PostgreSQL and Redis (via Docker)
docker-compose up -d postgres redis

# Run database migrations
cd packages/backend
npx prisma migrate dev

# Seed initial data
npx prisma db seed

# Start development servers (from root)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## 2. Monorepo Configuration

### Package.json (Root)
```json
{
  "name": "dr-assessment-tool",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev --workspace=packages/backend",
    "dev:frontend": "npm run dev --workspace=packages/frontend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"packages/**/*.{ts,tsx,js,jsx,json,md}\"",
    "prisma:studio": "npm run studio --workspace=packages/backend"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "concurrently": "^8.2.2",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3"
  }
}
```

### Shared Package Configuration
The `packages/shared` package contains types and utilities used by both frontend and backend.

**packages/shared/package.json**:
```json
{
  "name": "@dr-assessment/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src"
  }
}
```

**packages/shared/src/index.ts**:
```typescript
export * from './types';
export * from './constants';
export * from './utils';
```

### TypeScript Configuration
**tsconfig.json (Root)**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 3. Database Setup

### Prisma Schema Implementation

**packages/backend/prisma/schema.prisma** (Full schema as per ARCHITECTURE.md)

### Key Implementation Details

#### Row-Level Security (RLS) via Prisma Middleware
```typescript
// packages/backend/src/middleware/prismaMiddleware.ts
import { PrismaClient } from '@prisma/client';

export function applyTenantIsolation(prisma: PrismaClient, getOrganizationId: () => string) {
  prisma.$use(async (params, next) => {
    // Models that require tenant isolation
    const tenantModels = [
      'Assessment',
      'Site',
      'System',
      'Component',
      'Service',
      'Risk',
      'Recommendation'
    ];

    if (tenantModels.includes(params.model || '')) {
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          organizationId: getOrganizationId()
        };
      } else if (params.action === 'create' || params.action === 'createMany') {
        if (params.action === 'create') {
          params.args.data.organizationId = getOrganizationId();
        }
      } else if (params.action === 'update' || params.action === 'updateMany' || params.action === 'delete' || params.action === 'deleteMany') {
        params.args.where = {
          ...params.args.where,
          organizationId: getOrganizationId()
        };
      }
    }

    return next(params);
  });
}
```

#### Database Migrations
```bash
# Create a new migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (visual database editor)
npx prisma studio
```

#### Seed Data
**packages/backend/prisma/seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      subdomain: 'demo',
      brandingConfig: {
        create: {
          primaryColor: '#0066cc',
          secondaryColor: '#333333',
          accentColor: '#ff6600',
          contactEmail: 'contact@demo.com'
        }
      }
    }
  });

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ORG_ADMIN',
      organizationId: org.id
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 4. Authentication System

### JWT Configuration

**packages/backend/src/utils/jwt.ts**:
```typescript
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
}
```

### Authentication Middleware

**packages/backend/src/middleware/auth.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }

    next();
  };
}
```

### Auth Routes

**packages/backend/src/routes/auth.routes.ts**:
```typescript
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: {
            id: user.organization.id,
            name: user.organization.name
          }
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
    });
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().min(1)
});

router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization and user
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        users: {
          create: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'ORG_ADMIN'
          }
        },
        brandingConfig: {
          create: {
            primaryColor: '#0066cc',
            secondaryColor: '#333333',
            accentColor: '#ff6600'
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = organization.users[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: {
            id: organization.id,
            name: organization.name
          }
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
    });
  }
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

router.post('/refresh', validateRequest(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }
    });
  }
});

export default router;
```

### Frontend Auth Integration

**packages/frontend/src/features/auth/authSlice.ts**:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organization: {
      id: string;
      name: string;
    };
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken')
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any; accessToken: string; refreshToken: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 5. Multi-Tenant White-Label System

### Branding Service

**packages/backend/src/services/branding.service.ts**:
```typescript
import { PrismaClient } from '@prisma/client';

export class BrandingService {
  constructor(private prisma: PrismaClient) {}

  async getBrandingByDomain(domain: string) {
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

    // Return default branding if not found
    if (!organization || !organization.brandingConfig) {
      return this.getDefaultBranding();
    }

    return {
      organizationName: organization.name,
      ...organization.brandingConfig
    };
  }

  private getDefaultBranding() {
    return {
      organizationName: 'DR Assessment Tool',
      primaryColor: '#0066cc',
      secondaryColor: '#333333',
      accentColor: '#ff6600',
      fontFamily: 'Inter, sans-serif',
      logoUrl: '/assets/default-logo.svg',
      faviconUrl: '/assets/favicon.ico'
    };
  }
}
```

### Branding Route

**packages/backend/src/routes/branding.routes.ts**:
```typescript
import { Router } from 'express';
import { BrandingService } from '../services/branding.service';
import { prisma } from '../config/database';

const router = Router();
const brandingService = new BrandingService(prisma);

router.get('/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const branding = await brandingService.getBrandingByDomain(domain);

    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    console.error('Branding fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch branding' }
    });
  }
});

export default router;
```

### Frontend Branding Hook

**packages/frontend/src/hooks/useBranding.ts**:
```typescript
import { useEffect, useState } from 'react';

interface BrandingConfig {
  organizationName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const domain = window.location.hostname;
        const response = await fetch(`/api/branding/${domain}`);
        const data = await response.json();

        if (data.success) {
          setBranding(data.data);
          applyBranding(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBranding();
  }, []);

  return { branding, loading };
}

function applyBranding(branding: BrandingConfig) {
  // Apply CSS variables
  const root = document.documentElement;
  root.style.setProperty('--primary-color', branding.primaryColor);
  root.style.setProperty('--secondary-color', branding.secondaryColor);
  root.style.setProperty('--accent-color', branding.accentColor);
  root.style.setProperty('--font-family', branding.fontFamily);

  // Update favicon
  if (branding.faviconUrl) {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = branding.faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  // Update page title
  document.title = `${branding.organizationName} - DR Assessment`;
}
```

---

## 6. High-Level Assessment

### Question Configuration

**packages/backend/src/config/highLevelQuestions.ts**:
```typescript
export interface Question {
  id: string;
  category: string;
  text: string;
  weight: number;
  helpText?: string;
}

export const HIGH_LEVEL_QUESTIONS: Question[] = [
  // Business Continuity Planning (15%)
  {
    id: 'bcp_001',
    category: 'Business Continuity Planning',
    text: 'Does your organization have a documented Business Continuity Plan (BCP)?',
    weight: 0.03,
    helpText: 'A BCP outlines procedures and instructions for maintaining or recovering operations during a disaster.'
  },
  {
    id: 'bcp_002',
    category: 'Business Continuity Planning',
    text: 'Is the BCP reviewed and updated at least annually?',
    weight: 0.025
  },
  {
    id: 'bcp_003',
    category: 'Business Continuity Planning',
    text: 'Have key stakeholders and their roles been identified in the BCP?',
    weight: 0.025
  },
  {
    id: 'bcp_004',
    category: 'Business Continuity Planning',
    text: 'Are communication plans established for stakeholders during incidents?',
    weight: 0.02
  },
  {
    id: 'bcp_005',
    category: 'Business Continuity Planning',
    text: 'Are crisis management procedures documented and accessible?',
    weight: 0.025
  },
  {
    id: 'bcp_006',
    category: 'Business Continuity Planning',
    text: 'Have you conducted a Business Impact Analysis (BIA)?',
    weight: 0.025
  },

  // Backup & Recovery (20%)
  {
    id: 'backup_001',
    category: 'Backup & Recovery',
    text: 'Are all critical systems backed up at least daily?',
    weight: 0.04
  },
  {
    id: 'backup_002',
    category: 'Backup & Recovery',
    text: 'Are backups stored in a geographically separate location?',
    weight: 0.035
  },
  {
    id: 'backup_003',
    category: 'Backup & Recovery',
    text: 'Are backup restoration procedures tested at least quarterly?',
    weight: 0.04
  },
  {
    id: 'backup_004',
    category: 'Backup & Recovery',
    text: 'Are backups encrypted both at rest and in transit?',
    weight: 0.03
  },
  {
    id: 'backup_005',
    category: 'Backup & Recovery',
    text: 'Is backup retention aligned with compliance and business requirements?',
    weight: 0.025
  },
  {
    id: 'backup_006',
    category: 'Backup & Recovery',
    text: 'Are immutable backups implemented to prevent tampering?',
    weight: 0.03
  },

  // Infrastructure Redundancy (18%)
  {
    id: 'infra_001',
    category: 'Infrastructure Redundancy',
    text: 'Have all single points of failure been identified?',
    weight: 0.04
  },
  {
    id: 'infra_002',
    category: 'Infrastructure Redundancy',
    text: 'Are critical systems deployed across multiple availability zones?',
    weight: 0.04
  },
  {
    id: 'infra_003',
    category: 'Infrastructure Redundancy',
    text: 'Are critical systems deployed across multiple geographic regions?',
    weight: 0.035
  },
  {
    id: 'infra_004',
    category: 'Infrastructure Redundancy',
    text: 'Is there redundancy in network connectivity?',
    weight: 0.03
  },
  {
    id: 'infra_005',
    category: 'Infrastructure Redundancy',
    text: 'Is there redundancy in power supply for on-premise infrastructure?',
    weight: 0.025
  },
  {
    id: 'infra_006',
    category: 'Infrastructure Redundancy',
    text: 'Are load balancers deployed with failover capabilities?',
    weight: 0.02
  },

  // Data Replication (12%)
  {
    id: 'data_001',
    category: 'Data Replication',
    text: 'Is database replication configured for critical data stores?',
    weight: 0.03
  },
  {
    id: 'data_002',
    category: 'Data Replication',
    text: 'Are RPO (Recovery Point Objective) targets defined and met?',
    weight: 0.03
  },
  {
    id: 'data_003',
    category: 'Data Replication',
    text: 'Are RTO (Recovery Time Objective) targets defined and met?',
    weight: 0.03
  },
  {
    id: 'data_004',
    category: 'Data Replication',
    text: 'Is cross-region data replication implemented?',
    weight: 0.025
  },
  {
    id: 'data_005',
    category: 'Data Replication',
    text: 'Are data consistency checks performed regularly?',
    weight: 0.005
  },

  // Monitoring & Alerting (10%)
  {
    id: 'monitor_001',
    category: 'Monitoring & Alerting',
    text: 'Are all critical systems monitored 24/7?',
    weight: 0.03
  },
  {
    id: 'monitor_002',
    category: 'Monitoring & Alerting',
    text: 'Are alert escalation procedures documented?',
    weight: 0.02
  },
  {
    id: 'monitor_003',
    category: 'Monitoring & Alerting',
    text: 'Are runbooks available for common incidents?',
    weight: 0.025
  },
  {
    id: 'monitor_004',
    category: 'Monitoring & Alerting',
    text: 'Is automated remediation implemented where possible?',
    weight: 0.015
  },
  {
    id: 'monitor_005',
    category: 'Monitoring & Alerting',
    text: 'Are synthetic monitoring/health checks configured?',
    weight: 0.01
  },

  // Testing & Validation (15%)
  {
    id: 'test_001',
    category: 'Testing & Validation',
    text: 'Are DR drills conducted at least annually?',
    weight: 0.04
  },
  {
    id: 'test_002',
    category: 'Testing & Validation',
    text: 'Are failover procedures tested regularly?',
    weight: 0.035
  },
  {
    id: 'test_003',
    category: 'Testing & Validation',
    text: 'Are recovery procedures tested for all critical systems?',
    weight: 0.035
  },
  {
    id: 'test_004',
    category: 'Testing & Validation',
    text: 'Are post-mortem analyses conducted after incidents?',
    weight: 0.02
  },
  {
    id: 'test_005',
    category: 'Testing & Validation',
    text: 'Are lessons learned incorporated into DR plans?',
    weight: 0.02
  },

  // Security & Compliance (5%)
  {
    id: 'security_001',
    category: 'Security & Compliance',
    text: 'Are access controls tested during DR scenarios?',
    weight: 0.015
  },
  {
    id: 'security_002',
    category: 'Security & Compliance',
    text: 'Are compliance requirements (SOC 2, HIPAA, etc.) considered in DR planning?',
    weight: 0.02
  },
  {
    id: 'security_003',
    category: 'Security & Compliance',
    text: 'Are audit logs maintained for DR activities?',
    weight: 0.01
  },
  {
    id: 'security_004',
    category: 'Security & Compliance',
    text: 'Is incident response integrated with DR procedures?',
    weight: 0.005
  },

  // Documentation & Training (5%)
  {
    id: 'doc_001',
    category: 'Documentation & Training',
    text: 'Are architecture diagrams up to date and accessible?',
    weight: 0.015
  },
  {
    id: 'doc_002',
    category: 'Documentation & Training',
    text: 'Are DR procedures documented and easily accessible?',
    weight: 0.015
  },
  {
    id: 'doc_003',
    category: 'Documentation & Training',
    text: 'Is the team trained on DR procedures?',
    weight: 0.01
  },
  {
    id: 'doc_004',
    category: 'Documentation & Training',
    text: 'Are knowledge transfer sessions conducted regularly?',
    weight: 0.01
  }
];

// Verify weights sum to 1.0
const totalWeight = HIGH_LEVEL_QUESTIONS.reduce((sum, q) => sum + q.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`Total weight is ${totalWeight}, expected 1.0`);
}
```

### Scoring Service

**packages/backend/src/services/scoring.service.ts**:
```typescript
import { PrismaClient } from '@prisma/client';
import { HIGH_LEVEL_QUESTIONS } from '../config/highLevelQuestions';

export class ScoringService {
  constructor(private prisma: PrismaClient) {}

  async calculateHighLevelScore(assessmentId: string) {
    const responses = await this.prisma.highLevelResponse.findMany({
      where: { assessmentId }
    });

    let totalScore = 0;
    let answeredWeight = 0;

    for (const response of responses) {
      if (response.response !== null) {
        const question = HIGH_LEVEL_QUESTIONS.find(q => q.id === response.questionId);
        if (question) {
          answeredWeight += question.weight;
          if (response.response === true) {
            totalScore += question.weight;
          }
        }
      }
    }

    // Normalize to 100-point scale
    const normalizedScore = answeredWeight > 0 ? (totalScore / answeredWeight) * 100 : 0;

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(responses);

    // Update assessment
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: { overallScore: normalizedScore }
    });

    return {
      overallScore: normalizedScore,
      categoryScores
    };
  }

  private calculateCategoryScores(responses: any[]) {
    const categoryMap = new Map<string, { total: number; answered: number }>();

    for (const response of responses) {
      const question = HIGH_LEVEL_QUESTIONS.find(q => q.id === response.questionId);
      if (!question || response.response === null) continue;

      if (!categoryMap.has(question.category)) {
        categoryMap.set(question.category, { total: 0, answered: 0 });
      }

      const category = categoryMap.get(question.category)!;
      category.answered += question.weight;
      if (response.response === true) {
        category.total += question.weight;
      }
    }

    const categoryScores: Record<string, number> = {};
    for (const [category, { total, answered }] of categoryMap) {
      categoryScores[category] = answered > 0 ? (total / answered) * 100 : 0;
    }

    return categoryScores;
  }
}
```

### High-Level Assessment Component

**packages/frontend/src/components/assessment/HighLevelAssessment.tsx**:
```typescript
import React, { useState } from 'react';
import { Card, Form, Button, ProgressBar, Alert } from 'react-bootstrap';
import { HIGH_LEVEL_QUESTIONS } from './highLevelQuestions';

interface Props {
  assessmentId: string;
  onComplete: () => void;
}

export function HighLevelAssessment({ assessmentId, onComplete }: Props) {
  const [responses, setResponses] = useState<Record<string, boolean | null>>({});
  const [currentCategory, setCurrentCategory] = useState(0);
  const [loading, setLoading] = useState(false);

  const categories = Array.from(new Set(HIGH_LEVEL_QUESTIONS.map(q => q.category)));
  const categoryQuestions = HIGH_LEVEL_QUESTIONS.filter(
    q => q.category === categories[currentCategory]
  );

  const progress = (Object.keys(responses).length / HIGH_LEVEL_QUESTIONS.length) * 100;

  const handleResponse = (questionId: string, value: boolean | null) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentCategory < categories.length - 1) {
      setCurrentCategory(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save responses
      await fetch(`/api/assessments/${assessmentId}/high-level`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      });

      // Calculate score
      await fetch(`/api/assessments/${assessmentId}/high-level/calculate`, {
        method: 'POST'
      });

      onComplete();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="high-level-assessment">
      <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-4" />

      <h3 className="mb-4">{categories[currentCategory]}</h3>

      {categoryQuestions.map(question => (
        <Card key={question.id} className="mb-3">
          <Card.Body>
            <Card.Title>{question.text}</Card.Title>
            {question.helpText && (
              <Card.Text className="text-muted small">{question.helpText}</Card.Text>
            )}
            <div className="d-flex gap-2 mt-3">
              <Button
                variant={responses[question.id] === true ? 'success' : 'outline-success'}
                onClick={() => handleResponse(question.id, true)}
              >
                Yes
              </Button>
              <Button
                variant={responses[question.id] === false ? 'danger' : 'outline-danger'}
                onClick={() => handleResponse(question.id, false)}
              >
                No
              </Button>
              <Button
                variant={responses[question.id] === null ? 'secondary' : 'outline-secondary'}
                onClick={() => handleResponse(question.id, null)}
              >
                N/A
              </Button>
            </div>
          </Card.Body>
        </Card>
      ))}

      <div className="d-flex justify-content-between mt-4">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentCategory === 0}
        >
          Previous
        </Button>

        {currentCategory < categories.length - 1 ? (
          <Button variant="primary" onClick={handleNext}>
            Next Category
          </Button>
        ) : (
          <Button variant="success" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Deep-Dive Assessment

### Drag-and-Drop System Builder

**packages/frontend/src/components/assessment/SystemBuilder.tsx**:
```typescript
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Card, Form, Modal } from 'react-bootstrap';

interface Props {
  assessmentId: string;
}

export function SystemBuilder({ assessmentId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [showAddSystem, setShowAddSystem] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addSite = (siteData: any) => {
    const newNode: Node = {
      id: `site-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: siteData.name,
        type: 'site',
        ...siteData
      },
      style: {
        backgroundColor: '#e3f2fd',
        border: '2px solid #1976d2',
        borderRadius: '8px',
        padding: '10px'
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setShowAddSite(false);
  };

  const addSystem = (systemData: any) => {
    if (!selectedSite) return;

    const newNode: Node = {
      id: `system-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: systemData.name,
        type: 'system',
        siteId: selectedSite,
        ...systemData
      },
      style: {
        backgroundColor: '#fff3e0',
        border: '2px solid #f57c00',
        borderRadius: '8px',
        padding: '10px'
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setShowAddSystem(false);
  };

  const saveDiagram = async () => {
    // Save nodes and edges to backend
    try {
      await fetch(`/api/assessments/${assessmentId}/diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      alert('Diagram saved successfully!');
    } catch (error) {
      console.error('Failed to save diagram:', error);
    }
  };

  return (
    <div style={{ height: '600px' }}>
      <div className="mb-3">
        <Button variant="primary" onClick={() => setShowAddSite(true)} className="me-2">
          Add Site
        </Button>
        <Button variant="secondary" onClick={() => setShowAddSystem(true)} className="me-2">
          Add System
        </Button>
        <Button variant="success" onClick={saveDiagram}>
          Save Diagram
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>

      {/* Add Site Modal */}
      <Modal show={showAddSite} onHide={() => setShowAddSite(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Site</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddSiteForm onSubmit={addSite} />
        </Modal.Body>
      </Modal>

      {/* Add System Modal */}
      <Modal show={showAddSystem} onHide={() => setShowAddSystem(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add System</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddSystemForm onSubmit={addSystem} />
        </Modal.Body>
      </Modal>
    </div>
  );
}

function AddSiteForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'AWS',
    region: '',
    availabilityZone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Site Name</Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Provider</Form.Label>
        <Form.Select
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
        >
          <option value="AWS">AWS</option>
          <option value="AZURE">Azure</option>
          <option value="GCP">GCP</option>
          <option value="ON_PREM">On-Premise</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Region</Form.Label>
        <Form.Control
          type="text"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Availability Zone</Form.Label>
        <Form.Control
          type="text"
          value={formData.availabilityZone}
          onChange={(e) => setFormData({ ...formData, availabilityZone: e.target.value })}
        />
      </Form.Group>

      <Button type="submit" variant="primary">
        Add Site
      </Button>
    </Form>
  );
}

function AddSystemForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    businessCriticality: 'TIER_3',
    rpoMinutes: 60,
    rtoMinutes: 240
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>System Name</Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Business Criticality</Form.Label>
        <Form.Select
          value={formData.businessCriticality}
          onChange={(e) => setFormData({ ...formData, businessCriticality: e.target.value })}
        >
          <option value="TIER_1">Tier 1 - Mission Critical</option>
          <option value="TIER_2">Tier 2 - Business Critical</option>
          <option value="TIER_3">Tier 3 - Important</option>
          <option value="TIER_4">Tier 4 - Low Priority</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>RPO (minutes)</Form.Label>
        <Form.Control
          type="number"
          value={formData.rpoMinutes}
          onChange={(e) => setFormData({ ...formData, rpoMinutes: parseInt(e.target.value) })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>RTO (minutes)</Form.Label>
        <Form.Control
          type="number"
          value={formData.rtoMinutes}
          onChange={(e) => setFormData({ ...formData, rtoMinutes: parseInt(e.target.value) })}
        />
      </Form.Group>

      <Button type="submit" variant="primary">
        Add System
      </Button>
    </Form>
  );
}
```

---

## 8. Automated Analysis Engine

(Implementation details in ARCHITECTURE.md - see SPOF Detection Algorithm and Recommendation Engine sections)

The analysis engine consists of:
1. **SPOF Detection Service** - Identifies single points of failure
2. **Risk Analysis Service** - Categorizes and scores risks
3. **Recommendation Engine** - Generates actionable recommendations
4. **Impact Assessment Service** - Calculates downstream impacts

---

## 9. PDF Report Generation

### PDF Service Implementation

**packages/backend/src/services/pdf.service.ts**:
```typescript
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export class PDFService {
  constructor(private prisma: PrismaClient) {}

  async generateAssessmentReport(assessmentId: string): Promise<Buffer> {
    // Fetch all data
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        organization: {
          include: { brandingConfig: true }
        },
        sites: {
          include: {
            systems: {
              include: {
                components: {
                  include: { services: true }
                }
              }
            }
          }
        },
        risks: true,
        recommendations: true,
        highLevelResponses: true
      }
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Prepare template data
    const templateData = {
      organizationName: assessment.organization.name,
      assessmentName: assessment.name,
      assessmentDate: assessment.createdAt.toLocaleDateString(),
      overallScore: assessment.overallScore?.toFixed(1),
      branding: assessment.organization.brandingConfig,
      sites: assessment.sites,
      risks: assessment.risks,
      recommendations: assessment.recommendations,
      categoryScores: this.calculateCategoryScores(assessment.highLevelResponses)
    };

    // Load and compile template
    const templatePath = path.join(__dirname, '../templates/report.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    const html = template(templateData);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    await browser.close();

    return Buffer.from(pdf);
  }

  private calculateCategoryScores(responses: any[]) {
    // Implementation similar to ScoringService.calculateCategoryScores
    return {};
  }
}
```

---

## 10. Security Implementation

### Input Validation Middleware

**packages/backend/src/middleware/validateRequest.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
      }
      next(error);
    }
  };
}
```

### XSS Protection

**packages/backend/src/utils/sanitize.ts**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>\"']/g, (char) => {
    const escapeChars: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapeChars[char] || char;
  });
}
```

### Security Headers

**packages/backend/src/app.ts**:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting

**packages/backend/src/middleware/rateLimiter.ts**:
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'auth-limit:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per window
  skipSuccessfulRequests: true
});
```

---

## 11. Testing Strategy

### Backend Unit Tests

**packages/backend/tests/services/scoring.service.test.ts**:
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ScoringService } from '../../src/services/scoring.service';
import { PrismaClient } from '@prisma/client';

describe('ScoringService', () => {
  let scoringService: ScoringService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    scoringService = new ScoringService(prisma);
  });

  it('should calculate correct score with all yes responses', async () => {
    // Test implementation
  });

  it('should handle partial responses correctly', async () => {
    // Test implementation
  });
});
```

### Frontend Component Tests

**packages/frontend/src/components/assessment/HighLevelAssessment.test.tsx**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { HighLevelAssessment } from './HighLevelAssessment';

describe('HighLevelAssessment', () => {
  it('renders questions correctly', () => {
    render(<HighLevelAssessment assessmentId="test-id" onComplete={() => {}} />);
    expect(screen.getByText(/Business Continuity Planning/i)).toBeInTheDocument();
  });

  it('allows users to answer questions', () => {
    render(<HighLevelAssessment assessmentId="test-id" onComplete={() => {}} />);
    const yesButton = screen.getAllByText('Yes')[0];
    fireEvent.click(yesButton);
    expect(yesButton).toHaveClass('btn-success');
  });
});
```

---

## 12. Deployment

### Docker Setup

**docker/Dockerfile.backend**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

WORKDIR /app/packages/backend

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

**docker/Dockerfile.frontend**:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

WORKDIR /app/packages/frontend
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

**packages/backend/.env.example**:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dr_assessment

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Conclusion

This implementation guide provides a comprehensive roadmap for building the DR Assessment Tool. Each section can be implemented incrementally, with testing at each stage. The modular architecture ensures that features can be developed and deployed independently while maintaining system integrity.

For additional support and detailed code examples, refer to the FEATURE_SPECIFICATION.md and ARCHITECTURE.md documents.
