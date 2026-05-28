import TransactionModel from '../models/Transaction.js';
import ProductModel from '../models/Product.js';
import { query } from '../config/database.js';
import { BadRequestError } from '../utils/errors.js';

// All queries below filter by tenant_id and read from the new
// transactions/transaction_items/products schema. Payment-method and
// status reports are gone — append-only transactions have no status
// and the schema no longer tracks payment method (deferred per ADR-0001).
class ReportController {
  async getDailySales(req, res, next) {
    try {
      const target = req.query.date ? new Date(req.query.date) : new Date();
      const startOfDay = new Date(target); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(target); endOfDay.setHours(23, 59, 59, 999);

      const summary = await TransactionModel.getSummary(req.tenantId, startOfDay, endOfDay);
      const recent = await TransactionModel.findByTenant(req.tenantId, {
        start_date: startOfDay,
        end_date: endOfDay,
        limit: 10,
      });
      const hourly = await query(
        `SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
                COUNT(*)::int AS transaction_count,
                COALESCE(SUM(total_amount), 0) AS total_sales
           FROM transactions
          WHERE tenant_id = $1
            AND created_at >= $2 AND created_at <= $3
          GROUP BY EXTRACT(HOUR FROM created_at)
          ORDER BY hour`,
        [req.tenantId, startOfDay, endOfDay]
      );

      res.json({
        date: target.toISOString().split('T')[0],
        summary,
        hourly_breakdown: hourly.rows,
        recent_transactions: recent,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductPerformance(req, res, next) {
    try {
      const { start_date, end_date, limit = 20 } = req.query;
      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }

      const top = await query(
        `SELECT p.product_id, p.name, p.category, p.price,
                COUNT(ti.transaction_item_id)::int AS times_sold,
                SUM(ti.quantity)::int AS total_quantity,
                COALESCE(SUM(ti.quantity * ti.unit_price), 0) AS total_revenue,
                COALESCE(AVG(ti.unit_price), 0) AS average_price
           FROM products p
           JOIN transaction_items ti ON p.product_id = ti.product_id
           JOIN transactions t ON ti.transaction_id = t.transaction_id
          WHERE t.tenant_id = $1
            AND t.created_at >= $2 AND t.created_at <= $3
          GROUP BY p.product_id, p.name, p.category, p.price
          ORDER BY total_revenue DESC
          LIMIT $4`,
        [req.tenantId, start_date, end_date, limit]
      );

      const categories = await query(
        `SELECT p.category,
                COUNT(DISTINCT p.product_id)::int AS product_count,
                SUM(ti.quantity)::int AS total_quantity,
                COALESCE(SUM(ti.quantity * ti.unit_price), 0) AS total_revenue
           FROM products p
           JOIN transaction_items ti ON p.product_id = ti.product_id
           JOIN transactions t ON ti.transaction_id = t.transaction_id
          WHERE t.tenant_id = $1
            AND t.created_at >= $2 AND t.created_at <= $3
          GROUP BY p.category
          ORDER BY total_revenue DESC`,
        [req.tenantId, start_date, end_date]
      );

      const slowMoving = await query(
        `SELECT p.product_id, p.name, p.category, p.price, p.current_stock,
                COALESCE(SUM(ti.quantity), 0)::int AS total_sold
           FROM products p
           LEFT JOIN transaction_items ti ON p.product_id = ti.product_id
           LEFT JOIN transactions t ON ti.transaction_id = t.transaction_id
                 AND t.created_at >= $2 AND t.created_at <= $3
          WHERE p.tenant_id = $1 AND p.is_active = true
          GROUP BY p.product_id, p.name, p.category, p.price, p.current_stock
          ORDER BY total_sold ASC
          LIMIT 10`,
        [req.tenantId, start_date, end_date]
      );

      res.json({
        period: { start_date, end_date },
        top_products: top.rows,
        category_performance: categories.rows,
        slow_moving_products: slowMoving.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryReport(req, res, next) {
    try {
      const summary = await query(
        `SELECT
           COUNT(*)::int AS total_products,
           COALESCE(SUM(current_stock), 0)::int AS total_units,
           COALESCE(SUM(current_stock * cost), 0) AS total_value,
           COALESCE(SUM(current_stock * price), 0) AS potential_revenue,
           COUNT(*) FILTER (WHERE current_stock <= reorder_level)::int AS low_stock_count,
           COUNT(*) FILTER (WHERE current_stock = 0)::int AS out_of_stock_count
         FROM products
         WHERE tenant_id = $1 AND is_active = true`,
        [req.tenantId]
      );

      const lowStock = await ProductModel.getLowStock(req.tenantId);

      const outOfStock = await query(
        `SELECT product_id, name, category, sku, current_stock, reorder_level
           FROM products
          WHERE tenant_id = $1 AND is_active = true AND current_stock = 0
          ORDER BY name`,
        [req.tenantId]
      );

      const byCategory = await query(
        `SELECT category,
                COUNT(*)::int AS product_count,
                COALESCE(SUM(current_stock), 0)::int AS total_units,
                COALESCE(SUM(current_stock * cost), 0) AS total_value
           FROM products
          WHERE tenant_id = $1 AND is_active = true
          GROUP BY category
          ORDER BY total_value DESC`,
        [req.tenantId]
      );

      const recent = await query(
        `SELECT product_id, name, category, current_stock, updated_at
           FROM products
          WHERE tenant_id = $1
          ORDER BY updated_at DESC
          LIMIT 10`,
        [req.tenantId]
      );

      res.json({
        summary: summary.rows[0],
        low_stock_items: lowStock,
        out_of_stock_items: outOfStock.rows,
        by_category: byCategory.rows,
        recent_updates: recent.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCashierPerformance(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }

      const result = await query(
        `SELECT u.user_id, u.name, u.email,
                COUNT(t.transaction_id)::int AS total_transactions,
                COALESCE(SUM(t.total_amount), 0) AS total_sales,
                COALESCE(AVG(t.total_amount), 0) AS average_transaction,
                COALESCE(MAX(t.total_amount), 0) AS highest_sale,
                MIN(t.created_at) AS first_sale,
                MAX(t.created_at) AS last_sale
           FROM users u
           LEFT JOIN transactions t ON u.user_id = t.user_id
                 AND t.tenant_id = $1
                 AND t.created_at >= $2 AND t.created_at <= $3
          WHERE u.tenant_id = $1
            AND u.role = 'Cashier'
            AND u.is_active = true
          GROUP BY u.user_id, u.name, u.email
          ORDER BY total_sales DESC`,
        [req.tenantId, start_date, end_date]
      );

      res.json({
        period: { start_date, end_date },
        cashier_performance: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSalesTrends(req, res, next) {
    try {
      const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
      const groupBy = period === 'monthly'
        ? `TO_CHAR(created_at, 'YYYY-MM')`
        : `TO_CHAR(created_at, 'IYYY-IW')`;

      const result = await query(
        `SELECT ${groupBy} AS period,
                COUNT(*)::int AS transaction_count,
                COALESCE(SUM(total_amount), 0) AS total_sales,
                COALESCE(AVG(total_amount), 0) AS average_sale,
                COUNT(DISTINCT user_id)::int AS active_cashiers
           FROM transactions
          WHERE tenant_id = $1
            AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY ${groupBy}
          ORDER BY period DESC
          LIMIT 20`,
        [req.tenantId]
      );

      res.json({ period_type: period, trends: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const todayStats = await TransactionModel.getSummary(req.tenantId, today, todayEnd);
      const monthStats = await TransactionModel.getSummary(req.tenantId, monthStart, monthEnd);
      const lowStock = await ProductModel.getLowStock(req.tenantId);
      const recent = await TransactionModel.findByTenant(req.tenantId, { limit: 5 });

      const topProducts = await query(
        `SELECT p.name,
                SUM(ti.quantity)::int AS total_sold,
                COALESCE(SUM(ti.quantity * ti.unit_price), 0) AS revenue
           FROM products p
           JOIN transaction_items ti ON p.product_id = ti.product_id
           JOIN transactions t ON ti.transaction_id = t.transaction_id
          WHERE t.tenant_id = $1
            AND t.created_at >= $2 AND t.created_at <= $3
          GROUP BY p.product_id, p.name
          ORDER BY revenue DESC
          LIMIT 5`,
        [req.tenantId, monthStart, monthEnd]
      );

      res.json({
        today: todayStats,
        this_month: monthStats,
        alerts: { low_stock_count: lowStock.length },
        recent_transactions: recent,
        top_products: topProducts.rows,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
