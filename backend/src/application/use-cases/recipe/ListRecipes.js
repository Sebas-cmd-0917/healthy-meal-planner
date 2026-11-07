export class ListRecipes {
  /** @param {{ recipeRepository: import('../../ports/RecipeRepository.js').RecipeRepository }} deps */
  constructor({ recipeRepository }) {
    this.recipeRepository = recipeRepository;
  }

  async execute() {
    return this.recipeRepository.findAll();
  }
}
