import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get alerts summary
router.get('/summary', notificationController.getAlertsSummary);

export default router;