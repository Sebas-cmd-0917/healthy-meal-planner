import { Router } from 'express';
import { RecipeController } from '../controllers/RecipeController.js';

export function recipeRoutes(useCases) {
  const router = Router();
  const controller = new RecipeController(useCases);

  router.get('/', controller.list);
  router.post('/', controller.create);

  return router;
}
