import { NotFoundError } from '../../../domain/shared/DomainError.js';
import { pickEditable } from '../shared/batch.js';

export class UpdateTask {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository;
  }

  async execute(id, changes) {
    const current = await this.taskRepository.findById(id);
    if (!current) throw new NotFoundError('La tarea no existe');
    const [saved] = await this.taskRepository.saveMany([current.with(pickEditable(changes, ['date', 'title', 'notes', 'done']))]);
    return saved;
  }
}
