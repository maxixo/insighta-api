import { env } from '../config/env.js';
import { mongoManager } from '../db/mongo.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const databaseReady = await mongoManager.ping();

  res.status(200).json({
    status: 'success',
    data: {
      environment: env.NODE_ENV,
      database: databaseReady ? 'ready' : 'not_ready'
    }
  });
});

export const getReadiness = asyncHandler(async (_req, res) => {
  const databaseReady = await mongoManager.ping();

  if (!databaseReady) {
    res.status(503).json({
      status: 'error',
      message: 'Database not ready'
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      database: 'ready'
    }
  });
});
