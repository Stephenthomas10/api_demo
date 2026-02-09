/**
 * Password Hasher Port - abstraction for password hashing operations.
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
