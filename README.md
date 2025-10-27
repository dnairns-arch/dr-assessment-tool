# Disaster Recovery Assessment Tool

A comprehensive, enterprise-grade disaster recovery assessment platform that enables organizations to evaluate, plan, and optimize their resilience strategies across single and multi-cloud environments.

## Overview

This tool provides:
- **Rapid High-Level Assessments**: Quick 30-minute organizational DR posture evaluations
- **Deep-Dive Assessments**: Comprehensive system-level analysis with component-level granularity
- **Automated Risk Analysis**: AI-powered SPOF detection, risk identification, and recommendations
- **Multi-Tenant White-Label**: Domain-based branding for MSPs and consultants
- **Professional PDF Reports**: Comprehensive, branded reports with risk analysis and remediation roadmaps
- **Interactive Visualizations**: Drag-and-drop system builder, dependency mapping, and impact simulation

## Features

### Assessment Modes

#### High-Level Assessment
- Checkbox-based questionnaire across 8 major DR categories
- Real-time scoring (0-100 scale) with category breakdowns
- 50+ industry best practice questions
- Executive summary generation
- Benchmark comparisons

#### Deep-Dive Assessment
- Hierarchical infrastructure modeling (Sites → Systems → Components → Services)
- Visual drag-and-drop system builder
- Dependency mapping and visualization
- Component-level configuration tracking
- RPO/RTO target definition
- Compliance requirement mapping

### Automated Analysis

- **SPOF Detection**: Identifies single points of failure at all levels
- **Risk Assessment**: Categorizes and prioritizes risks by severity
- **Recommendation Engine**: Generates actionable, prioritized recommendations
- **Impact Analysis**: Calculates downstream effects of component failures
- **Provider Concentration Analysis**: Identifies multi-cloud opportunities
- **Geographic Distribution Analysis**: Ensures proper regional redundancy

### Reporting

- Professional PDF generation with charts and diagrams
- Executive summaries and detailed technical sections
- Risk heat maps and prioritization matrices
- Remediation roadmaps with effort/cost estimates
- White-label branding support
- Export to JSON/CSV

## Technology Stack

### Backend
- **Node.js 20** with TypeScript
- **Express.js** - REST API framework
- **Prisma** - Type-safe ORM
- **PostgreSQL 15** - Primary database
- **Redis** - Caching and job queues
- **JWT** - Authentication
- **Puppeteer** - PDF generation
- **Bull** - Background job processing

### Frontend (To Be Implemented)
- **React 18** with TypeScript
- **Redux Toolkit** - State management
- **Bootstrap 5** - UI framework
- **React Flow** - Diagram visualization
- **Chart.js / D3.js** - Data visualization
- **Vite** - Build tool

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development
- **GitHub Actions** - CI/CD (future)

## Project Structure

```
dr-assessment-tool/
├── packages/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── config/      # Configuration
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── routes/      # API routes
│   │   │   ├── controllers/ # Route controllers
│   │   │   ├── services/    # Business logic
│   │   │   ├── utils/       # Utilities
│   │   │   ├── app.ts       # Express app
│   │   │   └── server.ts    # Server entry
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── frontend/            # React application (to be implemented)
│   │
│   └── shared/              # Shared types and utilities
│       ├── src/
│       │   ├── types.ts     # TypeScript types
│       │   ├── constants.ts # Shared constants
│       │   └── validators.ts # Zod schemas
│       └── package.json
│
├── docker/                  # Docker configuration
├── docs/                    # Documentation
├── FEATURE_SPECIFICATION.md # Comprehensive feature spec
├── ARCHITECTURE.md          # Technical architecture
├── IMPLEMENTATION_GUIDE.md  # Implementation guide
├── package.json             # Root package.json
└── docker-compose.yml       # Docker Compose config
```

## Getting Started

### Prerequisites

- **Node.js 20+** and npm 10+
- **PostgreSQL 15+**
- **Redis 7+**
- **Docker** (optional, for containerized development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dnairns-arch/dr-assessment-tool.git
   cd dr-assessment-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

   Edit `packages/backend/.env` and configure:
   - Database connection string
   - Redis URL
   - JWT secrets (IMPORTANT: Change in production!)
   - CORS origins

4. **Start PostgreSQL and Redis**

   **Option A: Using Docker Compose**
   ```bash
   npm run docker:up
   ```

   **Option B: Local installation**
   - Start PostgreSQL on port 5432
   - Start Redis on port 6379

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database**
   ```bash
   npm run prisma:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   The backend will be available at http://localhost:3000

### Default Credentials

After seeding, you can log in with:

**Admin User:**
- Email: `admin@demo.com`
- Password: `Admin123!`

**Assessor User:**
- Email: `assessor@demo.com`
- Password: `Assessor123!`

## Development

### Running the Backend

```bash
# Development mode with hot reload
npm run dev:backend

# Build for production
npm run build:backend

# Start production build
npm run start:backend
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Reset database (WARNING: deletes all data)
cd packages/backend
npx prisma migrate reset
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## API Documentation

### Health Check

```
GET /health
```

Returns server health status.

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Assessments

```
GET    /api/assessments
POST   /api/assessments
GET    /api/assessments/:id
PATCH  /api/assessments/:id
DELETE /api/assessments/:id
```

### High-Level Assessment

```
GET  /api/assessments/:id/high-level
PUT  /api/assessments/:id/high-level
POST /api/assessments/:id/high-level/calculate
```

### Deep-Dive Assessment

```
GET    /api/assessments/:id/sites
POST   /api/assessments/:id/sites
GET    /api/sites/:id
PATCH  /api/sites/:id
DELETE /api/sites/:id

GET    /api/sites/:siteId/systems
POST   /api/sites/:siteId/systems
GET    /api/systems/:id
PATCH  /api/systems/:id
DELETE /api/systems/:id

GET    /api/systems/:systemId/components
POST   /api/systems/:systemId/components
GET    /api/components/:id
PATCH  /api/components/:id
DELETE /api/components/:id

GET    /api/components/:componentId/services
POST   /api/components/:componentId/services
GET    /api/services/:id
PATCH  /api/services/:id
DELETE /api/services/:id
```

### Analysis

```
POST /api/assessments/:id/analyze
GET  /api/assessments/:id/risks
GET  /api/assessments/:id/spofs
GET  /api/assessments/:id/recommendations
```

### Reports

```
GET /api/assessments/:id/pdf
GET /api/assessments/:id/export
```

See [API Documentation](./docs/API.md) for complete details.

## Security

This application implements comprehensive security measures:

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation on all inputs
- **XSS Protection**: Input sanitization and CSP headers
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **Rate Limiting**: Prevents brute force and DoS attacks
- **CORS**: Configurable origin whitelist
- **Helmet.js**: Security headers (HSTS, CSP, etc.)
- **Secure Password Storage**: bcrypt with cost factor 12
- **Audit Logging**: All actions logged for compliance

### Security Best Practices

1. **Change default secrets** in `.env` before deploying to production
2. **Use HTTPS** in production (TLS 1.3)
3. **Enable MFA** for admin accounts
4. **Regular security audits** with `npm audit`
5. **Keep dependencies updated**
6. **Review audit logs** regularly
7. **Implement backup encryption**

## Deployment

### Docker Deployment

1. **Build images**
   ```bash
   docker-compose build
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec backend npm run prisma:migrate:deploy
   ```

### Production Deployment

For production deployment to cloud platforms, see:
- [Deployment Guide](./docs/DEPLOYMENT.md)
- Cloud-specific guides for AWS, Azure, GCP

### Environment Variables for Production

Ensure you set these in production:

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
REDIS_URL=<production-redis-url>
JWT_SECRET=<strong-secret-key>
JWT_REFRESH_SECRET=<another-strong-secret-key>
CORS_ORIGIN=https://yourdomain.com
```

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run backend tests only
npm run test:backend

# Run frontend tests only (when implemented)
npm run test:frontend
```

## Performance

Expected performance metrics:

- API response time: < 200ms (p95)
- Dashboard load time: < 2s
- PDF generation: < 30s for comprehensive reports
- Supports: 100+ concurrent users per tenant
- Handles: 1000+ component assessments

Optimization features:
- Redis caching for frequently accessed data
- Database query optimization with indexes
- Connection pooling
- Async job processing for heavy operations
- CDN for static assets (production)

## Monitoring

The application includes:

- **Health check endpoint**: `/health`
- **Structured logging**: Winston with JSON format
- **Error tracking**: Comprehensive error handling
- **Audit logging**: All user actions tracked
- **Metrics**: Request rate, error rate, response times

Integrate with:
- Application Performance Monitoring (APM) tools
- Log aggregation services (ELK, Splunk, DataDog)
- Error tracking (Sentry)

## Multi-Tenancy

The application supports multi-tenancy with:

- **Tenant isolation**: Row-level security at database level
- **White-label branding**: Custom logos, colors, domains per tenant
- **Subdomain support**: `tenant1.dr-assessment.com`
- **Custom domain support**: `assessment.customdomain.com`
- **Per-tenant rate limits**
- **Audit trail separation**

## Compliance

The assessment tool helps organizations demonstrate compliance with:

- SOC 2 Type II
- ISO 27001
- NIST Cybersecurity Framework
- HIPAA (healthcare)
- PCI DSS (payment processing)
- GDPR (data protection)

Reports include compliance gap analysis and evidence generation.

## Roadmap

### Phase 1 (Current)
- ✅ Backend API infrastructure
- ✅ Database schema and models
- ✅ Authentication and authorization
- ✅ Multi-tenant white-label support
- ✅ Security hardening

### Phase 2 (Next)
- ⏳ Frontend React application
- ⏳ High-level assessment UI
- ⏳ Dashboard and visualizations
- ⏳ Basic reporting

### Phase 3
- ⏳ Deep-dive assessment UI
- ⏳ Drag-and-drop system builder
- ⏳ Dependency mapping
- ⏳ Interactive diagrams

### Phase 4
- ⏳ Automated analysis engine
- ⏳ SPOF detection
- ⏳ Recommendation engine
- ⏳ Risk assessment automation

### Phase 5
- ⏳ PDF report generation
- ⏳ Advanced visualizations
- ⏳ Export functionality

### Phase 6 (Future)
- Infrastructure discovery (AWS, Azure, GCP API integration)
- Monitoring tool integration (DataDog, New Relic)
- Continuous DR validation
- Chaos engineering integration
- Mobile application

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Commit with conventional commits
6. Push and create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

For support, please:
- Open an issue on GitHub
- Contact: support@dr-assessment.com
- Documentation: https://docs.dr-assessment.com

## Acknowledgments

- Built with industry best practices for DR/BC
- Inspired by NIST, ISO 27001, and SOC 2 frameworks
- Community feedback and contributions

---

**Built with ❤️ for better disaster recovery planning**
