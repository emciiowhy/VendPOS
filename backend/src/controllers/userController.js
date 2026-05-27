import UserModel from '../models/User.js';
import AuthService from '../services/authService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

class UserController {
  // Get all users in store (owner only)
  async getAllUsers(req, res, next) {
    try {
      const storeId = req.storeId;
      const users = await UserModel.findByStore(storeId);
      
      // Remove password hashes from response
      const sanitizedUsers = users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({ users: sanitizedUsers });
    } catch (error) {
      next(error);
    }
  }

  // Create new user (cashier)
  async createUser(req, res, next) {
    try {
      const { email, password, full_name, role = 'cashier' } = req.body;
      const storeId = req.storeId;

      // Validate input
      if (!email || !password || !full_name) {
        throw new BadRequestError('Email, password, and full name are required');
      }

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new BadRequestError('Email already in use');
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const user = await UserModel.create({
        email,
        password_hash: passwordHash,
        full_name,
        role,
        store_id: storeId,
      });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, full_name, role } = req.body;
      const storeId = req.storeId;

      // Get user to verify it belongs to the store
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.store_id !== storeId) {
        throw new ForbiddenError('Cannot modify users from another store');
      }

      // Prevent changing owner's role
      if (existingUser.role === 'owner' && role !== 'owner') {
        throw new ForbiddenError('Cannot change owner role');
      }

      // Update user
      const updatedUser = await UserModel.update(id, {
        email: email || existingUser.email,
        full_name: full_name || existingUser.full_name,
        role: role || existingUser.role,
      });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'User updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const storeId = req.storeId;

      // Get user to verify it belongs to the store
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.store_id !== storeId) {
        throw new ForbiddenError('Cannot modify users from another store');
      }

      // Prevent deactivating owner
      if (existingUser.role === 'owner') {
        throw new ForbiddenError('Cannot deactivate owner account');
      }

      // Update status
      const updatedUser = await UserModel.update(id, { is_active });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change user password
  async changeUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const storeId = req.storeId;

      if (!password) {
        throw new BadRequestError('Password is required');
      }

      // Get user to verify it belongs to the store
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.store_id !== storeId) {
        throw new ForbiddenError('Cannot modify users from another store');
      }

      // Hash new password
      const passwordHash = await AuthService.hashPassword(password);

      // Update password
      await UserModel.updatePassword(id, passwordHash);

      res.json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;

      // Get user to verify it belongs to the store
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.store_id !== storeId) {
        throw new ForbiddenError('Cannot delete users from another store');
      }

      // Prevent deleting owner
      if (existingUser.role === 'owner') {
        throw new ForbiddenError('Cannot delete owner account');
      }

      // Soft delete (deactivate) instead of hard delete
      await UserModel.update(id, { is_active: false });

      res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();