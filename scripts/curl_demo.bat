@echo off
REM API Demo Script for Windows
REM This script demonstrates the full API workflow using cURL

set BASE_URL=http://localhost:3000

echo ========================================
echo Project API Demo
echo ========================================
echo.

echo 1. Health Check
curl -s "%BASE_URL%/health"
echo.
echo.

echo 2. Register a new user
curl -s -X POST "%BASE_URL%/auth/register" -H "Content-Type: application/json" -d "{\"name\": \"Demo User\", \"email\": \"demo@example.com\", \"password\": \"demo1234\"}"
echo.
echo.

echo 3. Login (copy the token from the response)
curl -s -X POST "%BASE_URL%/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"demo@example.com\", \"password\": \"demo1234\"}"
echo.
echo.

echo ========================================
echo After getting your token, run the following commands manually:
echo ========================================
echo.
echo Get current user:
echo curl -H "Authorization: Bearer YOUR_TOKEN" %BASE_URL%/auth/me
echo.
echo Create project:
echo curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"title\": \"My Project\", \"description\": \"Test\", \"status\": \"todo\"}" %BASE_URL%/projects
echo.
echo List projects:
echo curl -H "Authorization: Bearer YOUR_TOKEN" %BASE_URL%/projects
echo.
echo Update project:
echo curl -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"status\": \"doing\"}" %BASE_URL%/projects/PROJECT_ID
echo.
echo Delete project:
echo curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" %BASE_URL%/projects/PROJECT_ID
echo.
echo ========================================
echo Admin endpoints (login as admin@example.com / Admin@1234):
echo ========================================
echo.
echo Admin list all projects:
echo curl -H "Authorization: Bearer ADMIN_TOKEN" %BASE_URL%/admin/projects
echo.
echo Admin delete any project:
echo curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" %BASE_URL%/admin/projects/PROJECT_ID
