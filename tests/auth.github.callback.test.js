import request from 'supertest';
import { vi } from 'vitest';

import { mongoManager } from '../src/db/mongo.js';
import { createApp } from '../src/app.js';
import { verifyToken } from '../src/utils/tokens.js';

const OAUTH_ENV_OVERRIDES = {
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  GITHUB_REDIRECT_URI: 'http://localhost:4000/auth/github/callback',
  GITHUB_SCOPE: 'read:user user:email',
  AUTH_COOKIE_SECURE: 'false',
  AUTH_PKCE_COOKIE_MAX_AGE_MS: '600000',
  ACCESS_TOKEN_SECRET: 'test-access-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret',
  ACCESS_TOKEN_TTL_SECONDS: '180',
  REFRESH_TOKEN_TTL_SECONDS: '300'
};

function applyOAuthEnvOverrides() {
  Object.entries(OAUTH_ENV_OVERRIDES).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

function createGithubFetchMock({
  token = 'github-access-token',
  githubId = 12345,
  username = 'octocat',
  email = null,
  avatarUrl = 'https://avatars.githubusercontent.com/u/12345',
  emailAddresses = [{ email: 'octocat@example.com', primary: true, verified: true }]
} = {}) {
  return vi.fn(async (input, init = {}) => {
    const url = new URL(String(input));

    if (url.toString() === 'https://github.com/login/oauth/access_token') {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            access_token: token,
            token_type: 'bearer',
            scope: 'read:user user:email'
          };
        }
      };
    }

    if (url.toString() === 'https://api.github.com/user') {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: githubId,
            login: username,
            email,
            avatar_url: avatarUrl
          };
        }
      };
    }

    if (url.toString() === 'https://api.github.com/user/emails') {
      return {
        ok: true,
        status: 200,
        async json() {
          return emailAddresses;
        }
      };
    }

    throw new Error(`Unexpected URL: ${url.toString()} (${init.method ?? 'GET'})`);
  });
}

describe('GET /auth/github/callback', () => {
  beforeEach(() => {
    applyOAuthEnvOverrides();
  });

  it('creates a user, stores a refresh token, and returns signed app tokens', async () => {
    vi.stubGlobal('fetch', createGithubFetchMock());

    const app = createApp();
    const response = await request(app)
      .get('/auth/github/callback?code=oauth-code&state=oauth-state')
      .set('Cookie', [
        'github_oauth_state=oauth-state',
        'github_oauth_code_verifier=oauth-verifier'
      ]);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.access_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(response.body.refresh_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('github_oauth_state=;'),
        expect.stringContaining('github_oauth_code_verifier=;')
      ])
    );

    const accessPayload = verifyToken(response.body.access_token, process.env.ACCESS_TOKEN_SECRET);
    const refreshPayload = verifyToken(response.body.refresh_token, process.env.REFRESH_TOKEN_SECRET);

    expect(accessPayload.type).toBe('access');
    expect(refreshPayload.type).toBe('refresh');
    expect(accessPayload.role).toBe('analyst');
    expect(refreshPayload.role).toBe('analyst');
    expect(accessPayload.exp - accessPayload.iat).toBe(180);
    expect(refreshPayload.exp - refreshPayload.iat).toBe(300);

    const savedUser = await mongoManager.getCollection('users').findOne({ github_id: '12345' });

    expect(savedUser).toMatchObject({
      github_id: '12345',
      username: 'octocat',
      email: 'octocat@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345',
      role: 'analyst',
      is_active: true
    });
    expect(savedUser.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(savedUser.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(savedUser.last_login_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    const refreshTokens = await mongoManager.getCollection('refresh_tokens').find({ user_id: savedUser.id }).toArray();

    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0].id).toBe(refreshPayload.jti);
    expect(refreshTokens[0].token_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reuses an existing user record and preserves role and active state', async () => {
    vi.stubGlobal(
      'fetch',
      createGithubFetchMock({
        username: 'new-octocat',
        email: 'public@example.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/99999'
      })
    );

    const existingUser = {
      id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
      github_id: '12345',
      username: 'old-octocat',
      email: 'old@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/old',
      role: 'admin',
      is_active: false,
      created_at: '2026-04-15T08:00:00Z',
      last_login_at: '2026-04-15T08:00:00Z'
    };

    await mongoManager.getCollection('users').insertOne(existingUser);

    const app = createApp();
    const response = await request(app)
      .get('/auth/github/callback?code=oauth-code&state=oauth-state')
      .set('Cookie', [
        'github_oauth_state=oauth-state',
        'github_oauth_code_verifier=oauth-verifier'
      ]);

    expect(response.status).toBe(200);

    const savedUser = await mongoManager.getCollection('users').findOne({ github_id: '12345' });

    expect(savedUser).toMatchObject({
      id: existingUser.id,
      github_id: existingUser.github_id,
      username: 'new-octocat',
      email: 'public@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/99999',
      role: 'admin',
      is_active: false,
      created_at: existingUser.created_at
    });
    expect(savedUser.last_login_at).not.toBe(existingUser.last_login_at);
  });

  it('rejects the callback when the OAuth state does not match', async () => {
    const fetchMock = createGithubFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp();
    const response = await request(app)
      .get('/auth/github/callback?code=oauth-code&state=wrong-state')
      .set('Cookie', [
        'github_oauth_state=oauth-state',
        'github_oauth_code_verifier=oauth-verifier'
      ]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Invalid GitHub OAuth state'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
