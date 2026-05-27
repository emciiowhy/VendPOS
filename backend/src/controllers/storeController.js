import StoreModel from '../models/Store.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';
import { isValidHexColor, isValidPhone } from '../utils/validation.js';
import logger from '../utils/logger.js';

class StoreController {
  // Get store details
  async getStore(req, res, next) {
    try {
      const storeId = req.storeId;
      const store = await StoreModel.findById(storeId);

      res.json({
        store
      });
    } catch (error) {
      next(error);
    }
  }

  // Update store
  async updateStore(req, res, next) {
    try {
      const storeId = req.storeId;
      const updates = req.body;

      // Validate theme color if provided
      if (updates.theme_color && !isValidHexColor(updates.theme_color)) {
        throw new BadRequestError('Invalid theme color format. Use hex format (e.g., #3B82F6)');
      }

      // Validate phone if provided
      if (updates.phone && !isValidPhone(updates.phone)) {
        throw new BadRequestError('Invalid phone number format');
      }

      const store = await StoreModel.update(storeId, updates);

      logger.success(`Store updated: ${store.store_name} (ID: ${storeId})`);

      res.json({
        message: 'Store updated successfully',
        store
      });
    } catch (error) {
      next(error);
    }
  }

  // Update store logo
  async updateLogo(req, res, next) {
    try {
      const storeId = req.storeId;
      const { logo_url } = req.body;

      if (!logo_url) {
        throw new BadRequestError('Logo URL is required');
      }

      const store = await StoreModel.update(storeId, { logo_url });

      logger.success(`Logo updated for store: ${store.store_name}`);

      res.json({
        message: 'Logo updated successfully',
        logo_url: store.logo_url
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StoreController();