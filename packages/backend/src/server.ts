import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectRedis } from './config/redis';
import { prisma } from './config/database';

async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.server.port, () => {
      logger.info(
        `Server running on port ${env.server.port} in ${env.server.nodeEnv} mode`
      );
      logger.info(`Health check available at http://localhost:${env.server.port}/health`);
      logger.info(`API available at http://localhost:${env.server.port}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await prisma.$disconnect();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
