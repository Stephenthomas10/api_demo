import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/response';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function rateLimit(
  windowMs: number = env.rateLimitWindowMs,
  maxRequests: number = env.rateLimitMaxRequests
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(clientKey);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(clientKey, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      sendError(
        res,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later.',
        429
      );
      return;
    }

    next();
  };
}

// More strict rate limit for auth endpoints
export const authRateLimit = rateLimit(15 * 60 * 1000, 20); // 20 requests per 15 minutes
