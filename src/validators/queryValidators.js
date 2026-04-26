import { AGE_GROUPS, GENDERS, LIST_SORT_FIELDS, QUERY_DEFAULTS } from '../constants/profile.js';
import { getCountryNameByCode, normalizeCountryCode } from '../utils/country.js';
import { AppError } from '../utils/appError.js';
import { getPagination } from '../utils/pagination.js';

function getSingleValue(query, key, options = {}) {
  const value = query[key];

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new AppError(options.numeric ? 422 : 400, 'Invalid query parameters');
  }

  if (typeof value !== 'string') {
    throw new AppError(options.numeric ? 422 : 400, 'Invalid query parameters');
  }

  if (value.trim() === '') {
    throw new AppError(400, 'Invalid query parameters');
  }

  return value.trim();
}

function parseInteger(query, key) {
  const rawValue = getSingleValue(query, key, { numeric: true });

  if (rawValue === undefined) {
    return undefined;
  }

  if (!/^-?\d+$/.test(rawValue)) {
    throw new AppError(422, 'Invalid query parameters');
  }

  return Number.parseInt(rawValue, 10);
}

function parseNumber(query, key) {
  const rawValue = getSingleValue(query, key, { numeric: true });

  if (rawValue === undefined) {
    return undefined;
  }

  if (!/^-?\d+(\.\d+)?$/.test(rawValue)) {
    throw new AppError(422, 'Invalid query parameters');
  }

  return Number(rawValue);
}

function parseSort(query) {
  const sortBy = getSingleValue(query, 'sort_by');
  const order = getSingleValue(query, 'order');

  if (order && !sortBy) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (sortBy && !Object.hasOwn(LIST_SORT_FIELDS, sortBy)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (order && !['asc', 'desc'].includes(order)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  const resolvedSortBy = sortBy ?? QUERY_DEFAULTS.sortBy;
  const resolvedOrder = order ?? QUERY_DEFAULTS.order;

  return {
    [LIST_SORT_FIELDS[resolvedSortBy]]: resolvedOrder === 'asc' ? 1 : -1
  };
}

export function validateListQuery(query) {
  const gender = getSingleValue(query, 'gender');
  const ageGroup = getSingleValue(query, 'age_group');
  const countryId = getSingleValue(query, 'country_id');
  const minAge = parseInteger(query, 'min_age');
  const maxAge = parseInteger(query, 'max_age');
  const minGenderProbability = parseNumber(query, 'min_gender_probability');
  const minCountryProbability = parseNumber(query, 'min_country_probability');
  const page = parseInteger(query, 'page') ?? QUERY_DEFAULTS.page;
  const limit = parseInteger(query, 'limit') ?? QUERY_DEFAULTS.limit;

  if (gender && !GENDERS.includes(gender)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (ageGroup && !AGE_GROUPS.includes(ageGroup)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (countryId && !getCountryNameByCode(countryId)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if ((minAge !== undefined && minAge < 0) || (maxAge !== undefined && maxAge < 0)) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (
    (minGenderProbability !== undefined &&
      (!Number.isFinite(minGenderProbability) || minGenderProbability < 0 || minGenderProbability > 1)) ||
    (minCountryProbability !== undefined &&
      (!Number.isFinite(minCountryProbability) || minCountryProbability < 0 || minCountryProbability > 1))
  ) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, 'Invalid query parameters');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError(400, 'Invalid query parameters');
  }

  const pagination = getPagination({ page, limit });
  const filter = {};

  if (gender) {
    filter.gender = gender;
  }

  if (ageGroup) {
    filter.age_group = ageGroup;
  }

  if (countryId) {
    filter.country_id = normalizeCountryCode(countryId);
  }

  if (minAge !== undefined || maxAge !== undefined) {
    filter.age = {};

    if (minAge !== undefined) {
      filter.age.$gte = minAge;
    }

    if (maxAge !== undefined) {
      filter.age.$lte = maxAge;
    }
  }

  if (minGenderProbability !== undefined) {
    filter.gender_probability = { $gte: minGenderProbability };
  }

  if (minCountryProbability !== undefined) {
    filter.country_probability = { $gte: minCountryProbability };
  }

  return {
    filter,
    sort: parseSort(query),
    page: pagination.page,
    limit: pagination.limit,
    skip: pagination.skip
  };
}

export function validateSearchQuery(query) {
  const rawQuery = query.q;

  if (rawQuery === undefined || rawQuery === null) {
    throw new AppError(400, 'Unable to interpret query');
  }

  if (Array.isArray(rawQuery)) {
    throw new AppError(400, 'Unable to interpret query');
  }

  if (typeof rawQuery !== 'string' || rawQuery.trim() === '') {
    throw new AppError(400, 'Unable to interpret query');
  }

  return {
    q: rawQuery.trim(),
    ...validateListQuery(query)
  };
}
