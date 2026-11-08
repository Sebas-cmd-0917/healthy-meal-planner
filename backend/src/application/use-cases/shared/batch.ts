import { ValidationError } from '../../../domain/shared/DomainError.js';

/**
 * Construye entidades de una lista validando todas antes de guardar.
 * Si una falla, el mensaje indica cuál ("Gasto 2: ...").
 */
export function buildAll<T>(input: unknown, build: (item: Record<string, unknown>) => T, { label, max = 100 }: { label: string; max?: number }): T[] {
  const items: unknown[] = Array.isArray(input) ? input : [input];
  if (!items.length) throw new ValidationError(`Envía al menos un(a) ${label.toLowerCase()}`);
  if (items.length > max) throw new ValidationError(`Máximo ${max} por petición`);
  return items.map((item, i) => {
    try {
      return build(isRecord(item) ? item : {});
    } catch (e) {
      if (items.length > 1 && e instanceof ValidationError) throw new ValidationError(`${label} ${i + 1}: ${e.message}`);
      throw e;
    }
  });
}

/** Deja solo los campos permitidos; falla si no queda ninguno. */
export function pickEditable<K extends string>(changes: unknown, editable: readonly K[]): Partial<Record<K, unknown>> {
  const source = isRecord(changes) ? changes : {};
  const patch = Object.fromEntries(Object.entries(source).filter(([k]) => (editable as readonly string[]).includes(k)));
  if (!Object.keys(patch).length) throw new ValidationError(`Nada que actualizar. Campos válidos: ${editable.join(', ')}`);
  return patch as Partial<Record<K, unknown>>;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
