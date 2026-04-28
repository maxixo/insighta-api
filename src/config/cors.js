import cors from 'cors';

import { env } from './env.js';

function getAllowedOrigins() {
  return env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsMiddleware() {
  if (env.CORS_ORIGIN === '*') {
    return cors({ origin: '*' });
  }

  const allowedOrigins = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  });
}
