import { AppError } from '../utils/appError.js';
import { isBlank, normalizeName } from '../utils/normalization.js';

export function validateCreateProfileBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('name' in body)) {
    throw new AppError(400, 'Name is required');
  }

  if (typeof body.name !== 'string') {
    throw new AppError(422, 'Name must be a string');
  }

  if (isBlank(body.name)) {
    throw new AppError(400, 'Name is required');
  }

  return normalizeName(body.name);
}

export function validateProfileId(profileId) {
  if (profileId === undefined || profileId === null) {
    throw new AppError(400, 'Profile id is required');
  }

  if (typeof profileId !== 'string') {
    throw new AppError(422, 'Profile id must be a string');
  }

  if (profileId.trim() === '') {
    throw new AppError(400, 'Profile id is required');
  }

  return profileId.trim();
}
