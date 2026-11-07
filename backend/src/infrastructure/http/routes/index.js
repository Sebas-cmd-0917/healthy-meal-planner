import { Router } from 'express';
import { recipeRoutes } from './recipe.routes.js';
import { scheduleRoutes } from './schedule.routes.js';

export function apiRoutes({ useCases }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.use('/recipes', recipeRoutes(useCases));
  router.use('/schedule', scheduleRoutes(useCases));

  return router;
}
