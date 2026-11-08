import { randomUUID } from 'node:crypto';
import { Recipe } from '../../../../domain/recipe/Recipe.js';
import type { RecipeRepository } from '../../../../application/ports/repositories.js';

export class InMemoryRecipeRepository implements RecipeRepository {
  #items = new Map<string, Recipe>();

  async findAll(): Promise<Recipe[]> {
    return [...this.#items.values()];
  }

  async findById(id: string): Promise<Recipe | null> {
    return this.#items.get(id) ?? null;
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const saved = new Recipe({
      ...recipe.toJSON(),
      id: recipe.id ?? randomUUID(),
      createdAt: recipe.createdAt ?? new Date().toISOString(),
    });
    this.#items.set(saved.id!, saved);
    return saved;
  }
}
