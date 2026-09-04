import express from 'express';
import { register, login, getMe, updateUserRole } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/users/:id/role', protect, requireAdmin, updateUserRole);
router.put('/users/:id/role', protect, requireAdmin, updateUserRole);

export default router;
