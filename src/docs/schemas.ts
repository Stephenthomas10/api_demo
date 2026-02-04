import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================================================
// Common Schemas
// ============================================================================

export const ErrorDetailSchema = z
  .object({
    field: z.string(),
    message: z.string(),
  })
  .openapi('ErrorDetail');

export const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.array(ErrorDetailSchema).optional(),
    }),
  })
  .openapi('ErrorResponse');

export const MessageResponseDataSchema = z
  .object({
    message: z.string(),
  })
  .openapi('MessageResponseData');

// Helper to wrap data in success envelope
export function successEnvelope<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

// ============================================================================
// User Schemas
// ============================================================================

export const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['user', 'admin']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('User');

// ============================================================================
// Auth Schemas
// ============================================================================

export const RegisterRequestSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .openapi('RegisterRequest');

export const LoginRequestSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  })
  .openapi('LoginRequest');

export const AuthResponseDataSchema = z
  .object({
    user: UserSchema,
    token: z.string(),
  })
  .openapi('AuthResponseData');

export const AuthResponseSchema = successEnvelope(AuthResponseDataSchema).openapi('AuthResponse');
export const UserResponseSchema = successEnvelope(UserSchema).openapi('UserResponse');

// ============================================================================
// Project Schemas
// ============================================================================

export const ProjectStatusSchema = z.enum(['todo', 'doing', 'done']).openapi('ProjectStatus');

export const ProjectIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ProjectSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: ProjectStatusSchema,
    ownerId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('Project');

export const ProjectWithOwnerSchema = ProjectSchema.extend({
  owner: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
}).openapi('ProjectWithOwner');

export const CreateProjectRequestSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    status: ProjectStatusSchema.optional(),
  })
  .openapi('CreateProjectRequest');

export const UpdateProjectRequestSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().optional(),
    status: ProjectStatusSchema.optional(),
  })
  .openapi('UpdateProjectRequest');

export const ProjectResponseSchema = successEnvelope(ProjectSchema).openapi('ProjectResponse');

export const ProjectListResponseDataSchema = z
  .object({
    items: z.array(ProjectSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi('ProjectListResponseData');

export const ProjectListResponseSchema = successEnvelope(ProjectListResponseDataSchema).openapi(
  'ProjectListResponse'
);

export const ProjectWithOwnerListResponseDataSchema = z
  .object({
    items: z.array(ProjectWithOwnerSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi('ProjectWithOwnerListResponseData');

export const ProjectWithOwnerListResponseSchema = successEnvelope(
  ProjectWithOwnerListResponseDataSchema
).openapi('ProjectWithOwnerListResponse');

export const DeleteResponseSchema = successEnvelope(MessageResponseDataSchema).openapi(
  'DeleteResponse'
);

// ============================================================================
// Health Check Schemas
// ============================================================================

export const HealthCheckDataSchema = z
  .object({
    status: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi('HealthCheckData');

export const HealthCheckResponseSchema = successEnvelope(HealthCheckDataSchema).openapi(
  'HealthCheckResponse'
);

// ============================================================================
// Pagination Query Schemas
// ============================================================================

export const PaginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .openapi({
      description: 'Maximum number of items to return (1-50)',
      example: '10',
    }),
  offset: z
    .string()
    .optional()
    .openapi({
      description: 'Number of items to skip',
      example: '0',
    }),
});

// ============================================================================
// Demo Schemas (for validation testing)
// ============================================================================

export const HealthCheckDemoQuerySchema = z.object({
  break: z
    .string()
    .optional()
    .openapi({
      description: 'Set to "1" to intentionally break the response schema (dev only)',
      example: '1',
    }),
});

export const HealthCheckDemoResponseSchema = successEnvelope(
  z.object({
    status: z.literal('ok'),
    checkedAt: z.string().datetime(),
  })
).openapi('HealthCheckDemoResponse');
