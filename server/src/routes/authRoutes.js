import express from 'express';
import { register, login, getMe, updateUserRole } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate-limited: brute-force / registration spam protection
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

router.get('/me', protect, getMe);
router.post('/users/:id/role', protect, requireAdmin, updateUserRole);
router.put('/users/:id/role', protect, requireAdmin, updateUserRole);

export default router;
