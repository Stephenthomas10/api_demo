import { Project } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Errors } from '../utils/response';
import { IProjectRepository } from '../ports/projectRepo.port';
import { prisma, createPrismaProjectRepo } from '../adapters';

// ============================================================================
// Types (unchanged - same exports as before)
// ============================================================================

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectWithOwner extends Project {
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// Dependencies interface for DI
// ============================================================================

export interface ProjectsServiceDeps {
  projectRepo: IProjectRepository;
}

// ============================================================================
// Projects Service Interface (for type safety)
// ============================================================================

export interface IProjectsService {
  createProject(ownerId: string, input: CreateProjectInput): Promise<Project>;
  getProjectsByOwner(ownerId: string, pagination: PaginationParams): Promise<PaginatedResponse<Project>>;
  getProjectById(projectId: string, ownerId: string): Promise<Project>;
  updateProject(projectId: string, ownerId: string, input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string, ownerId: string): Promise<void>;
  getAllProjects(pagination: PaginationParams): Promise<PaginatedResponse<ProjectWithOwner>>;
  adminDeleteProject(projectId: string): Promise<void>;
}

// ============================================================================
// Factory function (DIP-compliant)
// ============================================================================

/**
 * Factory function to create a projects service with injected dependencies.
 * Use this for testing or custom configurations.
 */
export function makeProjectsService(deps: ProjectsServiceDeps): IProjectsService {
  const { projectRepo } = deps;

  async function createProject(
    ownerId: string,
    input: CreateProjectInput
  ): Promise<Project> {
    return projectRepo.create({
      title: input.title,
      description: input.description,
      status: input.status || 'todo',
      ownerId,
    });
  }

  async function getProjectsByOwner(
    ownerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Project>> {
    const [items, total] = await Promise.all([
      projectRepo.findManyByOwner(ownerId, {
        skip: pagination.offset,
        take: pagination.limit,
      }),
      projectRepo.countByOwner(ownerId),
    ]);

    return {
      items,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async function getProjectById(
    projectId: string,
    ownerId: string
  ): Promise<Project> {
    const project = await projectRepo.findById(projectId);

    if (!project) {
      throw new AppError(
        Errors.NOT_FOUND.code,
        'Project not found.',
        Errors.NOT_FOUND.status
      );
    }

    if (project.ownerId !== ownerId) {
      throw new AppError(
        Errors.FORBIDDEN.code,
        'You do not have permission to access this project.',
        Errors.FORBIDDEN.status
      );
    }

    return project;
  }

  async function updateProject(
    projectId: string,
    ownerId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    const project = await projectRepo.findById(projectId);

    if (!project) {
      throw new AppError(
        Errors.NOT_FOUND.code,
        'Project not found.',
        Errors.NOT_FOUND.status
      );
    }

    if (project.ownerId !== ownerId) {
      throw new AppError(
        Errors.FORBIDDEN.code,
        'You do not have permission to modify this project.',
        Errors.FORBIDDEN.status
      );
    }

    // Build update data, only including fields that were provided
    const updateData: Partial<{ title: string; description: string; status: string }> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;

    return projectRepo.update(projectId, updateData);
  }

  async function deleteProject(
    projectId: string,
    ownerId: string
  ): Promise<void> {
    const project = await projectRepo.findById(projectId);

    if (!project) {
      throw new AppError(
        Errors.NOT_FOUND.code,
        'Project not found.',
        Errors.NOT_FOUND.status
      );
    }

    if (project.ownerId !== ownerId) {
      throw new AppError(
        Errors.FORBIDDEN.code,
        'You do not have permission to delete this project.',
        Errors.FORBIDDEN.status
      );
    }

    await projectRepo.delete(projectId);
  }

  async function getAllProjects(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ProjectWithOwner>> {
    const [items, total] = await Promise.all([
      projectRepo.findManyWithOwner({
        skip: pagination.offset,
        take: pagination.limit,
      }),
      projectRepo.count(),
    ]);

    return {
      items,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async function adminDeleteProject(projectId: string): Promise<void> {
    const project = await projectRepo.findById(projectId);

    if (!project) {
      throw new AppError(
        Errors.NOT_FOUND.code,
        'Project not found.',
        Errors.NOT_FOUND.status
      );
    }

    await projectRepo.delete(projectId);
  }

  return {
    createProject,
    getProjectsByOwner,
    getProjectById,
    updateProject,
    deleteProject,
    getAllProjects,
    adminDeleteProject,
  };
}

// ============================================================================
// Default instance (backward compatible export)
// ============================================================================

const defaultDeps: ProjectsServiceDeps = {
  projectRepo: createPrismaProjectRepo(prisma),
};

const defaultProjectsService = makeProjectsService(defaultDeps);

// Export individual functions for backward compatibility
export const createProject = defaultProjectsService.createProject;
export const getProjectsByOwner = defaultProjectsService.getProjectsByOwner;
export const getProjectById = defaultProjectsService.getProjectById;
export const updateProject = defaultProjectsService.updateProject;
export const deleteProject = defaultProjectsService.deleteProject;
export const getAllProjects = defaultProjectsService.getAllProjects;
export const adminDeleteProject = defaultProjectsService.adminDeleteProject;

// Export the service object (used by controllers)
export const projectsService = defaultProjectsService;
