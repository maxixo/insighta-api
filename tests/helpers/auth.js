import { USER_ROLES } from '../../src/constants/auth.js';
import { mongoManager } from '../../src/db/mongo.js';
import { issueAccessToken } from '../../src/utils/tokens.js';

const TOKEN_ENV_OVERRIDES = {
  ACCESS_TOKEN_SECRET: 'test-access-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret',
  ACCESS_TOKEN_TTL_SECONDS: '180',
  REFRESH_TOKEN_TTL_SECONDS: '300'
};

export function applyTokenEnvOverrides() {
  Object.entries(TOKEN_ENV_OVERRIDES).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

export function createAuthUser(overrides = {}) {
  return {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
    github_id: '12345',
    username: 'octocat',
    email: 'octocat@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    role: USER_ROLES.analyst,
    is_active: true,
    created_at: '2026-04-15T08:00:00Z',
    last_login_at: '2026-04-15T08:00:00Z',
    ...overrides
  };
}

export async function createAuthorizedUser(overrides = {}) {
  applyTokenEnvOverrides();

  const user = createAuthUser(overrides);
  await mongoManager.getCollection('users').insertOne(user);

  return {
    user,
    accessToken: issueAccessToken(user)
  };
}

export function createAuthorizationHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

export function createApiVersionHeaders(accessToken) {
  return {
    Authorization: createAuthorizationHeader(accessToken),
    'X-API-Version': '1'
  };
}
