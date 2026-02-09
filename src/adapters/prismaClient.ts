import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient instance for production use.
 * Adapters use this instead of creating their own instances.
 */
export const prisma = new PrismaClient();
