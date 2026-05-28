import authService from '../services/authService.js';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedError('No token provided');

    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyAccessToken(token);

    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenant_id,
    };

    logger.debug(`User authenticated: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authService.extractTokenFromHeader(authHeader);
      const decoded = authService.verifyAccessToken(token);
      req.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        tenant_id: decoded.tenant_id,
      };
    }
    next();
  } catch (error) {
    next();
  }
};
