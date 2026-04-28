import app from './app.js';
import { env } from './config/env.js';
import { mongoManager } from './db/mongo.js';
import { profileRepository } from './repositories/profileRepository.js';

async function startServer() {
  await mongoManager.connect();
  await profileRepository.ensureIndexes();

  const server = app.listen(env.PORT, () => {
    console.log(`Profile Intelligence API listening on port ${env.PORT}`);
  });

  server.requestTimeout = env.REQUEST_TIMEOUT_MS;
  server.headersTimeout = env.HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT_MS;

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received. Shutting down.`);

    const forceShutdownTimer = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);

    server.close(async () => {
      clearTimeout(forceShutdownTimer);

      try {
        await mongoManager.close();
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    });
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
