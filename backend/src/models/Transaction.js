import { query, transaction } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class TransactionModel {
  // Decrement product stock atomically. Returns true iff the row was
  // actually updated. The WHERE guard is race-safe under READ COMMITTED;
  // verified by prototype (see CONTEXT.md → Verified invariants).
  // This is the only place in the codebase that mutates current_stock
  // downward — all checkout paths go through it.
  async tryDecrementStock(client, { tenant_id, product_id, qty }) {
    const result = await client.query(
      `UPDATE products
          SET current_stock = current_stock - $1
        WHERE tenant_id = $2
          AND product_id = $3
          AND current_stock >= $1`,
      [qty, tenant_id, product_id]
    );
    return result.rowCount === 1;
  }

  // Atomic checkout. Inserts a transactions row + transaction_items and
  // decrements stock for every line. If any item is short, the whole
  // transaction rolls back — no partial commits, no oversell. Append-only
  // per ADR-0001.
  async create({ tenant_id, user_id, items }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Transaction must contain at least one item');
    }

    return await transaction(async (client) => {
      const total_amount = items.reduce(
        (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
        0
      );

      const txRes = await client.query(
        `INSERT INTO transactions (tenant_id, user_id, total_amount)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [tenant_id, user_id, total_amount]
      );
      const tx = txRes.rows[0];

      for (const item of items) {
        const ok = await this.tryDecrementStock(client, {
          tenant_id,
          product_id: item.product_id,
          qty: item.quantity,
        });
        if (!ok) {
          const check = await client.query(
            `SELECT current_stock FROM products
              WHERE product_id = $1 AND tenant_id = $2`,
            [item.product_id, tenant_id]
          );
          if (check.rows.length === 0) {
            throw new BadRequestError(`Product ${item.product_id} does not exist in this tenant`);
          }
          throw new BadRequestError(
            `Insufficient stock for product ${item.product_id}. ` +
            `Available: ${check.rows[0].current_stock}, Requested: ${item.quantity}`
          );
        }

        await client.query(
          `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [tx.transaction_id, item.product_id, item.quantity, item.unit_price]
        );
      }

      return await this.findByIdWithItems(tx.transaction_id, tenant_id, client);
    });
  }

  async findById(transaction_id, tenant_id) {
    const result = await query(
      `SELECT t.*, u.name as cashier_name, u.email as cashier_email
         FROM transactions t
         JOIN users u ON t.user_id = u.user_id
        WHERE t.transaction_id = $1 AND t.tenant_id = $2`,
      [transaction_id, tenant_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Transaction not found');
    return result.rows[0];
  }

  async findByIdWithItems(transaction_id, tenant_id, client = null) {
    const q = client ? client.query.bind(client) : query;

    const txRes = await q(
      `SELECT t.*, u.name as cashier_name, u.email as cashier_email
         FROM transactions t
         JOIN users u ON t.user_id = u.user_id
        WHERE t.transaction_id = $1 AND t.tenant_id = $2`,
      [transaction_id, tenant_id]
    );
    if (txRes.rows.length === 0) throw new NotFoundError('Transaction not found');
    const tx = txRes.rows[0];

    const itemsRes = await q(
      `SELECT ti.*, p.name as product_name, p.sku
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.product_id
        WHERE ti.transaction_id = $1
        ORDER BY ti.transaction_item_id`,
      [transaction_id]
    );
    tx.items = itemsRes.rows;
    return tx;
  }

  async findByTenant(tenant_id, filters = {}) {
    let sql = `
      SELECT t.*, u.name as cashier_name
        FROM transactions t
        JOIN users u ON t.user_id = u.user_id
       WHERE t.tenant_id = $1
    `;
    const params = [tenant_id];
    let i = 2;

    if (filters.user_id) {
      sql += ` AND t.user_id = $${i++}`;
      params.push(filters.user_id);
    }
    if (filters.start_date) {
      sql += ` AND t.created_at >= $${i++}`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ` AND t.created_at <= $${i++}`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY t.created_at DESC`;

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

  async getSummary(tenant_id, startDate, endDate) {
    const result = await query(
      `SELECT
         COUNT(*)::int as total_transactions,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_transaction,
         COUNT(DISTINCT user_id)::int as active_cashiers
       FROM transactions
       WHERE tenant_id = $1
         AND created_at >= $2
         AND created_at <= $3`,
      [tenant_id, startDate, endDate]
    );
    return result.rows[0];
  }

  async getTodayByCashier(user_id, tenant_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await query(
      `SELECT
         COUNT(*)::int as total_transactions,
         COALESCE(SUM(total_amount), 0) as total_amount
       FROM transactions
       WHERE user_id = $1
         AND tenant_id = $2
         AND created_at >= $3`,
      [user_id, tenant_id, today]
    );
    return result.rows[0];
  }
}

export default new TransactionModel();
