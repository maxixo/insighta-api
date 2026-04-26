import countries from 'i18n-iso-countries';
import englishLocale from 'i18n-iso-countries/langs/en.json' with { type: 'json' };

import { normalizeCountrySearchText } from './normalization.js';

countries.registerLocale(englishLocale);

const COUNTRY_NAMES = countries.getNames('en');

const COUNTRY_SEARCH_INDEX = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({
    code,
    name,
    normalizedName: normalizeCountrySearchText(name)
  }))
  .sort((left, right) => right.normalizedName.length - left.normalizedName.length);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeCountryCode(countryId) {
  if (typeof countryId !== 'string') {
    return null;
  }

  const normalized = countryId.trim().toUpperCase();
  return normalized || null;
}

export function getCountryNameByCode(countryId) {
  const normalized = normalizeCountryCode(countryId);

  if (!normalized) {
    return null;
  }

  return COUNTRY_NAMES[normalized] ?? null;
}

export function isValidCountryCode(countryId) {
  return Boolean(getCountryNameByCode(countryId));
}

export function findCountryInNormalizedText(normalizedText) {
  for (const country of COUNTRY_SEARCH_INDEX) {
    const pattern = new RegExp(`(?:^|\\s)from ${escapeRegex(country.normalizedName)}(?:$|\\s)`);

    if (pattern.test(normalizedText)) {
      return {
        country_id: country.code,
        country_name: country.name
      };
    }
  }

  return null;
}
