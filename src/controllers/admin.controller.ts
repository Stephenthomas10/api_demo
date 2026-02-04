import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectsService } from '../services/projects.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

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

export async function listAllProjects(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = paginationSchema.parse(req.query);
    const result = await projectsService.getAllProjects(pagination);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await projectsService.adminDeleteProject(id);
    sendSuccess(res, { message: 'Project deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

export const adminController = {
  listAllProjects,
  deleteProject,
};
