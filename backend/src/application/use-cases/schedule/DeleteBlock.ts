import { NotFoundError } from '../../../domain/shared/DomainError.js';
import type { ScheduleRepository } from '../../ports/repositories.js';

export class DeleteBlock {
  constructor(private readonly deps: { scheduleRepository: ScheduleRepository }) {}

  async execute(id: string): Promise<void> {
    if (!(await this.deps.scheduleRepository.delete(id))) throw new NotFoundError('El bloque no existe');
  }
}
