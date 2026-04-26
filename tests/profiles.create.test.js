import request from 'supertest';
import { vi } from 'vitest';

import app from '../src/app.js';
import { mockEnrichmentFetch } from './helpers/mockFetch.js';

describe('POST /api/v1/profiles', () => {
  it('creates a profile with normalized name and enrichment data', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());

    const response = await request(app)
      .post('/api/v1/profiles')
      .send({ name: '  Ella  ' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.name).toBe('ella');
    expect(response.body.data.gender).toBe('female');
    expect(response.body.data.age).toBe(28);
    expect(response.body.data.age_group).toBe('adult');
    expect(response.body.data.country_id).toBe('NG');
    expect(response.body.data.country_name).toBe('Nigeria');
    expect(response.body.data.country_probability).toBe(0.64);
    expect(response.body.data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(response.body.data.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('returns the existing profile for idempotent create', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());

    const firstResponse = await request(app)
      .post('/api/v1/profiles')
      .send({ name: 'ella' });

    const secondResponse = await request(app)
      .post('/api/v1/profiles')
      .send({ name: ' Ella ' });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.message).toBe('Profile already exists');
    expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
  });

  it('returns validation errors for invalid request bodies', async () => {
    const missingName = await request(app).post('/api/v1/profiles').send({});
    const invalidType = await request(app).post('/api/v1/profiles').send({ name: 42 });

    expect(missingName.status).toBe(400);
    expect(missingName.body).toEqual({ status: 'error', message: 'Name is required' });
    expect(invalidType.status).toBe(422);
    expect(invalidType.body).toEqual({ status: 'error', message: 'Name must be a string' });
  });

  it('returns invalid json body errors', async () => {
    const response = await request(app)
      .post('/api/v1/profiles')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: 'error', message: 'Invalid JSON body' });
  });

  it('returns 502 when enrichment fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        async json() {
          return {};
        }
      }))
    );

    const response = await request(app)
      .post('/api/v1/profiles')
      .send({ name: 'ella' });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Upstream enrichment service failed'
    });
  });
});
