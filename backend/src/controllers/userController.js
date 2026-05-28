import UserModel from '../models/User.js';
import AuthService from '../services/authService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { validatePassword } from '../utils/validation.js';

const sanitize = (user) => {
  if (!user) return user;
  const { password_hash, ...rest } = user;
  return rest;
};

const ensureSameTenant = (existing, tenantId) => {
  if (existing.tenant_id !== tenantId) {
    throw new ForbiddenError('Cannot modify users from another tenant');
  }
};

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.findByTenant(req.tenantId);
      res.json({ users: users.map(sanitize) });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { email, password, name, role = 'Cashier' } = req.body;
      if (!email || !password || !name) {
        throw new BadRequestError('email, password, and name are required');
      }
      if (!['Owner', 'Cashier'].includes(role)) {
        throw new BadRequestError("role must be 'Owner' or 'Cashier'");
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }
      if (await UserModel.findByEmail(email)) {
        throw new BadRequestError('Email already in use');
      }
      const password_hash = await AuthService.hashPassword(password);
      const user = await UserModel.create({
        tenant_id: req.tenantId,
        email,
        password_hash,
        name,
        role,
      });
      res.status(201).json({ message: 'User created successfully', user: sanitize(user) });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, name, role } = req.body;
      const existing = await UserModel.findById(id);
      ensureSameTenant(existing, req.tenantId);

      if (existing.role === 'Owner' && role && role !== 'Owner') {
        throw new ForbiddenError('Cannot change Owner role');
      }

      const updated = await UserModel.update(id, {
        email: email ?? existing.email,
        name: name ?? existing.name,
        role: role ?? existing.role,
      });
      res.json({ message: 'User updated successfully', user: sanitize(updated) });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const existing = await UserModel.findById(id);
      ensureSameTenant(existing, req.tenantId);
      if (existing.role === 'Owner') {
        throw new ForbiddenError('Cannot change Owner active status');
      }
      const updated = await UserModel.update(id, { is_active });
      res.json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        user: sanitize(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  async changeUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password) throw new BadRequestError('Password is required');
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }
      const existing = await UserModel.findById(id);
      ensureSameTenant(existing, req.tenantId);
      const password_hash = await AuthService.hashPassword(password);
      await UserModel.updatePassword(id, password_hash);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // "Delete" is soft-delete only — see User model. Owner cannot be deleted.
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await UserModel.findById(id);
      ensureSameTenant(existing, req.tenantId);
      if (existing.role === 'Owner') {
        throw new ForbiddenError('Cannot delete Owner account');
      }
      await UserModel.deactivate(id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
