import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { mongoManager } from '../src/db/mongo.js';
import { profileRepository } from '../src/repositories/profileRepository.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  await mongoManager.connect({
    uri: process.env.MONGO_URI,
    dbName: process.env.DB_NAME
  });

  await profileRepository.ensureIndexes();
});

beforeEach(async () => {
  await mongoManager.getCollection('profiles').deleteMany({});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await mongoManager.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
