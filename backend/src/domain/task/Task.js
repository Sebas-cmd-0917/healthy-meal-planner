import { ValidationError } from '../shared/DomainError.js';
import { assertDate } from '../shared/dateRange.js';

/** Una tarea del tablero semanal (ej. "Leer 30 min"), asignada a un día y marcable como hecha. */
export class Task {
  constructor({ id = null, date, title, notes = '', done = false, createdAt = null }) {
    if (!title || typeof title !== 'string' || !title.trim()) throw new ValidationError('La tarea necesita un título');
    if (title.trim().length > 120) throw new ValidationError('El título de la tarea es muy largo (máx. 120)');
    if (typeof done !== 'boolean') throw new ValidationError('"done" debe ser true o false');
    this.id = id;
    this.date = assertDate(date);
    this.title = title.trim();
    this.notes = notes ?? '';
    this.done = done;
    this.createdAt = createdAt;
  }

  with(changes) {
    return new Task({ ...this.toJSON(), ...changes, id: this.id, createdAt: this.createdAt });
  }

  toJSON() {
    return { id: this.id, date: this.date, title: this.title, notes: this.notes, done: this.done, createdAt: this.createdAt };
  }
}
