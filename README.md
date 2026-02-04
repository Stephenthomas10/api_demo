# Project API

A production-like REST API demonstrating authentication, authorization, and CRUD operations using Node.js, Express, TypeScript, Prisma ORM, and SQLite.

## Features

- JWT-based authentication
- Role-based authorization (user/admin)
- Full CRUD operations for Projects resource
- Input validation with Zod
- Pagination support
- Rate limiting on auth endpoints
- Consistent API response envelope
- Request logging
- Comprehensive test suite
- OpenAPI/Swagger documentation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite
- **Validation**: Zod
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier

## Quick Start (Without Docker)

### Prerequisites

- Node.js 20+ installed
- npm or yarn

### Installation

1. **Clone and install dependencies**

```bash
cd api_demo
npm install
```

2. **Configure environment**

```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (defaults work for development)
```

3. **Set up database**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (creates admin and test user)
npm run db:seed
```

4. **Start the development server**

```bash
npm run dev
```

The API will be running at `http://localhost:3000`

### Running Tests

First, ensure the test database is initialized:

```bash
# Push schema to test database (first time only)
DATABASE_URL="file:./prisma/test.db" npx prisma db push --skip-generate
```

Then run tests:

```bash
npm test
```

For coverage report:

```bash
npm run test:coverage
```

## Seeded Users

After running `npm run db:seed`, the following users are available:

| Role  | Email              | Password    |
|-------|-------------------|-------------|
| Admin | admin@example.com | Admin@1234  |
| User  | user@example.com  | User@1234   |

## API Endpoints

### Health Check

| Method | Endpoint  | Description        |
|--------|-----------|-------------------|
| GET    | /health   | API health status |

### Authentication

| Method | Endpoint        | Description           | Auth Required |
|--------|-----------------|----------------------|---------------|
| POST   | /auth/register  | Register new user    | No            |
| POST   | /auth/login     | Login, get JWT token | No            |
| GET    | /auth/me        | Get current user     | Yes           |

### Projects (User)

| Method | Endpoint         | Description              | Auth Required |
|--------|------------------|-------------------------|---------------|
| POST   | /projects        | Create project          | Yes           |
| GET    | /projects        | List own projects       | Yes           |
| GET    | /projects/:id    | Get project by ID       | Yes (owner)   |
| PATCH  | /projects/:id    | Update project          | Yes (owner)   |
| DELETE | /projects/:id    | Delete project          | Yes (owner)   |

### Admin

| Method | Endpoint              | Description          | Auth Required      |
|--------|-----------------------|---------------------|-------------------|
| GET    | /admin/projects       | List all projects   | Yes (admin only)  |
| DELETE | /admin/projects/:id   | Delete any project  | Yes (admin only)  |

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ]  // Optional
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

## Status Codes

| Code | Meaning               |
|------|-----------------------|
| 200  | Success               |
| 201  | Created               |
| 400  | Validation Error      |
| 401  | Unauthenticated       |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict (duplicate)  |
| 429  | Rate Limit Exceeded   |
| 500  | Internal Server Error |

## Demo with cURL

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

Save the token from the response for subsequent requests.

### 3. Get current user

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a project

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title": "My Project", "description": "A test project", "status": "todo"}'
```

### 5. List projects

```bash
curl "http://localhost:3000/projects?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Update a project

```bash
curl -X PATCH http://localhost:3000/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "doing"}'
```

### 7. Delete a project

```bash
curl -X DELETE http://localhost:3000/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Admin: List all projects

```bash
# Login as admin first
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin@1234"}'

# Use admin token
curl http://localhost:3000/admin/projects \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## Using Postman

1. Import the collection from `postman/project-api.postman_collection.json`
2. Optionally import the environment from `postman/project-api.postman_environment.json`
3. Run "Login" or "Register User" request - the token is automatically saved
4. Subsequent requests will use the saved token

## Swagger / OpenAPI Documentation

Interactive API documentation is available at:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/openapi.json

### Using Swagger UI for Authentication

1. Open http://localhost:3000/docs in your browser
2. Use the `/auth/login` endpoint to get a JWT token
3. Click the **Authorize** button (lock icon) at the top right
4. Enter the token (without "Bearer " prefix)
5. Click **Authorize** - all subsequent requests will include the token

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT signing (min 10 chars) | Required |
| `JWT_EXPIRES_IN` | Token expiration time | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Running with Docker (Optional)

### Build and run

```bash
# Set a secure JWT secret
export JWT_SECRET=your-secure-secret-here

# Build and start
docker-compose up --build
```

### Stop

```bash
docker-compose down
```

### With volume cleanup

```bash
docker-compose down -v
```

## Project Structure

```
/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── Dockerfile
├── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── projects.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── projects.controller.ts
│   │   └── admin.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── projects.service.ts
│   ├── utils/
│   │   ├── response.ts
│   │   └── logger.ts
│   └── docs/
│       ├── openapi.ts
│       └── schemas.ts
├── scripts/
│   ├── curl_demo.sh
│   └── curl_demo.bat
├── postman/
│   ├── project-api.postman_collection.json
│   └── project-api.postman_environment.json
└── tests/
    ├── setup.ts
    ├── api.test.ts
    ├── auth.test.ts
    └── projects.test.ts
```

## Development

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Database Studio

```bash
npm run db:studio
```

## License

MIT
