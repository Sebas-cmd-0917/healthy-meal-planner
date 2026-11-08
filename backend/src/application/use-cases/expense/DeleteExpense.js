import { NotFoundError } from '../../../domain/shared/DomainError.js';

export class DeleteExpense {
  constructor({ expenseRepository }) {
    this.expenseRepository = expenseRepository;
  }

  async execute(id) {
    if (!(await this.expenseRepository.delete(id))) throw new NotFoundError('El gasto no existe');
  }
}
