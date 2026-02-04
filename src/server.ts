import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.port, () => {
  logger.info(`Server started`, {
    port: env.port,
    environment: env.nodeEnv,
    url: `http://localhost:${env.port}`,
  });
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forcing server shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;
