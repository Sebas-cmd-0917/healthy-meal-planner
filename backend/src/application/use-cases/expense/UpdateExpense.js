import { NotFoundError } from '../../../domain/shared/DomainError.js';
import { pickEditable } from '../shared/batch.js';

export class UpdateExpense {
  constructor({ expenseRepository }) {
    this.expenseRepository = expenseRepository;
  }

  async execute(id, changes) {
    const current = await this.expenseRepository.findById(id);
    if (!current) throw new NotFoundError('El gasto no existe');
    const [saved] = await this.expenseRepository.saveMany([current.with(pickEditable(changes, ['date', 'amount', 'category', 'note']))]);
    return saved;
  }
}
