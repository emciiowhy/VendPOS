import { query, transaction } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class SaleModel {
  // Create new sale with items (transaction)
  async create({ store_id, cashier_id, items, payment_method = 'cash', notes = null }) {
    return await transaction(async (client) => {
      // Calculate total
      const total_amount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      // Create sale
      const saleResult = await client.query(
        `INSERT INTO sales (store_id, cashier_id, total_amount, payment_method, notes, status)
         VALUES ($1, $2, $3, $4, $5, 'completed')
         RETURNING *`,
        [store_id, cashier_id, total_amount, payment_method, notes]
      );

      const sale = saleResult.rows[0];

      // Create sale items and update inventory
      for (const item of items) {
        // Insert sale item
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [sale.id, item.product_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
        );

        // Decrease inventory
        const inventoryResult = await client.query(
          `UPDATE inventory 
           SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = $2 AND store_id = $3 AND quantity >= $1
           RETURNING *`,
          [item.quantity, item.product_id, store_id]
        );

        if (inventoryResult.rows.length === 0) {
          // Check current stock
          const stockCheck = await client.query(
            `SELECT quantity FROM inventory WHERE product_id = $1 AND store_id = $2`,
            [item.product_id, store_id]
          );

          if (stockCheck.rows.length === 0) {
            throw new BadRequestError(`Product ID ${item.product_id} has no inventory record`);
          } else {
            throw new BadRequestError(
              `Insufficient stock for product ID ${item.product_id}. ` +
              `Available: ${stockCheck.rows[0].quantity}, Requested: ${item.quantity}`
            );
          }
        }
      }

      // Get complete sale with items
      return await this.findByIdWithItems(sale.id, store_id, client);
    });
  }

  // Find sale by ID
  async findById(id, storeId) {
    const result = await query(
      `SELECT s.*, u.full_name as cashier_name, u.email as cashier_email
       FROM sales s
       JOIN users u ON s.cashier_id = u.id
       WHERE s.id = $1 AND s.store_id = $2`,
      [id, storeId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Sale not found');
    }

    return result.rows[0];
  }

  // Find sale with items
  async findByIdWithItems(id, storeId, client = null) {
    const queryFn = client ? client.query.bind(client) : query;

    const saleResult = await queryFn(
      `SELECT s.*, u.full_name as cashier_name, u.email as cashier_email
       FROM sales s
       JOIN users u ON s.cashier_id = u.id
       WHERE s.id = $1 AND s.store_id = $2`,
      [id, storeId]
    );

    if (saleResult.rows.length === 0) {
      throw new NotFoundError('Sale not found');
    }

    const sale = saleResult.rows[0];

    // Get sale items
    const itemsResult = await queryFn(
      `SELECT si.*, p.name as product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1
       ORDER BY si.id`,
      [id]
    );

    sale.items = itemsResult.rows;

    return sale;
  }

  // Find all sales for a store
  async findByStore(storeId, filters = {}) {
    let sql = `
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.store_id = $1
    `;
    const params = [storeId];
    let paramIndex = 2;

    // Filter by cashier
    if (filters.cashier_id) {
      sql += ` AND s.cashier_id = $${paramIndex}`;
      params.push(filters.cashier_id);
      paramIndex++;
    }

    // Filter by status
    if (filters.status) {
      sql += ` AND s.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    // Filter by date range
    if (filters.start_date) {
      sql += ` AND s.created_at >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      sql += ` AND s.created_at <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    sql += ` ORDER BY s.created_at DESC`;

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

  // Void sale
  async void(id, storeId) {
    return await transaction(async (client) => {
      // Get sale with items
      const saleResult = await client.query(
        `SELECT * FROM sales WHERE id = $1 AND store_id = $2 AND status = 'completed'`,
        [id, storeId]
      );

      if (saleResult.rows.length === 0) {
        throw new NotFoundError('Sale not found or already voided');
      }

      // Get sale items
      const itemsResult = await client.query(
        `SELECT * FROM sale_items WHERE sale_id = $1`,
        [id]
      );

      // Restore inventory for each item
      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE inventory 
           SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = $2 AND store_id = $3`,
          [item.quantity, item.product_id, storeId]
        );
      }

      // Update sale status
      const result = await client.query(
        `UPDATE sales SET status = 'void' WHERE id = $1 RETURNING *`,
        [id]
      );

      return result.rows[0];
    });
  }

  // Get sales summary for a period
  async getSummary(storeId, startDate, endDate) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_sale,
         COUNT(DISTINCT cashier_id) as active_cashiers
       FROM sales
       WHERE store_id = $1 
         AND status = 'completed'
         AND created_at >= $2 
         AND created_at <= $3`,
      [storeId, startDate, endDate]
    );

    return result.rows[0];
  }

  // Get today's sales for a cashier
  async getTodaySalesByCashier(cashierId, storeId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await query(
      `SELECT 
         COUNT(*) as total_transactions,
         COALESCE(SUM(total_amount), 0) as total_amount
       FROM sales
       WHERE cashier_id = $1 
         AND store_id = $2
         AND status = 'completed'
         AND created_at >= $3`,
      [cashierId, storeId, today]
    );

    return result.rows[0];
  }
}

export default new SaleModel();