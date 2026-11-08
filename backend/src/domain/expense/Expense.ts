import { ValidationError } from '../shared/DomainError.js';
import { assertDate, optionalId, optionalString } from '../shared/dateRange.js';
import type { ISODate, Untrusted } from '../shared/types.js';

export const EXPENSE_CATEGORIES = [
  'comida', 'mercado', 'transporte', 'hogar', 'servicios', 'salud', 'entretenimiento', 'compras', 'otros',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const MAX_AMOUNT = 10_000_000_000;
const isCategory = (value: unknown): value is ExpenseCategory => EXPENSE_CATEGORIES.includes(value as ExpenseCategory);

/** Acepta 15000, "15000", "15.000" o "$15.000" (pesos colombianos, sin decimales). */
function parseAmount(value: unknown): number {
  const raw = typeof value === 'string' ? value.replace(/[$\s.,]/g, '') : value;
  const n = Number(raw);
  if (raw === '' || raw === null || !Number.isInteger(n) || n <= 0 || n > MAX_AMOUNT) {
    throw new ValidationError('El monto debe ser un valor entero en pesos mayor que 0');
  }
  return n;
}

export interface ExpenseProps {
  id: string | null;
  date: ISODate;
  /** Pesos colombianos, sin decimales */
  amount: number;
  category: ExpenseCategory;
  note: string;
  createdAt: string | null;
}

/** Un gasto en pesos colombianos (COP). */
export class Expense {
  readonly id: string | null;
  readonly date: ISODate;
  readonly amount: number;
  readonly category: ExpenseCategory;
  readonly note: string;
  readonly createdAt: string | null;

  constructor({ id, date, amount, category = 'otros', note, createdAt }: Untrusted<ExpenseProps>) {
    if (!isCategory(category)) {
      throw new ValidationError(`La categoría debe ser una de: ${EXPENSE_CATEGORIES.join(', ')}`);
    }
    this.id = optionalId(id);
    this.date = assertDate(date);
    this.amount = parseAmount(amount);
    this.category = category;
    this.note = optionalString(note, 'note').trim();
    this.createdAt = optionalId(createdAt);
  }

  with(changes: Untrusted<ExpenseProps>): Expense {
    return new Expense({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON(): ExpenseProps {
    const { id, date, amount, category, note, createdAt } = this;
    return { id, date, amount, category, note, createdAt };
  }
}
