import ProductModel from '../models/Product.js';
import { BadRequestError } from '../utils/errors.js';
import { isValidPrice } from '../utils/validation.js';
import logger from '../utils/logger.js';

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        is_active: req.query.is_active === 'false' ? false : (req.query.is_active === 'true' ? true : undefined),
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
      };
      const products = await ProductModel.findByTenant(req.tenantId, filters);
      res.json({ products, count: products.length });
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req, res, next) {
    try {
      const product = await ProductModel.findById(req.params.id, req.tenantId);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const { name, category, price, cost, current_stock, reorder_level, sku, image_url } = req.body;

      if (!name || !category || price == null) {
        throw new BadRequestError('name, category, and price are required');
      }
      if (!isValidPrice(price)) throw new BadRequestError('Invalid price value');
      if (cost != null && !isValidPrice(cost)) throw new BadRequestError('Invalid cost value');

      const product = await ProductModel.create({
        tenant_id: req.tenantId,
        name,
        category,
        price,
        cost,
        current_stock: current_stock ?? 0,
        reorder_level: reorder_level ?? 10,
        sku,
        image_url,
      });

      logger.success(`Product created: ${name} (id ${product.product_id})`);
      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const updates = req.body;
      if (updates.price != null && !isValidPrice(updates.price)) {
        throw new BadRequestError('Invalid price value');
      }
      if (updates.cost != null && !isValidPrice(updates.cost)) {
        throw new BadRequestError('Invalid cost value');
      }
      const product = await ProductModel.update(req.params.id, req.tenantId, updates);
      logger.success(`Product updated: ${product.name} (id ${product.product_id})`);
      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await ProductModel.deactivate(req.params.id, req.tenantId);
      logger.success(`Product deactivated: id ${req.params.id}`);
      res.json({ message: 'Product deactivated' });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await ProductModel.getCategories(req.tenantId);
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const products = await ProductModel.getLowStock(req.tenantId);
      res.json({ products, count: products.length });
    } catch (error) {
      next(error);
    }
  }

  // Manual stock top-up (owner). For sale-driven decrements,
  // the recordTransaction flow uses tryDecrementStock instead.
  async adjustStock(req, res, next) {
    try {
      const { delta } = req.body;
      if (typeof delta !== 'number' || delta === 0) {
        throw new BadRequestError('delta must be a non-zero number');
      }
      const product = await ProductModel.adjustStock(req.params.id, req.tenantId, delta);
      logger.success(`Stock adjusted for product ${product.product_id} by ${delta} → ${product.current_stock}`);
      res.json({ message: 'Stock adjusted', product });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
