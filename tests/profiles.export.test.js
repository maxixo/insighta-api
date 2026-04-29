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

describe('GET /api/v1/profiles/export?format=csv', () => {
  beforeEach(async () => {
    await mongoManager.getCollection('profiles').insertMany(seededProfiles);
  });

  it('exports filtered and sorted profiles as csv for read-authorized users', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });

    const response = await request(app)
      .get('/api/v1/profiles/export?format=csv&gender=female&sort_by=age&order=desc')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="profiles_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.csv"$/
    );

    const lines = response.text.split('\n');

    expect(lines).toEqual([
      'id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at',
      '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c,martha,female,0.9,67,senior,GB,United Kingdom,0.83,2026-04-17T08:00:00Z',
      '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a,ella,female,0.98,28,adult,NG,Nigeria,0.64,2026-04-15T08:00:00Z'
    ]);
  });

  it('requires the csv format query parameter', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });

    const response = await request(app)
      .get('/api/v1/profiles/export')
      .set(createApiVersionHeaders(accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Invalid query parameters'
    });
  });

  it('requires the api version header on export routes', async () => {
    const { accessToken } = await createAuthorizedUser({ role: USER_ROLES.analyst });

    const response = await request(app)
      .get('/api/v1/profiles/export?format=csv')
      .set('Authorization', createAuthorizationHeader(accessToken));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'API version header required'
    });
  });
});
