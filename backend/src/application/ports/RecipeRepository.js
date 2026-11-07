/**
 * Puerto de salida (driven port) para persistir recetas.
 * Cualquier adaptador (Supabase, memoria, MySQL...) debe implementar estos métodos.
 *
 * @typedef {import('../../domain/recipe/Recipe.js').Recipe} Recipe
 *
 * @typedef {Object} RecipeRepository
 * @property {() => Promise<Recipe[]>} findAll
 * @property {(id: string) => Promise<Recipe|null>} findById
 * @property {(recipe: Recipe) => Promise<Recipe>} save
 */
export {};
