import SaleModel from '../models/Sale.js';
import ProductModel from '../models/Product.js';
import InventoryModel from '../models/Inventory.js';
import { query } from '../config/database.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class ReportController {
  // Get daily sales report
  async getDailySales(req, res, next) {
    try {
      const storeId = req.storeId;
      const { date } = req.query;

      let targetDate;
      if (date) {
        targetDate = new Date(date);
      } else {
        targetDate = new Date();
      }

      // Set to start of day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      // Set to end of day
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get sales summary
      const summary = await SaleModel.getSummary(storeId, startOfDay, endOfDay);

      // Get all sales for the day
      const sales = await SaleModel.findByStore(storeId, {
        start_date: startOfDay,
        end_date: endOfDay,
        status: 'completed'
      });

      // Get sales by payment method
      const paymentMethodResult = await query(
        `SELECT payment_method, 
                COUNT(*) as count,
                SUM(total_amount) as total
         FROM sales
         WHERE store_id = $1 
           AND status = 'completed'
           AND created_at >= $2 
           AND created_at <= $3
         GROUP BY payment_method
         ORDER BY total DESC`,
        [storeId, startOfDay, endOfDay]
      );

      // Get hourly sales breakdown
      const hourlySalesResult = await query(
        `SELECT EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_sales
         FROM sales
         WHERE store_id = $1 
           AND status = 'completed'
           AND created_at >= $2 
           AND created_at <= $3
         GROUP BY EXTRACT(HOUR FROM created_at)
         ORDER BY hour`,
        [storeId, startOfDay, endOfDay]
      );

      res.json({
        date: targetDate.toISOString().split('T')[0],
        summary: {
          total_sales: parseInt(summary.total_sales) || 0,
          total_revenue: parseFloat(summary.total_revenue) || 0,
          average_sale: parseFloat(summary.average_sale) || 0,
          active_cashiers: parseInt(summary.active_cashiers) || 0
        },
        payment_methods: paymentMethodResult.rows,
        hourly_breakdown: hourlySalesResult.rows,
        recent_sales: sales.slice(0, 10) // Last 10 sales
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product performance report
  async getProductPerformance(req, res, next) {
    try {
      const storeId = req.storeId;
      const { start_date, end_date, limit = 20 } = req.query;

      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }

      // Get best selling products
      const topProductsResult = await query(
        `SELECT p.id, p.name, p.category, p.price,
                COUNT(si.id) as times_sold,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue,
                AVG(si.unit_price) as average_price
         FROM products p
         JOIN sale_items si ON p.id = si.product_id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.store_id = $1
           AND s.status = 'completed'
           AND s.created_at >= $2
           AND s.created_at <= $3
         GROUP BY p.id, p.name, p.category, p.price
         ORDER BY total_revenue DESC
         LIMIT $4`,
        [storeId, start_date, end_date, limit]
      );

      // Get category performance
      const categoryResult = await query(
        `SELECT p.category,
                COUNT(DISTINCT p.id) as product_count,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue
         FROM products p
         JOIN sale_items si ON p.id = si.product_id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.store_id = $1
           AND s.status = 'completed'
           AND s.created_at >= $2
           AND s.created_at <= $3
         GROUP BY p.category
         ORDER BY total_revenue DESC`,
        [storeId, start_date, end_date]
      );

      // Get slow moving products (low sales)
      const slowMovingResult = await query(
        `SELECT p.id, p.name, p.category, p.price,
                COALESCE(SUM(si.quantity), 0) as total_sold,
                i.quantity as current_stock
         FROM products p
         LEFT JOIN sale_items si ON p.id = si.product_id
         LEFT JOIN sales s ON si.sale_id = s.id 
           AND s.status = 'completed'
           AND s.created_at >= $2
           AND s.created_at <= $3
         LEFT JOIN inventory i ON p.id = i.product_id AND p.store_id = i.store_id
         WHERE p.store_id = $1
           AND p.is_active = true
         GROUP BY p.id, p.name, p.category, p.price, i.quantity
         ORDER BY total_sold ASC
         LIMIT 10`,
        [storeId, start_date, end_date]
      );

      res.json({
        period: { start_date, end_date },
        top_products: topProductsResult.rows,
        category_performance: categoryResult.rows,
        slow_moving_products: slowMovingResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Get inventory report
  async getInventoryReport(req, res, next) {
    try {
      const storeId = req.storeId;

      // Get inventory summary
      const summaryResult = await query(
        `SELECT 
           COUNT(DISTINCT i.product_id) as total_products,
           SUM(i.quantity) as total_units,
           SUM(i.quantity * p.cost) as total_value,
           SUM(i.quantity * p.price) as potential_revenue,
           COUNT(CASE WHEN i.quantity <= i.reorder_level THEN 1 END) as low_stock_count,
           COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock_count
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.store_id = $1`,
        [storeId]
      );

      // Get low stock items
      const lowStock = await InventoryModel.getLowStock(storeId);

      // Get out of stock items
      const outOfStockResult = await query(
        `SELECT p.id, p.name, p.category, p.sku, 
                i.quantity, i.reorder_level
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.store_id = $1 AND i.quantity = 0
         ORDER BY p.name`,
        [storeId]
      );

      // Get inventory by category
      const categoryResult = await query(
        `SELECT p.category,
                COUNT(DISTINCT p.id) as product_count,
                SUM(i.quantity) as total_units,
                SUM(i.quantity * p.cost) as total_value
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.store_id = $1
         GROUP BY p.category
         ORDER BY total_value DESC`,
        [storeId]
      );

      // Get recently updated inventory
      const recentUpdatesResult = await query(
        `SELECT p.id, p.name, p.category,
                i.quantity, i.last_updated
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.store_id = $1
         ORDER BY i.last_updated DESC
         LIMIT 10`,
        [storeId]
      );

      res.json({
        summary: summaryResult.rows[0],
        low_stock_items: lowStock,
        out_of_stock_items: outOfStockResult.rows,
        by_category: categoryResult.rows,
        recent_updates: recentUpdatesResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Get cashier performance report
  async getCashierPerformance(req, res, next) {
    try {
      const storeId = req.storeId;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }

      const performanceResult = await query(
        `SELECT u.id, u.full_name, u.email,
                COUNT(s.id) as total_transactions,
                SUM(s.total_amount) as total_sales,
                AVG(s.total_amount) as average_transaction,
                MAX(s.total_amount) as highest_sale,
                MIN(s.created_at) as first_sale,
                MAX(s.created_at) as last_sale
         FROM users u
         LEFT JOIN sales s ON u.id = s.cashier_id 
           AND s.store_id = $1
           AND s.status = 'completed'
           AND s.created_at >= $2
           AND s.created_at <= $3
         WHERE u.store_id = $1
           AND u.role = 'cashier'
           AND u.is_active = true
         GROUP BY u.id, u.full_name, u.email
         ORDER BY total_sales DESC`,
        [storeId, start_date, end_date]
      );

      res.json({
        period: { start_date, end_date },
        cashier_performance: performanceResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sales trends (weekly/monthly)
  async getSalesTrends(req, res, next) {
    try {
      const storeId = req.storeId;
      const { period = 'weekly' } = req.query; // 'weekly' or 'monthly'

      let dateFormat;
      let groupBy;

      if (period === 'monthly') {
        dateFormat = 'YYYY-MM';
        groupBy = `TO_CHAR(created_at, 'YYYY-MM')`;
      } else {
        dateFormat = 'YYYY-IW'; // ISO week
        groupBy = `TO_CHAR(created_at, 'YYYY-IW')`;
      }

      const trendsResult = await query(
        `SELECT ${groupBy} as period,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_sales,
                AVG(total_amount) as average_sale,
                COUNT(DISTINCT cashier_id) as active_cashiers
         FROM sales
         WHERE store_id = $1
           AND status = 'completed'
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY ${groupBy}
         ORDER BY period DESC
         LIMIT 20`,
        [storeId]
      );

      res.json({
        period_type: period,
        trends: trendsResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Get comprehensive dashboard stats
  async getDashboardStats(req, res, next) {
    try {
      const storeId = req.storeId;

      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayStats = await SaleModel.getSummary(storeId, today, todayEnd);

      // This month's stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthStats = await SaleModel.getSummary(storeId, monthStart, monthEnd);

      // Low stock count
      const lowStock = await InventoryModel.getLowStock(storeId);

      // Recent sales
      const recentSales = await SaleModel.findByStore(storeId, {
        limit: 5,
        status: 'completed'
      });

      // Top products this month
      const topProductsResult = await query(
        `SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.subtotal) as revenue
         FROM products p
         JOIN sale_items si ON p.id = si.product_id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.store_id = $1
           AND s.status = 'completed'
           AND s.created_at >= $2
           AND s.created_at <= $3
         GROUP BY p.id, p.name
         ORDER BY revenue DESC
         LIMIT 5`,
        [storeId, monthStart, monthEnd]
      );

      res.json({
        today: {
          sales: parseInt(todayStats.total_sales) || 0,
          revenue: parseFloat(todayStats.total_revenue) || 0,
          average_sale: parseFloat(todayStats.average_sale) || 0
        },
        this_month: {
          sales: parseInt(monthStats.total_sales) || 0,
          revenue: parseFloat(monthStats.total_revenue) || 0,
          average_sale: parseFloat(monthStats.average_sale) || 0
        },
        alerts: {
          low_stock_count: lowStock.length
        },
        recent_sales: recentSales,
        top_products: topProductsResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();