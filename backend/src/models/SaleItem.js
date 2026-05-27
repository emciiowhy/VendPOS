import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class SaleItemModel {
  // Create sale item
  async create({ sale_id, product_id, quantity, unit_price, subtotal }) {
    const result = await query(
      `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sale_id, product_id, quantity, unit_price, subtotal]
    );
    return result.rows[0];
  }

  // Get all items for a sale
  async findBySaleId(saleId) {
    const result = await query(
      `SELECT si.*, p.name as product_name, p.sku, p.category
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1
       ORDER BY si.id`,
      [saleId]
    );
    return result.rows;
  }

  // Get sale item by ID
  async findById(id) {
    const result = await query(
      `SELECT si.*, p.name as product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Sale item not found');
    }

    return result.rows[0];
  }

  // Get all sale items for a product (sales history)
  async findByProductId(productId, limit = 50) {
    const result = await query(
      `SELECT si.*, s.created_at as sale_date, s.status,
              u.full_name as cashier_name
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN users u ON s.cashier_id = u.id
       WHERE si.product_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  }

  // Get sale items with product details for a specific sale
  async findBySaleIdWithDetails(saleId) {
    const result = await query(
      `SELECT si.*,
              p.name as product_name,
              p.sku,
              p.category,
              p.image_url,
              p.cost,
              (si.subtotal - (si.quantity * p.cost)) as profit
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1
       ORDER BY si.id`,
      [saleId]
    );
    return result.rows;
  }

  // Calculate total for a sale based on items
  async calculateSaleTotal(saleId) {
    const result = await query(
      `SELECT SUM(subtotal) as total
       FROM sale_items
       WHERE sale_id = $1`,
      [saleId]
    );
    return parseFloat(result.rows[0].total) || 0;
  }

  // Get best-selling items across all sales
  async getBestSellers(storeId, limit = 10, startDate = null, endDate = null) {
    let sql = `
      SELECT si.product_id,
             p.name as product_name,
             p.category,
             p.price as current_price,
             COUNT(si.id) as times_sold,
             SUM(si.quantity) as total_quantity_sold,
             SUM(si.subtotal) as total_revenue,
             AVG(si.unit_price) as average_selling_price
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.store_id = $1 AND s.status = 'completed'
    `;

    const params = [storeId];
    let paramIndex = 2;

    if (startDate) {
      sql += ` AND s.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += `
      GROUP BY si.product_id, p.name, p.category, p.price
      ORDER BY total_revenue DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  // Get items that are frequently bought together
  async getFrequentlyBoughtTogether(productId, storeId, limit = 5) {
    const result = await query(
      `SELECT si2.product_id,
              p.name as product_name,
              p.price,
              COUNT(*) as times_bought_together
       FROM sale_items si1
       JOIN sale_items si2 ON si1.sale_id = si2.sale_id
       JOIN sales s ON si1.sale_id = s.id
       JOIN products p ON si2.product_id = p.id
       WHERE si1.product_id = $1
         AND si2.product_id != $1
         AND s.store_id = $2
         AND s.status = 'completed'
       GROUP BY si2.product_id, p.name, p.price
       ORDER BY times_bought_together DESC
       LIMIT $3`,
      [productId, storeId, limit]
    );
    return result.rows;
  }

  // Get profit analysis for sale items
  async getProfitAnalysis(storeId, startDate, endDate) {
    const result = await query(
      `SELECT 
         SUM(si.subtotal) as total_revenue,
         SUM(si.quantity * p.cost) as total_cost,
         SUM(si.subtotal - (si.quantity * p.cost)) as total_profit,
         AVG((si.subtotal - (si.quantity * p.cost)) / NULLIF(si.subtotal, 0) * 100) as profit_margin_percentage
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.store_id = $1
         AND s.status = 'completed'
         AND s.created_at >= $2
         AND s.created_at <= $3`,
      [storeId, startDate, endDate]
    );
    return result.rows[0];
  }

  // Update sale item (rarely used, but available)
  async update(id, updates) {
    const allowedUpdates = ['quantity', 'unit_price', 'subtotal'];
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

    values.push(id);

    const result = await query(
      `UPDATE sale_items 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Sale item not found');
    }

    return result.rows[0];
  }

  // Delete sale item
  async delete(id) {
    const result = await query(
      `DELETE FROM sale_items WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Sale item not found');
    }

    return result.rows[0];
  }

  // Get item count for a sale
  async getItemCount(saleId) {
    const result = await query(
      `SELECT COUNT(*) as item_count, SUM(quantity) as total_items
       FROM sale_items
       WHERE sale_id = $1`,
      [saleId]
    );
    return result.rows[0];
  }
}

export default new SaleItemModel();