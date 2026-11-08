import { Task } from '../../../../domain/task/Task.js';
import { SupabaseDatedRepository } from './SupabaseDatedRepository.js';

/** @implements {import('../../../../application/ports/TaskRepository.js').TaskRepository} */
export class SupabaseTaskRepository extends SupabaseDatedRepository {
  constructor(config) {
    super(config, {
      table: 'tasks',
      toDomain: (row) => new Task({
        id: row.id, date: row.date, title: row.title, notes: row.notes ?? '', done: row.done, createdAt: row.created_at,
      }),
      toRow: (t) => ({ date: t.date, title: t.title, notes: t.notes, done: t.done }),
    });
  }
}
