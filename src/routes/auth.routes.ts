import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

// POST /auth/register - Create a new user account
router.post('/register', authRateLimit, authController.register);

// POST /auth/login - Authenticate and get JWT token
router.post('/login', authRateLimit, authController.login);

// GET /auth/me - Get current authenticated user info
router.get('/me', authenticate, authController.me);

export default router;
