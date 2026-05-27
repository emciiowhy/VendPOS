// Base API Error
export class ApiError extends Error {
    constructor(message, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // 400 Bad Request
  export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
      super(message, 400);
    }
  }
  
  // 401 Unauthorized
  export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized - Please login') {
      super(message, 401);
    }
  }
  
  // 403 Forbidden
  export class ForbiddenError extends ApiError {
    constructor(message = 'Access denied') {
      super(message, 403);
    }
  }
  
  // 404 Not Found
  export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
      super(message, 404);
    }
  }
  
  // 409 Conflict
  export class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
      super(message, 409);
    }
  }
  
  // 422 Validation Error
  export class ValidationError extends ApiError {
    constructor(message = 'Validation failed', errors = []) {
      super(message, 422);
      this.errors = errors;
    }
  }
  
  // 500 Internal Server Error
  export class InternalServerError extends ApiError {
    constructor(message = 'Internal server error') {
      super(message, 500);
    }
  }