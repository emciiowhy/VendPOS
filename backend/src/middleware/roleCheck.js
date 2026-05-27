import { ForbiddenError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Role-based access control middleware
 * Restricts access to routes based on user role
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // User must be authenticated
      if (!req.user || !req.user.role) {
        throw new ForbiddenError('Authentication required');
      }

      const userRole = req.user.role;

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn(
          `Access denied: User ${req.user.id} (${userRole}) attempted to access ${req.method} ${req.path} ` +
          `(requires: ${allowedRoles.join(' or ')})`
        );
        throw new ForbiddenError(
          `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
        );
      }

      logger.debug(`Role check passed: ${userRole} can access ${req.method} ${req.path}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Shorthand middleware for common roles
export const requireOwner = requireRole('owner');
export const requireCashier = requireRole('cashier');
export const requireOwnerOrCashier = requireRole('owner', 'cashier');