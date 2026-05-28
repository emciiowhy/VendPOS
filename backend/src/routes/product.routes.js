import express from 'express';
import productController from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate, tenantIsolation);

// Specific routes BEFORE /:id.
router.get('/categories', productController.getCategories);
router.get('/low-stock', productController.getLowStock);

router.get('/', productController.getAllProducts);
router.post('/', requireOwner, productController.createProduct);

router.get('/:id', productController.getProduct);
router.put('/:id', requireOwner, productController.updateProduct);
router.patch('/:id/stock', requireOwner, productController.adjustStock);
router.delete('/:id', requireOwner, productController.deleteProduct);

export default router;
