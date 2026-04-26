import { findCountryInNormalizedText } from '../utils/country.js';
import { AppError } from '../utils/appError.js';
import { normalizeCountrySearchText } from '../utils/normalization.js';

const GENDER_TOKENS = {
  male: ['male', 'males'],
  female: ['female', 'females']
};

const AGE_GROUP_TOKENS = {
  child: ['child', 'children'],
  teenager: ['teenager', 'teenagers'],
  adult: ['adult', 'adults'],
  senior: ['senior', 'seniors']
};

function hasToken(text, token) {
  const pattern = new RegExp(`(?:^|\\s)${token}(?:$|\\s)`);
  return pattern.test(text);
}

function getMatchedKeys(text, tokenMap) {
  return Object.entries(tokenMap)
    .filter(([, tokens]) => tokens.some((token) => hasToken(text, token)))
    .map(([key]) => key);
}

function getAgeBounds(text) {
  const minAgeCandidates = [];
  const maxAgeCandidates = [];

  for (const match of text.matchAll(/(?:above|over|older than) (\d+)/g)) {
    minAgeCandidates.push(Number.parseInt(match[1], 10) + 1);
  }

  for (const match of text.matchAll(/(?:below|under|younger than) (\d+)/g)) {
    maxAgeCandidates.push(Number.parseInt(match[1], 10) - 1);
  }

  const result = {};

  if (minAgeCandidates.length > 0) {
    result.min_age = Math.max(...minAgeCandidates);
  }

  if (maxAgeCandidates.length > 0) {
    result.max_age = Math.min(...maxAgeCandidates);
  }

  return result;
}

export function interpretSearchQuery(rawQuery) {
  const normalizedQuery = normalizeCountrySearchText(rawQuery);
  const filters = {};

  const matchedGenders = getMatchedKeys(normalizedQuery, GENDER_TOKENS);
  if (matchedGenders.length === 1) {
    filters.gender = matchedGenders[0];
  }

  const matchedAgeGroups = getMatchedKeys(normalizedQuery, AGE_GROUP_TOKENS);
  if (matchedAgeGroups.length === 1) {
    filters.age_group = matchedAgeGroups[0];
  }

  if (hasToken(normalizedQuery, 'young')) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  Object.assign(filters, getAgeBounds(normalizedQuery));

  const country = findCountryInNormalizedText(normalizedQuery);
  if (country) {
    filters.country_id = country.country_id;
  }

  if (Object.keys(filters).length === 0) {
    throw new AppError(400, 'Unable to interpret query');
  }

  if (
    filters.min_age !== undefined &&
    filters.max_age !== undefined &&
    filters.min_age > filters.max_age
  ) {
    throw new AppError(400, 'Unable to interpret query');
  }

  return filters;
}
