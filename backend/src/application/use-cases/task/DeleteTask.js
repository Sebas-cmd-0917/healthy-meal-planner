import { NotFoundError } from '../../../domain/shared/DomainError.js';

export class DeleteTask {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository;
  }

  async execute(id) {
    if (!(await this.taskRepository.delete(id))) throw new NotFoundError('La tarea no existe');
  }
}
