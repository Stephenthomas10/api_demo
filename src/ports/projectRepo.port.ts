import { Project } from '@prisma/client';

/**
 * Project Repository Port - abstraction for project data access.
 */
export interface IProjectRepository {
  create(data: {
    title: string;
    description?: string;
    status: string;
    ownerId: string;
  }): Promise<Project>;

  findById(id: string): Promise<Project | null>;

  findManyByOwner(
    ownerId: string,
    options: { skip: number; take: number }
  ): Promise<Project[]>;

  countByOwner(ownerId: string): Promise<number>;

  update(id: string, data: Partial<{ title: string; description: string; status: string }>): Promise<Project>;

  delete(id: string): Promise<void>;

  findManyWithOwner(options: { skip: number; take: number }): Promise<
    Array<
      Project & {
        owner: { id: string; name: string; email: string };
      }
    >
  >;

  count(): Promise<number>;
}
