import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { requestLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess, sendError, Errors } from './utils/response';
import { validateResponse } from './middleware/validate';
import { generateOpenAPIDocument } from './docs/openapi';
import { HealthCheckDemoResponseSchema } from './docs/schemas';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import projectsRoutes from './routes/projects.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Generate OpenAPI spec once at startup
const openApiSpec = generateOpenAPIDocument();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// OpenAPI / Swagger Documentation
// ============================================================================

// Raw OpenAPI JSON spec
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Swagger UI
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: 'Project API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// ============================================================================
// Response Validation Demo (Development Only)
// ============================================================================

// Demo endpoint to test response validation
app.get(
  '/docs/healthcheck-demo',
  validateResponse(HealthCheckDemoResponseSchema, (req: Request, res: Response) => {
    const shouldBreak = req.query.break === '1';

    if (shouldBreak && env.nodeEnv === 'development') {
      // Intentionally return wrong shape to trigger validation error
      sendSuccess(res, {
        status: 'broken', // Should be 'ok'
        checkedAt: new Date().toISOString(),
        extraField: 'This should not be here', // Extra field
      });
    } else {
      // Return correct shape
      sendSuccess(res, {
        status: 'ok',
        checkedAt: new Date().toISOString(),
      });
    }
  })
);

// API routes
app.use('/auth', authRoutes);
app.use('/projects', projectsRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(
    res,
    Errors.NOT_FOUND.code,
    'The requested resource was not found.',
    Errors.NOT_FOUND.status
  );
});

// Global error handler
app.use(errorHandler);

export default app;
