import express from 'express';
import {
  createNegotiation,
  getNegotiations,
  getNegotiationById,
  startNegotiation,
  cancelNegotiation,
  getNegotiationEvents,
  getNegotiationRounds,
  getNegotiationAllocation,
  approveAllocation,
  rejectAllocation,
} from '../controllers/negotiationController.js';
import { addDepartment, getDepartments } from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public/All authenticated users (Admin + Viewer)
router.use(protect);

router.get('/', getNegotiations);
router.get('/:id', getNegotiationById);
router.get('/:id/events', getNegotiationEvents);
router.get('/:id/rounds', getNegotiationRounds);
router.get('/:id/allocation', getNegotiationAllocation);
router.get('/:id/departments', getDepartments);

// Admin-only protected operations
router.post('/', requireAdmin, createNegotiation);
router.post('/:id/start', requireAdmin, startNegotiation);
router.post('/:id/cancel', requireAdmin, cancelNegotiation);
router.post('/:id/departments', requireAdmin, addDepartment);
router.post('/:id/approve', requireAdmin, approveAllocation);
router.post('/:id/reject', requireAdmin, rejectAllocation);

export default router;
