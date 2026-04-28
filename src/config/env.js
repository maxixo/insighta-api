import 'dotenv/config';

const DEFAULT_CORS_ORIGINS = '*';

const DEFAULT_SEED_SOURCE =
  'https://drive.google.com/uc?export=download&id=1Up06dcS9OfUEnDj_u6OV_xTRntupFhPH';

const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);

function parseInteger(value, fallback, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value, fallback) {
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

function parsePort(value) {
  return parseInteger(value ?? '4000', 4000, { min: 1, max: 65535 });
}

function parseNodeEnv(value) {
  const normalized = value?.trim() || 'development';
  return VALID_NODE_ENVS.has(normalized) ? normalized : 'development';
}

function parseCorsOrigin(value) {
  return value?.trim() || DEFAULT_CORS_ORIGINS;
}

function parseOptionalString(value) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const port = parsePort(process.env.PORT);
const appBaseUrl = parseOptionalString(process.env.APP_BASE_URL) || `http://localhost:${port}`;

export const env = Object.freeze({
  PORT: port,
  NODE_ENV: nodeEnv,
  APP_BASE_URL: appBaseUrl,
  MONGO_URI: process.env.MONGO_URI?.trim() || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME?.trim() || 'profile_db',
  CORS_ORIGIN: parseCorsOrigin(process.env.CORS_ORIGIN),
  SEED_PROFILES_SOURCE: process.env.SEED_PROFILES_SOURCE?.trim() || DEFAULT_SEED_SOURCE,
  GITHUB_CLIENT_ID: parseOptionalString(process.env.GITHUB_CLIENT_ID) || '',
  GITHUB_CLIENT_SECRET: parseOptionalString(process.env.GITHUB_CLIENT_SECRET) || '',
  GITHUB_SCOPE: parseOptionalString(process.env.GITHUB_SCOPE) || 'read:user user:email',
  GITHUB_AUTHORIZE_URL:
    parseOptionalString(process.env.GITHUB_AUTHORIZE_URL) || 'https://github.com/login/oauth/authorize',
  GITHUB_TOKEN_URL:
    parseOptionalString(process.env.GITHUB_TOKEN_URL) || 'https://github.com/login/oauth/access_token',
  GITHUB_REDIRECT_URI:
    parseOptionalString(process.env.GITHUB_REDIRECT_URI) || `${appBaseUrl}/auth/github/callback`,
  GITHUB_USER_URL: parseOptionalString(process.env.GITHUB_USER_URL) || 'https://api.github.com/user',
  GITHUB_USER_EMAILS_URL:
    parseOptionalString(process.env.GITHUB_USER_EMAILS_URL) || 'https://api.github.com/user/emails',
  AUTH_COOKIE_SECURE: parseBoolean(process.env.AUTH_COOKIE_SECURE, nodeEnv === 'production'),
  AUTH_PKCE_COOKIE_MAX_AGE_MS: parseInteger(process.env.AUTH_PKCE_COOKIE_MAX_AGE_MS, 600_000, { min: 1 }),
  ACCESS_TOKEN_SECRET: parseOptionalString(process.env.ACCESS_TOKEN_SECRET) || '',
  REFRESH_TOKEN_SECRET: parseOptionalString(process.env.REFRESH_TOKEN_SECRET) || '',
  ACCESS_TOKEN_TTL_SECONDS: parseInteger(process.env.ACCESS_TOKEN_TTL_SECONDS, 180, { min: 1 }),
  REFRESH_TOKEN_TTL_SECONDS: parseInteger(process.env.REFRESH_TOKEN_TTL_SECONDS, 300, { min: 1 }),
  ENABLE_DOCS: parseBoolean(process.env.ENABLE_DOCS, nodeEnv !== 'production'),
  TRUST_PROXY: parseBoolean(process.env.TRUST_PROXY, nodeEnv === 'production'),
  RATE_LIMIT_ENABLED: parseBoolean(process.env.RATE_LIMIT_ENABLED, nodeEnv !== 'test'),
  RATE_LIMIT_WINDOW_MS: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000, { min: 1 }),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInteger(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10, { min: 1 }),
  RATE_LIMIT_MAX_REQUESTS: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 60, { min: 1 }),
  REQUEST_TIMEOUT_MS: parseInteger(process.env.REQUEST_TIMEOUT_MS, 15_000, { min: 1 }),
  HEADERS_TIMEOUT_MS: parseInteger(process.env.HEADERS_TIMEOUT_MS, 16_000, { min: 1 }),
  KEEP_ALIVE_TIMEOUT_MS: parseInteger(process.env.KEEP_ALIVE_TIMEOUT_MS, 5_000, { min: 1 }),
  SHUTDOWN_TIMEOUT_MS: parseInteger(process.env.SHUTDOWN_TIMEOUT_MS, 10_000, { min: 1 }),
  MONGO_SERVER_SELECTION_TIMEOUT_MS: parseInteger(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 5_000, { min: 1 }),
  MONGO_MAX_POOL_SIZE: parseInteger(process.env.MONGO_MAX_POOL_SIZE, 20, { min: 1 }),
  MONGO_MIN_POOL_SIZE: parseInteger(process.env.MONGO_MIN_POOL_SIZE, 0, { min: 0 })
});

export function isTestEnvironment() {
  return env.NODE_ENV === 'test';
}
