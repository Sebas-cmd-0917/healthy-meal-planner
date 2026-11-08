import { Expense } from '../../../../domain/expense/Expense.js';
import type { SupabaseConfig } from '../../../config/env.js';
import { SupabaseDatedRepository } from './SupabaseDatedRepository.js';

interface ExpenseRow {
  id: string;
  date: string;
  /** bigint llega como string o number según el tamaño */
  amount: number | string;
  category: string;
  note: string | null;
  created_at: string;
}

export class SupabaseExpenseRepository extends SupabaseDatedRepository<Expense, ExpenseRow> {
  constructor(config: SupabaseConfig) {
    super(config, {
      table: 'expenses',
      toDomain: (row) => new Expense({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        category: row.category,
        note: row.note ?? '',
        createdAt: row.created_at,
      }),
      toRow: (e) => ({ date: e.date, amount: e.amount, category: e.category, note: e.note }),
    });
  }
}
