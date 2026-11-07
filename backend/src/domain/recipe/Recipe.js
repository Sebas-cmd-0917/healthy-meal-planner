import { ValidationError } from '../shared/DomainError.js';

/**
 * Entidad de dominio: no conoce Express, Supabase ni n8n.
 */
export class Recipe {
  constructor({ id = null, name, description = '', calories = null, tags = [], createdAt = null }) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('La receta necesita un nombre');
    }
    if (calories !== null && (!Number.isFinite(calories) || calories < 0)) {
      throw new ValidationError('Las calorías deben ser un número positivo');
    }
    if (!Array.isArray(tags)) {
      throw new ValidationError('Los tags deben ser una lista');
    }

    this.id = id;
    this.name = name.trim();
    this.description = description;
    this.calories = calories;
    this.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    this.createdAt = createdAt;
  }

  toJSON() {
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
