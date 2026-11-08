import { NotFoundError } from '../../../domain/shared/DomainError.js';
import type { Task } from '../../../domain/task/Task.js';
import type { TaskRepository } from '../../ports/repositories.js';
import { pickEditable } from '../shared/batch.js';

const EDITABLE = ['date', 'title', 'notes', 'done'] as const;

export class UpdateTask {
  constructor(private readonly deps: { taskRepository: TaskRepository }) {}

  async execute(id: string, changes: unknown): Promise<Task> {
    const current = await this.deps.taskRepository.findById(id);
    if (!current) throw new NotFoundError('La tarea no existe');
    const [saved] = await this.deps.taskRepository.saveMany([current.with(pickEditable(changes, EDITABLE))]);
    return saved!;
  }
}
