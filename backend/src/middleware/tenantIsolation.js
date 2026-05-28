import { ForbiddenError, BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Tenant Isolation Middleware
// Ensures users can only access data inside their own Tenant. Every
// protected route should chain `authenticate` then this. Reads
// tenant_id from params/body/query and asserts it matches the user's
// tenant; otherwise rejects with 403. Also injects req.tenantId.
export const tenantIsolation = (req, res, next) => {
  try {
    if (!req.user || !req.user.tenant_id) {
      throw new ForbiddenError('Tenant access required');
    }

    const userTenantId = req.user.tenant_id;

    const requestedTenantId =
      req.params.tenantId ||
      req.body.tenant_id ||
      req.query.tenant_id;

    if (requestedTenantId) {
      const requestedId = parseInt(requestedTenantId, 10);
      if (isNaN(requestedId)) {
        throw new BadRequestError('Invalid tenant ID');
      }
      if (requestedId !== userTenantId) {
        logger.warn(
          `Tenant isolation violation attempt: user ${req.user.user_id} tried to access tenant ${requestedId}`
        );
        throw new ForbiddenError('Access denied: cannot access another tenant\'s data');
      }
    }

    req.tenantId = userTenantId;
    logger.debug(`Tenant isolation: user ${req.user.user_id} accessing tenant ${userTenantId}`);
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalTenantIsolation = (req, res, next) => {
  if (req.user && req.user.tenant_id) {
    req.tenantId = req.user.tenant_id;
  }
  next();
};
