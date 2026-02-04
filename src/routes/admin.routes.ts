import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /admin/projects - List all projects (admin only)
router.get('/projects', adminController.listAllProjects);

// DELETE /admin/projects/:id - Delete any project (admin only)
router.delete('/projects/:id', adminController.deleteProject);

export default router;
