import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { mongoManager } from '../src/db/mongo.js';
import { profileRepository } from '../src/repositories/profileRepository.js';
import { refreshTokenRepository } from '../src/repositories/refreshTokenRepository.js';
import { userRepository } from '../src/repositories/userRepository.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  await mongoManager.connect({
    uri: process.env.MONGO_URI,
    dbName: process.env.DB_NAME
  });

  await profileRepository.ensureIndexes();
  await userRepository.ensureIndexes();
  await refreshTokenRepository.ensureIndexes();
});

beforeEach(async () => {
  await mongoManager.getCollection('profiles').deleteMany({});
  await mongoManager.getCollection('users').deleteMany({});
  await mongoManager.getCollection('refresh_tokens').deleteMany({});
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
