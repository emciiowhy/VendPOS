import InventoryModel from '../models/Inventory.js';
import { BadRequestError } from '../utils/errors.js';
import { isValidQuantity } from '../utils/validation.js';
import logger from '../utils/logger.js';

class InventoryController {
  // Get all inventory
  async getAllInventory(req, res, next) {
    try {
      const storeId = req.storeId;
      const inventory = await InventoryModel.findByStore(storeId);

      res.json({
        inventory,
        count: inventory.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get inventory for a specific product
  async getProductInventory(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.storeId;

      const inventory = await InventoryModel.findByProduct(productId, storeId);

      res.json({
        inventory
      });
    } catch (error) {
      next(error);
    }
  }

  // Update inventory quantity
  async updateQuantity(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.storeId;
      const { quantity } = req.body;

      if (quantity === undefined) {
        throw new BadRequestError('Quantity is required');
      }

      if (!isValidQuantity(quantity)) {
        throw new BadRequestError('Invalid quantity value');
      }

      const inventory = await InventoryModel.updateQuantity(productId, storeId, quantity);

      logger.success(`Inventory updated for product ${productId}: ${quantity} units`);

      res.json({
        message: 'Inventory updated successfully',
        inventory
      });
    } catch (error) {
      next(error);
    }
  }

  // Adjust inventory (add or subtract)
  async adjustQuantity(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.storeId;
      const { adjustment, reason } = req.body;

      if (adjustment === undefined) {
        throw new BadRequestError('Adjustment value is required');
      }

      const inventory = await InventoryModel.adjustQuantity(productId, storeId, adjustment);

      logger.success(
        `Inventory adjusted for product ${productId}: ${adjustment > 0 ? '+' : ''}${adjustment} ` +
        `(Reason: ${reason || 'Not specified'})`
      );

      res.json({
        message: 'Inventory adjusted successfully',
        inventory
      });
    } catch (error) {
      next(error);
    }
  }

  // Get low stock items
  async getLowStock(req, res, next) {
    try {
      const storeId = req.storeId;
      const lowStockItems = await InventoryModel.getLowStock(storeId);

      res.json({
        low_stock_items: lowStockItems,
        count: lowStockItems.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Update reorder level
  async updateReorderLevel(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.storeId;
      const { reorder_level } = req.body;

      if (reorder_level === undefined) {
        throw new BadRequestError('Reorder level is required');
      }

      if (!isValidQuantity(reorder_level)) {
        throw new BadRequestError('Invalid reorder level value');
      }

      const inventory = await InventoryModel.updateReorderLevel(productId, storeId, reorder_level);

      logger.success(`Reorder level updated for product ${productId}: ${reorder_level}`);

      res.json({
        message: 'Reorder level updated successfully',
        inventory
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();