import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DR Assessment Tool API',
      version: '1.0.0',
      description:
        'Comprehensive Disaster Recovery Assessment Platform API - Enables organizations to evaluate, plan, and optimize their resilience strategies',
      contact: {
        name: 'API Support',
        email: 'support@dr-assessment.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.server.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.dr-assessment.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 },
            totalCount: { type: 'integer', example: 100 }
          }
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Page number'
        },
        PageSizeParam: {
          in: 'query',
          name: 'pageSize',
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          description: 'Number of items per page'
        },
        SortByParam: {
          in: 'query',
          name: 'sortBy',
          schema: { type: 'string', default: 'createdAt' },
          description: 'Field to sort by'
        },
        SortOrderParam: {
          in: 'query',
          name: 'sortOrder',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          description: 'Sort order'
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication and authorization endpoints' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Branding', description: 'White-label branding configuration' },
      { name: 'Assessments', description: 'Assessment CRUD operations' },
      { name: 'High-Level Assessment', description: 'High-level questionnaire and scoring' },
      { name: 'Sites', description: 'Site management for deep-dive assessments' },
      { name: 'Systems', description: 'System management within sites' },
      { name: 'Components', description: 'Component management within systems' },
      { name: 'Services', description: 'Service management within components' },
      { name: 'Dependencies', description: 'Dependency mapping and visualization' },
      { name: 'Analysis', description: 'Automated risk analysis and SPOF detection' },
      { name: 'Reports', description: 'PDF report generation and export' }
    ]
  },
  apis: ['./src/routes/*.ts'] // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
