import { validationResult } from 'express-validator';
import { ValidationError } from './errors.js';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
};

// Email validation regex
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Validate store theme color (hex format)
export const isValidHexColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Validate phone number (basic)
export const isValidPhone = (phone) => {
  return /^[\d\s\-\+\(\)]+$/.test(phone);
};

// Validate price/amount
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num < 1000000;
};

// Validate quantity
export const isValidQuantity = (quantity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num >= 0 && num < 1000000;
};