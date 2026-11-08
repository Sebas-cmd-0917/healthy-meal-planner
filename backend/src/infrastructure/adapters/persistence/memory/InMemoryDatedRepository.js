import { randomUUID } from 'node:crypto';

/**
 * Repositorio en memoria para entidades con fecha (tareas, gastos).
 * `Entity` debe aceptar en su constructor lo que devuelve su toJSON().
 */
export class InMemoryDatedRepository {
  #items = new Map();

  constructor(Entity) {
    this.Entity = Entity;
  }

  async findBetween(from, to) {
    return [...this.#items.values()]
      .filter((e) => e.date >= from && e.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }

  async findById(id) {
    return this.#items.get(id) ?? null;
  }

  async saveMany(entities) {
    return entities.map((entity) => {
      const saved = new this.Entity({
        ...entity.toJSON(),
        id: entity.id ?? randomUUID(),
        createdAt: entity.createdAt ?? new Date().toISOString(),
      });
      this.#items.set(saved.id, saved);
      return saved;
    });
  }

  async delete(id) {
    return this.#items.delete(id);
  }
}
