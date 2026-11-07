import { createClient } from '@supabase/supabase-js';
import { Recipe } from '../../../../domain/recipe/Recipe.js';

const TABLE = 'recipes';

const toDomain = (row) => new Recipe({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  calories: row.calories,
  tags: row.tags ?? [],
  createdAt: row.created_at,
});

/** @implements {import('../../../../application/ports/RecipeRepository.js').RecipeRepository} */
export class SupabaseRecipeRepository {
  constructor({ url, secretKey }) {
    this.client = createClient(url, secretKey, { auth: { persistSession: false } });
  }

  async findAll() {
    const { data, error } = await this.client.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(toDomain);
  }

  async findById(id) {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async save(recipe) {
    const { id, createdAt, ...fields } = recipe.toJSON();
    const row = id ? { id, ...fields } : fields;
    const { data, error } = await this.client.from(TABLE).upsert(row).select().single();
    if (error) throw error;
    return toDomain(data);
  }
}
