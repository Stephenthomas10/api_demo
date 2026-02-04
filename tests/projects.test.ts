import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Projects Endpoints', () => {
  let userToken: string;
  let user2Token: string;
  let adminToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
      data: {
        name: 'User One',
        email: 'user1@example.com',
        passwordHash,
        role: 'user',
      },
    });
    userId = user1.id;

    await prisma.user.create({
      data: {
        name: 'User Two',
        email: 'user2@example.com',
        passwordHash,
        role: 'user',
      },
    });

    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
      },
    });

    // Get tokens
    const res1 = await request(app)
      .post('/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    userToken = res1.body.data.token;

    const res2 = await request(app)
      .post('/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' });
    user2Token = res2.body.data.token;

    const res3 = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = res3.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'My First Project',
          description: 'A test project',
          status: 'todo',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My First Project');
      expect(res.body.data.ownerId).toBe(userId);
      projectId = res.body.data.id;
    });

    it('should create project with default status', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Project Without Status',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('todo');
    });

    it('should return 400 for short title', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'AB',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/projects')
        .send({
          title: 'Test Project',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /projects', () => {
    it('should list only owned projects', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      res.body.data.items.forEach((project: { ownerId: string }) => {
        expect(project.ownerId).toBe(userId);
      });
    });

    it('should return empty list for user with no projects', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/projects?limit=1&offset=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
      expect(res.body.data.limit).toBe(1);
      expect(res.body.data.offset).toBe(0);
    });
  });

  describe('GET /projects/:id', () => {
    it('should get project by id', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projectId);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/projects/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update project partially', async () => {
      const res = await request(app)
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'doing',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('doing');
      expect(res.body.data.title).toBe('My First Project'); // unchanged
    });

    it('should update multiple fields', async () => {
      const res = await request(app)
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /projects/:id', () => {
    let deleteProjectId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Project to Delete',
        });
      deleteProjectId = res.body.data.id;
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .delete(`/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should delete project', async () => {
      const res = await request(app)
        .delete(`/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const getRes = await request(app)
        .get(`/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /admin/projects', () => {
      it('should list all projects for admin', async () => {
        const res = await request(app)
          .get('/admin/projects')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.items)).toBe(true);
      });

      it('should return 403 for non-admin', async () => {
        const res = await request(app)
          .get('/admin/projects')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('DELETE /admin/projects/:id', () => {
      let adminDeleteProjectId: string;

      beforeAll(async () => {
        // Create a project as user1
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Admin Delete Test',
          });
        adminDeleteProjectId = res.body.data.id;
      });

      it('should allow admin to delete any project', async () => {
        const res = await request(app)
          .delete(`/admin/projects/${adminDeleteProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 403 for non-admin', async () => {
        const res = await request(app)
          .delete(`/admin/projects/${projectId}`)
          .set('Authorization', `Bearer ${user2Token}`);

        expect(res.status).toBe(403);
      });
    });
  });
});
