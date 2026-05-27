import ProductModel from '../models/Product.js';
import InventoryModel from '../models/Inventory.js';
import { BadRequestError } from '../utils/errors.js';
import { isValidPrice } from '../utils/validation.js';
import logger from '../utils/logger.js';

class ProductController {
  // Get all products
  async getAllProducts(req, res, next) {
    try {
      const storeId = req.storeId;
      const filters = {
        category: req.query.category,
        is_active: req.query.is_active === 'false' ? false : undefined,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };

      const products = await ProductModel.findByStore(storeId, filters);

      res.json({
        products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products with inventory
  async getProductsWithInventory(req, res, next) {
    try {
      const storeId = req.storeId;
      const products = await ProductModel.findAllWithInventory(storeId);

      res.json({
        products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  async getProduct(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;

      const product = await ProductModel.findWithInventory(id, storeId);

      res.json({
        product
      });
    } catch (error) {
      next(error);
    }
  }

  // Create product
  async createProduct(req, res, next) {
    try {
      const storeId = req.storeId;
      const { name, description, sku, category, price, cost, image_url, initial_stock = 0 } = req.body;

      // Validate required fields
      if (!name || !price) {
        throw new BadRequestError('Product name and price are required');
      }

      // Validate price
      if (!isValidPrice(price)) {
        throw new BadRequestError('Invalid price value');
      }

      if (cost && !isValidPrice(cost)) {
        throw new BadRequestError('Invalid cost value');
      }

      // Create product
      const product = await ProductModel.create({
        store_id: storeId,
        name,
        description,
        sku,
        category,
        price,
        cost,
        image_url
      });

      // Create initial inventory
      if (initial_stock >= 0) {
        await InventoryModel.upsert({
          store_id: storeId,
          product_id: product.id,
          quantity: initial_stock
        });
      }

      logger.success(`Product created: ${name} (ID: ${product.id})`);

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;
      const updates = req.body;

      // Validate price if provided
      if (updates.price && !isValidPrice(updates.price)) {
        throw new BadRequestError('Invalid price value');
      }

      if (updates.cost && !isValidPrice(updates.cost)) {
        throw new BadRequestError('Invalid cost value');
      }

      const product = await ProductModel.update(id, storeId, updates);

      logger.success(`Product updated: ${product.name} (ID: ${id})`);

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product (soft delete)
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;

      await ProductModel.delete(id, storeId);

      logger.success(`Product deleted: ID ${id}`);

      res.json({
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product categories
  async getCategories(req, res, next) {
    try {
      const storeId = req.storeId;
      const categories = await ProductModel.getCategories(storeId);

      res.json({
        categories
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();