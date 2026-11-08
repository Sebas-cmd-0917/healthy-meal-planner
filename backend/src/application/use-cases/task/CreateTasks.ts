import { Task } from '../../../domain/task/Task.js';
import type { TaskRepository } from '../../ports/repositories.js';
import { buildAll } from '../shared/batch.js';

export class CreateTasks {
  constructor(private readonly deps: { taskRepository: TaskRepository }) {}

  execute(input: unknown): Promise<Task[]> {
    const tasks = buildAll(input, (item) => new Task({ ...item, id: null, createdAt: null }), { label: 'Tarea' });
    return this.deps.taskRepository.saveMany(tasks);
  }
}
