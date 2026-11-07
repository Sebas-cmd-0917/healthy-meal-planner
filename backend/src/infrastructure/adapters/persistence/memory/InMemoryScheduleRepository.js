import { randomUUID } from 'node:crypto';
import { ScheduleBlock } from '../../../../domain/schedule/ScheduleBlock.js';

const byDateAndTime = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);

/** @implements {import('../../../../application/ports/ScheduleRepository.js').ScheduleRepository} */
export class InMemoryScheduleRepository {
  #items = new Map();

  async findBetween(from, to) {
    return [...this.#items.values()].filter((b) => b.date >= from && b.date <= to).sort(byDateAndTime);
  }

  async findById(id) {
    return this.#items.get(id) ?? null;
  }

  async saveMany(blocks) {
    return blocks.map((block) => {
      const saved = new ScheduleBlock({
        ...block.toJSON(),
        id: block.id ?? randomUUID(),
        createdAt: block.createdAt ?? new Date().toISOString(),
      });
      this.#items.set(saved.id, saved);
      return saved;
    });
  }

  async delete(id) {
    return this.#items.delete(id);
  }
}
