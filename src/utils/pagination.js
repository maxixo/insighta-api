import { QUERY_DEFAULTS } from '../constants/profile.js';

export function getPagination({ page = QUERY_DEFAULTS.page, limit = QUERY_DEFAULTS.limit }) {
  const safeLimit = Math.min(limit, QUERY_DEFAULTS.maxLimit);

  return {
    page,
    limit: safeLimit,
    skip: (page - 1) * safeLimit
  };
}

function createPageLink(path, query, page, limit) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  params.set('page', String(page));
  params.set('limit', String(limit));

  return `${path}?${params.toString()}`;
}

export function getTotalPages(total, limit) {
  if (total === 0) {
    return 0;
  }

  return Math.ceil(total / limit);
}

export function buildPaginatedResponse({ path, query, page, limit, total, data }) {
  const totalPages = getTotalPages(total, limit);

  return {
    status: 'success',
    page,
    limit,
    total,
    total_pages: totalPages,
    links: {
      self: createPageLink(path, query, page, limit),
      next: totalPages > 0 && page < totalPages ? createPageLink(path, query, page + 1, limit) : null,
      prev: page > 1 && totalPages > 0 ? createPageLink(path, query, page - 1, limit) : null
    },
    data
  };
}
