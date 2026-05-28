import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class ProductModel {
  async create({ tenant_id, name, category, price, cost = null, current_stock = 0, reorder_level = 10, sku = null, image_url = null }) {
    const result = await query(
      `INSERT INTO products (tenant_id, name, category, price, cost, current_stock, reorder_level, sku, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenant_id, name, category, price, cost, current_stock, reorder_level, sku, image_url]
    );
    return result.rows[0];
  }

  async findById(product_id, tenant_id) {
    const result = await query(
      `SELECT * FROM products WHERE product_id = $1 AND tenant_id = $2`,
      [product_id, tenant_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Product not found');
    return result.rows[0];
  }

  async findByTenant(tenant_id, filters = {}) {
    let sql = `SELECT *,
                      (current_stock <= reorder_level) AS low_stock
                 FROM products WHERE tenant_id = $1`;
    const params = [tenant_id];
    let i = 2;

    if (filters.category) {
      sql += ` AND category = $${i++}`;
      params.push(filters.category);
    }
    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${i++}`;
      params.push(filters.is_active);
    }
    if (filters.search) {
      sql += ` AND name ILIKE $${i++}`;
      params.push(`%${filters.search}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${i++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ` OFFSET $${i++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async update(product_id, tenant_id, updates) {
    const allowed = ['name', 'category', 'price', 'cost', 'current_stock', 'reorder_level', 'sku', 'image_url', 'is_active'];
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) throw new Error('No valid fields to update');
    values.push(product_id, tenant_id);
    const result = await query(
      `UPDATE products SET ${fields.join(', ')}
        WHERE product_id = $${i} AND tenant_id = $${i + 1}
        RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new NotFoundError('Product not found');
    return result.rows[0];
  }

  // Soft delete only. Hard delete is impossible for products that have
  // ever appeared on a transaction (transaction_items.product_id RESTRICT).
  async deactivate(product_id, tenant_id) {
    const result = await query(
      `UPDATE products SET is_active = false
        WHERE product_id = $1 AND tenant_id = $2
        RETURNING product_id`,
      [product_id, tenant_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Product not found');
    return result.rows[0];
  }

  async getCategories(tenant_id) {
    const result = await query(
      `SELECT DISTINCT category
         FROM products
        WHERE tenant_id = $1 AND category IS NOT NULL
        ORDER BY category`,
      [tenant_id]
    );
    return result.rows.map(r => r.category);
  }

  async getLowStock(tenant_id) {
    const result = await query(
      `SELECT * FROM products
        WHERE tenant_id = $1
          AND is_active = true
          AND current_stock <= reorder_level
        ORDER BY current_stock ASC`,
      [tenant_id]
    );
    return result.rows;
  }

  // Adjust stock directly (admin/manual top-up). Returns updated row.
  // Increments are unguarded; explicit decrements use this too — for
  // sale-driven decrements, use Transaction.tryDecrementStock instead.
  async adjustStock(product_id, tenant_id, delta) {
    const result = await query(
      `UPDATE products
          SET current_stock = current_stock + $1
        WHERE product_id = $2 AND tenant_id = $3
          AND current_stock + $1 >= 0
        RETURNING *`,
      [delta, product_id, tenant_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Product not found or would go negative');
    return result.rows[0];
  }
}

export default new ProductModel();
