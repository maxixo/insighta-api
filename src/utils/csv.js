import { toUtcIsoSeconds } from './date.js';

const CSV_COLUMNS = [
  'id',
  'name',
  'gender',
  'gender_probability',
  'age',
  'age_group',
  'country_id',
  'country_name',
  'country_probability',
  'created_at'
];

function escapeCsvValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  const stringValue = String(value);

  if (!/[",\r\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function serializeProfilesCsv(profiles) {
  const rows = [
    CSV_COLUMNS.join(','),
    ...profiles.map((profile) => CSV_COLUMNS.map((column) => escapeCsvValue(profile[column])).join(','))
  ];

  return rows.join('\n');
}

export function createProfilesCsvFilename(date = new Date()) {
  const timestamp = toUtcIsoSeconds(date).replace(/:/g, '-');
  return `profiles_${timestamp}.csv`;
}
