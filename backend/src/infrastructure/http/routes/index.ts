import { Router } from 'express';
import type { UseCases } from '../../container.js';
import { crudRoutes } from './crud.routes.js';

export function apiRoutes(useCases: UseCases): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  router.get('/recipes', async (_req, res) => {
    res.json({ data: await useCases.listRecipes.execute() });
  });
  router.post('/recipes', async (req, res) => {
    res.status(201).json({ data: await useCases.createRecipe.execute(req.body) });
  });

  router.use('/schedule', crudRoutes({
    list: useCases.listSchedule, create: useCases.createBlocks, update: useCases.updateBlock, remove: useCases.deleteBlock,
    batchKey: 'blocks',
  }));
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
