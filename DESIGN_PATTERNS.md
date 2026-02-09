# Design Patterns in Project API

This document identifies and explains the software design patterns implemented in this REST API project.

---

## Table of Contents

1. [Creational Patterns](#creational-patterns)
   - [Singleton](#singleton)
   - [Factory](#factory)
2. [Structural Patterns](#structural-patterns)
   - [Adapter](#adapter)
   - [Decorator](#decorator)
3. [Behavioral Patterns](#behavioral-patterns)
   - [Chain of Responsibility](#chain-of-responsibility)
   - [Strategy](#strategy)
4. [Architectural Patterns](#architectural-patterns)
   - [Repository](#repository)
   - [Dependency Injection](#dependency-injection)
   - [Service Layer](#service-layer)
   - [Ports and Adapters (Hexagonal Architecture)](#ports-and-adapters-hexagonal-architecture)

---

## Creational Patterns

### Singleton

**Purpose:** Ensure a class has only one instance and provide a global point of access to it.

**Implementation:** `src/adapters/prismaClient.ts`

```typescript
import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient instance for production use.
 * Prevents multiple database connections.
 */
export const prisma = new PrismaClient();
```

**Why it's used:**
- Prisma recommends using a single client instance to avoid connection pool exhaustion
- Shared across all repository adapters
- Ensures consistent database connection management

**Location:** All repository adapters import this singleton instead of creating their own instances.

---

### Factory

**Purpose:** Define an interface for creating objects, but let subclasses or functions decide which class to instantiate.

**Implementation:** `src/services/auth.service.ts`, `src/services/projects.service.ts`

```typescript
// Factory function signature
export function makeAuthService(deps: AuthServiceDeps): IAuthService {
  const { userRepo, passwordHasher, tokenSigner } = deps;

  return {
    async register(input: RegisterInput) { /* ... */ },
    async login(input: LoginInput) { /* ... */ },
    async getCurrentUser(userId: string) { /* ... */ },
  };
}

// Production instance created with default dependencies
const defaultDeps: AuthServiceDeps = {
  userRepo: createPrismaUserRepo(prisma),
  passwordHasher: bcryptHasher,
  tokenSigner: jwtTokenSigner,
};
const defaultAuthService = makeAuthService(defaultDeps);
export const authService = defaultAuthService;
```

**Why it's used:**
- Enables dependency injection for testing (inject mocks)
- Allows runtime configuration of service dependencies
- Maintains backward compatibility (default export for production)

**Test usage:**
```typescript
const mockAuthService = makeAuthService({
  userRepo: mockUserRepo,
  passwordHasher: mockHasher,
  tokenSigner: mockSigner,
});
```

---

## Structural Patterns

### Adapter

**Purpose:** Convert the interface of a class into another interface clients expect. Allows classes with incompatible interfaces to work together.

**Implementation:** `src/adapters/` directory

```typescript
// Port (interface expected by services)
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

// Adapter (converts Prisma interface to our port interface)
export function createPrismaUserRepo(client: PrismaClient): IUserRepository {
  return {
    async findByEmail(email: string) {
      return client.user.findUnique({ where: { email } });
    },
    async create(data: CreateUserData) {
      return client.user.create({ data });
    },
  };
}
```

**Adapters in the project:**
| Adapter | Adapts From | Adapts To |
|---------|-------------|-----------|
| `prismaUserRepo.ts` | Prisma Client | `IUserRepository` |
| `prismaProjectRepo.ts` | Prisma Client | `IProjectRepository` |
| `bcryptHasher.ts` | bcrypt library | `IPasswordHasher` |
| `jwtTokenSigner.ts` | jsonwebtoken library | `ITokenSigner` |

**Why it's used:**
- Decouples services from specific database/library implementations
- Allows swapping implementations (e.g., from Prisma to TypeORM) without changing service code
- Implements the Dependency Inversion Principle (DIP)

---

### Decorator

**Purpose:** Attach additional responsibilities to an object dynamically without modifying its structure.

**Implementation:** Express middleware wrapping route handlers

```typescript
// Route handler decorated with middleware
app.get(
  '/projects/:id',
  authenticate,           // Decorator 1: adds authentication
  authorize('owner'),     // Decorator 2: adds authorization
  getProjectById          // Original handler
);

// Validation decorator
app.get(
  '/docs/healthcheck-demo',
  validateResponse(HealthCheckDemoResponseSchema, handler) // Wraps handler with validation
);
```

**Why it's used:**
- Adds cross-cutting concerns (auth, validation, logging) without modifying route handler code
- Composable: multiple decorators can be chained
- Separation of concerns: authentication logic separate from business logic

**Decorators used:**
- `authenticate` - adds JWT authentication
- `requireAdmin` - adds role-based authorization
- `validateResponse` - adds response schema validation
- `requestLogger` - adds request/response logging

---

## Behavioral Patterns

### Chain of Responsibility

**Purpose:** Pass a request along a chain of handlers, where each handler decides either to process the request or pass it to the next handler.

**Implementation:** Express middleware chain in `src/app.ts`

```typescript
const app = express();

// Middleware chain - each handler can process or pass to next()
app.use(express.json());              // 1. Parse JSON body
app.use(express.urlencoded());        // 2. Parse URL-encoded body
app.use(requestLogger);               // 3. Log request
app.use('/auth', authRoutes);         // 4. Route to auth handlers
app.use('/projects', projectsRoutes); // 5. Route to project handlers
app.use(notFoundHandler);             // 6. Handle 404s
app.use(errorHandler);                // 7. Handle errors
```

**Route-level chains:**
```typescript
router.get(
  '/',
  authenticate,     // Chain link 1: verify JWT
  requireAdmin,     // Chain link 2: verify admin role
  getAllProjects    // Chain link 3: execute business logic
);
```

**Why it's used:**
- Request processing is broken into discrete, reusable steps
- Each middleware has single responsibility
- Easy to add/remove/reorder middleware

**Chain handlers:**
1. Body parsers
2. Request logger
3. Authentication
4. Authorization
5. Business logic (controllers)
6. Error handler (terminal)

---

### Strategy

**Purpose:** Define a family of algorithms, encapsulate each one, and make them interchangeable at runtime.

**Implementation:** Port interfaces allow swapping implementations

```typescript
// Strategy interface
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

// Strategy 1: bcrypt implementation (current)
export const bcryptHasher: IPasswordHasher = {
  async hash(password: string) {
    return bcrypt.hash(password, 12);
  },
  async compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  },
};

// Strategy 2: Alternative implementation (future)
// Could swap to argon2, scrypt, or other hashing algorithms
export const argon2Hasher: IPasswordHasher = {
  async hash(password: string) {
    return argon2.hash(password);
  },
  async compare(password: string, hash: string) {
    return argon2.verify(hash, password);
  },
};

// Service uses strategy without knowing concrete implementation
const authService = makeAuthService({
  passwordHasher: bcryptHasher, // Can swap to argon2Hasher
});
```

**Strategies in the project:**
| Strategy Interface | Current Implementation | Alternative Implementations |
|-------------------|------------------------|----------------------------|
| `IPasswordHasher` | bcrypt | argon2, scrypt, pbkdf2 |
| `ITokenSigner` | jsonwebtoken | paseto, jose |
| `IUserRepository` | Prisma | TypeORM, MongoDB, in-memory |
| `IProjectRepository` | Prisma | TypeORM, MongoDB, in-memory |

**Why it's used:**
- Algorithm can be selected at runtime via dependency injection
- New implementations can be added without modifying service code
- Testability: swap real implementations with mocks

---

## Architectural Patterns

### Repository

**Purpose:** Mediate between the domain and data mapping layers using a collection-like interface for accessing domain objects.

**Implementation:** `src/ports/userRepo.port.ts`, `src/ports/projectRepo.port.ts`

```typescript
// Repository interface (port)
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

// Service uses repository abstraction
export function makeAuthService(deps: { userRepo: IUserRepository }) {
  return {
    async register(input: RegisterInput) {
      const existing = await deps.userRepo.findByEmail(input.email);
      if (existing) throw new Error('User exists');

      const user = await deps.userRepo.create({
        email: input.email,
        passwordHash: await hash(input.password),
      });
      return user;
    },
  };
}
```

**Why it's used:**
- Abstracts data access logic from business logic
- Services don't need to know SQL, Prisma syntax, or database details
- Easy to test: mock repository returns in-memory data
- Easy to change databases: implement new repository adapter

**Repositories:**
- `IUserRepository` - User CRUD operations
- `IProjectRepository` - Project CRUD operations

---

### Dependency Injection

**Purpose:** Provide dependencies to an object from external sources rather than having the object create them itself.

**Implementation:** Factory functions accept dependencies as parameters

```typescript
// Service declares dependencies via interface
interface AuthServiceDeps {
  userRepo: IUserRepository;
  passwordHasher: IPasswordHasher;
  tokenSigner: ITokenSigner;
}

// Dependencies injected via factory function
export function makeAuthService(deps: AuthServiceDeps): IAuthService {
  // Service uses injected dependencies, doesn't create them
  const { userRepo, passwordHasher, tokenSigner } = deps;

  return {
    async login(input: LoginInput) {
      const user = await userRepo.findByEmail(input.email);
      const valid = await passwordHasher.compare(input.password, user.passwordHash);
      const token = tokenSigner.sign({ userId: user.id, role: user.role });
      return { token };
    },
  };
}

// Production: inject real implementations
const prodService = makeAuthService({
  userRepo: createPrismaUserRepo(prisma),
  passwordHasher: bcryptHasher,
  tokenSigner: jwtTokenSigner,
});

// Test: inject mocks
const testService = makeAuthService({
  userRepo: mockUserRepo,
  passwordHasher: mockHasher,
  tokenSigner: mockSigner,
});
```

**Why it's used:**
- **Testability**: Inject mocks/stubs in tests instead of real database
- **Flexibility**: Change implementations without modifying service code
- **Decoupling**: Services don't depend on concrete classes, only interfaces
- **SOLID compliance**: Enforces Dependency Inversion Principle

**Injection points:**
- `makeAuthService()` - injects userRepo, passwordHasher, tokenSigner
- `makeProjectsService()` - injects projectRepo

---

### Service Layer

**Purpose:** Define an application's boundary with a layer of services that establishes a set of available operations and coordinates the application's response in each operation.

**Implementation:** `src/services/` directory

```typescript
// Service encapsulates business logic
export interface IAuthService {
  register(input: RegisterInput): Promise<{ user: User; token: string }>;
  login(input: LoginInput): Promise<{ token: string }>;
  getCurrentUser(userId: string): Promise<User>;
}

// Controller delegates to service (thin controller)
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = RegisterSchema.parse(req.body);
    const result = await authService.register(input); // Business logic in service
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};
```

**Responsibilities:**
| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Controller** | HTTP concerns (parse request, send response) | `auth.controller.ts` |
| **Service** | Business logic (validation, orchestration) | `auth.service.ts` |
| **Repository** | Data access (query database) | `prismaUserRepo.ts` |

**Why it's used:**
- **Single Responsibility**: Controllers handle HTTP, services handle business logic
- **Reusability**: Services can be called from controllers, CLI scripts, or background jobs
- **Testability**: Test business logic without HTTP layer
- **Consistency**: All business logic centralized in service layer

**Services:**
- `AuthService` - User registration, login, authentication
- `ProjectsService` - Project CRUD operations, ownership validation

---

### Ports and Adapters (Hexagonal Architecture)

**Purpose:** Decouple the application core from external concerns (databases, frameworks, UI) by defining ports (interfaces) and adapters (implementations).

**Implementation:** `src/ports/` + `src/adapters/` architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Application Core                       │
│                                                          │
│  ┌────────────────────┐         ┌────────────────────┐ │
│  │  AuthService       │         │  ProjectsService   │ │
│  │  (business logic)  │         │  (business logic)  │ │
│  └────────────────────┘         └────────────────────┘ │
│            │                              │             │
│            │ depends on ports             │             │
│            ▼                              ▼             │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Ports (interfaces)                  │  │
│  │  - IUserRepository                               │  │
│  │  - IProjectRepository                            │  │
│  │  - IPasswordHasher                               │  │
│  │  - ITokenSigner                                  │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────│──────────────────────────────┘
                        │ implemented by
                        ▼
          ┌─────────────────────────────┐
          │  Adapters (implementations) │
          │  - prismaUserRepo           │
          │  - prismaProjectRepo        │
          │  - bcryptHasher             │
          │  - jwtTokenSigner           │
          └─────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │  External Systems           │
          │  - Prisma/SQLite            │
          │  - bcrypt                   │
          │  - jsonwebtoken             │
          └─────────────────────────────┘
```

**Port interfaces (src/ports/):**
- `IUserRepository` - User data access contract
- `IProjectRepository` - Project data access contract
- `IPasswordHasher` - Password hashing contract
- `ITokenSigner` - JWT signing contract

**Adapter implementations (src/adapters/):**
- `prismaUserRepo` - Implements `IUserRepository` using Prisma
- `prismaProjectRepo` - Implements `IProjectRepository` using Prisma
- `bcryptHasher` - Implements `IPasswordHasher` using bcrypt
- `jwtTokenSigner` - Implements `ITokenSigner` using jsonwebtoken

**Why it's used:**
- **Technology independence**: Core logic doesn't depend on Prisma, bcrypt, or Express
- **Testability**: Easily swap real adapters with in-memory test doubles
- **Maintainability**: Change database or library without touching business logic
- **Flexibility**: Support multiple adapters (e.g., both Prisma and TypeORM)

**Flow example:**
1. Controller receives HTTP request
2. Controller calls `authService.register()`
3. Service calls `userRepo.findByEmail()` (port interface)
4. `prismaUserRepo` adapter translates to Prisma call (implementation detail)
5. Prisma queries SQLite database (external system)

---

## Pattern Relationships

```
┌──────────────────────────────────────────────────────┐
│ Hexagonal Architecture (Ports & Adapters)           │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Service Layer                              │    │
│  │                                             │    │
│  │  ┌──────────────────────────────────┐     │    │
│  │  │ Factory (creates services)       │     │    │
│  │  │                                   │     │    │
│  │  │  ┌────────────────────────────┐  │     │    │
│  │  │  │ Dependency Injection       │  │     │    │
│  │  │  │   ▼                        │  │     │    │
│  │  │  │ Strategy (swap impl)       │  │     │    │
│  │  │  └────────────────────────────┘  │     │    │
│  │  └──────────────────────────────────┘     │    │
│  └────────────────────────────────────────────┘    │
│            ▲                                        │
│            │ uses                                   │
│  ┌────────────────────────────────────────────┐    │
│  │ Repository (data access abstraction)       │    │
│  │            ▲                                │    │
│  │            │ implemented by                 │    │
│  │        Adapter (Prisma to Repository)      │    │
│  │            ▲                                │    │
│  │            │ uses                           │    │
│  │        Singleton (PrismaClient)            │    │
│  └────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘

HTTP Layer
    ▼
┌──────────────────────────────────────┐
│ Chain of Responsibility (middleware) │
│   ▼                                  │
│ Decorator (wraps handlers)           │
└──────────────────────────────────────┘
```

---

## Summary

This project demonstrates **10 design patterns** across 3 categories:

**Creational (2):**
- Singleton - Single PrismaClient instance
- Factory - Service creation with dependency injection

**Structural (2):**
- Adapter - Convert library interfaces to application ports
- Decorator - Enhance handlers with middleware

**Behavioral (2):**
- Chain of Responsibility - Express middleware chain
- Strategy - Swappable algorithm implementations

**Architectural (4):**
- Repository - Abstract data access
- Dependency Injection - Inject dependencies via factory functions
- Service Layer - Centralize business logic
- Ports and Adapters - Decouple core from external systems

These patterns work together to create a **maintainable, testable, and flexible** REST API architecture that adheres to SOLID principles.
