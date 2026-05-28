import TransactionModel from '../models/Transaction.js';
import ProductModel from '../models/Product.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class TransactionController {
  async getAllTransactions(req, res, next) {
    try {
      const filters = {
        user_id: req.query.user_id ? parseInt(req.query.user_id, 10) : undefined,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      };
      const transactions = await TransactionModel.findByTenant(req.tenantId, filters);
      res.json({ transactions, count: transactions.length });
    } catch (error) {
      next(error);
    }
  }

  async getTransaction(req, res, next) {
    try {
      const transaction = await TransactionModel.findByIdWithItems(req.params.id, req.tenantId);
      res.json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Transaction must have at least one item');
      }

      const validated = [];
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.unit_price == null) {
          throw new BadRequestError('Each item must have product_id, quantity, and unit_price');
        }
        if (item.quantity <= 0) throw new BadRequestError('Quantity must be greater than 0');
        if (item.unit_price < 0) throw new BadRequestError('Unit price must be 0 or greater');
        // Verify product exists in this tenant before opening the DB transaction.
        await ProductModel.findById(item.product_id, req.tenantId);
        validated.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
      }

      const transaction = await TransactionModel.create({
        tenant_id: req.tenantId,
        user_id: req.user.user_id,
        items: validated,
      });

      logger.success(
        `Transaction ${transaction.transaction_id} recorded — ` +
        `total ${transaction.total_amount}, items ${transaction.items.length}, cashier ${req.user.email}`
      );

      res.status(201).json({ message: 'Transaction recorded', transaction });
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactionsToday(req, res, next) {
    try {
      const summary = await TransactionModel.getTodayByCashier(req.user.user_id, req.tenantId);
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        throw new BadRequestError('start_date and end_date are required');
      }
      const summary = await TransactionModel.getSummary(req.tenantId, start_date, end_date);
      res.json({ summary, period: { start_date, end_date } });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
