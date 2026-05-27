import app from './src/app.js';
import config from './src/config/env.js';
import pool, { initializeDatabase } from './src/config/database.js';
import logger from './src/utils/logger.js';

const PORT = config.port;

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database (test connection + run schema in development)
    await initializeDatabase();
    logger.success('Database initialized successfully');

    // Start server
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      
      if (config.nodeEnv === 'development') {
        logger.debug('\n📋 Quick Start:');
        logger.debug('   1. Copy .env.example to .env and fill in values');
        logger.debug('   2. Schema auto-initialized on startup');
        logger.debug('   3. Start development: npm run dev\n');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  pool.end(() => {
    logger.info('Database pool closed');
    process.exit(0);
  });
});

startServer();