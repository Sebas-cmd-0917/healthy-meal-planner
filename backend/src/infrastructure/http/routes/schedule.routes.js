import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController.js';

export function scheduleRoutes(useCases) {
  const router = Router();
  const controller = new ScheduleController(useCases);

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
