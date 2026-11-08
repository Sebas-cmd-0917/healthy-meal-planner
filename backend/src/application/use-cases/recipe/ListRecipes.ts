import type { RecipeRepository } from '../../ports/repositories.js';

export class ListRecipes {
  constructor(private readonly deps: { recipeRepository: RecipeRepository }) {}

  execute() {
    return this.deps.recipeRepository.findAll();
  }
}
