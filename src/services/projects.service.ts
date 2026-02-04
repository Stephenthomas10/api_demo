import { PrismaClient, Project } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Errors } from '../utils/response';

const prisma = new PrismaClient();

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

export async function createProject(
  ownerId: string,
  input: CreateProjectInput
): Promise<Project> {
  return prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status || 'todo',
      ownerId,
    },
  });
}

export async function getProjectsByOwner(
  ownerId: string,
  pagination: PaginationParams
): Promise<PaginatedResponse<Project>> {
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset,
      take: pagination.limit,
    }),
    prisma.project.count({ where: { ownerId } }),
  ]);

  return {
    items,
    total,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

export async function getProjectById(
  projectId: string,
  ownerId: string
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

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

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

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
  const updateData: Partial<UpdateProjectInput> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });
}

export async function deleteProject(
  projectId: string,
  ownerId: string
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

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

  await prisma.project.delete({
    where: { id: projectId },
  });
}

// Admin functions
export async function getAllProjects(
  pagination: PaginationParams
): Promise<PaginatedResponse<ProjectWithOwner>> {
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset,
      take: pagination.limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.project.count(),
  ]);

  return {
    items,
    total,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

export async function adminDeleteProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(
      Errors.NOT_FOUND.code,
      'Project not found.',
      Errors.NOT_FOUND.status
    );
  }

  await prisma.project.delete({
    where: { id: projectId },
  });
}

export const projectsService = {
  createProject,
  getProjectsByOwner,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
  adminDeleteProject,
};
