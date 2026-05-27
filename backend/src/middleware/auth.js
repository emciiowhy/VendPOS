import authService from '../services/authService.js';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Authenticate user with JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      store_id: decoded.store_id
    };

    logger.debug(`User authenticated: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authService.extractTokenFromHeader(authHeader);
      const decoded = authService.verifyAccessToken(token);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        store_id: decoded.store_id
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};