import { env } from '../config/env.js';
import { AppError, UpstreamServiceError } from '../utils/appError.js';
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

function readCookie(headerValue) {
  return (headerValue ?? '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();

      if (name) {
        cookies[name] = decodeURIComponent(value);
      }

      return cookies;
    }, {});
}

function safeEquals(left, right) {
  if (!left || !right) {
    return false;
  }

  return left.length === right.length && left === right;
}

function getGithubOAuthConfig() {
  const clientId = readOptionalString(process.env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_ID);

  if (!clientId) {
    throw new AppError(500, 'GitHub OAuth is not configured');
  }

  return {
    authorizeUrl: readOptionalString(process.env.GITHUB_AUTHORIZE_URL, env.GITHUB_AUTHORIZE_URL),
    clientId,
    clientSecret: readOptionalString(process.env.GITHUB_CLIENT_SECRET, env.GITHUB_CLIENT_SECRET),
    redirectUri: readOptionalString(process.env.GITHUB_REDIRECT_URI, env.GITHUB_REDIRECT_URI),
    scope: readOptionalString(process.env.GITHUB_SCOPE, env.GITHUB_SCOPE),
    tokenUrl:
      readOptionalString(process.env.GITHUB_TOKEN_URL, env.GITHUB_TOKEN_URL) ||
      'https://github.com/login/oauth/access_token',
    userUrl: readOptionalString(process.env.GITHUB_USER_URL, env.GITHUB_USER_URL) || 'https://api.github.com/user',
    userEmailsUrl:
      readOptionalString(process.env.GITHUB_USER_EMAILS_URL, env.GITHUB_USER_EMAILS_URL) ||
      'https://api.github.com/user/emails',
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
  getPkceCookieOptions() {
    const config = getGithubOAuthConfig();

    return {
      httpOnly: true,
      maxAge: config.cookieMaxAgeMs,
      path: '/auth/github',
      sameSite: 'lax',
      secure: config.cookieSecure
    };
  }

  createAuthorizationRequest() {
    const config = getGithubOAuthConfig();
    const session = createPkceSession();

    return {
      authorizationUrl: buildAuthorizationUrl(config, session),
      state: session.state,
      codeVerifier: session.codeVerifier,
      cookieOptions: this.getPkceCookieOptions()
    };
  }

  validateCallbackRequest({ query, cookieHeader }) {
    const code = query.code?.trim();
    const state = query.state?.trim();

    if (!code) {
      throw new AppError(400, 'GitHub OAuth code is required');
    }

    if (!state) {
      throw new AppError(400, 'GitHub OAuth state is required');
    }

    const cookies = readCookie(cookieHeader);
    const storedState = cookies[GITHUB_STATE_COOKIE];
    const codeVerifier = cookies[GITHUB_VERIFIER_COOKIE];

    if (!safeEquals(storedState, state)) {
      throw new AppError(400, 'Invalid GitHub OAuth state');
    }

    if (!codeVerifier) {
      throw new AppError(400, 'GitHub OAuth verifier is missing');
    }

    return {
      code,
      codeVerifier
    };
  }

  async exchangeCodeForAccessToken({ code, codeVerifier }) {
    const config = getGithubOAuthConfig();

    if (!config.clientSecret) {
      throw new AppError(500, 'GitHub OAuth is not fully configured');
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier
      })
    });

    const payload = await response.json();

    if (!response.ok || !payload.access_token) {
      throw new UpstreamServiceError('GitHub OAuth exchange failed');
    }

    return payload.access_token;
  }

  async fetchGithubUser(accessToken) {
    const config = getGithubOAuthConfig();
    const userResponse = await fetch(config.userUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new UpstreamServiceError('GitHub user lookup failed');
    }

    const payload = await userResponse.json();

    return {
      githubId: String(payload.id),
      username: payload.login,
      email: payload.email ?? (await this.fetchGithubUserEmail(accessToken)),
      avatarUrl: payload.avatar_url ?? null
    };
  }

  async fetchGithubUserEmail(accessToken) {
    const config = getGithubOAuthConfig();
    const response = await fetch(config.userEmailsUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new UpstreamServiceError('GitHub user email lookup failed');
    }

    const payload = await response.json();

    if (!Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const primaryVerifiedEmail = payload.find((email) => email.primary && email.verified);

    if (primaryVerifiedEmail?.email) {
      return primaryVerifiedEmail.email;
    }

    const verifiedEmail = payload.find((email) => email.verified);

    if (verifiedEmail?.email) {
      return verifiedEmail.email;
    }

    return payload.find((email) => typeof email.email === 'string')?.email ?? null;
  }
}

export const githubOAuthService = new GithubOAuthService();
