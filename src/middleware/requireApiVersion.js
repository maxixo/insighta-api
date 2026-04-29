import { AppError } from '../utils/appError.js';

export function requireApiVersion(req, _res, next) {
  const headerValue = req.headers['x-api-version'];
  const version = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (typeof version !== 'string' || version.trim() !== '1') {
    next(new AppError(400, 'API version header required'));
    return;
  }

  next();
}
