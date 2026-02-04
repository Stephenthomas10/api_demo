import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /projects - Create a new project
router.post('/', projectsController.create);

// GET /projects - List user's projects with pagination
router.get('/', projectsController.list);

// GET /projects/:id - Get a specific project by ID
router.get('/:id', projectsController.getById);

// PATCH /projects/:id - Update a project (partial update)
router.patch('/:id', projectsController.update);

// DELETE /projects/:id - Delete a project
router.delete('/:id', projectsController.remove);

export default router;
