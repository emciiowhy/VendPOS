import express from 'express';
import reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// All report routes require authentication, tenant isolation, and owner role
router.use(authenticate, tenantIsolation, requireOwner);

// Daily sales report
router.get('/daily-sales', reportController.getDailySales);

// Product performance report
router.get('/product-performance', reportController.getProductPerformance);

// Inventory report
router.get('/inventory', reportController.getInventoryReport);

// Cashier performance report
router.get('/cashier-performance', reportController.getCashierPerformance);

// Sales trends (weekly/monthly)
router.get('/sales-trends', reportController.getSalesTrends);

// Dashboard statistics (overview)
router.get('/dashboard', reportController.getDashboardStats);

export default router;