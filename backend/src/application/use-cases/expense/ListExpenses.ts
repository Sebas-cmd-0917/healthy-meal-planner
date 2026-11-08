import type { Expense, ExpenseCategory } from '../../../domain/expense/Expense.js';
import { assertRange } from '../../../domain/shared/dateRange.js';
import type { ISODate } from '../../../domain/shared/types.js';
import type { ExpenseRepository } from '../../ports/repositories.js';

export interface ExpenseList {
  items: Expense[];
  summary: {
    total: number;
    count: number;
    byCategory: { category: ExpenseCategory; total: number }[];
    byDay: { date: ISODate; total: number }[];
  };
}

function totalsBy<K extends string>(items: Expense[], key: (e: Expense) => K): [K, number][] {
  const totals = new Map<K, number>();
  for (const e of items) totals.set(key(e), (totals.get(key(e)) ?? 0) + e.amount);
  return [...totals];
}

export class ListExpenses {
  constructor(private readonly deps: { expenseRepository: ExpenseRepository }) {}

  /** Gastos del rango (día, semana o mes) con totales por categoría y por día. */
  async execute(query: { from: unknown; to: unknown }): Promise<ExpenseList> {
    const { from, to } = assertRange(query.from, query.to, 92);
    const items = await this.deps.expenseRepository.findBetween(from, to);
    return {
      items,
      summary: {
        total: items.reduce((n, e) => n + e.amount, 0),
        count: items.length,
        byCategory: totalsBy(items, (e) => e.category)
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total),
        byDay: totalsBy(items, (e) => e.date)
          .map(([date, total]) => ({ date, total }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    };
  }
}
