import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { Errors } from '../utils/response';

const prisma = new PrismaClient();

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

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError(
      Errors.CONFLICT.code,
      'A user with this email already exists.',
      Errors.CONFLICT.status
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
    },
  });

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(
      Errors.UNAUTHORIZED.code,
      'Invalid email or password.',
      Errors.UNAUTHORIZED.status
    );
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError(
      Errors.UNAUTHORIZED.code,
      'Invalid email or password.',
      Errors.UNAUTHORIZED.status
    );
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getCurrentUser(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(
      Errors.NOT_FOUND.code,
      'User not found.',
      Errors.NOT_FOUND.status
    );
  }

  return sanitizeUser(user);
}

function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    role: user.role,
  };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export const authService = {
  register,
  login,
  getCurrentUser,
};
