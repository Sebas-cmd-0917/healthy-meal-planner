import { ValidationError } from '../shared/DomainError.js';
import { assertDate } from '../shared/dateRange.js';

export const BLOCK_KINDS = ['trabajo', 'gym', 'comida', 'otro'];

const DEFAULT_TITLES = { trabajo: 'Trabajo', gym: 'Gym', comida: 'Comida', otro: 'Actividad' };
const TIME_RE = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

export { assertDate };

/** Acepta "8:00", "08:00" o "08:00:00" y devuelve "08:00". */
function normalizeTime(value, field) {
  const m = typeof value === 'string' ? value.trim().match(TIME_RE) : null;
  const h = m ? Number(m[1]) : NaN;
  const min = m ? Number(m[2]) : NaN;
  if (!m || h > 23 || min > 59) throw new ValidationError(`La hora de ${field} debe tener formato HH:MM`);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const optionalNumber = (value, field, { integer = false, min = 0 } = {}) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || (integer && !Number.isInteger(n))) {
    throw new ValidationError(`${field} debe ser un número ${integer ? 'entero ' : ''}${min > 0 ? `mayor o igual a ${min}` : 'positivo'}`);
  }
  return n;
};

export class Exercise {
  constructor({ name, sets = null, reps = null, weightKg = null, restSeconds = null, notes = '' }) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Cada ejercicio necesita un nombre');
    }
    this.name = name.trim();
    this.sets = optionalNumber(sets, 'Las series', { integer: true, min: 1 });
    // Las repeticiones pueden ser un rango: "8-10"
    this.reps = reps === null || reps === undefined || reps === '' ? null : String(reps).trim();
    this.weightKg = optionalNumber(weightKg, 'El peso');
    // Descanso entre series, en segundos (90 = 1:30)
    this.restSeconds = optionalNumber(restSeconds, 'El descanso', { integer: true });
    this.notes = notes ?? '';
  }

  toJSON() {
    return {
      name: this.name, sets: this.sets, reps: this.reps, weightKg: this.weightKg, restSeconds: this.restSeconds, notes: this.notes,
    };
  }
}

/**
 * Un bloque de la agenda: trabajo, gym, comida u otra actividad en un día y franja horaria.
 * Los bloques de gym pueden traer su rutina; los de comida, la receta enlazada.
 */
export class ScheduleBlock {
  constructor({
    id = null, date, start, end, kind, title, notes = '', recipeId = null, exercises = [], done = false, createdAt = null,
  }) {
    if (!BLOCK_KINDS.includes(kind)) {
      throw new ValidationError(`El tipo debe ser uno de: ${BLOCK_KINDS.join(', ')}`);
    }
    this.id = id;
    this.date = assertDate(date);
    this.start = normalizeTime(start, 'inicio');
    this.end = normalizeTime(end, 'fin');
    if (this.end <= this.start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

    this.kind = kind;
    this.title = (typeof title === 'string' && title.trim()) ? title.trim() : DEFAULT_TITLES[kind];
    this.notes = notes ?? '';

    if (recipeId && kind !== 'comida') throw new ValidationError('Solo los bloques de comida pueden tener receta');
    this.recipeId = recipeId || null;

    if (!Array.isArray(exercises)) throw new ValidationError('Los ejercicios deben ser una lista');
    if (exercises.length && kind !== 'gym') throw new ValidationError('Solo los bloques de gym pueden tener ejercicios');
    this.exercises = exercises.map((e) => (e instanceof Exercise ? e : new Exercise(e)));

    if (typeof done !== 'boolean') throw new ValidationError('"done" debe ser true o false');
    this.done = done;

    this.createdAt = createdAt;
  }

  /** Devuelve un bloque nuevo con los cambios aplicados (y validados). */
  with(changes) {
    return new ScheduleBlock({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      start: this.start,
      end: this.end,
      kind: this.kind,
      title: this.title,
      notes: this.notes,
      recipeId: this.recipeId,
      exercises: this.exercises.map((e) => e.toJSON()),
      done: this.done,
      createdAt: this.createdAt,
    };
  }
}
