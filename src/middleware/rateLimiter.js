import { env } from '../config/env.js';

const buckets = new Map();

function getClientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isAuthPath(path) {
  return (
    path === '/auth' ||
    path.startsWith('/auth/') ||
    path === '/api/v1/auth' ||
    path.startsWith('/api/v1/auth/')
  );
}

function getRateLimitConfig(overrides = {}) {
  return {
    enabled: overrides.enabled ?? env.RATE_LIMIT_ENABLED,
    windowMs: overrides.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    authMaxRequests: overrides.authMaxRequests ?? env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    maxRequests: overrides.maxRequests ?? env.RATE_LIMIT_MAX_REQUESTS
  };
}

function getBucket(key, now, windowMs) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = {
      count: 0,
      resetAt: now + windowMs
    };

    buckets.set(key, fresh);
    return fresh;
  }

  return existing;
}

export function createRateLimiter(overrides = {}) {
  const config = getRateLimitConfig(overrides);

  if (!config.enabled) {
    return (_req, _res, next) => next();
  }

  return (req, res, next) => {
    const now = Date.now();
    const authScoped = isAuthPath(req.path);
    const limit = authScoped ? config.authMaxRequests : config.maxRequests;
    const scope = authScoped ? 'auth' : 'general';
    const bucket = getBucket(`${scope}:${getClientKey(req)}`, now, config.windowMs);

    bucket.count += 1;

    const remaining = Math.max(limit - bucket.count, 0);
    const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        status: 'error',
        message: 'Too many requests'
      });
      return;
    }

    next();
  };
}
