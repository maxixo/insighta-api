import { AppError } from '../utils/appError.js';

export function requireRole(allowedRoles) {
  return function roleMiddleware(req, _res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'Forbidden'));
      return;
    }

    next();
  };
}
