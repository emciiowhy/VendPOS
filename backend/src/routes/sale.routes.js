import express from 'express';
import saleController from '../controllers/saleController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

// Get all sales
router.get('/', saleController.getAllSales);

// ⚠️ SPECIFIC ROUTES FIRST - before /:id
// Get sales summary
router.get('/summary', saleController.getSalesSummary);

// Get my today's sales (for cashiers)
router.get('/my-today', saleController.getMySalesToday);

// Create sale (all authenticated users can create sales)
router.post('/', saleController.createSale);

// Void sale (owner only) - also specific, before /:id
router.post('/:id/void', requireOwner, saleController.voidSale);

// ⚠️ DYNAMIC /:id ROUTE LAST - catches everything else
// Get single sale
router.get('/:id', saleController.getSale);

export default router;