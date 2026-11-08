import { NotFoundError } from '../../../domain/shared/DomainError.js';
import type { ExpenseRepository } from '../../ports/repositories.js';

export class DeleteExpense {
  constructor(private readonly deps: { expenseRepository: ExpenseRepository }) {}

  async execute(id: string): Promise<void> {
    if (!(await this.deps.expenseRepository.delete(id))) throw new NotFoundError('El gasto no existe');
  }
}
