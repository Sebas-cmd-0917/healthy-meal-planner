import { randomUUID } from 'node:crypto';
import type { DatedRepository } from '../../../../application/ports/repositories.js';

interface DatedEntity {
  readonly id: string | null;
  readonly date: string;
  readonly createdAt: string | null;
  toJSON(): object;
}

/**
 * Repositorio en memoria para entidades con fecha (agenda, tareas, gastos).
 * `create` reconstruye la entidad con su id y fecha de creación asignados.
 */
export class InMemoryDatedRepository<T extends DatedEntity> implements DatedRepository<T> {
  #items = new Map<string, T>();

  constructor(
    private readonly create: (props: Record<string, unknown>) => T,
    private readonly sortKey: (entity: T) => string = (e) => `${e.date}${e.createdAt}`,
  ) {}

  async findBetween(from: string, to: string): Promise<T[]> {
    return [...this.#items.values()]
      .filter((e) => e.date >= from && e.date <= to)
      .sort((a, b) => this.sortKey(a).localeCompare(this.sortKey(b)));
  }

  async findById(id: string): Promise<T | null> {
    return this.#items.get(id) ?? null;
  }

  async saveMany(entities: T[]): Promise<T[]> {
    return entities.map((entity) => {
      const saved = this.create({
        ...entity.toJSON(),
        id: entity.id ?? randomUUID(),
        createdAt: entity.createdAt ?? new Date().toISOString(),
      });
      this.#items.set(saved.id!, saved);
      return saved;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.#items.delete(id);
  }
}
