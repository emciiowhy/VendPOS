import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error(`Error: ${err.message}`, config.nodeEnv === 'development' ? err.stack : null);

  // Handle known API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      ...(config.nodeEnv === 'development' && { stack: error.stack })
    });
  }

  // Handle PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          status: 'fail',
          message: 'Resource already exists',
          detail: error.detail
        });
      
      case '23503': // Foreign key violation
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid reference',
          detail: error.detail
        });
      
      case '23502': // Not null violation
        return res.status(400).json({
          status: 'fail',
          message: 'Missing required field',
          detail: error.detail
        });
      
      case '22P02': // Invalid text representation
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid data format'
        });
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Token expired'
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    status: 'error',
    message: config.nodeEnv === 'development' 
      ? err.message 
      : 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};