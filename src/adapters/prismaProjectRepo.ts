import { PrismaClient, Project } from '@prisma/client';
import { IProjectRepository } from '../ports/projectRepo.port';

/**
 * Prisma implementation of IProjectRepository.
 */
export function createPrismaProjectRepo(prisma: PrismaClient): IProjectRepository {
  return {
    async create(data: {
      title: string;
      description?: string;
      status: string;
      ownerId: string;
    }): Promise<Project> {
      return prisma.project.create({ data });
    },

    async findById(id: string): Promise<Project | null> {
      return prisma.project.findUnique({ where: { id } });
    },

    async findManyByOwner(
      ownerId: string,
      options: { skip: number; take: number }
    ): Promise<Project[]> {
      return prisma.project.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      });
    },

    async countByOwner(ownerId: string): Promise<number> {
      return prisma.project.count({ where: { ownerId } });
    },

    async update(
      id: string,
      data: Partial<{ title: string; description: string; status: string }>
    ): Promise<Project> {
      return prisma.project.update({ where: { id }, data });
    },

    async delete(id: string): Promise<void> {
      await prisma.project.delete({ where: { id } });
    },

    async findManyWithOwner(options: { skip: number; take: number }) {
      return prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    },

    async count(): Promise<number> {
      return prisma.project.count();
    },
  };
}
