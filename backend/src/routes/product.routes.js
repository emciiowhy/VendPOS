import express from 'express';
import productController from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireOwner } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

// Get all products (available to all authenticated users)
router.get('/', productController.getAllProducts);

// Get products with inventory
router.get('/with-inventory', productController.getProductsWithInventory);

// Get product categories
router.get('/categories', productController.getCategories);

// Get single product
router.get('/:id', productController.getProduct);

// Create product (owner only)
router.post('/', requireOwner, productController.createProduct);

// Update product (owner only)
router.put('/:id', requireOwner, productController.updateProduct);

// Delete product (owner only)
router.delete('/:id', requireOwner, productController.deleteProduct);

export default router;