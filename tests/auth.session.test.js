import request from 'supertest';

import { createApp } from '../src/app.js';
import { mongoManager } from '../src/db/mongo.js';
import { authService } from '../src/services/authService.js';
import { verifyToken } from '../src/utils/tokens.js';

const TOKEN_ENV_OVERRIDES = {
  ACCESS_TOKEN_SECRET: 'test-access-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret',
  ACCESS_TOKEN_TTL_SECONDS: '180',
  REFRESH_TOKEN_TTL_SECONDS: '300'
};

function applyTokenEnvOverrides() {
  Object.entries(TOKEN_ENV_OVERRIDES).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

function createUser(overrides = {}) {
  return {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
    github_id: '12345',
    username: 'octocat',
    email: 'octocat@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    role: 'analyst',
    is_active: true,
    created_at: '2026-04-15T08:00:00Z',
    last_login_at: '2026-04-15T08:00:00Z',
    ...overrides
  };
}

describe('auth session lifecycle', () => {
  beforeEach(() => {
    applyTokenEnvOverrides();
  });

  it('rotates the refresh token and invalidates the previous token on refresh', async () => {
    const app = createApp();
    const user = createUser();

    await mongoManager.getCollection('users').insertOne(user);

    const initialSession = await authService.issueSessionTokens(user);
    const response = await request(app).post('/auth/refresh').send({
      refresh_token: initialSession.refreshToken
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.access_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(response.body.refresh_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(response.body.refresh_token).not.toBe(initialSession.refreshToken);

    const newRefreshPayload = verifyToken(response.body.refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const storedRefreshTokens = await mongoManager.getCollection('refresh_tokens').find({ user_id: user.id }).toArray();

    expect(storedRefreshTokens).toHaveLength(1);
    expect(storedRefreshTokens[0].id).toBe(newRefreshPayload.jti);

    const reusedTokenResponse = await request(app).post('/auth/refresh').send({
      refresh_token: initialSession.refreshToken
    });

    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body).toEqual({
      status: 'error',
      message: 'Invalid or expired refresh token'
    });
  });

  it('invalidates the submitted refresh token on logout', async () => {
    const app = createApp();
    const user = createUser();

    await mongoManager.getCollection('users').insertOne(user);

    const session = await authService.issueSessionTokens(user);
    const response = await request(app).post('/auth/logout').send({
      refresh_token: session.refreshToken
    });

    expect(response.status).toBe(204);

    const storedRefreshTokens = await mongoManager.getCollection('refresh_tokens').find({ user_id: user.id }).toArray();

    expect(storedRefreshTokens).toHaveLength(0);

    const refreshAfterLogout = await request(app).post('/auth/refresh').send({
      refresh_token: session.refreshToken
    });

    expect(refreshAfterLogout.status).toBe(401);
    expect(refreshAfterLogout.body).toEqual({
      status: 'error',
      message: 'Invalid or expired refresh token'
    });
  });

  it('validates refresh token request bodies', async () => {
    const app = createApp();
    const missingRefreshToken = await request(app).post('/auth/refresh').send({});
    const invalidType = await request(app).post('/auth/logout').send({ refresh_token: 42 });

    expect(missingRefreshToken.status).toBe(400);
    expect(missingRefreshToken.body).toEqual({
      status: 'error',
      message: 'Refresh token is required'
    });
    expect(invalidType.status).toBe(422);
    expect(invalidType.body).toEqual({
      status: 'error',
      message: 'Refresh token must be a string'
    });
  });
});
