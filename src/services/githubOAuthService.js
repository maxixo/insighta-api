import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { createPkceSession } from '../utils/pkce.js';

export const GITHUB_STATE_COOKIE = 'github_oauth_state';
export const GITHUB_VERIFIER_COOKIE = 'github_oauth_code_verifier';

function readOptionalString(value, fallback = null) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function readBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function readInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getGithubOAuthConfig() {
  const clientId = readOptionalString(process.env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_ID);

  if (!clientId) {
    throw new AppError(500, 'GitHub OAuth is not configured');
  }

  return {
    authorizeUrl: readOptionalString(process.env.GITHUB_AUTHORIZE_URL, env.GITHUB_AUTHORIZE_URL),
    clientId,
    redirectUri: readOptionalString(process.env.GITHUB_REDIRECT_URI, env.GITHUB_REDIRECT_URI),
    scope: readOptionalString(process.env.GITHUB_SCOPE, env.GITHUB_SCOPE),
    cookieMaxAgeMs: readInteger(process.env.AUTH_PKCE_COOKIE_MAX_AGE_MS, env.AUTH_PKCE_COOKIE_MAX_AGE_MS),
    cookieSecure: readBoolean(process.env.AUTH_COOKIE_SECURE, env.AUTH_COOKIE_SECURE)
  };
}

function buildAuthorizationUrl(config, session) {
  const url = new URL(config.authorizeUrl);

  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: session.state,
    code_challenge: session.codeChallenge,
    code_challenge_method: 'S256'
  }).toString();

  return url.toString();
}

class GithubOAuthService {
  createAuthorizationRequest() {
    const config = getGithubOAuthConfig();
    const session = createPkceSession();

    return {
      authorizationUrl: buildAuthorizationUrl(config, session),
      state: session.state,
      codeVerifier: session.codeVerifier,
      cookieOptions: {
        httpOnly: true,
        maxAge: config.cookieMaxAgeMs,
        path: '/auth/github',
        sameSite: 'lax',
        secure: config.cookieSecure
      }
    };
  }
}

export const githubOAuthService = new GithubOAuthService();
