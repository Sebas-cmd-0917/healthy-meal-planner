import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRoutes } from './infrastructure/http/routes/index.js';
import { errorHandler, notFound } from './infrastructure/http/middlewares/errorHandler.js';

/** Crea la app de Express sin levantar el servidor (sirve para tests, Vercel o Cloud Run). */
export function createApp({ env, container }) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRoutes(container));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
