#!/bin/bash

# API Demo Script
# This script demonstrates the full API workflow using cURL

BASE_URL="http://localhost:3000"

echo "========================================"
echo "Project API Demo"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${BLUE}1. Health Check${NC}"
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. Register a new user
echo -e "${BLUE}2. Register a new user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@example.com",
    "password": "demo1234"
  }')
echo "$REGISTER_RESPONSE" | jq .
echo ""

# 3. Login
echo -e "${BLUE}3. Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo1234"
  }')
echo "$LOGIN_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo -e "${GREEN}Token extracted: ${TOKEN:0:50}...${NC}"
echo ""

# 4. Get current user info
echo -e "${BLUE}4. Get current user info (GET /auth/me)${NC}"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 5. Create a project
echo -e "${BLUE}5. Create a project${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Demo Project",
    "description": "A project created via cURL demo",
    "status": "todo"
  }')
echo "$CREATE_RESPONSE" | jq .

# Extract project ID
PROJECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo -e "${GREEN}Project ID: $PROJECT_ID${NC}"
echo ""

# 6. Create another project
echo -e "${BLUE}6. Create another project${NC}"
curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Second Project",
    "description": "Another test project",
    "status": "doing"
  }' | jq .
echo ""

# 7. List all projects
echo -e "${BLUE}7. List all projects (GET /projects)${NC}"
curl -s "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 8. Get project by ID
echo -e "${BLUE}8. Get project by ID${NC}"
curl -s "$BASE_URL/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 9. Update project (PATCH)
echo -e "${BLUE}9. Update project (PATCH)${NC}"
curl -s -X PATCH "$BASE_URL/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "doing",
    "title": "Updated Demo Project"
  }' | jq .
echo ""

# 10. List projects with pagination
echo -e "${BLUE}10. List projects with pagination (limit=1, offset=0)${NC}"
curl -s "$BASE_URL/projects?limit=1&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 11. Delete project
echo -e "${BLUE}11. Delete project${NC}"
curl -s -X DELETE "$BASE_URL/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 12. Verify deletion
echo -e "${BLUE}12. Verify deletion (should return 404)${NC}"
curl -s "$BASE_URL/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "========================================"
echo -e "${YELLOW}Admin Demo (using seeded admin user)${NC}"
echo "========================================"
echo ""

# 13. Login as admin
echo -e "${BLUE}13. Login as admin${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@1234"
  }')
echo "$ADMIN_LOGIN_RESPONSE" | jq .

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.token')
echo ""

# 14. Admin list all projects
echo -e "${BLUE}14. Admin list all projects${NC}"
curl -s "$BASE_URL/admin/projects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

echo "========================================"
echo -e "${GREEN}Demo completed!${NC}"
echo "========================================"
