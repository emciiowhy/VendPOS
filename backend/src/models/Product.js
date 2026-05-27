import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class ProductModel {
  // Create new product
  async create({ store_id, name, description = null, sku = null, category = null, price, cost = null, image_url = null }) {
    const result = await query(
      `INSERT INTO products (store_id, name, description, sku, category, price, cost, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [store_id, name, description, sku, category, price, cost, image_url]
    );
    return result.rows[0];
  }

  // Find product by ID (with store validation)
  async findById(id, storeId) {
    const result = await query(
      `SELECT * FROM products WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }
    
    return result.rows[0];
  }

  // Find all products for a store
  async findByStore(storeId, filters = {}) {
    let sql = `SELECT * FROM products WHERE store_id = $1`;
    const params = [storeId];
    let paramIndex = 2;

    // Filter by category
    if (filters.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    // Filter by active status
    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    // Search by name
    if (filters.search) {
      sql += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    // Pagination
    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  // Update product
  async update(id, storeId, updates) {
    const allowedUpdates = ['name', 'description', 'sku', 'category', 'price', 'cost', 'image_url', 'is_active'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id, storeId);

    const result = await query(
      `UPDATE products 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result.rows[0];
  }

  // Delete product (soft delete - set is_active to false)
  async delete(id, storeId) {
    const result = await query(
      `UPDATE products SET is_active = false 
       WHERE id = $1 AND store_id = $2
       RETURNING id`,
      [id, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result.rows[0];
  }

  // Hard delete product
  async hardDelete(id, storeId) {
    const result = await query(
      `DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id`,
      [id, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result.rows[0];
  }

  // Get product with inventory
  async findWithInventory(id, storeId) {
    const result = await query(
      `SELECT p.*, i.quantity as stock_quantity, i.reorder_level
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id AND p.store_id = i.store_id
       WHERE p.id = $1 AND p.store_id = $2`,
      [id, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result.rows[0];
  }

  // Get all products with inventory for a store
  async findAllWithInventory(storeId) {
    const result = await query(
      `SELECT p.*, 
              COALESCE(i.quantity, 0) as stock_quantity, 
              i.reorder_level,
              CASE WHEN COALESCE(i.quantity, 0) <= COALESCE(i.reorder_level, 0) 
                   THEN true ELSE false END as low_stock
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id AND p.store_id = i.store_id
       WHERE p.store_id = $1 AND p.is_active = true
       ORDER BY p.name`,
      [storeId]
    );
    return result.rows;
  }

  // Get product categories for a store
  async getCategories(storeId) {
    const result = await query(
      `SELECT DISTINCT category 
       FROM products 
       WHERE store_id = $1 AND category IS NOT NULL
       ORDER BY category`,
      [storeId]
    );
    return result.rows.map(row => row.category);
  }
}

export default new ProductModel();