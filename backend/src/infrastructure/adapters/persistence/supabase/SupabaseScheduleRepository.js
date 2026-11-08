import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { ScheduleBlock } from '../../../../domain/schedule/ScheduleBlock.js';

const BLOCKS = 'schedule_blocks';
const EXERCISES = 'workout_exercises';
const SELECT = `*, ${EXERCISES}(*)`;
// Postgres rechaza ids que no son UUID con un error 500; los tratamos como "no existe"
const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const toDomain = (row) => new ScheduleBlock({
  id: row.id,
  date: row.date,
  start: row.start_time,
  end: row.end_time,
  kind: row.kind,
  title: row.title,
  notes: row.notes ?? '',
  recipeId: row.recipe_id,
  exercises: [...(row[EXERCISES] ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((e) => ({
      name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weight_kg, restSeconds: e.rest_seconds, notes: e.notes ?? '',
    })),
  done: row.done ?? false,
  createdAt: row.created_at,
});

/** @implements {import('../../../../application/ports/ScheduleRepository.js').ScheduleRepository} */
export class SupabaseScheduleRepository {
  constructor({ url, secretKey }) {
    this.client = createClient(url, secretKey, { auth: { persistSession: false } });
  }

  async findBetween(from, to) {
    const { data, error } = await this.client
      .from(BLOCKS)
      .select(SELECT)
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time');
    if (error) throw error;
    return data.map(toDomain);
  }

  async findById(id) {
    if (!isUuid(id)) return null;
    const { data, error } = await this.client.from(BLOCKS).select(SELECT).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async saveMany(blocks) {
    // Los ids se generan aquí para poder enlazar los ejercicios en la misma operación
    const withIds = blocks.map((b) => ({ block: b, id: b.id ?? randomUUID() }));

    const rows = withIds.map(({ block: b, id }) => ({
      id,
      date: b.date,
      start_time: b.start,
      end_time: b.end,
      kind: b.kind,
      title: b.title,
      notes: b.notes,
      recipe_id: b.recipeId,
      done: b.done,
    }));
    const { error: upsertError } = await this.client.from(BLOCKS).upsert(rows);
    if (upsertError) throw upsertError;

    // La rutina se reemplaza completa en cada guardado
    const ids = withIds.map((x) => x.id);
    const { error: deleteError } = await this.client.from(EXERCISES).delete().in('block_id', ids);
    if (deleteError) throw deleteError;

    const exerciseRows = withIds.flatMap(({ block, id }) =>
      block.exercises.map((e, position) => ({
        block_id: id,
        position,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        weight_kg: e.weightKg,
        rest_seconds: e.restSeconds,
        notes: e.notes,
      })),
    );
    if (exerciseRows.length) {
      const { error } = await this.client.from(EXERCISES).insert(exerciseRows);
      if (error) throw error;
    }

    const { data, error } = await this.client.from(BLOCKS).select(SELECT).in('id', ids);
    if (error) throw error;
    const byId = new Map(data.map((row) => [row.id, toDomain(row)]));
    return ids.map((id) => byId.get(id));
  }

  async delete(id) {
    if (!isUuid(id)) return false;
    // Los ejercicios se borran en cascada (ON DELETE CASCADE)
    const { data, error } = await this.client.from(BLOCKS).delete().eq('id', id).select('id');
    if (error) throw error;
    return data.length > 0;
  }
}
