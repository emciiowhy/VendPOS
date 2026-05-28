import { ForbiddenError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Role-based access control. Roles are 'Owner' or 'Cashier' per the
// ERD's casing (see CONTEXT.md, PRD D5).
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new ForbiddenError('Authentication required');
      }
      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        logger.warn(
          `Access denied: user ${req.user.user_id} (${userRole}) attempted ${req.method} ${req.path} ` +
          `(requires: ${allowedRoles.join(' or ')})`
        );
        throw new ForbiddenError(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireOwner = requireRole('Owner');
export const requireCashier = requireRole('Cashier');
export const requireOwnerOrCashier = requireRole('Owner', 'Cashier');
