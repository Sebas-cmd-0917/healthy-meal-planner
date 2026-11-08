import { ValidationError } from './DomainError.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Valida YYYY-MM-DD y que sea una fecha real (no 2026-02-31). */
export function assertDate(value, field = 'fecha') {
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
export function assertRange(from, to, maxDays) {
  assertDate(from, 'fecha inicial');
  assertDate(to, 'fecha final');
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  if (days < 0) throw new ValidationError('La fecha final no puede ser anterior a la inicial');
  if (days >= maxDays) throw new ValidationError(`El rango máximo es de ${maxDays} días`);
}
