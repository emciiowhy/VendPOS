import express from 'express';
import storeController from '../controllers/storeController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

// Get store details
router.get('/', storeController.getStore);

// Update store (owner only)
router.put('/', requireOwner, storeController.updateStore);

// Update store logo (owner only)
router.post('/logo', requireOwner, storeController.updateLogo);

export default router;