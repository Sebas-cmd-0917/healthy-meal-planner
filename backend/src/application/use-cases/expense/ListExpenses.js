import { assertRange } from '../../../domain/shared/dateRange.js';

const sumBy = (items, key) => {
  const totals = new Map();
  for (const e of items) totals.set(e[key], (totals.get(e[key]) ?? 0) + e.amount);
  return [...totals].map(([k, total]) => ({ [key]: k, total }));
};

export class ListExpenses {
  constructor({ expenseRepository }) {
    this.expenseRepository = expenseRepository;
  }

  /** Gastos del rango (día, semana o mes) con totales por categoría y por día. */
  async execute({ from, to }) {
    assertRange(from, to, 92);
    const items = await this.expenseRepository.findBetween(from, to);
    return {
      items,
      summary: {
        total: items.reduce((n, e) => n + e.amount, 0),
        count: items.length,
        byCategory: sumBy(items, 'category').sort((a, b) => b.total - a.total),
        byDay: sumBy(items, 'date').sort((a, b) => a.date.localeCompare(b.date)),
      },
    };
  }
}
