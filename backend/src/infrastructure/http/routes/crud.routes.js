import { Router } from 'express';

/**
 * Rutas estándar para recursos con fecha (tareas, gastos):
 *   GET    /?from=AAAA-MM-DD&to=AAAA-MM-DD   → { data: { items, summary } }
 *   POST   /            uno, una lista o { [batchKey]: [...] }
 *   PATCH  /:id
 *   DELETE /:id
 */
export function crudRoutes({ list, create, update, remove, batchKey }) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json({ data: await list.execute({ from: req.query.from, to: req.query.to }) });
  });

  router.post('/', async (req, res) => {
    const body = req.body ?? {};
    const input = Array.isArray(body) ? body : Array.isArray(body[batchKey]) ? body[batchKey] : body;
    res.status(201).json({ data: await create.execute(input) });
  });

  router.patch('/:id', async (req, res) => {
    res.json({ data: await update.execute(req.params.id, req.body ?? {}) });
  });

  router.delete('/:id', async (req, res) => {
    await remove.execute(req.params.id);
    res.status(204).end();
  });

  return router;
}
