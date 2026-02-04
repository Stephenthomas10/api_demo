import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError, Errors } from '../utils/response';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(
      res,
      Errors.UNAUTHORIZED.code,
      'Authentication required. Please provide a valid Bearer token.',
      Errors.UNAUTHORIZED.status
    );
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    sendError(
      res,
      Errors.UNAUTHORIZED.code,
      'Invalid or expired token.',
      Errors.UNAUTHORIZED.status
    );
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendError(
      res,
      Errors.UNAUTHORIZED.code,
      'Authentication required.',
      Errors.UNAUTHORIZED.status
    );
    return;
  }

  if (req.user.role !== 'admin') {
    sendError(
      res,
      Errors.FORBIDDEN.code,
      'Admin access required.',
      Errors.FORBIDDEN.status
    );
    return;
  }

  next();
}
