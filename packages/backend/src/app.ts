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
// Additional routes (to be created):
// import organizationRoutes from './routes/organization.routes';
// import brandingRoutes from './routes/branding.routes';
// import siteRoutes from './routes/site.routes';
// import systemRoutes from './routes/system.routes';
// import componentRoutes from './routes/component.routes';
// import serviceRoutes from './routes/service.routes';
// import dependencyRoutes from './routes/dependency.routes';
// import analysisRoutes from './routes/analysis.routes';
// import reportRoutes from './routes/report.routes';

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

  // Additional routes (to be implemented):
  // app.use('/api/organizations', organizationRoutes);
  // app.use('/api/branding', brandingRoutes);
  // app.use('/api/sites', siteRoutes);
  // app.use('/api/systems', systemRoutes);
  // app.use('/api/components', componentRoutes);
  // app.use('/api/services', serviceRoutes);
  // app.use('/api/dependencies', dependencyRoutes);
  // app.use('/api/analysis', analysisRoutes);
  // app.use('/api/reports', reportRoutes);

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
