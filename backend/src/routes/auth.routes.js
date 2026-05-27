import express from 'express';
import authController from '../controllers/authController.js';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

// User management routes (owner only)
router.get('/users', authenticate, tenantIsolation, requireOwner, userController.getAllUsers);
router.post('/users', authenticate, tenantIsolation, requireOwner, userController.createUser);
router.put('/users/:id', authenticate, tenantIsolation, requireOwner, userController.updateUser);
router.patch('/users/:id/status', authenticate, tenantIsolation, requireOwner, userController.updateUserStatus);
router.patch('/users/:id/password', authenticate, tenantIsolation, requireOwner, userController.changeUserPassword);
router.delete('/users/:id', authenticate, tenantIsolation, requireOwner, userController.deleteUser);

export default router;