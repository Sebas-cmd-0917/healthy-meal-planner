import { ValidationError } from '../shared/DomainError.js';
import { assertBoolean, assertDate, optionalId, optionalString } from '../shared/dateRange.js';
import type { ISODate, Untrusted } from '../shared/types.js';

export const BLOCK_KINDS = ['trabajo', 'gym', 'comida', 'otro'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

const DEFAULT_TITLES: Record<BlockKind, string> = { trabajo: 'Trabajo', gym: 'Gym', comida: 'Comida', otro: 'Actividad' };
const TIME_RE = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

const isKind = (value: unknown): value is BlockKind => BLOCK_KINDS.includes(value as BlockKind);

/** Acepta "8:00", "08:00" o "08:00:00" y devuelve "08:00". */
function normalizeTime(value: unknown, field: string): string {
  const m = typeof value === 'string' ? value.trim().match(TIME_RE) : null;
  const h = Number(m?.[1]);
  const min = Number(m?.[2]);
  if (!m || h > 23 || min > 59) throw new ValidationError(`La hora de ${field} debe tener formato HH:MM`);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function optionalNumber(value: unknown, field: string, { integer = false, min = 0 } = {}): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || (integer && !Number.isInteger(n))) {
    const kind = integer ? 'entero ' : '';
    throw new ValidationError(`${field} debe ser un número ${kind}${min > 0 ? `mayor o igual a ${min}` : 'positivo'}`);
  }
  return n;
}

export interface ExerciseProps {
  name: string;
  sets: number | null;
  /** Puede ser un rango: "8-10" */
  reps: string | null;
  weightKg: number | null;
  /** Descanso entre series, en segundos (90 = 1:30) */
  restSeconds: number | null;
  notes: string;
}

export class Exercise {
  readonly name: string;
  readonly sets: number | null;
  readonly reps: string | null;
  readonly weightKg: number | null;
  readonly restSeconds: number | null;
  readonly notes: string;

  constructor({ name, sets, reps, weightKg, restSeconds, notes }: Untrusted<ExerciseProps>) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('Cada ejercicio necesita un nombre');
    this.name = name.trim();
    this.sets = optionalNumber(sets, 'Las series', { integer: true, min: 1 });
    this.reps = reps === null || reps === undefined || reps === '' ? null : String(reps).trim();
    this.weightKg = optionalNumber(weightKg, 'El peso');
    this.restSeconds = optionalNumber(restSeconds, 'El descanso', { integer: true });
    this.notes = optionalString(notes, 'notes');
  }

  toJSON(): ExerciseProps {
    const { name, sets, reps, weightKg, restSeconds, notes } = this;
    return { name, sets, reps, weightKg, restSeconds, notes };
  }
}

export interface ScheduleBlockProps {
  id: string | null;
  date: ISODate;
  start: string;
  end: string;
  kind: BlockKind;
  title: string;
  notes: string;
  recipeId: string | null;
  exercises: ExerciseProps[];
  done: boolean;
  createdAt: string | null;
}

/**
 * Un bloque de la agenda: trabajo, gym, comida u otra actividad en un día y franja horaria.
 * Los bloques de gym pueden traer su rutina; los de comida, la receta enlazada.
 */
export class ScheduleBlock {
  readonly id: string | null;
  readonly date: ISODate;
  readonly start: string;
  readonly end: string;
  readonly kind: BlockKind;
  readonly title: string;
  readonly notes: string;
  readonly recipeId: string | null;
  readonly exercises: Exercise[];
  readonly done: boolean;
  readonly createdAt: string | null;

  constructor(props: Untrusted<ScheduleBlockProps>) {
    const { id, date, start, end, kind, title, notes, recipeId, exercises = [], done = false, createdAt } = props;
    if (!isKind(kind)) throw new ValidationError(`El tipo debe ser uno de: ${BLOCK_KINDS.join(', ')}`);

    this.id = optionalId(id);
    this.date = assertDate(date);
    this.start = normalizeTime(start, 'inicio');
    this.end = normalizeTime(end, 'fin');
    if (this.end <= this.start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

    this.kind = kind;
    this.title = typeof title === 'string' && title.trim() ? title.trim() : DEFAULT_TITLES[kind];
    this.notes = optionalString(notes, 'notes');

    if (recipeId && kind !== 'comida') throw new ValidationError('Solo los bloques de comida pueden tener receta');
    this.recipeId = optionalId(recipeId);

    if (!Array.isArray(exercises)) throw new ValidationError('Los ejercicios deben ser una lista');
    if (exercises.length && kind !== 'gym') throw new ValidationError('Solo los bloques de gym pueden tener ejercicios');
    this.exercises = exercises.map((e: unknown) => (e instanceof Exercise ? e : new Exercise((e ?? {}) as Untrusted<ExerciseProps>)));

    this.done = assertBoolean(done, 'done');
    this.createdAt = optionalId(createdAt);
  }

  /** Devuelve un bloque nuevo con los cambios aplicados (y validados). */
  with(changes: Untrusted<ScheduleBlockProps>): ScheduleBlock {
    return new ScheduleBlock({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON(): ScheduleBlockProps {
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
