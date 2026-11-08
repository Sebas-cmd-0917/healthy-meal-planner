import { assertRange } from '../../../domain/shared/dateRange.js';
import type { Task } from '../../../domain/task/Task.js';
import type { TaskRepository } from '../../ports/repositories.js';

export interface TaskList {
  items: Task[];
  summary: { total: number; done: number; pending: number };
}

export class ListTasks {
  constructor(private readonly deps: { taskRepository: TaskRepository }) {}

  /** Tareas del rango y cuántas están hechas. */
  async execute(query: { from: unknown; to: unknown }): Promise<TaskList> {
    const { from, to } = assertRange(query.from, query.to, 31);
    const items = await this.deps.taskRepository.findBetween(from, to);
    const done = items.filter((t) => t.done).length;
    return { items, summary: { total: items.length, done, pending: items.length - done } };
  }
}
