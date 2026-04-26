import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { createCorsMiddleware } from './config/cors.js';
import { isTestEnvironment } from './config/env.js';
import openApiDocument from './docs/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import healthRoutes from './routes/healthRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(createCorsMiddleware());
  app.use(
    morgan(isTestEnvironment() ? 'tiny' : 'combined', {
      skip: () => isTestEnvironment()
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/health', healthRoutes);
  app.use('/api/v1/profiles', profileRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
