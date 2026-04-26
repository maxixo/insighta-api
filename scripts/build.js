import app from '../src/app.js';
import openApiDocument from '../src/docs/openapi.js';

if (!app || openApiDocument.openapi !== '3.0.3') {
  throw new Error('Build validation failed');
}

console.log('Build validation passed');
