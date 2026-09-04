import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Public self-registration always creates users with VIEWER role, ignoring any role in req.body
    const user = await User.create({
      name,
      email,
      password,
      role: 'VIEWER',
    });

    const token = user.generateAuthToken();

    logger.info(`New user registered: ${user.email} with role ${user.role}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = user.generateAuthToken();

    logger.info(`User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role (e.g. promote to ADMIN)
 * @route   POST /api/auth/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role = 'ADMIN' } = req.body;

    if (!['ADMIN', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: ${role}. Allowed roles: ADMIN, VIEWER`,
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id ${id} not found`,
      });
    }

    user.role = role;
    await user.save();

    logger.info(
      `User role updated: ${user.email} role changed to ${user.role} by admin ${req.user ? req.user.email : 'system'}`
    );

    res.status(200).json({
      success: true,
      message: `User role updated successfully to ${user.role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

