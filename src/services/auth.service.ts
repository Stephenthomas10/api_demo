import { User } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Errors } from '../utils/response';
import { IUserRepository } from '../ports/userRepo.port';
import { IPasswordHasher } from '../ports/passwordHasher.port';
import { ITokenSigner } from '../ports/tokenSigner.port';
import { prisma, createPrismaUserRepo, bcryptHasher, jwtTokenSigner } from '../adapters';

// ============================================================================
// Types (unchanged - same exports as before)
// ============================================================================

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// ============================================================================
// Dependencies interface for DI
// ============================================================================

export interface AuthServiceDeps {
  userRepo: IUserRepository;
  passwordHasher: IPasswordHasher;
  tokenSigner: ITokenSigner;
}

// ============================================================================
// Auth Service Interface (for type safety)
// ============================================================================

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  getCurrentUser(userId: string): Promise<UserResponse>;
}

// ============================================================================
// Helper function (internal)
// ============================================================================

function sanitizeUser(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ============================================================================
// Factory function (DIP-compliant)
// ============================================================================

/**
 * Factory function to create an auth service with injected dependencies.
 * Use this for testing or custom configurations.
 */
export function makeAuthService(deps: AuthServiceDeps): IAuthService {
  const { userRepo, passwordHasher, tokenSigner } = deps;

  async function register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await userRepo.findByEmail(input.email);

    if (existingUser) {
      throw new AppError(
        Errors.CONFLICT.code,
        'A user with this email already exists.',
        Errors.CONFLICT.status
      );
    }

    const passwordHash = await passwordHasher.hash(input.password);

    const user = await userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
    });

    const token = tokenSigner.sign({ userId: user.id, role: user.role });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  async function login(input: LoginInput): Promise<AuthResponse> {
    const user = await userRepo.findByEmail(input.email);

    if (!user) {
      throw new AppError(
        Errors.UNAUTHORIZED.code,
        'Invalid email or password.',
        Errors.UNAUTHORIZED.status
      );
    }

    const isValidPassword = await passwordHasher.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(
        Errors.UNAUTHORIZED.code,
        'Invalid email or password.',
        Errors.UNAUTHORIZED.status
      );
    }

    const token = tokenSigner.sign({ userId: user.id, role: user.role });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  async function getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new AppError(
        Errors.NOT_FOUND.code,
        'User not found.',
        Errors.NOT_FOUND.status
      );
    }

    return sanitizeUser(user);
  }

  return {
    register,
    login,
    getCurrentUser,
  };
}

// ============================================================================
// Default instance (backward compatible export)
// ============================================================================

const defaultDeps: AuthServiceDeps = {
  userRepo: createPrismaUserRepo(prisma),
  passwordHasher: bcryptHasher,
  tokenSigner: jwtTokenSigner,
};

const defaultAuthService = makeAuthService(defaultDeps);

// Export individual functions for backward compatibility
export const register = defaultAuthService.register;
export const login = defaultAuthService.login;
export const getCurrentUser = defaultAuthService.getCurrentUser;

// Export the service object (used by controllers)
export const authService = defaultAuthService;
