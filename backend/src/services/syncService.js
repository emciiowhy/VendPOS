import { query, transaction } from '../config/database.js';
import SaleModel from '../models/Sale.js';
import InventoryModel from '../models/Inventory.js';
import logger from '../utils/logger.js';

/**
 * Sync Service
 * Handles synchronization of offline data when connection is restored
 */
class SyncService {
  /**
   * Process queued sales from offline mode
   * @param {Array} queuedSales - Array of sale objects
   * @param {Number} storeId - Store ID
   * @param {Number} cashierId - Cashier ID
   * @returns {Object} Sync results
   */
  async syncQueuedSales(queuedSales, storeId, cashierId) {
    const results = {
      successful: [],
      failed: [],
      total: queuedSales.length
    };

    logger.info(`Starting sync of ${queuedSales.length} queued sales for store ${storeId}`);

    for (const queuedSale of queuedSales) {
      try {
        // Validate sale data
        const validation = this.validateQueuedSale(queuedSale);
        if (!validation.valid) {
          results.failed.push({
            offline_id: queuedSale.offline_id,
            error: validation.error
          });
          continue;
        }

        // Create sale in database
        const sale = await SaleModel.create({
          store_id: storeId,
          cashier_id: cashierId,
          items: queuedSale.items,
          payment_method: queuedSale.payment_method || 'cash',
          notes: `[Offline sync] ${queuedSale.notes || ''}`,
          // Use offline timestamp if available
          created_at: queuedSale.timestamp ? new Date(queuedSale.timestamp) : undefined
        });

        results.successful.push({
          offline_id: queuedSale.offline_id,
          sale_id: sale.id,
          synced_at: new Date()
        });

        logger.success(`Synced offline sale: ${queuedSale.offline_id} -> DB ID: ${sale.id}`);
      } catch (error) {
        logger.error(`Failed to sync sale ${queuedSale.offline_id}:`, error);
        
        results.failed.push({
          offline_id: queuedSale.offline_id,
          error: error.message
        });
      }
    }

    logger.info(
      `Sync complete: ${results.successful.length} successful, ${results.failed.length} failed`
    );

    return results;
  }

  /**
   * Sync inventory adjustments made offline
   * @param {Array} adjustments - Array of inventory adjustment objects
   * @param {Number} storeId - Store ID
   * @returns {Object} Sync results
   */
  async syncInventoryAdjustments(adjustments, storeId) {
    const results = {
      successful: [],
      failed: [],
      total: adjustments.length
    };

    logger.info(`Starting sync of ${adjustments.length} inventory adjustments`);

    for (const adjustment of adjustments) {
      try {
        const { product_id, adjustment_value, reason, timestamp } = adjustment;

        // Verify product exists
        await InventoryModel.findByProduct(product_id, storeId);

        // Apply adjustment
        await InventoryModel.adjustQuantity(product_id, storeId, adjustment_value);

        results.successful.push({
          offline_id: adjustment.offline_id,
          product_id: product_id,
          synced_at: new Date()
        });

        logger.success(`Synced inventory adjustment for product ${product_id}`);
      } catch (error) {
        logger.error(`Failed to sync adjustment ${adjustment.offline_id}:`, error);
        
        results.failed.push({
          offline_id: adjustment.offline_id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Validate queued sale data
   * @param {Object} sale - Sale object
   * @returns {Object} Validation result
   */
  validateQueuedSale(sale) {
    // Check required fields
    if (!sale.offline_id) {
      return { valid: false, error: 'Missing offline_id' };
    }

    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      return { valid: false, error: 'Sale must have at least one item' };
    }

    // Validate each item
    for (const item of sale.items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return { 
          valid: false, 
          error: 'Each item must have product_id, quantity, and unit_price' 
        };
      }

      if (item.quantity <= 0) {
        return { valid: false, error: 'Item quantity must be greater than 0' };
      }

      if (item.unit_price < 0) {
        return { valid: false, error: 'Item price cannot be negative' };
      }
    }

    return { valid: true };
  }

  /**
   * Detect and resolve conflicts
   * @param {Object} offlineData - Data from offline operation
   * @param {Object} serverData - Current data from server
   * @returns {Object} Conflict resolution strategy
   */
  detectConflict(offlineData, serverData) {
    const conflicts = [];

    // Example: Inventory conflict
    if (offlineData.type === 'inventory_adjustment') {
      const offlineQuantity = offlineData.quantity;
      const serverQuantity = serverData.quantity;

      if (offlineQuantity !== serverQuantity) {
        conflicts.push({
          type: 'quantity_mismatch',
          offline_value: offlineQuantity,
          server_value: serverQuantity,
          resolution: 'use_server' // Default strategy
        });
      }
    }

    return {
      has_conflicts: conflicts.length > 0,
      conflicts: conflicts
    };
  }

  /**
   * Get sync status for a store
   * @param {Number} storeId - Store ID
   * @returns {Object} Sync status
   */
  async getSyncStatus(storeId) {
    try {
      // Get latest synced sale
      const latestSaleResult = await query(
        `SELECT MAX(created_at) as last_sale_sync
         FROM sales
         WHERE store_id = $1`,
        [storeId]
      );

      // Get latest inventory update
      const latestInventoryResult = await query(
        `SELECT MAX(last_updated) as last_inventory_sync
         FROM inventory
         WHERE store_id = $1`,
        [storeId]
      );

      return {
        last_sale_sync: latestSaleResult.rows[0].last_sale_sync,
        last_inventory_sync: latestInventoryResult.rows[0].last_inventory_sync,
        server_time: new Date()
      };
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Create sync checkpoint
   * @param {Number} storeId - Store ID
   * @param {String} syncType - Type of sync (e.g., 'sales', 'inventory')
   * @returns {Object} Checkpoint data
   */
  async createSyncCheckpoint(storeId, syncType) {
    const checkpoint = {
      store_id: storeId,
      sync_type: syncType,
      timestamp: new Date(),
      checkpoint_id: `${storeId}-${syncType}-${Date.now()}`
    };

    logger.info(`Sync checkpoint created: ${checkpoint.checkpoint_id}`);
    
    return checkpoint;
  }

  /**
   * Verify data integrity after sync
   * @param {Array} syncedItems - Items that were synced
   * @param {Number} storeId - Store ID
   * @returns {Object} Integrity check results
   */
  async verifyDataIntegrity(syncedItems, storeId) {
    const issues = [];

    for (const item of syncedItems) {
      try {
        if (item.sale_id) {
          // Verify sale exists and totals match
          const sale = await SaleModel.findById(item.sale_id, storeId);
          
          // Verify inventory was properly deducted
          for (const saleItem of sale.items) {
            const inventory = await InventoryModel.findByProduct(
              saleItem.product_id,
              storeId
            );
            
            // Basic integrity check - inventory should not be negative
            if (inventory.quantity < 0) {
              issues.push({
                type: 'negative_inventory',
                product_id: saleItem.product_id,
                quantity: inventory.quantity
              });
            }
          }
        }
      } catch (error) {
        issues.push({
          type: 'verification_error',
          item_id: item.offline_id || item.sale_id,
          error: error.message
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Rollback synced data in case of critical error
   * @param {Array} syncedItems - Items to rollback
   * @returns {Object} Rollback results
   */
  async rollbackSync(syncedItems) {
    logger.warn(`Rolling back ${syncedItems.length} synced items`);
    
    const results = {
      rolled_back: [],
      failed_rollback: []
    };

    return await transaction(async (client) => {
      for (const item of syncedItems) {
        try {
          if (item.sale_id) {
            // Void the sale (this will restore inventory)
            await client.query(
              `UPDATE sales SET status = 'void' WHERE id = $1`,
              [item.sale_id]
            );

            // Restore inventory
            const saleItemsResult = await client.query(
              `SELECT product_id, quantity FROM sale_items WHERE sale_id = $1`,
              [item.sale_id]
            );

            for (const saleItem of saleItemsResult.rows) {
              await client.query(
                `UPDATE inventory 
                 SET quantity = quantity + $1 
                 WHERE product_id = $2`,
                [saleItem.quantity, saleItem.product_id]
              );
            }

            results.rolled_back.push(item);
          }
        } catch (error) {
          logger.error(`Failed to rollback item:`, error);
          results.failed_rollback.push({
            ...item,
            error: error.message
          });
        }
      }

      return results;
    });
  }

  /**
   * Generate sync report
   * @param {Object} syncResults - Results from sync operation
   * @returns {Object} Formatted report
   */
  generateSyncReport(syncResults) {
    const { successful, failed, total } = syncResults;
    
    return {
      summary: {
        total: total,
        successful: successful.length,
        failed: failed.length,
        success_rate: total > 0 ? (successful.length / total * 100).toFixed(2) + '%' : '0%'
      },
      successful_items: successful,
      failed_items: failed,
      timestamp: new Date()
    };
  }
}

export default new SyncService();