import Negotiation from '../models/Negotiation.js';
import Department from '../models/Department.js';
import Round from '../models/Round.js';
import Allocation from '../models/Allocation.js';
import NegotiationEvent from '../models/NegotiationEvent.js';
import { checkFeasibility } from '../engine/proposalValidator.js';
import { addNegotiationJob } from '../queues/negotiationQueue.js';
import { broadcastNegotiationEvent } from '../sockets/socketManager.js';
import NegotiationEngine from '../engine/negotiationEngine.js';
import logger from '../config/logger.js';

/**
 * @desc    Create a new negotiation with dynamic departments
 * @route   POST /api/negotiations
 * @access  Private (ADMIN)
 */
export const createNegotiation = async (req, res, next) => {
  try {
    const {
      title,
      description,
      companyBudget,
      currency = 'INR',
      maxRounds = 5,
      departments = [],
    } = req.body;

    if (!title || !companyBudget) {
      return res.status(400).json({
        success: false,
        message: 'Title and company budget are required',
      });
    }

    if (departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one department is required to create a negotiation',
      });
    }

    // Feasibility Pre-Check
    const feasibility = checkFeasibility(Number(companyBudget), departments);
    if (!feasibility.isFeasible) {
      return res.status(400).json({
        success: false,
        message: feasibility.message,
        feasibility,
      });
    }

    // Create Negotiation parent record
    const negotiation = await Negotiation.create({
      title,
      description,
      companyBudget: Number(companyBudget),
      currency,
      maxRounds: Number(maxRounds) || 5,
      status: 'PENDING',
      createdBy: req.user._id,
      departments: [],
    });

    // Create dynamic departments
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const createdDepts = [];

    for (let i = 0; i < departments.length; i++) {
      const d = departments[i];
      const deptDoc = await Department.create({
        negotiationId: negotiation._id,
        name: d.name,
        requestedBudget: Number(d.requestedBudget),
        minAcceptableBudget: Number(d.minAcceptableBudget),
        priority: d.priority || 'MEDIUM',
        strategy: d.strategy || 'COMPROMISING',
        hardConstraints: Array.isArray(d.hardConstraints)
          ? d.hardConstraints
          : d.hardConstraints ? [d.hardConstraints] : [],
        softPreferences: Array.isArray(d.softPreferences)
          ? d.softPreferences
          : d.softPreferences ? [d.softPreferences] : [],
        description: d.description || '',
        color: d.color || defaultColors[i % defaultColors.length],
      });
      createdDepts.push(deptDoc._id);
    }

    negotiation.departments = createdDepts;
    await negotiation.save();

    // Log creation audit event
    await NegotiationEngine.logEvent(negotiation._id, {
      eventType: 'NEGOTIATION_CREATED',
      message: `Negotiation '${title}' created with budget ₹${Number(companyBudget).toLocaleString('en-IN')} by ${req.user.name} (${req.user.role}).`,
      details: {
        companyBudget,
        departmentCount: departments.length,
        maxRounds,
      },
      actor: 'ADMIN',
    });

    const populated = await Negotiation.findById(negotiation._id)
      .populate('departments')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      negotiation: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all negotiations with metrics
 * @route   GET /api/negotiations
 * @access  Private (ADMIN & VIEWER)
 */
export const getNegotiations = async (req, res, next) => {
  try {
    const negotiations = await Negotiation.find()
      .populate('departments')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('proposedAllocation')
      .populate('finalAllocation')
      .sort({ createdAt: -1 });

    const stats = {
      total: negotiations.length,
      running: negotiations.filter((n) => n.status === 'RUNNING').length,
      awaitingApproval: negotiations.filter((n) => n.status === 'AWAITING_APPROVAL').length,
      finalized: negotiations.filter((n) => n.status === 'FINALIZED').length,
      settled: negotiations.filter((n) => n.status === 'SETTLED').length,
      deadlock: negotiations.filter((n) => n.status === 'DEADLOCK').length,
      failed: negotiations.filter((n) => n.status === 'FAILED').length,
    };

    res.status(200).json({
      success: true,
      stats,
      negotiations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single negotiation by ID
 * @route   GET /api/negotiations/:id
 * @access  Private (ADMIN & VIEWER)
 */
export const getNegotiationById = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('departments')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('proposedAllocation')
      .populate('finalAllocation');

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation not found',
      });
    }

    res.status(200).json({
      success: true,
      negotiation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start negotiation orchestration
 * @route   POST /api/negotiations/:id/start
 * @access  Private (ADMIN)
 */
export const startNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id).populate('departments');
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation not found',
      });
    }

    if (negotiation.status === 'RUNNING') {
      return res.status(400).json({
        success: false,
        message: 'Negotiation is already running',
      });
    }

    if (['FINALIZED', 'AWAITING_APPROVAL'].includes(negotiation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot start negotiation in '${negotiation.status}' state.`,
      });
    }

    // Feasibility Check
    const feasibility = checkFeasibility(negotiation.companyBudget, negotiation.departments);
    if (!feasibility.isFeasible) {
      return res.status(400).json({
        success: false,
        message: feasibility.message,
      });
    }

    // Clear previous rounds if restarting from FAILED or PENDING
    await Round.deleteMany({ negotiationId: negotiation._id });

    // Enqueue job for async BullMQ / In-process execution
    const jobInfo = await addNegotiationJob(negotiation._id.toString());

    res.status(200).json({
      success: true,
      message: 'Negotiation initiated successfully.',
      jobInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a running or pending negotiation
 * @route   POST /api/negotiations/:id/cancel
 * @access  Private (ADMIN)
 */
export const cancelNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found' });
    }

    if (negotiation.status === 'FINALIZED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a finalized negotiation' });
    }

    negotiation.status = 'CANCELLED';
    await negotiation.save();

    await NegotiationEngine.logEvent(negotiation._id, {
      eventType: 'NEGOTIATION_CANCELLED',
      message: `Negotiation cancelled by ${req.user.name}.`,
      actor: 'ADMIN',
    });

    broadcastNegotiationEvent(negotiation._id, 'NEGOTIATION_CANCELLED', {
      negotiationId: negotiation._id,
      status: 'CANCELLED',
    });

    res.status(200).json({
      success: true,
      message: 'Negotiation cancelled successfully',
      negotiation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete audit event history
 * @route   GET /api/negotiations/:id/events
 * @access  Private (ADMIN & VIEWER)
 */
export const getNegotiationEvents = async (req, res, next) => {
  try {
    const events = await NegotiationEvent.find({ negotiationId: req.params.id }).sort({
      timestamp: 1,
    });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get negotiation rounds
 * @route   GET /api/negotiations/:id/rounds
 * @access  Private (ADMIN & VIEWER)
 */
export const getNegotiationRounds = async (req, res, next) => {
  try {
    const rounds = await Round.find({ negotiationId: req.params.id }).sort({
      roundNumber: 1,
    });

    res.status(200).json({
      success: true,
      count: rounds.length,
      rounds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get proposed / final allocation
 * @route   GET /api/negotiations/:id/allocation
 * @access  Private (ADMIN & VIEWER)
 */
export const getNegotiationAllocation = async (req, res, next) => {
  try {
    const allocation = await Allocation.findOne({ negotiationId: req.params.id })
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    HUMAN APPROVAL GATE - Admin approves proposed budget allocation
 * @route   POST /api/negotiations/:id/approve
 * @access  Private (ADMIN ONLY)
 */
export const approveAllocation = async (req, res, next) => {
  try {
    const { approvalNote } = req.body;
    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found' });
    }

    if (negotiation.status !== 'AWAITING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve negotiation in '${negotiation.status}' state. Must be 'AWAITING_APPROVAL'.`,
      });
    }

    const allocation = await Allocation.findOne({
      negotiationId: negotiation._id,
      status: 'AWAITING_APPROVAL',
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'No pending allocation awaiting approval was found.',
      });
    }

    const now = new Date();

    // 1. Authoritative Allocation Update
    allocation.status = 'APPROVED';
    allocation.approvedBy = req.user._id;
    allocation.approvedAt = now;
    allocation.approvalNote = approvalNote || 'Approved by Executive Administrator.';
    allocation.allocations = allocation.allocations.map((a) => ({
      ...a.toObject(),
      finalAmount: a.proposedAmount,
    }));
    await allocation.save();

    // 2. Authoritative Negotiation State Transition
    negotiation.status = 'FINALIZED';
    negotiation.finalAllocation = allocation._id;
    negotiation.approvedBy = req.user._id;
    negotiation.approvedAt = now;
    negotiation.approvalNote = allocation.approvalNote;
    await negotiation.save();

    // 3. Persist Immutable Audit Events
    await NegotiationEngine.logEvent(negotiation._id, {
      eventType: 'ALLOCATION_APPROVED',
      message: `Human Admin ${req.user.name} approved the proposed allocation of ₹${allocation.totalAllocated.toLocaleString('en-IN')}. Note: "${allocation.approvalNote}"`,
      details: {
        approvedBy: req.user._id,
        approvedByName: req.user.name,
        approvedAt: now,
        approvalNote: allocation.approvalNote,
        finalAllocations: allocation.allocations,
      },
      actor: 'ADMIN',
    });

    await NegotiationEngine.logEvent(negotiation._id, {
      eventType: 'NEGOTIATION_FINALIZED',
      message: `Negotiation '${negotiation.title}' is officially FINALIZED and binding.`,
      actor: 'SYSTEM',
    });

    // 4. Real-time Broadcast
    broadcastNegotiationEvent(negotiation._id, 'ALLOCATION_APPROVED', {
      negotiationId: negotiation._id,
      status: 'FINALIZED',
      allocation,
      approvedBy: { name: req.user.name, email: req.user.email, role: req.user.role },
      approvedAt: now,
    });

    res.status(200).json({
      success: true,
      message: 'Budget allocation successfully approved and finalized.',
      negotiation,
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    HUMAN APPROVAL GATE - Admin rejects proposed allocation
 * @route   POST /api/negotiations/:id/reject
 * @access  Private (ADMIN ONLY)
 */
export const rejectAllocation = async (req, res, next) => {
  try {
    const { approvalNote = 'Rejected by administrator during governance review.' } = req.body;
    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found' });
    }

    if (negotiation.status !== 'AWAITING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject negotiation in '${negotiation.status}' state. Must be 'AWAITING_APPROVAL'.`,
      });
    }

    const allocation = await Allocation.findOne({
      negotiationId: negotiation._id,
      status: 'AWAITING_APPROVAL',
    });

    if (allocation) {
      allocation.status = 'REJECTED';
      allocation.approvalNote = approvalNote;
      await allocation.save();
    }

    // Set negotiation to FAILED with reason
    negotiation.status = 'FAILED';
    negotiation.failureReason = `Allocation rejected by admin: ${approvalNote}`;
    await negotiation.save();

    await NegotiationEngine.logEvent(negotiation._id, {
      eventType: 'ALLOCATION_REJECTED',
      message: `Admin ${req.user.name} rejected the proposed allocation: "${approvalNote}"`,
      details: {
        rejectedBy: req.user._id,
        rejectedByName: req.user.name,
        approvalNote,
      },
      actor: 'ADMIN',
    });

    broadcastNegotiationEvent(negotiation._id, 'ALLOCATION_REJECTED', {
      negotiationId: negotiation._id,
      status: 'FAILED',
      reason: approvalNote,
    });

    res.status(200).json({
      success: true,
      message: 'Allocation rejected and marked as failed.',
      negotiation,
    });
  } catch (error) {
    next(error);
  }
};
