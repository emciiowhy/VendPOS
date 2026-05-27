import InventoryModel from '../models/Inventory.js';
import logger from '../utils/logger.js';

class NotificationService {
  async checkLowStockAlerts(storeId) {
    try {
      const lowStockItems = await InventoryModel.getLowStock(storeId);
      
      if (lowStockItems.length > 0) {
        logger.warn(`Low stock alert: ${lowStockItems.length} items for store ${storeId}`);
        
        return {
          count: lowStockItems.length,
          items: lowStockItems,
          message: `${lowStockItems.length} items are low on stock`,
        };
      }
      
      return { count: 0, items: [], message: 'All items well stocked' };
    } catch (error) {
      logger.error('Error checking low stock:', error);
      throw error;
    }
  }

  async getNotifications(storeId) {
    const notifications = [];
    const now = new Date().toISOString();

    // Check low stock
    const lowStockAlert = await this.checkLowStockAlerts(storeId);
    if (lowStockAlert.count > 0) {
      notifications.push({
        type: 'low_stock',
        severity: 'warning',
        title: 'Low Stock Alert',
        message: lowStockAlert.message,
        count: lowStockAlert.count,
        items: lowStockAlert.items,
        timestamp: now,
      });
    }

    // Check out of stock
    const outOfStock = await this.getOutOfStockItems(storeId);
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

  // Get out of stock items
  async getOutOfStockItems(storeId) {
    try {
      const items = await InventoryModel.findByStore(storeId);
      const outOfStock = items.filter(item => item.quantity === 0);
      
      return {
        count: outOfStock.length,
        items: outOfStock,
        message: outOfStock.length > 0 
          ? `${outOfStock.length} items are out of stock` 
          : 'No items out of stock',
      };
    } catch (error) {
      logger.error('Error getting out of stock items:', error);
      throw error;
    }
  }

  // Get all alerts summary
  async getAlertsSummary(storeId) {
    const lowStock = await this.checkLowStockAlerts(storeId);
    const outOfStock = await this.getOutOfStockItems(storeId);

    return {
      low_stock: lowStock,
      out_of_stock: outOfStock,
      total_alerts: lowStock.count + outOfStock.count,
    };
  }
}

export default new NotificationService();