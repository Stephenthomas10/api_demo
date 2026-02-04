import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  UserResponseSchema,
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  ProjectResponseSchema,
  ProjectListResponseSchema,
  ProjectWithOwnerListResponseSchema,
  DeleteResponseSchema,
  HealthCheckResponseSchema,
  ErrorResponseSchema,
  PaginationQuerySchema,
  HealthCheckDemoQuerySchema,
  HealthCheckDemoResponseSchema,
  ProjectIdParamsSchema,
} from './schemas';

export const registry = new OpenAPIRegistry();

// ============================================================================
// Security Schemes
// ============================================================================

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Authorization header. Example: "Authorization: Bearer {token}"',
});

// ============================================================================
// Auth Routes
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  description: 'Create a new user account and receive a JWT token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterRequestSchema,
          example: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword123',
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
          example: {
            success: true,
            data: {
              user: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                createdAt: '2024-01-15T10:30:00.000Z',
                updatedAt: '2024-01-15T10:30:00.000Z',
              },
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [{ field: 'email', message: 'Invalid email format' }],
            },
          },
        },
      },
    },
    409: {
      description: 'Email already exists',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A user with this email already exists.',
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login',
  description: 'Authenticate with email and password to receive a JWT token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
          example: {
            email: 'john@example.com',
            password: 'securepassword123',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password.',
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current user',
  description: 'Get the currently authenticated user\'s information',
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user info',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing token',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// Projects Routes
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/projects',
  tags: ['Projects'],
  summary: 'Create a project',
  description: 'Create a new project for the authenticated user',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProjectRequestSchema,
          example: {
            title: 'My New Project',
            description: 'A description of the project',
            status: 'todo',
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Project created successfully',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
          example: {
            success: true,
            data: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              title: 'My New Project',
              description: 'A description of the project',
              status: 'todo',
              ownerId: '550e8400-e29b-41d4-a716-446655440000',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/projects',
  tags: ['Projects'],
  summary: 'List projects',
  description: 'Get a paginated list of the authenticated user\'s projects',
  security: [{ BearerAuth: [] }],
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      description: 'List of projects',
      content: {
        'application/json': {
          schema: ProjectListResponseSchema,
          example: {
            success: true,
            data: {
              items: [
                {
                  id: '550e8400-e29b-41d4-a716-446655440001',
                  title: 'My Project',
                  description: 'Project description',
                  status: 'doing',
                  ownerId: '550e8400-e29b-41d4-a716-446655440000',
                  createdAt: '2024-01-15T10:30:00.000Z',
                  updatedAt: '2024-01-15T10:30:00.000Z',
                },
              ],
              total: 1,
              limit: 10,
              offset: 0,
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'Get a project',
  description: 'Get a specific project by ID (must be owned by the authenticated user)',
  security: [{ BearerAuth: [] }],
  request: {
    params: ProjectIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Project details',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Not the project owner',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'Update a project',
  description: 'Update a project (partial update, must be owned by the authenticated user)',
  security: [{ BearerAuth: [] }],
  request: {
    params: ProjectIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateProjectRequestSchema,
          example: {
            title: 'Updated Title',
            status: 'doing',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Project updated successfully',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Not the project owner',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'Delete a project',
  description: 'Delete a project (must be owned by the authenticated user)',
  security: [{ BearerAuth: [] }],
  request: {
    params: ProjectIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Project deleted successfully',
      content: {
        'application/json': {
          schema: DeleteResponseSchema,
          example: {
            success: true,
            data: {
              message: 'Project deleted successfully',
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Not the project owner',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// Admin Routes
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/admin/projects',
  tags: ['Admin'],
  summary: 'List all projects (Admin)',
  description: 'Get a paginated list of all projects with owner information (admin only)',
  security: [{ BearerAuth: [] }],
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      description: 'List of all projects with owner info',
      content: {
        'application/json': {
          schema: ProjectWithOwnerListResponseSchema,
          example: {
            success: true,
            data: {
              items: [
                {
                  id: '550e8400-e29b-41d4-a716-446655440001',
                  title: 'User Project',
                  description: 'Project description',
                  status: 'todo',
                  ownerId: '550e8400-e29b-41d4-a716-446655440000',
                  createdAt: '2024-01-15T10:30:00.000Z',
                  updatedAt: '2024-01-15T10:30:00.000Z',
                  owner: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'John Doe',
                    email: 'john@example.com',
                  },
                },
              ],
              total: 1,
              limit: 10,
              offset: 0,
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin role required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/admin/projects/{id}',
  tags: ['Admin'],
  summary: 'Delete any project (Admin)',
  description: 'Delete any project regardless of ownership (admin only)',
  security: [{ BearerAuth: [] }],
  request: {
    params: ProjectIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Project deleted successfully',
      content: {
        'application/json': {
          schema: DeleteResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin role required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// Health Check Routes
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Check if the API is running',
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: HealthCheckResponseSchema,
          example: {
            success: true,
            data: {
              status: 'healthy',
              timestamp: '2024-01-15T10:30:00.000Z',
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/docs/healthcheck-demo',
  tags: ['Health'],
  summary: 'Response validation demo (dev only)',
  description:
    'A demo endpoint to test response validation. Pass ?break=1 to intentionally return an invalid response shape and see the validation error. Only works in development mode.',
  request: {
    query: HealthCheckDemoQuerySchema,
  },
  responses: {
    200: {
      description: 'Valid response',
      content: {
        'application/json': {
          schema: HealthCheckDemoResponseSchema,
          example: {
            success: true,
            data: {
              status: 'ok',
              checkedAt: '2024-01-15T10:30:00.000Z',
            },
          },
        },
      },
    },
    500: {
      description: 'Response validation failed (when ?break=1 in dev mode)',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Response validation failed',
              details: [{ field: 'data.status', message: "Expected 'ok', received 'broken'" }],
            },
          },
        },
      },
    },
  },
});

// ============================================================================
// Generate OpenAPI Document
// ============================================================================

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Project API',
      version: '1.0.0',
      description:
        'REST API demonstrating authentication, authorization, and CRUD operations with Zod validation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Projects', description: 'Project CRUD operations' },
      { name: 'Admin', description: 'Admin-only operations' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
  });
}
