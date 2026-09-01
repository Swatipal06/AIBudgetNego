import Department from '../models/Department.js';
import Negotiation from '../models/Negotiation.js';
import { checkFeasibility } from '../engine/proposalValidator.js';

/**
 * @desc    Add a department to negotiation
 * @route   POST /api/negotiations/:id/departments
 * @access  Private (ADMIN)
 */
export const addDepartment = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found' });
    }

    if (negotiation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add departments once negotiation has started or completed.',
      });
    }

    const {
      name,
      requestedBudget,
      minAcceptableBudget,
      priority = 'MEDIUM',
      strategy = 'COMPROMISING',
      hardConstraints = [],
      softPreferences = [],
      description = '',
      color = '#3b82f6',
    } = req.body;

    const department = await Department.create({
      negotiationId: negotiation._id,
      name,
      requestedBudget: Number(requestedBudget),
      minAcceptableBudget: Number(minAcceptableBudget),
      priority,
      strategy,
      hardConstraints,
      softPreferences,
      description,
      color,
    });

    negotiation.departments.push(department._id);
    await negotiation.save();

    res.status(201).json({
      success: true,
      department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all departments for a negotiation
 * @route   GET /api/negotiations/:id/departments
 * @access  Private (ADMIN & VIEWER)
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ negotiationId: req.params.id });
    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a department
 * @route   PUT /api/departments/:id
 * @access  Private (ADMIN)
 */
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const negotiation = await Negotiation.findById(department.negotiationId);
    if (negotiation && negotiation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update departments after negotiation has started.',
      });
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      department: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 * @access  Private (ADMIN)
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const negotiation = await Negotiation.findById(department.negotiationId);
    if (negotiation && negotiation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete departments after negotiation has started.',
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    if (negotiation) {
      negotiation.departments = negotiation.departments.filter(
        (dId) => dId.toString() !== req.params.id
      );
      await negotiation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
