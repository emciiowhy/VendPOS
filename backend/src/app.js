import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import storeRoutes from './routes/store.routes.js';
import productRoutes from './routes/product.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import saleRoutes from './routes/sale.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

// ============ Middleware ============

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.http(req.method, req.originalUrl, res.statusCode, responseTime);
  });
  
  next();
});

// ============ Routes ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// API documentation (simple)
app.get('/api', (req, res) => {
  res.json({
    message: 'Multi-Tenant SaaS POS System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      store: '/api/store',
      products: '/api/products',
      inventory: '/api/inventory',
      sales: '/api/sales',
      notifications: '/api/notifications',
      reports: '/api/reports'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// ============ Error Handling ============

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;