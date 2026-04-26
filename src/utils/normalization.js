export function normalizeName(value) {
  return value.trim().toLowerCase();
}

export function normalizeCountrySearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBlank(value) {
  return typeof value === 'string' && value.trim() === '';
}
