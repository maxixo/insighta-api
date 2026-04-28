import { AppError } from '../utils/appError.js';

export function requireActiveUser(req, _res, next) {
  if (!req.user?.is_active) {
    next(new AppError(403, 'User account is inactive'));
    return;
  }

  next();
}
