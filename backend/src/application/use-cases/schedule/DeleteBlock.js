import { NotFoundError } from '../../../domain/shared/DomainError.js';

export class DeleteBlock {
  constructor({ scheduleRepository }) {
    this.scheduleRepository = scheduleRepository;
  }

  async execute(id) {
    const deleted = await this.scheduleRepository.delete(id);
    if (!deleted) throw new NotFoundError('El bloque no existe');
  }
}
