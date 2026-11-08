import { Recipe } from '../../../domain/recipe/Recipe.js';
import type { AutomationGateway } from '../../ports/AutomationGateway.js';
import type { RecipeRepository } from '../../ports/repositories.js';
import { isRecord } from '../shared/batch.js';

export class CreateRecipe {
  constructor(private readonly deps: { recipeRepository: RecipeRepository; automationGateway: AutomationGateway }) {}

  async execute(input: unknown): Promise<Recipe> {
    const recipe = new Recipe(isRecord(input) ? input : {});
    const saved = await this.deps.recipeRepository.save(recipe);
    // Si n8n no está disponible no se rompe la creación
    await this.deps.automationGateway.publish('recipe.created', saved.toJSON()).catch(() => {});
    return saved;
  }
}
