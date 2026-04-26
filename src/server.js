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

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down.`);

    server.close(async () => {
      await mongoManager.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
