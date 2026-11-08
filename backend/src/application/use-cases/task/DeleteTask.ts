import { NotFoundError } from '../../../domain/shared/DomainError.js';
import type { TaskRepository } from '../../ports/repositories.js';

export class DeleteTask {
  constructor(private readonly deps: { taskRepository: TaskRepository }) {}

  async execute(id: string): Promise<void> {
    if (!(await this.deps.taskRepository.delete(id))) throw new NotFoundError('La tarea no existe');
  }
}
