import UserModel from '../models/User.js';
import StoreModel from '../models/Store.js';
import authService from '../services/authService.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { validatePassword } from '../utils/validation.js';
import logger from '../utils/logger.js';

class AuthController {
  // Register new owner with store
  async register(req, res, next) {
    try {
      const { email, password, full_name, store_name } = req.body;

      // Validate required fields
      if (!email || !password || !full_name || !store_name) {
        throw new BadRequestError('Email, password, full name, and store name are required');
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const password_hash = await authService.hashPassword(password);

      // Create user first (without store_id)
      const user = await UserModel.create({
        email,
        password_hash,
        full_name,
        role: 'owner',
        store_id: null
      });

      // Create store
      const store = await StoreModel.create({
        owner_id: user.id,
        store_name
      });

      // Update user with store_id
      await UserModel.update(user.id, { store_id: store.id });

      // Generate tokens
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        store_id: store.id
      });

      logger.success(`New owner registered: ${email} with store: ${store_name}`);

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          store_id: store.id
        },
        store: {
          id: store.id,
          store_name: store.store_name,
          theme_color: store.theme_color
        },
        ...tokens
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      // Find user with password
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const tokens = authService.generateTokens(user);

      logger.success(`User logged in: ${email} (${user.role})`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          store_id: user.store_id
        },
        ...tokens
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      // Verify refresh token
      const decoded = authService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await UserModel.findById(decoded.id);

      // Generate new tokens
      const tokens = authService.generateTokens(user);

      logger.info(`Tokens refreshed for user: ${user.email}`);

      res.json({
        message: 'Token refreshed successfully',
        ...tokens
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);

      // Get store info if user has a store
      let store = null;
      if (user.store_id) {
        store = await StoreModel.findById(user.store_id);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          store_id: user.store_id,
          is_active: user.is_active,
          created_at: user.created_at
        },
        store: store ? {
          id: store.id,
          store_name: store.store_name,
          logo_url: store.logo_url,
          theme_color: store.theme_color,
          address: store.address,
          phone: store.phone
        } : null
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Current password and new password are required');
      }

      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      // Get user with password
      const user = await UserModel.findByIdWithPassword(req.user.id);

      // Verify current password
      const isPasswordValid = await authService.comparePassword(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password
      await UserModel.updatePassword(user.id, newPasswordHash);

      logger.success(`Password changed for user: ${user.email}`);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();