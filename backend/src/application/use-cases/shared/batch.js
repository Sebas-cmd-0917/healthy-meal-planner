import { ValidationError } from '../../../domain/shared/DomainError.js';

/**
 * Construye entidades de una lista validando todas antes de guardar.
 * Si una falla, el mensaje indica cuál ("Gasto 2: ...").
 */
export function buildAll(input, build, { label, max = 100 }) {
  const items = Array.isArray(input) ? input : [input];
  if (!items.length) throw new ValidationError(`Envía al menos un ${label.toLowerCase()}`);
  if (items.length > max) throw new ValidationError(`Máximo ${max} por petición`);
  return items.map((item, i) => {
    try {
      return build(item ?? {});
    } catch (e) {
      if (items.length > 1 && e instanceof ValidationError) throw new ValidationError(`${label} ${i + 1}: ${e.message}`);
      throw e;
    }
  });
}

/** Deja solo los campos permitidos; falla si no queda ninguno. */
export function pickEditable(changes, editable) {
  const patch = Object.fromEntries(Object.entries(changes ?? {}).filter(([k]) => editable.includes(k)));
  if (!Object.keys(patch).length) throw new ValidationError(`Nada que actualizar. Campos válidos: ${editable.join(', ')}`);
  return patch;
}
