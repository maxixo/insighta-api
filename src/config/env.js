import 'dotenv/config';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
].join(',');

const DEFAULT_SEED_SOURCE =
  'https://drive.google.com/uc?export=download&id=1Up06dcS9OfUEnDj_u6OV_xTRntupFhPH';

function parsePort(value) {
  const parsed = Number.parseInt(value ?? '4000', 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 4000;
  }

  return parsed;
}

export const env = {
  PORT: parsePort(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  MONGO_URI: process.env.MONGO_URI?.trim() || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME?.trim() || 'profile_db',
  CORS_ORIGIN: process.env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGINS,
  SEED_PROFILES_SOURCE: process.env.SEED_PROFILES_SOURCE?.trim() || DEFAULT_SEED_SOURCE
};

export function isTestEnvironment() {
  return env.NODE_ENV === 'test';
}
