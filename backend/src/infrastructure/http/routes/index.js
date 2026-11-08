import { Router } from 'express';
import { recipeRoutes } from './recipe.routes.js';
import { scheduleRoutes } from './schedule.routes.js';
import { crudRoutes } from './crud.routes.js';

export function apiRoutes({ useCases }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.use('/recipes', recipeRoutes(useCases));
  router.use('/schedule', scheduleRoutes(useCases));
  router.use('/tasks', crudRoutes({
    list: useCases.listTasks, create: useCases.createTasks, update: useCases.updateTask, remove: useCases.deleteTask,
    batchKey: 'tasks',
  }));
  router.use('/expenses', crudRoutes({
    list: useCases.listExpenses, create: useCases.createExpenses, update: useCases.updateExpense, remove: useCases.deleteExpense,
    batchKey: 'expenses',
  }));

  return router;
}
