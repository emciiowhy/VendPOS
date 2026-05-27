import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class InventoryModel {
  // Create or update inventory for a product
  async upsert({ store_id, product_id, quantity, reorder_level = 10 }) {
    const result = await query(
      `INSERT INTO inventory (store_id, product_id, quantity, reorder_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id, product_id) 
       DO UPDATE SET 
         quantity = $3,
         reorder_level = $4,
         last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [store_id, product_id, quantity, reorder_level]
    );
    return result.rows[0];
  }

  // Get inventory for a specific product
  async findByProduct(productId, storeId) {
    const result = await query(
      `SELECT i.*, p.name as product_name, p.sku
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.product_id = $1 AND i.store_id = $2`,
      [productId, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory record not found');
    }

    return result.rows[0];
  }

  // Get all inventory for a store
  async findByStore(storeId) {
    const result = await query(
      `SELECT i.*, p.name as product_name, p.sku, p.category,
              CASE WHEN i.quantity <= i.reorder_level 
                   THEN true ELSE false END as low_stock
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.store_id = $1
       ORDER BY p.name`,
      [storeId]
    );
    return result.rows;
  }

  // Update inventory quantity
  async updateQuantity(productId, storeId, quantity) {
    const result = await query(
      `UPDATE inventory 
       SET quantity = $1, last_updated = CURRENT_TIMESTAMP
       WHERE product_id = $2 AND store_id = $3
       RETURNING *`,
      [quantity, productId, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory record not found');
    }

    return result.rows[0];
  }

  // Adjust inventory (add or subtract)
  async adjustQuantity(productId, storeId, adjustment) {
    const result = await query(
      `UPDATE inventory 
       SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP
       WHERE product_id = $2 AND store_id = $3
       RETURNING *`,
      [adjustment, productId, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory record not found');
    }

    return result.rows[0];
  }

  // Decrease inventory (for sales)
  async decreaseStock(productId, storeId, quantity) {
    const result = await query(
      `UPDATE inventory 
       SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
       WHERE product_id = $2 AND store_id = $3 AND quantity >= $1
       RETURNING *`,
      [quantity, productId, storeId]
    );

    if (result.rows.length === 0) {
      // Check if it's because of insufficient stock
      const check = await query(
        `SELECT quantity FROM inventory WHERE product_id = $1 AND store_id = $2`,
        [productId, storeId]
      );

      if (check.rows.length === 0) {
        throw new NotFoundError('Inventory record not found');
      } else {
        throw new Error(`Insufficient stock. Available: ${check.rows[0].quantity}, Requested: ${quantity}`);
      }
    }

    return result.rows[0];
  }

  // Get low stock items
  async getLowStock(storeId) {
    const result = await query(
      `SELECT i.*, p.name as product_name, p.sku, p.category
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.store_id = $1 AND i.quantity <= i.reorder_level
       ORDER BY i.quantity ASC`,
      [storeId]
    );
    return result.rows;
  }

  // Update reorder level
  async updateReorderLevel(productId, storeId, reorderLevel) {
    const result = await query(
      `UPDATE inventory 
       SET reorder_level = $1
       WHERE product_id = $2 AND store_id = $3
       RETURNING *`,
      [reorderLevel, productId, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory record not found');
    }

    return result.rows[0];
  }

  // Check if product has sufficient stock
  async hasStock(productId, storeId, requiredQuantity) {
    const result = await query(
      `SELECT quantity FROM inventory 
       WHERE product_id = $1 AND store_id = $2`,
      [productId, storeId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].quantity >= requiredQuantity;
  }

  // Delete inventory record
  async delete(productId, storeId) {
    const result = await query(
      `DELETE FROM inventory WHERE product_id = $1 AND store_id = $2 RETURNING id`,
      [productId, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory record not found');
    }

    return result.rows[0];
  }
}

export default new InventoryModel();