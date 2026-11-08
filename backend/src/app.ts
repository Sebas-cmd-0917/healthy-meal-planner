import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Env } from './infrastructure/config/env.js';
import type { Container } from './infrastructure/container.js';
import { apiRoutes } from './infrastructure/http/routes/index.js';
import { errorHandler, notFound } from './infrastructure/http/middlewares/errorHandler.js';

/** Crea la app de Express sin levantar el servidor (sirve para tests, Vercel o Cloud Run). */
export function createApp({ env, container }: { env: Pick<Env, 'corsOrigin'>; container: Container }): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRoutes(container.useCases));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
