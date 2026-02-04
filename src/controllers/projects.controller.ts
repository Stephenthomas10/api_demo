import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectsService } from '../services/projects.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const statusEnum = z.enum(['todo', 'doing', 'done']);

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: statusEnum.optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  status: statusEnum.optional(),
});

const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '10', 10);
      return Math.min(Math.max(1, num), 50); // Clamp between 1 and 50
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '0', 10);
      return Math.max(0, num); // Minimum 0
    }),
});

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const input = createProjectSchema.parse(req.body);
    const project = await projectsService.createProject(req.user.userId, input);
    sendSuccess(res, project, 201);
  } catch (error) {
    next(error);
  }
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const pagination = paginationSchema.parse(req.query);
    const result = await projectsService.getProjectsByOwner(req.user.userId, pagination);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const { id } = req.params;
    const project = await projectsService.getProjectById(id, req.user.userId);
    sendSuccess(res, project, 200);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const { id } = req.params;
    const input = updateProjectSchema.parse(req.body);
    const project = await projectsService.updateProject(id, req.user.userId, input);
    sendSuccess(res, project, 200);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const { id } = req.params;
    await projectsService.deleteProject(id, req.user.userId);
    sendSuccess(res, { message: 'Project deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

export const projectsController = {
  create,
  list,
  getById,
  update,
  remove,
};
