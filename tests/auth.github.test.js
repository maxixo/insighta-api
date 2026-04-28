import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const OAUTH_ENV_KEYS = [
  'APP_BASE_URL',
  'GITHUB_AUTHORIZE_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_REDIRECT_URI',
  'GITHUB_SCOPE',
  'AUTH_COOKIE_SECURE',
  'AUTH_PKCE_COOKIE_MAX_AGE_MS'
];

const originalEnv = Object.fromEntries(OAUTH_ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreOAuthEnv() {
  for (const key of OAUTH_ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = originalEnv[key];
  }
}

function readCookieValue(serializedCookie) {
  return serializedCookie.match(/^[^=]+=([^;]+)/)?.[1] ?? null;
}

describe('GET /auth/github', () => {
  afterEach(() => {
    restoreOAuthEnv();
    vi.resetModules();
  });

  it('redirects to GitHub with PKCE parameters and verifier cookies', async () => {
    process.env.GITHUB_CLIENT_ID = 'github-client-id';
    process.env.GITHUB_REDIRECT_URI = 'http://localhost:4000/auth/github/callback';
    process.env.GITHUB_SCOPE = 'read:user user:email';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_PKCE_COOKIE_MAX_AGE_MS = '600000';

    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const response = await request(app).get('/auth/github');

    expect(response.status).toBe(302);
    expect(response.headers['cache-control']).toBe('no-store');

    const location = new URL(response.headers.location);

    expect(`${location.origin}${location.pathname}`).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('client_id')).toBe(process.env.GITHUB_CLIENT_ID);
    expect(location.searchParams.get('redirect_uri')).toBe(process.env.GITHUB_REDIRECT_URI);
    expect(location.searchParams.get('scope')).toBe(process.env.GITHUB_SCOPE);
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');

    const cookies = response.headers['set-cookie'];

    expect(cookies).toHaveLength(2);

    const stateCookie = cookies.find((cookie) => cookie.startsWith('github_oauth_state='));
    const verifierCookie = cookies.find((cookie) => cookie.startsWith('github_oauth_code_verifier='));

    expect(stateCookie).toBeDefined();
    expect(verifierCookie).toBeDefined();
    expect(stateCookie).toContain('HttpOnly');
    expect(stateCookie).toContain('Path=/auth/github');
    expect(stateCookie).toContain('SameSite=Lax');
    expect(verifierCookie).toContain('HttpOnly');
    expect(verifierCookie).toContain('Path=/auth/github');
    expect(verifierCookie).toContain('SameSite=Lax');

    const state = readCookieValue(stateCookie);
    const codeVerifier = readCookieValue(verifierCookie);

    expect(location.searchParams.get('state')).toBe(state);
    expect(location.searchParams.get('code_challenge')).toBeTruthy();
    expect(location.searchParams.get('code_challenge')).not.toBe(codeVerifier);
  });

  it('returns 500 when the GitHub client ID is missing', async () => {
    delete process.env.GITHUB_CLIENT_ID;

    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const response = await request(app).get('/auth/github');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      message: 'GitHub OAuth is not configured'
    });
  });
});
