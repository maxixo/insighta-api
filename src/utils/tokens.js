import crypto from 'node:crypto';

import { env } from '../config/env.js';
import { AppError } from './appError.js';

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function readOptionalString(value, fallback = '') {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function readInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readTokenConfig() {
  return {
    accessTokenSecret: readOptionalString(process.env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_SECRET),
    refreshTokenSecret: readOptionalString(process.env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_SECRET),
    accessTokenTtlSeconds: readInteger(process.env.ACCESS_TOKEN_TTL_SECONDS, env.ACCESS_TOKEN_TTL_SECONDS),
    refreshTokenTtlSeconds: readInteger(process.env.REFRESH_TOKEN_TTL_SECONDS, env.REFRESH_TOKEN_TTL_SECONDS)
  };
}

function signHmac(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeToken(payload, secret, expiresInSeconds) {
  if (!secret) {
    throw new AppError(500, 'Token signing is not configured');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = signHmac(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

export function verifyToken(token, secret) {
  if (!secret) {
    throw new AppError(500, 'Token signing is not configured');
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new AppError(401, 'Invalid token');
  }

  const expectedSignature = signHmac(`${encodedHeader}.${encodedPayload}`, secret);

  if (signature.length !== expectedSignature.length) {
    throw new AppError(401, 'Invalid token');
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new AppError(401, 'Invalid token');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));

  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new AppError(401, 'Token expired');
  }

  return payload;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function issueAccessToken(user) {
  const config = readTokenConfig();

  return encodeToken(
    {
      sub: user.id,
      role: user.role,
      type: 'access'
    },
    config.accessTokenSecret,
    config.accessTokenTtlSeconds
  );
}

export function issueRefreshToken({ user, refreshTokenId }) {
  const config = readTokenConfig();

  return {
    token: encodeToken(
      {
        sub: user.id,
        role: user.role,
        type: 'refresh',
        jti: refreshTokenId
      },
      config.refreshTokenSecret,
      config.refreshTokenTtlSeconds
    ),
    expiresInSeconds: config.refreshTokenTtlSeconds
  };
}
