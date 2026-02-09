import { PrismaClient, User } from '@prisma/client';
import { IUserRepository } from '../ports/userRepo.port';

/**
 * Prisma implementation of IUserRepository.
 */
export function createPrismaUserRepo(prisma: PrismaClient): IUserRepository {
  return {
    async findByEmail(email: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { email } });
    },

    async findById(id: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    async create(data: {
      name: string;
      email: string;
      passwordHash: string;
      role: string;
    }): Promise<User> {
      return prisma.user.create({ data });
    },
  };
}
