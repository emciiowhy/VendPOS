import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';

const router = express.Router();

router.use(authenticate, tenantIsolation);

// Specific routes BEFORE /:id (preserved from prototype).
router.get('/summary', transactionController.getSummary);
router.get('/my-today', transactionController.getMyTransactionsToday);

router.get('/', transactionController.getAllTransactions);
router.post('/', transactionController.createTransaction);

// Dynamic /:id last.
router.get('/:id', transactionController.getTransaction);

export default router;
