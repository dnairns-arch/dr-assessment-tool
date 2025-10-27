import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import assessmentRoutes from './routes/assessment.routes';
import organizationRoutes from './routes/organization.routes';
import brandingRoutes from './routes/branding.routes';
import siteRoutes from './routes/site.routes';
import systemRoutes from './routes/system.routes';
import componentRoutes from './routes/component.routes';
import serviceRoutes from './routes/service.routes';
import dependencyRoutes from './routes/dependency.routes';
import analysisRoutes from './routes/analysis.routes';
import reportRoutes from './routes/report.routes';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
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
    })
  );

  // CORS
  app.use(
    cors({
      origin: env.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use('/api/', apiLimiter);

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.server.nodeEnv
    });
  });

  // Swagger Documentation UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'DR Assessment Tool API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      }
    })
  );

  // Swagger JSON spec
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api', organizationRoutes); // /api/organizations
  app.use('/api', brandingRoutes); // /api/branding
  app.use('/api', siteRoutes); // /api/assessments/:assessmentId/sites and /api/sites/:id
  app.use('/api', systemRoutes); // /api/sites/:siteId/systems and /api/systems/:id
  app.use('/api', componentRoutes); // /api/systems/:systemId/components and /api/components/:id
  app.use('/api', serviceRoutes); // /api/components/:componentId/services and /api/services/:id
  app.use('/api', dependencyRoutes); // /api/assessments/:assessmentId/dependencies and /api/dependencies
  app.use('/api', analysisRoutes); // /api/assessments/:assessmentId/analyze, /api/risks, /api/recommendations
  app.use('/api', reportRoutes); // /api/assessments/:assessmentId/report

  // API root endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'DR Assessment Tool API',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/auth',
        assessments: '/api/assessments',
        organizations: '/api/organizations',
        branding: '/api/branding',
        sites: '/api/sites',
        systems: '/api/systems',
        components: '/api/components',
        services: '/api/services',
        dependencies: '/api/dependencies',
        analysis: '/api/assessments/:assessmentId/analyze',
        risks: '/api/risks',
        recommendations: '/api/recommendations',
        reports: '/api/assessments/:assessmentId/report',
        docs: '/api/docs',
        health: '/health'
      }
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
