import { randomUUID } from 'node:crypto';
import { Recipe } from '../../../../domain/recipe/Recipe.js';

/** @implements {import('../../../../application/ports/RecipeRepository.js').RecipeRepository} */
export class InMemoryRecipeRepository {
  #items = new Map();

  async findAll() {
    return [...this.#items.values()];
  }

  async findById(id) {
    return this.#items.get(id) ?? null;
  }

  async save(recipe) {
    const saved = new Recipe({
      ...recipe.toJSON(),
      id: recipe.id ?? randomUUID(),
      createdAt: recipe.createdAt ?? new Date().toISOString(),
    });
    this.#items.set(saved.id, saved);
    return saved;
  }
}
