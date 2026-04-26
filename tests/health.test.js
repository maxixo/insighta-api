import request from 'supertest';

import app from '../src/app.js';

describe('GET /health', () => {
  it('returns service health and database readiness', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        environment: 'test',
        database: 'ready'
      }
    });
  });
});
