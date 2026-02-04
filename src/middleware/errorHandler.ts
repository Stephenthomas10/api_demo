import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError, Errors } from '../utils/response';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error occurred', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(
      res,
      Errors.VALIDATION_ERROR.code,
      'Validation failed',
      Errors.VALIDATION_ERROR.status,
      details
    );
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      sendError(
        res,
        Errors.CONFLICT.code,
        `A record with this ${prismaError.meta?.target?.[0] || 'field'} already exists.`,
        Errors.CONFLICT.status
      );
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(
        res,
        Errors.NOT_FOUND.code,
        'Record not found.',
        Errors.NOT_FOUND.status
      );
      return;
    }
  }

  // Default to internal server error
  sendError(
    res,
    Errors.INTERNAL_ERROR.code,
    'An unexpected error occurred.',
    Errors.INTERNAL_ERROR.status
  );
}
