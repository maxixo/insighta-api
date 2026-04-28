import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';
import { verifyToken } from '../utils/tokens.js';

function getAccessTokenSecret() {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET?.trim();
  return accessTokenSecret || env.ACCESS_TOKEN_SECRET;
}

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    throw new AppError(401, 'Authentication required');
  }

  if (typeof authorizationHeader !== 'string') {
    throw new AppError(401, 'Authentication required');
  }

  const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || rest.length > 0) {
    throw new AppError(401, 'Authentication required');
  }

  return token;
}

export async function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyToken(token, getAccessTokenSecret());

    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      throw new AppError(401, 'Authentication required');
    }

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    req.auth = {
      token,
      payload
    };
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    next(error);
  }
}
