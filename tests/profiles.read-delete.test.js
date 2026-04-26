import request from 'supertest';
import { vi } from 'vitest';

import app from '../src/app.js';
import { mockEnrichmentFetch } from './helpers/mockFetch.js';

describe('GET/DELETE /api/v1/profiles/:id', () => {
  it('gets an existing profile by id', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .send({ name: 'ella' });

    const response = await request(app).get(`/api/v1/profiles/${createResponse.body.data.id}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.name).toBe('ella');
  });

  it('returns 404 when a profile does not exist', async () => {
    const response = await request(app).get('/api/v1/profiles/non-existent-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ status: 'error', message: 'Profile not found' });
  });

  it('deletes an existing profile', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .send({ name: 'ella' });

    const deleteResponse = await request(app).delete(`/api/v1/profiles/${createResponse.body.data.id}`);
    const getResponse = await request(app).get(`/api/v1/profiles/${createResponse.body.data.id}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });
});
