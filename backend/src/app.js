import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import productRoutes from './routes/product.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(req.method, req.originalUrl, res.statusCode, Date.now() - start);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'VendPOS API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      tenant: '/api/tenant',
      products: '/api/products',
      transactions: '/api/transactions',
      notifications: '/api/notifications',
      reports: '/api/reports',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
