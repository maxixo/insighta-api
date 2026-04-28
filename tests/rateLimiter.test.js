import express from 'express';
import request from 'supertest';

import { createRateLimiter } from '../src/middleware/rateLimiter.js';

function createTestApp() {
  const app = express();

  app.set('trust proxy', false);
  app.use(
    createRateLimiter({
      enabled: true,
      windowMs: 60_000,
      authMaxRequests: 10,
      maxRequests: 60
    })
  );

  app.get('/api/v1/auth/login', (_req, res) => {
    res.status(200).json({ status: 'success' });
  });

  app.get('/api/v1/profiles', (_req, res) => {
    res.status(200).json({ status: 'success' });
  });

  return app;
}

describe('rate limiter', () => {
  it('limits auth endpoints to 10 requests per minute', async () => {
    const app = createTestApp();

    for (let index = 0; index < 10; index += 1) {
      const response = await request(app).get('/api/v1/auth/login');
      expect(response.status).toBe(200);
    }

    const blocked = await request(app).get('/api/v1/auth/login');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      status: 'error',
      message: 'Too many requests'
    });
  });

  it('limits non-auth endpoints to 60 requests per minute', async () => {
    const app = createTestApp();

    for (let index = 0; index < 60; index += 1) {
      const response = await request(app).get('/api/v1/profiles');
      expect(response.status).toBe(200);
    }

    const blocked = await request(app).get('/api/v1/profiles');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      status: 'error',
      message: 'Too many requests'
    });
  });
});
