import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';

describe('Assessment Workflow Integration Tests', () => {
  const app = createApp();
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let assessmentId: string;
  let siteId: string;
  let systemId: string;
  let componentId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'test-integration@example.com' }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: { email: 'test-integration@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('1. Authentication Flow', () => {
    it('should register a new user and organization', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-integration@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'Test Organization'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test-integration@example.com');

      authToken = response.body.data.accessToken;
      userId = response.body.data.user.id;
      organizationId = response.body.data.user.organizationId;
    });

    it('should login with existing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-integration@example.com',
          password: 'Test123!@#'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      authToken = response.body.data.accessToken;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test-integration@example.com');
    });
  });

  describe('2. Assessment Creation and Management', () => {
    it('should create a new assessment', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Assessment',
          description: 'Testing full workflow',
          type: 'HYBRID'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test Assessment');
      expect(response.body.data.type).toBe('HYBRID');
      expect(response.body.data.status).toBe('DRAFT');

      assessmentId = response.body.data.id;
    });

    it('should list assessments', async () => {
      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get assessment details', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(assessmentId);
    });

    it('should update assessment', async () => {
      const response = await request(app)
        .patch(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
    });
  });

  describe('3. High-Level Assessment Flow', () => {
    it('should update high-level responses', async () => {
      const response = await request(app)
        .put(`/api/assessments/${assessmentId}/high-level`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          responses: {
            'bcp_001': true,
            'bcp_002': false,
            'backup_001': true
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get high-level responses', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/high-level`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should calculate high-level score', async () => {
      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/high-level/calculate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallScore).toBeDefined();
      expect(response.body.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('4. Deep-Dive Infrastructure Mapping', () => {
    it('should create a site', async () => {
      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/sites`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'AWS us-east-1',
          siteType: 'CLOUD',
          provider: 'AWS',
          region: 'us-east-1'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('AWS us-east-1');
      siteId = response.body.data.id;
    });

    it('should list sites', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/sites`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should create a system', async () => {
      const response = await request(app)
        .post(`/api/sites/${siteId}/systems`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Web Application',
          businessCriticality: 'CRITICAL',
          rpoMinutes: 60,
          rtoMinutes: 30
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Web Application');
      systemId = response.body.data.id;
    });

    it('should create a component', async () => {
      const response = await request(app)
        .post(`/api/systems/${systemId}/components`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Load Balancer',
          componentType: 'LOAD_BALANCER',
          isRedundant: true,
          hasHealthCheck: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Load Balancer');
      componentId = response.body.data.id;
    });

    it('should create a service', async () => {
      const response = await request(app)
        .post(`/api/components/${componentId}/services`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'NGINX',
          version: '1.21.0',
          port: 443
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('NGINX');
    });
  });

  describe('5. Analysis and Recommendations', () => {
    it('should run DR analysis', async () => {
      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/analyze`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.risks).toBeInstanceOf(Array);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.data.spofs).toBeInstanceOf(Array);
    });

    it('should list risks', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/risks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get SPOFs', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/spofs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should list recommendations', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/recommendations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('6. Report Generation', () => {
    it('should get report metadata', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/report/metadata`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assessmentId).toBe(assessmentId);
      expect(response.body.data.sections).toBeDefined();
    });

    it('should generate PDF report', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/report/pdf`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate executive summary', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/report/executive-summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });

  describe('7. Cleanup', () => {
    it('should delete assessment', async () => {
      const response = await request(app)
        .delete(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should verify assessment is deleted', async () => {
      await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
