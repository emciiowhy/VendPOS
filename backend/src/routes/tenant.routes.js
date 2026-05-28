import express from 'express';
import tenantController from '../controllers/tenantController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate, tenantIsolation);

router.get('/', tenantController.getTenant);
router.put('/', requireOwner, tenantController.updateTenant);
router.post('/logo', requireOwner, tenantController.updateLogo);

export default router;
