import { ValidationError } from '../shared/DomainError.js';
import { assertBoolean, assertDate, optionalId, optionalString } from '../shared/dateRange.js';
import type { ISODate, Untrusted } from '../shared/types.js';

export interface TaskProps {
  id: string | null;
  date: ISODate;
  title: string;
  notes: string;
  done: boolean;
  createdAt: string | null;
}

/** Una tarea del tablero semanal (ej. "Leer 30 min"), asignada a un día y marcable como hecha. */
export class Task {
  readonly id: string | null;
  readonly date: ISODate;
  readonly title: string;
  readonly notes: string;
  readonly done: boolean;
  readonly createdAt: string | null;

  constructor({ id, date, title, notes, done = false, createdAt }: Untrusted<TaskProps>) {
    if (typeof title !== 'string' || !title.trim()) throw new ValidationError('La tarea necesita un título');
    if (title.trim().length > 120) throw new ValidationError('El título de la tarea es muy largo (máx. 120)');
    this.id = optionalId(id);
    this.date = assertDate(date);
    this.title = title.trim();
    this.notes = optionalString(notes, 'notes');
    this.done = assertBoolean(done, 'done');
    this.createdAt = optionalId(createdAt);
  }

  with(changes: Untrusted<TaskProps>): Task {
    return new Task({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON(): TaskProps {
    const { id, date, title, notes, done, createdAt } = this;
    return { id, date, title, notes, done, createdAt };
  }
}
