import request from 'supertest';

import app from '../src/app.js';
import { mongoManager } from '../src/db/mongo.js';
import { USER_ROLES } from '../src/constants/auth.js';
import { createApiVersionHeaders, createAuthorizationHeader, createAuthorizedUser } from './helpers/auth.js';

const seededProfiles = [
  {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
    name: 'ella',
    gender: 'female',
    gender_probability: 0.98,
    age: 28,
    age_group: 'adult',
    country_id: 'NG',
    country_name: 'Nigeria',
    country_probability: 0.64,
    created_at: '2026-04-15T08:00:00Z'
  },
  {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7b',
    name: 'john',
    gender: 'male',
    gender_probability: 0.88,
    age: 17,
    age_group: 'teenager',
    country_id: 'US',
    country_name: 'United States of America',
    country_probability: 0.72,
    created_at: '2026-04-16T08:00:00Z'
  },
  {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c',
    name: 'martha',
    gender: 'female',
    gender_probability: 0.9,
    age: 67,
    age_group: 'senior',
    country_id: 'GB',
    country_name: 'United Kingdom',
    country_probability: 0.83,
    created_at: '2026-04-17T08:00:00Z'
  }
];

describe('GET /api/v1/profiles and /api/v1/profiles/search', () => {
  beforeEach(async () => {
    await mongoManager.getCollection('profiles').insertMany(seededProfiles);
  });

  it('supports filters sorting and pagination', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app).get(
      '/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=2'
    )
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.total).toBe(2);
    expect(response.body.total_pages).toBe(1);
    expect(response.body.links).toEqual({
      self: '/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=2',
      next: null,
      prev: null
    });
    expect(response.body.data.map((profile) => profile.name)).toEqual(['martha', 'ella']);
  });

  it('clamps limit to 50 and validates query contract', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const clamped = await request(app)
      .get('/api/v1/profiles?limit=100')
      .set(createApiVersionHeaders(accessToken));
    const invalidRange = await request(app)
      .get('/api/v1/profiles?min_age=40&max_age=20')
      .set(createApiVersionHeaders(accessToken));
    const invalidType = await request(app)
      .get('/api/v1/profiles?min_age=abc')
      .set(createApiVersionHeaders(accessToken));

    expect(clamped.status).toBe(200);
    expect(clamped.body.limit).toBe(50);
    expect(clamped.body.total_pages).toBe(1);
    expect(clamped.body.links).toEqual({
      self: '/api/v1/profiles?limit=50&page=1',
      next: null,
      prev: null
    });
    expect(invalidRange.status).toBe(400);
    expect(invalidRange.body).toEqual({ status: 'error', message: 'Invalid query parameters' });
    expect(invalidType.status).toBe(422);
    expect(invalidType.body).toEqual({ status: 'error', message: 'Invalid query parameters' });
  });

  it('interprets deterministic search queries', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles/search?q=young%20females%20from%20nigeria&sort_by=created_at&order=asc')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.total_pages).toBe(0);
    expect(response.body.links).toEqual({
      self: '/api/v1/profiles/search?q=young+females+from+nigeria&sort_by=created_at&order=asc&page=1&limit=10',
      next: null,
      prev: null
    });
  });

  it('supports comparator and country search rules', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles/search?q=older%20than%2030%20from%20united%20kingdom')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.total_pages).toBe(1);
    expect(response.body.links).toEqual({
      self: '/api/v1/profiles/search?q=older+than+30+from+united+kingdom&page=1&limit=10',
      next: null,
      prev: null
    });
    expect(response.body.data[0].name).toBe('martha');
  });

  it('returns navigation links for multi-page list responses', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles?page=2&limit=1&sort_by=created_at&order=asc')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(2);
    expect(response.body.limit).toBe(1);
    expect(response.body.total).toBe(3);
    expect(response.body.total_pages).toBe(3);
    expect(response.body.links).toEqual({
      self: '/api/v1/profiles?page=2&limit=1&sort_by=created_at&order=asc',
      next: '/api/v1/profiles?page=3&limit=1&sort_by=created_at&order=asc',
      prev: '/api/v1/profiles?page=1&limit=1&sort_by=created_at&order=asc'
    });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('john');
  });

  it('returns an interpretation error when no search rule matches', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles/search?q=hello%20world')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: 'error', message: 'Unable to interpret query' });
  });

  it('returns the same interpretation error for empty search text', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles/search?q=')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: 'error', message: 'Unable to interpret query' });
  });

  it('requires authentication for profile list routes', async () => {
    const response = await request(app).get('/api/v1/profiles');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Authentication required'
    });
  });

  it('rejects inactive users on protected api routes', async () => {
    const { accessToken } = await createAuthorizedUser({
      role: USER_ROLES.analyst,
      is_active: false
    });
    const response = await request(app)
      .get('/api/v1/profiles')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 'error',
      message: 'User account is inactive'
    });
  });

  it('requires the api version header on profile reads', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });
    const response = await request(app)
      .get('/api/v1/profiles')
      .set('Authorization', createAuthorizationHeader(accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'API version header required'
    });
  });
});
