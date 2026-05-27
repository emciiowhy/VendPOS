import SaleModel from '../models/Sale.js';
import ProductModel from '../models/Product.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class SaleController {
  // Get all sales
  async getAllSales(req, res, next) {
    try {
      const storeId = req.storeId;
      const filters = {
        cashier_id: req.query.cashier_id ? parseInt(req.query.cashier_id) : undefined,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      const sales = await SaleModel.findByStore(storeId, filters);

      res.json({
        sales,
        count: sales.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single sale with items
  async getSale(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;

      const sale = await SaleModel.findByIdWithItems(id, storeId);

      res.json({
        sale
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new sale
  async createSale(req, res, next) {
    try {
      const storeId = req.storeId;
      const cashierId = req.user.id;
      const { items, payment_method = 'cash', notes } = req.body;

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Sale must have at least one item');
      }

      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        if (!item.product_id || !item.quantity || !item.unit_price) {
          throw new BadRequestError('Each item must have product_id, quantity, and unit_price');
        }

        if (item.quantity <= 0) {
          throw new BadRequestError('Quantity must be greater than 0');
        }

        if (item.unit_price < 0) {
          throw new BadRequestError('Unit price must be 0 or greater');
        }

        // Verify product exists and belongs to store
        const product = await ProductModel.findById(item.product_id, storeId);

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        });
      }

      // Create sale
      const sale = await SaleModel.create({
        store_id: storeId,
        cashier_id: cashierId,
        items: validatedItems,
        payment_method,
        notes
      });

      logger.success(
        `Sale created: ID ${sale.id}, Total: $${sale.total_amount}, ` +
        `Items: ${sale.items.length}, Cashier: ${req.user.email}`
      );

      res.status(201).json({
        message: 'Sale created successfully',
        sale
      });
    } catch (error) {
      next(error);
    }
  }

  // Void sale
  async voidSale(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.storeId;

      const sale = await SaleModel.void(id, storeId);

      logger.warn(`Sale voided: ID ${id} by user ${req.user.email}`);

      res.json({
        message: 'Sale voided successfully',
        sale
      });
    } catch (error) {
      next(error);
    }
  }

  // Get today's sales for current cashier
  async getMySalesToday(req, res, next) {
    try {
      const cashierId = req.user.id;
      const storeId = req.storeId;

      const summary = await SaleModel.getTodaySalesByCashier(cashierId, storeId);

      res.json({
        summary
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sales summary for a period
  async getSalesSummary(req, res, next) {
    try {
      const storeId = req.storeId;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }

      const summary = await SaleModel.getSummary(storeId, start_date, end_date);

      res.json({
        summary,
        period: { start_date, end_date }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SaleController();