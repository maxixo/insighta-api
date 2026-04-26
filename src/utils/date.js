export function toUtcIsoSeconds(date = new Date()) {
  return new Date(date).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function classifyAgeGroup(age) {
  if (age <= 12) {
    return 'child';
  }

  if (age <= 19) {
    return 'teenager';
  }

  if (age <= 59) {
    return 'adult';
  }

  return 'senior';
}
