import { QUERY_DEFAULTS } from '../constants/profile.js';

export function getPagination({ page = QUERY_DEFAULTS.page, limit = QUERY_DEFAULTS.limit }) {
  const safeLimit = Math.min(limit, QUERY_DEFAULTS.maxLimit);

  return {
    page,
    limit: safeLimit,
    skip: (page - 1) * safeLimit
  };
}
