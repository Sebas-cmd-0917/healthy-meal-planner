import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ScheduleBlock, type BlockKind } from '../../../../domain/schedule/ScheduleBlock.js';
import type { ScheduleRepository } from '../../../../application/ports/repositories.js';
import type { SupabaseConfig } from '../../../config/env.js';
import { createSupabase, isUuid } from './client.js';

const BLOCKS = 'schedule_blocks';
const EXERCISES = 'workout_exercises';
const SELECT = `*, ${EXERCISES}(*)`;

interface ExerciseRow {
  position: number;
  name: string;
  sets: number | null;
  reps: string | null;
  weight_kg: number | string | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface BlockRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  kind: BlockKind;
  title: string;
  notes: string | null;
  recipe_id: string | null;
  done: boolean | null;
  created_at: string;
  [EXERCISES]?: ExerciseRow[];
}

const toDomain = (row: BlockRow) => new ScheduleBlock({
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
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      weightKg: e.weight_kg === null ? null : Number(e.weight_kg), // numeric llega como string
      restSeconds: e.rest_seconds,
      notes: e.notes ?? '',
    })),
  done: row.done ?? false,
  createdAt: row.created_at,
});

export class SupabaseScheduleRepository implements ScheduleRepository {
  private readonly client: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.client = createSupabase(config);
  }

  async findBetween(from: string, to: string): Promise<ScheduleBlock[]> {
    const { data, error } = await this.client
      .from(BLOCKS)
      .select(SELECT)
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time');
    if (error) throw error;
    return (data as BlockRow[]).map(toDomain);
  }

  async findById(id: string): Promise<ScheduleBlock | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.client.from(BLOCKS).select(SELECT).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as BlockRow) : null;
  }

  async saveMany(blocks: ScheduleBlock[]): Promise<ScheduleBlock[]> {
    // Los ids se generan aquí para poder enlazar los ejercicios en la misma operación
    const withIds = blocks.map((block) => ({ block, id: block.id ?? randomUUID() }));

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
    const byId = new Map((data as BlockRow[]).map((row) => [row.id, toDomain(row)]));
    return ids.map((id) => byId.get(id)!);
  }

  async delete(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    // Los ejercicios se borran en cascada (ON DELETE CASCADE)
    const { data, error } = await this.client.from(BLOCKS).delete().eq('id', id).select('id');
    if (error) throw error;
    return data.length > 0;
  }
}
