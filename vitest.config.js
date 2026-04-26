import { defineConfig } from 'vitest/config';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'profile_db_test';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
});
