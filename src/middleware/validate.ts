import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { sendError, Errors } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ============================================================================
// Request Validation Middleware
// ============================================================================

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Middleware to validate request body, query params, and route params using Zod schemas.
 * Returns 400 VALIDATION_ERROR if validation fails.
 */
export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
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
      next(error);
    }
  };
}

// ============================================================================
// Response Validation Middleware (Development Only)
// ============================================================================

/**
 * Wraps a handler to validate its response against a Zod schema.
 * In development mode:
 *   - If response doesn't match schema, returns 500 INTERNAL_ERROR with validation details
 *   - Logs a clear error message
 * In production mode:
 *   - Skips validation for performance
 */
export function validateResponse<T extends ZodTypeAny>(
  responseSchema: T,
  handler: RequestHandler
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // In production, skip response validation
    if (env.nodeEnv !== 'development') {
      return handler(req, res, next);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    let responseSent = false;

    // Override json method to capture and validate response
    res.json = function (body: unknown): Response {

      // Only validate if status is 2xx (success responses)
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        const result = responseSchema.safeParse(body);

        if (!result.success) {
          // Log the validation error
          logger.error('Response validation failed', {
            path: req.path,
            method: req.method,
            statusCode,
            errors: result.error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
              received: e.code === 'invalid_type' ? (e as { received?: unknown }).received : undefined,
            })),
            responseBody: JSON.stringify(body).slice(0, 500), // Truncate for logging
          });

          // Return 500 with validation error details
          if (!responseSent) {
            responseSent = true;
            res.status(500);
            return originalJson({
              success: false,
              error: {
                code: Errors.INTERNAL_ERROR.code,
                message: 'Response validation failed',
                details: result.error.errors.map((e) => ({
                  field: e.path.join('.'),
                  message: e.message,
                })),
              },
            });
          }
        }
      }

      // Response is valid or non-2xx, send it
      if (!responseSent) {
        responseSent = true;
        return originalJson(body);
      }

      return res;
    };

    try {
      await Promise.resolve(handler(req, res, next));
    } catch (error) {
      // Restore original json in case of error
      res.json = originalJson;
      next(error);
    }
  };
}

/**
 * Convenience function to create a validated handler.
 * Combines request validation and response validation.
 */
export function validated<TResponse extends ZodTypeAny>(
  schemas: ValidationSchemas & { response?: TResponse },
  handler: RequestHandler
): RequestHandler[] {
  const middlewares: RequestHandler[] = [];

  // Add request validation if any request schemas provided
  if (schemas.body || schemas.query || schemas.params) {
    middlewares.push(
      validateRequest({
        body: schemas.body,
        query: schemas.query,
        params: schemas.params,
      })
    );
  }

  // Wrap handler with response validation if response schema provided
  if (schemas.response) {
    middlewares.push(validateResponse(schemas.response, handler));
  } else {
    middlewares.push(handler);
  }

  return middlewares;
}
