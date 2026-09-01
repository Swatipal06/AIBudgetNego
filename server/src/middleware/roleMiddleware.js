import logger from '../config/logger.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking roles.',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user._id} (${req.user.email}) with role ${req.user.role}. Required: ${roles.join(', ')}`
      );
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to perform this administrative action. Required: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
