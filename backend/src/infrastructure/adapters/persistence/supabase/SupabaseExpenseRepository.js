import { Expense } from '../../../../domain/expense/Expense.js';
import { SupabaseDatedRepository } from './SupabaseDatedRepository.js';

/** @implements {import('../../../../application/ports/ExpenseRepository.js').ExpenseRepository} */
export class SupabaseExpenseRepository extends SupabaseDatedRepository {
  constructor(config) {
    super(config, {
      table: 'expenses',
      toDomain: (row) => new Expense({
        id: row.id,
        date: row.date,
        amount: Number(row.amount), // bigint llega como string
        category: row.category,
        note: row.note ?? '',
        createdAt: row.created_at,
      }),
      toRow: (e) => ({ date: e.date, amount: e.amount, category: e.category, note: e.note }),
    });
  }
}
