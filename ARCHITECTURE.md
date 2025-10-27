# DR Assessment Tool - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              React SPA (Port 5173)                         │ │
│  │  - React Router                                            │ │
│  │  - Redux Toolkit (State Management)                        │ │
│  │  - Bootstrap UI                                            │ │
│  │  - React Flow (Diagrams)                                   │ │
│  │  - Chart.js / D3.js (Visualizations)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS/REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API Server (Port 3000)               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                          │ │
│  │  - Helmet (Security Headers)                               │ │
│  │  - CORS                                                    │ │
│  │  - Rate Limiting                                           │ │
│  │  - JWT Authentication                                      │ │
│  │  - Input Validation (Zod)                                  │ │
│  │  - Request Logging                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Route Layer                                               │ │
│  │  - Auth Routes                                             │ │
│  │  - Organization Routes                                     │ │
│  │  - Assessment Routes                                       │ │
│  │  - Site/System/Component Routes                            │ │
│  │  - Analysis Routes                                         │ │
│  │  - Report Routes                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service Layer                                             │ │
│  │  - Assessment Service                                      │ │
│  │  - Analysis Service (SPOF, Risk Detection)                 │ │
│  │  - Recommendation Engine                                   │ │
│  │  - Scoring Service                                         │ │
│  │  - PDF Generation Service                                  │ │
│  │  - Email Service                                           │ │
│  │  - Branding Service                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Data Access Layer (Prisma ORM)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database (Port 5432)              │
│  - Multi-tenant data with Row-Level Security                    │
│  - JSONB for flexible schema                                    │
│  - Full-text search                                             │
│  - Audit logs                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Redis Cache (Port 6379)                      │
│  - Session storage                                              │
│  - Rate limiting counters                                       │
│  - Job queue (Bull)                                             │
│  - Query result caching                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
dr-assessment-tool/
├── packages/
│   ├── frontend/                 # React application
│   │   ├── src/
│   │   │   ├── api/             # API client (RTK Query)
│   │   │   ├── assets/          # Images, fonts
│   │   │   ├── components/      # React components
│   │   │   │   ├── common/      # Reusable components
│   │   │   │   ├── assessment/  # Assessment-specific
│   │   │   │   ├── dashboard/   # Dashboard components
│   │   │   │   ├── diagrams/    # React Flow diagrams
│   │   │   │   └── reports/     # Report viewers
│   │   │   ├── features/        # Redux slices
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── layouts/         # Page layouts
│   │   │   ├── pages/           # Route pages
│   │   │   ├── services/        # Business logic
│   │   │   ├── styles/          # SCSS files
│   │   │   ├── types/           # TypeScript types
│   │   │   ├── utils/           # Helper functions
│   │   │   ├── App.tsx          # Root component
│   │   │   ├── main.tsx         # Entry point
│   │   │   └── vite-env.d.ts
│   │   ├── public/
│   │   │   └── branding/        # White-label assets
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── backend/                  # Express API server
│   │   ├── src/
│   │   │   ├── config/          # Configuration
│   │   │   │   ├── database.ts
│   │   │   │   ├── redis.ts
│   │   │   │   └── env.ts
│   │   │   ├── middleware/      # Express middleware
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── validateRequest.ts
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   └── tenantContext.ts
│   │   │   ├── routes/          # API routes
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── organization.routes.ts
│   │   │   │   ├── assessment.routes.ts
│   │   │   │   ├── site.routes.ts
│   │   │   │   ├── system.routes.ts
│   │   │   │   ├── component.routes.ts
│   │   │   │   ├── service.routes.ts
│   │   │   │   ├── analysis.routes.ts
│   │   │   │   └── report.routes.ts
│   │   │   ├── controllers/     # Route controllers
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── assessment.service.ts
│   │   │   │   ├── scoring.service.ts
│   │   │   │   ├── analysis.service.ts
│   │   │   │   ├── recommendation.service.ts
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── email.service.ts
│   │   │   │   └── branding.service.ts
│   │   │   ├── models/          # Business models
│   │   │   ├── validators/      # Zod schemas
│   │   │   ├── jobs/            # Background jobs
│   │   │   │   ├── analysis.job.ts
│   │   │   │   └── pdf.job.ts
│   │   │   ├── utils/           # Utilities
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── password.ts
│   │   │   │   └── sanitize.ts
│   │   │   ├── types/           # TypeScript types
│   │   │   ├── app.ts           # Express app
│   │   │   └── server.ts        # Server entry
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   ├── migrations/      # Database migrations
│   │   │   └── seed.ts          # Seed data
│   │   ├── tests/               # API tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                   # Shared types/utils
│       ├── src/
│       │   ├── types/           # Shared TypeScript types
│       │   ├── constants/       # Shared constants
│       │   └── utils/           # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                         # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── SECURITY.md
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│
├── FEATURE_SPECIFICATION.md
├── ARCHITECTURE.md
├── package.json                 # Root package.json
├── package-lock.json
├── .gitignore
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## Database Schema Design

### Core Entities

```prisma
// User & Organization
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          UserRole
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  isActive      Boolean  @default(true)
  mfaEnabled    Boolean  @default(false)
  mfaSecret     String?
}

enum UserRole {
  SUPER_ADMIN
  ORG_ADMIN
  ASSESSOR
  VIEWER
}

model Organization {
  id              String   @id @default(uuid())
  name            String
  subdomain       String?  @unique
  customDomain    String?  @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isActive        Boolean  @default(true)
  users           User[]
  assessments     Assessment[]
  brandingConfig  BrandingConfig?
}

model BrandingConfig {
  id               String   @id @default(uuid())
  organizationId   String   @unique
  organization     Organization @relation(fields: [organizationId], references: [id])
  logoUrl          String?
  faviconUrl       String?
  primaryColor     String   @default("#0066cc")
  secondaryColor   String   @default("#333333")
  accentColor      String   @default("#ff6600")
  fontFamily       String   @default("Inter, sans-serif")
  contactEmail     String?
  contactPhone     String?
  website          String?
  pdfFooter        String?
  emailSignature   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// Assessment
model Assessment {
  id                String         @id @default(uuid())
  organizationId    String
  organization      Organization   @relation(fields: [organizationId], references: [id])
  name              String
  description       String?
  type              AssessmentType @default(HIGH_LEVEL)
  status            AssessmentStatus @default(DRAFT)
  overallScore      Float?
  createdById       String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  submittedAt       DateTime?

  // High-level mode
  highLevelResponses HighLevelResponse[]

  // Deep-dive mode
  sites             Site[]

  // Analysis results
  risks             Risk[]
  recommendations   Recommendation[]

  @@index([organizationId])
  @@index([status])
}

enum AssessmentType {
  HIGH_LEVEL
  DEEP_DIVE
  HYBRID
}

enum AssessmentStatus {
  DRAFT
  IN_PROGRESS
  SUBMITTED
  ANALYZED
  COMPLETED
}

// High-Level Assessment
model HighLevelResponse {
  id            String     @id @default(uuid())
  assessmentId  String
  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  category      String     // BCP, Backup, Infrastructure, etc.
  questionId    String
  questionText  String
  response      Boolean?
  notes         String?
  score         Float?
  weight        Float?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@unique([assessmentId, questionId])
  @@index([assessmentId, category])
}

// Deep-Dive Assessment - Hierarchical Structure
model Site {
  id               String     @id @default(uuid())
  assessmentId     String
  assessment       Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  name             String
  description      String?
  siteType         SiteType   @default(CLOUD)
  provider         String?    // AWS, Azure, GCP, On-Prem
  region           String?
  availabilityZone String?
  geographicLocation Json?    // { lat, lng, address }
  isActive         Boolean    @default(true)
  metadata         Json?      // Flexible additional data
  position         Json?      // UI positioning { x, y }
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  systems          System[]

  @@index([assessmentId])
}

enum SiteType {
  CLOUD
  ON_PREMISE
  HYBRID
  EDGE
}

model System {
  id               String         @id @default(uuid())
  siteId           String
  site             Site           @relation(fields: [siteId], references: [id], onDelete: Cascade)
  name             String
  description      String?
  systemType       String?        // Web App, Database, API, etc.
  businessCriticality Criticality @default(TIER_3)
  rpoMinutes       Int?           // Recovery Point Objective
  rtoMinutes       Int?           // Recovery Time Objective
  complianceReqs   String[]       // ["SOC2", "HIPAA"]
  operationalHours String?        // 24/7, Business Hours
  metadata         Json?
  position         Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  components       Component[]

  @@index([siteId])
}

enum Criticality {
  TIER_1  // Mission Critical
  TIER_2  // Business Critical
  TIER_3  // Important
  TIER_4  // Low Priority
}

model Component {
  id               String          @id @default(uuid())
  systemId         String
  system           System          @relation(fields: [systemId], references: [id], onDelete: Cascade)
  name             String
  description      String?
  componentType    ComponentType
  providerService  String?         // EC2, RDS, S3, etc.
  configuration    Json?           // Instance type, size, etc.
  capacity         Json?           // CPU, RAM, storage
  scalingConfig    Json?           // Auto-scaling settings
  isRedundant      Boolean         @default(false)
  redundancyLevel  Int?            // N+1, N+2, etc.
  hasHealthCheck   Boolean         @default(false)
  metadata         Json?
  position         Json?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  services         Service[]
  dependenciesFrom Dependency[]    @relation("DependencySource")
  dependenciesTo   Dependency[]    @relation("DependencyTarget")

  @@index([systemId])
}

enum ComponentType {
  COMPUTE
  STORAGE
  DATABASE
  NETWORK
  LOAD_BALANCER
  CACHE
  MESSAGE_QUEUE
  CDN
  DNS
  FIREWALL
  OTHER
}

model Service {
  id               String      @id @default(uuid())
  componentId      String
  component        Component   @relation(fields: [componentId], references: [id], onDelete: Cascade)
  name             String
  version          String?
  description      String?
  containerImage   String?
  vmImage          String?
  resourceRequirements Json?   // CPU, memory limits
  healthCheckUrl   String?
  port             Int?
  protocol         String?     // HTTP, TCP, gRPC
  environmentVars  Json?       // Non-sensitive env vars
  metadata         Json?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([componentId])
}

model Dependency {
  id             String         @id @default(uuid())
  sourceId       String
  source         Component      @relation("DependencySource", fields: [sourceId], references: [id], onDelete: Cascade)
  targetId       String
  target         Component      @relation("DependencyTarget", fields: [targetId], references: [id], onDelete: Cascade)
  dependencyType DependencyType @default(SYNC)
  protocol       String?        // HTTP, gRPC, TCP
  isRequired     Boolean        @default(true)
  description    String?
  metadata       Json?
  createdAt      DateTime       @default(now())

  @@unique([sourceId, targetId])
  @@index([sourceId])
  @@index([targetId])
}

enum DependencyType {
  SYNC       // Synchronous call
  ASYNC      // Async/queue-based
  DATA       // Data flow only
  CONTROL    // Control plane
}

// Risk & Recommendations
model Risk {
  id               String       @id @default(uuid())
  assessmentId     String
  assessment       Assessment   @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  riskType         RiskType
  severity         Severity
  title            String
  description      String
  affectedEntities Json         // Array of affected site/system/component IDs
  impact           String?
  likelihood       String?      // Low, Medium, High
  mitigation       String?
  detectedAt       DateTime     @default(now())
  status           RiskStatus   @default(OPEN)
  resolvedAt       DateTime?

  @@index([assessmentId, severity])
  @@index([status])
}

enum RiskType {
  SPOF                    // Single Point of Failure
  CAPACITY                // Under-provisioned
  CONFIGURATION           // Misconfiguration
  NETWORK                 // Network risk
  DATA                    // Data loss risk
  COMPLIANCE              // Compliance gap
  PROVIDER_CONCENTRATION  // All eggs in one basket
  GEOGRAPHIC_CONCENTRATION
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}

enum RiskStatus {
  OPEN
  ACKNOWLEDGED
  MITIGATED
  ACCEPTED
  RESOLVED
}

model Recommendation {
  id               String              @id @default(uuid())
  assessmentId     String
  assessment       Assessment          @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  category         String              // Redundancy, Backup, Architecture, etc.
  priority         Priority
  title            String
  description      String
  rationale        String?
  implementation   String?             // How to implement
  estimatedEffort  String?             // Hours/Days/Weeks
  estimatedCost    String?             // $, $$, $$$
  expectedBenefit  String?
  affectedEntities Json                // Site/system/component IDs
  status           RecommendationStatus @default(PENDING)
  userResponse     String?
  respondedAt      DateTime?
  createdAt        DateTime            @default(now())

  @@index([assessmentId, priority])
  @@index([status])
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum RecommendationStatus {
  PENDING
  ACCEPTED
  REJECTED
  IN_PROGRESS
  COMPLETED
}

// Audit Log
model AuditLog {
  id             String   @id @default(uuid())
  organizationId String
  userId         String?
  action         String   // CREATE_ASSESSMENT, UPDATE_SITE, etc.
  entityType     String   // Assessment, Site, System, etc.
  entityId       String
  changes        Json?    // Before/after values
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([entityType, entityId])
}
```

---

## API Design Patterns

### RESTful Conventions
- **GET** `/api/resource` - List resources (with pagination)
- **POST** `/api/resource` - Create resource
- **GET** `/api/resource/:id` - Get single resource
- **PATCH** `/api/resource/:id` - Partial update
- **PUT** `/api/resource/:id` - Full replace (rarely used)
- **DELETE** `/api/resource/:id` - Delete resource

### Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}

// List Response with Pagination
{
  "success": true,
  "data": [ /* array of resources */ ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalCount": 100
    }
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Authentication Flow
1. User submits credentials to `POST /api/auth/login`
2. Server validates credentials, generates JWT
3. Response includes access token (15min) and refresh token (7 days)
4. Client includes access token in `Authorization: Bearer <token>` header
5. On token expiry, client uses refresh token at `POST /api/auth/refresh`
6. Server validates refresh token, issues new access token

### Multi-Tenant Isolation
- Extract organization ID from JWT claims
- Attach to request context via middleware
- All database queries automatically filter by organization ID
- Prisma middleware enforces tenant isolation

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- TLS 1.3 encryption
- HTTPS only (HSTS headers)
- Rate limiting per IP/user

**Layer 2: Application**
- Helmet.js security headers
- CORS whitelist
- CSP headers
- Input validation (Zod)
- Output encoding
- Prepared statements (Prisma)

**Layer 3: Authentication**
- bcrypt password hashing (cost factor 12)
- JWT with short expiry
- Refresh token rotation
- MFA support (TOTP)
- Account lockout after failed attempts

**Layer 4: Authorization**
- RBAC (Role-Based Access Control)
- Resource-level permissions
- Tenant isolation

**Layer 5: Data**
- Encryption at rest (PostgreSQL)
- Encrypted backups
- Audit logging
- PII redaction in logs

### XSS Prevention Strategy

**Input Handling**:
```typescript
// Validate all inputs with Zod
const siteSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: z.enum(['AWS', 'AZURE', 'GCP', 'ON_PREM'])
});

// Sanitize HTML inputs (if accepting rich text)
import DOMPurify from 'isomorphic-dompurify';
const cleanHtml = DOMPurify.sanitize(userInput);
```

**Output Handling**:
```typescript
// React automatically escapes JSX
<div>{userProvidedData}</div> // Safe

// Dangerous pattern (avoid):
<div dangerouslySetInnerHTML={{__html: data}} /> // Only use with sanitized data
```

**CSP Headers**:
```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize inline scripts
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

---

## Analysis Engine Architecture

### SPOF Detection Algorithm

```typescript
interface SPOFAnalysisResult {
  spofs: SPOF[];
  criticalPaths: CriticalPath[];
}

interface SPOF {
  componentId: string;
  type: 'component' | 'site' | 'system';
  severity: Severity;
  impactedSystems: string[];
  reason: string;
}

// Detection logic:
function detectSPOFs(assessment: Assessment): SPOF[] {
  const spofs: SPOF[] = [];

  // 1. Non-redundant components in critical systems
  for (const site of assessment.sites) {
    for (const system of site.systems) {
      if (system.businessCriticality === 'TIER_1') {
        for (const component of system.components) {
          if (!component.isRedundant || component.redundancyLevel < 2) {
            spofs.push({
              componentId: component.id,
              type: 'component',
              severity: 'CRITICAL',
              impactedSystems: [system.id],
              reason: `Critical component "${component.name}" lacks redundancy`
            });
          }
        }
      }
    }
  }

  // 2. Single-site systems (no geographic redundancy)
  const systemSiteCounts = new Map<string, Set<string>>();
  for (const site of assessment.sites) {
    for (const system of site.systems) {
      if (!systemSiteCounts.has(system.id)) {
        systemSiteCounts.set(system.id, new Set());
      }
      systemSiteCounts.get(system.id)!.add(site.id);
    }
  }

  for (const [systemId, siteIds] of systemSiteCounts) {
    if (siteIds.size === 1) {
      const system = findSystemById(systemId);
      if (system.businessCriticality !== 'TIER_4') {
        spofs.push({
          componentId: systemId,
          type: 'system',
          severity: 'HIGH',
          impactedSystems: [systemId],
          reason: `System "${system.name}" exists in only one site`
        });
      }
    }
  }

  // 3. Provider concentration
  const providerComponents = new Map<string, number>();
  for (const site of assessment.sites) {
    const provider = site.provider || 'UNKNOWN';
    providerComponents.set(provider, (providerComponents.get(provider) || 0) + 1);
  }

  const totalComponents = assessment.sites.length;
  for (const [provider, count] of providerComponents) {
    if (count / totalComponents > 0.8) { // 80% threshold
      spofs.push({
        componentId: 'PROVIDER_' + provider,
        type: 'site',
        severity: 'HIGH',
        impactedSystems: [],
        reason: `${Math.round(count/totalComponents*100)}% of infrastructure on ${provider}`
      });
    }
  }

  return spofs;
}
```

### Recommendation Engine

```typescript
interface RecommendationRule {
  condition: (assessment: Assessment) => boolean;
  generate: (assessment: Assessment) => Recommendation[];
}

const recommendationRules: RecommendationRule[] = [
  // Rule: Suggest multi-AZ for single-AZ components
  {
    condition: (assessment) => {
      return assessment.sites.some(site =>
        site.provider === 'AWS' && !site.availabilityZone.includes(',')
      );
    },
    generate: (assessment) => {
      const recommendations: Recommendation[] = [];
      for (const site of assessment.sites) {
        if (site.provider === 'AWS' && !site.availabilityZone?.includes(',')) {
          recommendations.push({
            category: 'Redundancy',
            priority: 'HIGH',
            title: `Deploy ${site.name} across multiple Availability Zones`,
            description: `Site "${site.name}" is deployed in a single AZ, creating a SPOF.`,
            rationale: 'AWS AZs are isolated failure domains. Multi-AZ deployment protects against AZ-level outages.',
            implementation: '1. Provision resources in 2+ AZs\n2. Configure load balancing\n3. Set up cross-AZ replication',
            estimatedEffort: '2-5 days',
            estimatedCost: '$$',
            expectedBenefit: 'Eliminates AZ-level SPOF, improves availability to 99.99%'
          });
        }
      }
      return recommendations;
    }
  },

  // Rule: Suggest cross-region for mission-critical systems
  {
    condition: (assessment) => {
      return assessment.sites.filter(s => s.systems.some(sys => sys.businessCriticality === 'TIER_1')).length < 2;
    },
    generate: (assessment) => {
      const criticalSystems = assessment.sites
        .flatMap(s => s.systems)
        .filter(sys => sys.businessCriticality === 'TIER_1');

      return [{
        category: 'Redundancy',
        priority: 'CRITICAL',
        title: 'Implement cross-region disaster recovery for Tier 1 systems',
        description: `${criticalSystems.length} mission-critical system(s) lack geographic redundancy.`,
        rationale: 'Region-level outages, though rare, have occurred. Cross-region DR ensures business continuity.',
        implementation: '1. Select secondary region\n2. Set up data replication\n3. Deploy hot/warm standby\n4. Configure failover automation',
        estimatedEffort: '4-8 weeks',
        estimatedCost: '$$$',
        expectedBenefit: 'Protects against region-level outages, supports <1 hour RTO'
      }];
    }
  }

  // Additional rules...
];

function generateRecommendations(assessment: Assessment): Recommendation[] {
  const allRecommendations: Recommendation[] = [];

  for (const rule of recommendationRules) {
    if (rule.condition(assessment)) {
      allRecommendations.push(...rule.generate(assessment));
    }
  }

  // Deduplicate and prioritize
  return deduplicateAndPrioritize(allRecommendations);
}
```

---

## PDF Generation Architecture

### Technology Stack
- **Puppeteer**: Headless Chrome for HTML-to-PDF
- **Handlebars**: Template engine
- **Chart.js**: Chart generation (rendered to canvas, then to image)

### Generation Flow
1. Collect assessment data from database
2. Run analysis to get risks, SPOFs, recommendations
3. Generate chart images (Chart.js → Canvas → PNG)
4. Compile data into template context
5. Render Handlebars template to HTML
6. Launch Puppeteer, load HTML
7. Generate PDF with page breaks, headers, footers
8. Store PDF in storage (filesystem or S3)
9. Return download URL

### Template Structure
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* PDF-optimized CSS */
    @page {
      size: Letter;
      margin: 0.75in;
    }
    .page-break { page-break-after: always; }
    /* Branding styles injected dynamically */
  </style>
</head>
<body>
  <header>
    <img src="{{brandingLogo}}" alt="Logo" />
    <h1>Disaster Recovery Assessment Report</h1>
    <p>{{organizationName}} - {{assessmentDate}}</p>
  </header>

  <section class="executive-summary">
    <h2>Executive Summary</h2>
    <div class="score-gauge">
      <img src="{{scoreGaugeImage}}" />
    </div>
    <p>Overall Readiness Score: <strong>{{overallScore}}/100</strong></p>
    <!-- ... -->
  </section>

  <div class="page-break"></div>

  <section class="risk-analysis">
    <h2>Risk Analysis</h2>
    {{#each risks}}
      <div class="risk-item severity-{{severity}}">
        <h3>{{title}}</h3>
        <p>{{description}}</p>
      </div>
    {{/each}}
  </section>

  <!-- More sections... -->

  <footer>
    <p>{{brandingFooter}}</p>
    <p>Page <span class="pageNumber"></span> of <span class="totalPages"></span></p>
  </footer>
</body>
</html>
```

---

## Frontend State Management

### Redux Toolkit Structure

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api/api';
import authReducer from './features/auth/authSlice';
import assessmentReducer from './features/assessment/assessmentSlice';
import uiReducer from './features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    assessment: assessmentReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### RTK Query API

```typescript
// api/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Assessment', 'Site', 'System', 'Component', 'Risk', 'Recommendation'],
  endpoints: (builder) => ({
    // Assessments
    getAssessments: builder.query<Assessment[], void>({
      query: () => '/assessments',
      providesTags: ['Assessment']
    }),
    createAssessment: builder.mutation<Assessment, CreateAssessmentDto>({
      query: (body) => ({
        url: '/assessments',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Assessment']
    }),
    // Sites
    createSite: builder.mutation<Site, CreateSiteDto>({
      query: ({ assessmentId, ...body }) => ({
        url: `/assessments/${assessmentId}/sites`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Site']
    }),
    // ... more endpoints
  })
});

export const {
  useGetAssessmentsQuery,
  useCreateAssessmentMutation,
  useCreateSiteMutation
  // ... more hooks
} = api;
```

---

## Performance Optimization

### Database
- Indexes on frequently queried fields
- Connection pooling (Prisma)
- Query result caching (Redis)
- Lazy loading of related entities
- Database read replicas for reporting

### API
- Response compression (gzip)
- ETags for conditional requests
- Pagination (limit/offset)
- Field selection (`?fields=id,name`)
- Background job queue for heavy operations

### Frontend
- Code splitting (React.lazy)
- Route-based chunking
- Asset optimization (Vite)
- Image lazy loading
- Virtual scrolling for large lists (react-window)
- Memoization (useMemo, React.memo)
- Debouncing user inputs

### Caching Strategy
- **Browser**: Cache static assets (1 year)
- **CDN**: Distribute static assets
- **Redis**: Cache API responses (5-60 minutes)
- **In-Memory**: Cache config/branding (application lifetime)

---

## Deployment Architecture

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dr_assessment
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/dr_assessment
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

### Production Deployment
- **Frontend**: Static hosting (Vercel, Netlify, CloudFront + S3)
- **Backend**: Containerized (ECS, Kubernetes, Cloud Run)
- **Database**: Managed PostgreSQL (RDS, Cloud SQL, Azure Database)
- **Cache**: Managed Redis (ElastiCache, Cloud Memorystore)
- **CDN**: CloudFront, Cloudflare
- **SSL**: Let's Encrypt or cloud-managed certificates

---

## Monitoring & Observability

### Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dr-assessment-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Checks
```typescript
// GET /health
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Metrics
- Request rate (requests/second)
- Error rate (%)
- Response time (p50, p95, p99)
- Database connection pool usage
- Cache hit rate
- Queue depth

---

## Conclusion

This architecture provides a solid foundation for a production-grade, scalable, secure disaster recovery assessment platform. The modular design allows for incremental development and easy maintenance, while the comprehensive security measures ensure data protection and compliance.
