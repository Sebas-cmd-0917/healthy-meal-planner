import { ValidationError } from '../shared/DomainError.js';
import { optionalId, optionalString } from '../shared/dateRange.js';
import type { Untrusted } from '../shared/types.js';

export interface RecipeProps {
  id: string | null;
  name: string;
  description: string;
  calories: number | null;
  tags: string[];
  createdAt: string | null;
}

/** Entidad de dominio: no conoce Express, Supabase ni n8n. */
export class Recipe {
  readonly id: string | null;
  readonly name: string;
  readonly description: string;
  readonly calories: number | null;
  readonly tags: string[];
  readonly createdAt: string | null;

  constructor({ id, name, description, calories = null, tags = [], createdAt }: Untrusted<RecipeProps>) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('La receta necesita un nombre');
    if (calories !== null && (typeof calories !== 'number' || !Number.isFinite(calories) || calories < 0)) {
      throw new ValidationError('Las calorías deben ser un número positivo');
    }
    if (!Array.isArray(tags)) throw new ValidationError('Los tags deben ser una lista');

    this.id = optionalId(id);
    this.name = name.trim();
    this.description = optionalString(description, 'description');
    this.calories = calories;
    this.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    this.createdAt = optionalId(createdAt);
  }

  toJSON(): RecipeProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      calories: this.calories,
      tags: this.tags,
      createdAt: this.createdAt,
    };
  }
}
