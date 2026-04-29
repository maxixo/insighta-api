import request from 'supertest';
import { vi } from 'vitest';

import { USER_ROLES } from '../src/constants/auth.js';
import app from '../src/app.js';
import { createApiVersionHeaders, createAuthorizationHeader, createAuthorizedUser } from './helpers/auth.js';
import { mockEnrichmentFetch } from './helpers/mockFetch.js';

describe('GET/DELETE /api/v1/profiles/:id', () => {
  it('gets an existing profile by id', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());
    const admin = await createAuthorizedUser({ role: USER_ROLES.admin });
    const analyst = await createAuthorizedUser({
      id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7b',
      github_id: '67890',
      role: USER_ROLES.analyst
    });

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(admin.accessToken))
      .send({ name: 'ella' });

    const response = await request(app)
      .get(`/api/v1/profiles/${createResponse.body.data.id}`)
      .set(createApiVersionHeaders(analyst.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.name).toBe('ella');
  });

  it('returns 404 when a profile does not exist', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles/non-existent-id')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ status: 'error', message: 'Profile not found' });
  });

  it('deletes an existing profile', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());
    const admin = await createAuthorizedUser({ role: USER_ROLES.admin });

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(admin.accessToken))
      .send({ name: 'ella' });

    const deleteResponse = await request(app)
      .delete(`/api/v1/profiles/${createResponse.body.data.id}`)
      .set(createApiVersionHeaders(admin.accessToken));
    const getResponse = await request(app)
      .get(`/api/v1/profiles/${createResponse.body.data.id}`)
      .set(createApiVersionHeaders(admin.accessToken));

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('rejects analyst users from deleting profiles', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());
    const admin = await createAuthorizedUser({ role: USER_ROLES.admin });
    const analyst = await createAuthorizedUser({
      id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7b',
      github_id: '67890',
      role: USER_ROLES.analyst
    });

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(admin.accessToken))
      .send({ name: 'ella' });

    const response = await request(app)
      .delete(`/api/v1/profiles/${createResponse.body.data.id}`)
      .set(createApiVersionHeaders(analyst.accessToken));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Forbidden'
    });
  });

  it('requires the api version header on profile deletes', async () => {
    vi.stubGlobal('fetch', mockEnrichmentFetch());
    const admin = await createAuthorizedUser({ role: USER_ROLES.admin });

    const createResponse = await request(app)
      .post('/api/v1/profiles')
      .set(createApiVersionHeaders(admin.accessToken))
      .send({ name: 'ella' });

    const response = await request(app)
      .delete(`/api/v1/profiles/${createResponse.body.data.id}`)
      .set('Authorization', createAuthorizationHeader(admin.accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'API version header required'
    });
  });
});
