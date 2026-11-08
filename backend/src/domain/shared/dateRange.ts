import { ValidationError } from './DomainError.js';
import type { ISODate } from './types.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Valida AAAA-MM-DD y que sea una fecha real (no 2026-02-31). */
export function assertDate(value: unknown, field = 'fecha'): ISODate {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new ValidationError(`La ${field} debe tener formato AAAA-MM-DD`);
  }
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`La ${field} ${value} no existe`);
  }
  return value;
}

/** Valida un rango de fechas (ambas incluidas) con un máximo de días. */
export function assertRange(from: unknown, to: unknown, maxDays: number): { from: ISODate; to: ISODate } {
  const start = assertDate(from, 'fecha inicial');
  const end = assertDate(to, 'fecha final');
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS;
  if (days < 0) throw new ValidationError('La fecha final no puede ser anterior a la inicial');
  if (days >= maxDays) throw new ValidationError(`El rango máximo es de ${maxDays} días`);
  return { from: start, to: end };
}

export function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ValidationError(`"${field}" debe ser true o false`);
  return value;
}

export function optionalString(value: unknown, field: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') throw new ValidationError(`"${field}" debe ser texto`);
  return value;
}

export function optionalId(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}
