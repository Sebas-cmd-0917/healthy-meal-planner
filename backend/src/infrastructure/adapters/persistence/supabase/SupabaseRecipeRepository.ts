import type { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '../../../../domain/recipe/Recipe.js';
import type { RecipeRepository } from '../../../../application/ports/repositories.js';
import type { SupabaseConfig } from '../../../config/env.js';
import { createSupabase, isUuid } from './client.js';

const TABLE = 'recipes';

interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  calories: number | null;
  tags: string[] | null;
  created_at: string;
}

const toDomain = (row: RecipeRow) => new Recipe({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  calories: row.calories,
  tags: row.tags ?? [],
  createdAt: row.created_at,
});

export class SupabaseRecipeRepository implements RecipeRepository {
  private readonly client: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.client = createSupabase(config);
  }

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.client.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as RecipeRow[]).map(toDomain);
  }

  async findById(id: string): Promise<Recipe | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as RecipeRow) : null;
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const { id, createdAt: _createdAt, ...fields } = recipe.toJSON();
    const row = id ? { id, ...fields } : fields;
    const { data, error } = await this.client.from(TABLE).upsert(row).select().single();
    if (error) throw error;
    return toDomain(data as RecipeRow);
  }
}
