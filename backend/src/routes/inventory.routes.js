import express from 'express';
import inventoryController from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

// Get all inventory
router.get('/', inventoryController.getAllInventory);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStock);

// Get inventory for specific product
router.get('/:productId', inventoryController.getProductInventory);

// Update inventory quantity (owner only)
router.put('/:productId/quantity', requireOwner, inventoryController.updateQuantity);

// Adjust inventory (owner only)
router.post('/:productId/adjust', requireOwner, inventoryController.adjustQuantity);

// Update reorder level (owner only)
router.put('/:productId/reorder-level', requireOwner, inventoryController.updateReorderLevel);

export default router;