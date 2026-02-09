import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../ports/passwordHasher.port';

const SALT_ROUNDS = 10;

/**
 * bcrypt implementation of IPasswordHasher.
 */
export const bcryptHasher: IPasswordHasher = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },
};
