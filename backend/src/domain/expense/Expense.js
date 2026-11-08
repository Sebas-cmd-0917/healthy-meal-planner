import { ValidationError } from '../shared/DomainError.js';
import { assertDate } from '../shared/dateRange.js';

export const EXPENSE_CATEGORIES = [
  'comida', 'mercado', 'transporte', 'hogar', 'servicios', 'salud', 'entretenimiento', 'compras', 'otros',
];

const MAX_AMOUNT = 10_000_000_000;

/** Acepta 15000, "15000", "15.000" o "$15.000" (pesos colombianos, sin decimales). */
function parseAmount(value) {
  const raw = typeof value === 'string' ? value.replace(/[$\s.,]/g, '') : value;
  const n = Number(raw);
  if (raw === '' || !Number.isInteger(n) || n <= 0 || n > MAX_AMOUNT) {
    throw new ValidationError('El monto debe ser un valor entero en pesos mayor que 0');
  }
  return n;
}

/** Un gasto en pesos colombianos (COP). */
export class Expense {
  constructor({ id = null, date, amount, category = 'otros', note = '', createdAt = null }) {
    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw new ValidationError(`La categoría debe ser una de: ${EXPENSE_CATEGORIES.join(', ')}`);
    }
    this.id = id;
    this.date = assertDate(date);
    this.amount = parseAmount(amount);
    this.category = category;
    this.note = (note ?? '').trim();
    this.createdAt = createdAt;
  }

  with(changes) {
    return new Expense({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON() {
    return { id: this.id, date: this.date, amount: this.amount, category: this.category, note: this.note, createdAt: this.createdAt };
  }
}
