import request from 'supertest';
import { vi } from 'vitest';

import { USER_ROLES } from '../src/constants/auth.js';
import app from '../src/app.js';
import { createApiVersionHeaders, createAuthorizationHeader, createAuthorizedUser } from './helpers/auth.js';
import { mockEnrichmentFetch } from './helpers/mockFetch.js';

describe('POST /api/v1/profiles', () => {
  it('creates a profile with normalized name and enrichment data', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });

    const response = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
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
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });

    const firstResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({ name: 'ella' });

    const secondResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({ name: ' Ella ' });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.message).toBe('Profile already exists');
    expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
  });

  it('returns validation errors for invalid request bodies', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });
    const missingName = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({});
    const invalidType = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({ name: 42 });

    expect(missingName.status).toBe(400);
    expect(missingName.body).toEqual({ status: 'error', message: 'Name is required' });
    expect(invalidType.status).toBe(422);
    expect(invalidType.body).toEqual({ status: 'error', message: 'Name must be a string' });
  });

  it('returns invalid json body errors', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });
    const response = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
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
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });

    const response = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({ name: 'ella' });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Upstream enrichment service failed'
    });
  });

  it('rejects analyst users from creating profiles', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });

    const response = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken))
      .send({ name: 'ella' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Forbidden'
    });
  });

  it('requires the api version header on profile writes', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.admin });

    const response = await request(app)
      .post('/api/v1/profiles')
      .set('Authorization', createAuthorizationHeader(accessToken))
      .send({ name: 'ella' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'API version header required'
    });
  });
});
