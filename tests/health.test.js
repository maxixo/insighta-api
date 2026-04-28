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

  it('returns readiness for deployment probes', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        database: 'ready'
      }
    });
  });

  it('allows requests from any origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://blocked.example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
