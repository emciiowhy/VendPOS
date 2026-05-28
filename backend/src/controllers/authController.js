import UserModel from '../models/User.js';
import TenantModel from '../models/Tenant.js';
import authService from '../services/authService.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { validatePassword } from '../utils/validation.js';
import logger from '../utils/logger.js';

class AuthController {
  // Register: create a Tenant + its first Owner in one DB transaction.
  async register(req, res, next) {
    try {
      const { email, password, name, business_name } = req.body;

      if (!email || !password || !name || !business_name) {
        throw new BadRequestError('email, password, name, and business_name are required');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      const { tenant, user } = await TenantModel.registerWithOwner({
        business_name,
        owner_name: name,
        owner_email: email,
        owner_password: password,
      });

      const tokens = authService.generateTokens({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        tenant_id: tenant.tenant_id,
      });

      logger.success(`New owner registered: ${email} (tenant ${tenant.tenant_id} "${business_name}")`);

      res.status(201).json({
        message: 'Registration successful',
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: tenant.tenant_id,
        },
        tenant: {
          tenant_id: tenant.tenant_id,
          business_name: tenant.business_name,
          subscription_tier: tenant.subscription_tier,
          theme_color: tenant.theme_color,
        },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const user = await UserModel.findByEmail(email);
      if (!user) throw new UnauthorizedError('Invalid email or password');
      if (!user.is_active) throw new UnauthorizedError('Account is deactivated');

      const isPasswordValid = await authService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

      const tokens = authService.generateTokens(user);
      logger.success(`User logged in: ${email} (${user.role})`);

      res.json({
        message: 'Login successful',
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
        },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new BadRequestError('Refresh token is required');

      const decoded = authService.verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(decoded.user_id);
      const tokens = authService.generateTokens(user);

      res.json({ message: 'Token refreshed successfully', ...tokens });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.user_id);
      const tenant = await TenantModel.findById(user.tenant_id);

      res.json({
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
          is_active: user.is_active,
          created_at: user.created_at,
        },
        tenant: {
          tenant_id: tenant.tenant_id,
          business_name: tenant.business_name,
          subscription_tier: tenant.subscription_tier,
          logo_url: tenant.logo_url,
          theme_color: tenant.theme_color,
          address: tenant.address,
          phone: tenant.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Current password and new password are required');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      const user = await UserModel.findByIdWithPassword(req.user.user_id);
      const isPasswordValid = await authService.comparePassword(currentPassword, user.password_hash);
      if (!isPasswordValid) throw new UnauthorizedError('Current password is incorrect');

      const newPasswordHash = await authService.hashPassword(newPassword);
      await UserModel.updatePassword(user.user_id, newPasswordHash);

      logger.success(`Password changed for user: ${user.email}`);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
