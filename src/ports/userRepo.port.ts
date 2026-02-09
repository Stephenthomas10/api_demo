import { User } from '@prisma/client';

/**
 * User Repository Port - abstraction for user data access.
 * Services depend on this interface, not the concrete implementation.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User>;
}
