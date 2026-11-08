import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatedRepository } from '../../../../application/ports/repositories.js';
import type { SupabaseConfig } from '../../../config/env.js';
import { createSupabase, isUuid } from './client.js';

interface Mapping<T, Row> {
  table: string;
  toDomain: (row: Row) => T;
  toRow: (entity: T) => Record<string, unknown>;
}

/**
 * Repositorio de Supabase para entidades con fecha (tareas, gastos).
 * Cada subclase indica la tabla y cómo traducir entre fila y entidad.
 */
export class SupabaseDatedRepository<T extends { readonly id: string | null }, Row> implements DatedRepository<T> {
  protected readonly client: SupabaseClient;

  constructor(config: SupabaseConfig, private readonly mapping: Mapping<T, Row>) {
    this.client = createSupabase(config);
  }

  async findBetween(from: string, to: string): Promise<T[]> {
    const { data, error } = await this.client
      .from(this.mapping.table)
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('created_at');
    if (error) throw error;
    return (data as Row[]).map(this.mapping.toDomain);
  }

  async findById(id: string): Promise<T | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.client.from(this.mapping.table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapping.toDomain(data as Row) : null;
  }

  async saveMany(entities: T[]): Promise<T[]> {
    const rows = entities.map((e) => (e.id ? { id: e.id, ...this.mapping.toRow(e) } : this.mapping.toRow(e)));
    const { data, error } = await this.client.from(this.mapping.table).upsert(rows, { defaultToNull: false }).select('*');
    if (error) throw error;
    return (data as Row[]).map(this.mapping.toDomain);
  }

  async delete(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const { data, error } = await this.client.from(this.mapping.table).delete().eq('id', id).select('id');
    if (error) throw error;
    return data.length > 0;
  }
}
