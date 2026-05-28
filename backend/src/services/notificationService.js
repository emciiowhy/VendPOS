import ProductModel from '../models/Product.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// Low-stock + out-of-stock alerts for a tenant. Stock now lives on
// products.current_stock, so this reads from there directly.
class NotificationService {
  async getLowStockItems(tenantId) {
    const items = await ProductModel.getLowStock(tenantId);
    const lowOnly = items.filter(i => i.current_stock > 0);
    return {
      count: lowOnly.length,
      items: lowOnly,
      message: lowOnly.length > 0
        ? `${lowOnly.length} item${lowOnly.length === 1 ? '' : 's'} low on stock`
        : 'All items well stocked',
    };
  }

  async getOutOfStockItems(tenantId) {
    const result = await query(
      `SELECT *
         FROM products
        WHERE tenant_id = $1
          AND is_active = true
          AND current_stock = 0
        ORDER BY name`,
      [tenantId]
    );
    return {
      count: result.rows.length,
      items: result.rows,
      message: result.rows.length > 0
        ? `${result.rows.length} item${result.rows.length === 1 ? '' : 's'} out of stock`
        : 'No items out of stock',
    };
  }

  async getNotifications(tenantId) {
    const notifications = [];
    const now = new Date().toISOString();

    const lowStock = await this.getLowStockItems(tenantId);
    if (lowStock.count > 0) {
      notifications.push({
        type: 'low_stock',
        severity: 'warning',
        title: 'Low Stock Alert',
        message: lowStock.message,
        count: lowStock.count,
        items: lowStock.items,
        timestamp: now,
      });
      logger.warn(`Low stock alert: ${lowStock.count} items for tenant ${tenantId}`);
    }

    const outOfStock = await this.getOutOfStockItems(tenantId);
    if (outOfStock.count > 0) {
      notifications.push({
        type: 'out_of_stock',
        severity: 'error',
        title: 'Out of Stock',
        message: outOfStock.message,
        count: outOfStock.count,
        items: outOfStock.items,
        timestamp: now,
      });
    }

    return notifications;
  }

  async getAlertsSummary(tenantId) {
    const low = await this.getLowStockItems(tenantId);
    const out = await this.getOutOfStockItems(tenantId);
    return {
      low_stock: low,
      out_of_stock: out,
      total_alerts: low.count + out.count,
    };
  }
}

export default new NotificationService();
