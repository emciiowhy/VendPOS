import TenantModel from '../models/Tenant.js';
import { BadRequestError } from '../utils/errors.js';
import { isValidHexColor, isValidPhone } from '../utils/validation.js';
import logger from '../utils/logger.js';

class TenantController {
  async getTenant(req, res, next) {
    try {
      const tenant = await TenantModel.findById(req.tenantId);
      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  async updateTenant(req, res, next) {
    try {
      const updates = req.body;
      if (updates.theme_color && !isValidHexColor(updates.theme_color)) {
        throw new BadRequestError('Invalid theme color format. Use hex format (e.g., #3B82F6)');
      }
      if (updates.phone && !isValidPhone(updates.phone)) {
        throw new BadRequestError('Invalid phone number format');
      }
      const tenant = await TenantModel.update(req.tenantId, updates);
      logger.success(`Tenant updated: ${tenant.business_name} (id ${req.tenantId})`);
      res.json({ message: 'Tenant updated successfully', tenant });
    } catch (error) {
      next(error);
    }
  }

  async updateLogo(req, res, next) {
    try {
      const { logo_url } = req.body;
      if (!logo_url) throw new BadRequestError('Logo URL is required');
      const tenant = await TenantModel.update(req.tenantId, { logo_url });
      logger.success(`Logo updated for tenant: ${tenant.business_name}`);
      res.json({ message: 'Logo updated successfully', logo_url: tenant.logo_url });
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantController();
