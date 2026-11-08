import { assertRange } from '../../../domain/shared/dateRange.js';

export class ListTasks {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository;
  }

  /** Tareas del rango y cuántas están hechas. */
  async execute({ from, to }) {
    assertRange(from, to, 31);
    const items = await this.taskRepository.findBetween(from, to);
    const done = items.filter((t) => t.done).length;
    return { items, summary: { total: items.length, done, pending: items.length - done } };
  }
}
