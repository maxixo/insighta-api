import { AppError } from '../utils/appError.js';

export function validateRefreshTokenBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('refresh_token' in body)) {
    throw new AppError(400, 'Refresh token is required');
  }

  if (typeof body.refresh_token !== 'string') {
    throw new AppError(422, 'Refresh token must be a string');
  }

  const refreshToken = body.refresh_token.trim();

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token is required');
  }

  return refreshToken;
}
