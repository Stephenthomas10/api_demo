import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../src/app';

const prisma = new PrismaClient();

describe('API Infrastructure', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /openapi.json', () => {
    it('should return OpenAPI spec', async () => {
      const res = await request(app).get('/openapi.json');

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBeDefined();
      expect(res.body.info.title).toBe('Project API');
      expect(res.body.info.version).toBeDefined();
      expect(res.body.paths).toBeDefined();
    });

    it('should include auth endpoints in spec', async () => {
      const res = await request(app).get('/openapi.json');

      expect(res.body.paths['/auth/register']).toBeDefined();
      expect(res.body.paths['/auth/login']).toBeDefined();
      expect(res.body.paths['/auth/me']).toBeDefined();
    });

    it('should include project endpoints in spec', async () => {
      const res = await request(app).get('/openapi.json');

      expect(res.body.paths['/projects']).toBeDefined();
      expect(res.body.paths['/projects/{id}']).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

describe('Edge Cases', () => {
  let userToken: string;

  beforeAll(async () => {
    // Clean up and create test user
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: 'Edge Test User',
        email: 'edge@example.com',
        passwordHash,
        role: 'user',
      },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'edge@example.com', password: 'password123' });
    userToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Invalid UUID handling', () => {
    it('should return 404 for invalid UUID on GET /projects/:id', async () => {
      const res = await request(app)
        .get('/projects/not-a-valid-uuid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent UUID on GET /projects/:id', async () => {
      const res = await request(app)
        .get('/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for invalid UUID on PATCH /projects/:id', async () => {
      const res = await request(app)
        .patch('/projects/invalid-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for invalid UUID on DELETE /projects/:id', async () => {
      const res = await request(app)
        .delete('/projects/invalid-uuid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Missing body fields', () => {
    it('should return 400 for empty body on POST /auth/register', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty body on POST /auth/login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing title on POST /projects', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'No title provided' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Malformed Authorization header', () => {
    it('should return 401 for missing Bearer prefix', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', userToken);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for empty Bearer token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
