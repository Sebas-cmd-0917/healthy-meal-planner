import type { Expense } from '../../../domain/expense/Expense.js';
import { NotFoundError } from '../../../domain/shared/DomainError.js';
import type { ExpenseRepository } from '../../ports/repositories.js';
import { pickEditable } from '../shared/batch.js';

const EDITABLE = ['date', 'amount', 'category', 'note'] as const;

export class UpdateExpense {
  constructor(private readonly deps: { expenseRepository: ExpenseRepository }) {}

  async execute(id: string, changes: unknown): Promise<Expense> {
    const current = await this.deps.expenseRepository.findById(id);
    if (!current) throw new NotFoundError('El gasto no existe');
    const [saved] = await this.deps.expenseRepository.saveMany([current.with(pickEditable(changes, EDITABLE))]);
    return saved!;
  }
}
