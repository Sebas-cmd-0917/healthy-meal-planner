import { Task } from '../../../../domain/task/Task.js';
import type { SupabaseConfig } from '../../../config/env.js';
import { SupabaseDatedRepository } from './SupabaseDatedRepository.js';

interface TaskRow {
  id: string;
  date: string;
  title: string;
  notes: string | null;
  done: boolean;
  created_at: string;
}

export class SupabaseTaskRepository extends SupabaseDatedRepository<Task, TaskRow> {
  constructor(config: SupabaseConfig) {
    super(config, {
      table: 'tasks',
      toDomain: (row) => new Task({
        id: row.id, date: row.date, title: row.title, notes: row.notes ?? '', done: row.done, createdAt: row.created_at,
      }),
      toRow: (t) => ({ date: t.date, title: t.title, notes: t.notes, done: t.done }),
    });
  }
}
