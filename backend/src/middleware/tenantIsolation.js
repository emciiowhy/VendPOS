import { ForbiddenError, BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Tenant Isolation Middleware
 * Ensures users can only access data from their own store
 */
export const tenantIsolation = (req, res, next) => {
  try {
    // User must be authenticated first
    if (!req.user || !req.user.store_id) {
      throw new ForbiddenError('Store access required');
    }

    const userStoreId = req.user.store_id;
    
    // Check store_id in params, body, or query
    const requestedStoreId = 
      req.params.storeId || 
      req.body.store_id || 
      req.query.store_id;

    // If a specific store_id is requested, verify it matches user's store
    if (requestedStoreId) {
      const requestedId = parseInt(requestedStoreId);
      
      if (isNaN(requestedId)) {
        throw new BadRequestError('Invalid store ID');
      }
      
      if (requestedId !== userStoreId) {
        logger.warn(
          `Tenant isolation violation attempt: User ${req.user.id} tried to access store ${requestedId}`
        );
        throw new ForbiddenError('Access denied: Cannot access another store\'s data');
      }
    }

    // Inject store_id into request for use in controllers
    req.storeId = userStoreId;
    
    logger.debug(`Tenant isolation: User ${req.user.id} accessing store ${userStoreId}`);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional tenant isolation for routes that may work across stores
 * Still injects storeId but doesn't enforce strict isolation
 */
export const optionalTenantIsolation = (req, res, next) => {
  if (req.user && req.user.store_id) {
    req.storeId = req.user.store_id;
  }
  next();
};