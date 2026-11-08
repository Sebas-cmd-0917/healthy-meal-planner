import { Router } from 'express';

interface Handlers {
  list: { execute(query: { from: unknown; to: unknown }): Promise<unknown> };
  create: { execute(input: unknown): Promise<unknown> };
  update: { execute(id: string, changes: unknown): Promise<unknown> };
  remove: { execute(id: string): Promise<void> };
  /** Clave del lote en el body: { [batchKey]: [...] } */
  batchKey: string;
}

/**
 * Rutas estándar para recursos con fecha (agenda, tareas, gastos):
 *   GET    /?from=AAAA-MM-DD&to=AAAA-MM-DD
 *   POST   /            uno, una lista o { [batchKey]: [...] }
 *   PATCH  /:id
 *   DELETE /:id
 */
export function crudRoutes({ list, create, update, remove, batchKey }: Handlers): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json({ data: await list.execute({ from: req.query.from, to: req.query.to }) });
  });

  router.post('/', async (req, res) => {
    const body: unknown = req.body ?? {};
    const batch = typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)[batchKey]
      : undefined;
    res.status(201).json({ data: await create.execute(Array.isArray(batch) ? batch : body) });
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
