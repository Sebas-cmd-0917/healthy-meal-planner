import { Recipe } from '../../../domain/recipe/Recipe.js';

export class CreateRecipe {
  /**
   * @param {{
   *   recipeRepository: import('../../ports/RecipeRepository.js').RecipeRepository,
   *   automationGateway: import('../../ports/AutomationGateway.js').AutomationGateway
   * }} deps
   */
  constructor({ recipeRepository, automationGateway }) {
    this.recipeRepository = recipeRepository;
    this.automationGateway = automationGateway;
  }

  async execute(input) {
    const recipe = new Recipe(input);
    const saved = await this.recipeRepository.save(recipe);
    // Si n8n no está disponible no se rompe la creación
    await this.automationGateway.publish('recipe.created', saved.toJSON()).catch(() => {});
    return saved;
  }
}
