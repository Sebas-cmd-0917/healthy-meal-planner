import { createClient } from '@supabase/supabase-js';

const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Repositorio de Supabase para entidades con fecha (tareas, gastos).
 * Cada subclase indica la tabla y cómo traducir entre fila y entidad.
 */
export class SupabaseDatedRepository {
  constructor({ url, secretKey }, { table, toDomain, toRow }) {
    this.client = createClient(url, secretKey, { auth: { persistSession: false } });
    this.table = table;
    this.toDomain = toDomain;
    this.toRow = toRow;
  }

  async findBetween(from, to) {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('created_at');
    if (error) throw error;
    return data.map(this.toDomain);
  }

  async findById(id) {
    if (!isUuid(id)) return null;
    const { data, error } = await this.client.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.toDomain(data) : null;
  }

  async saveMany(entities) {
    const rows = entities.map((e) => {
      const row = this.toRow(e);
      return e.id ? { id: e.id, ...row } : row;
    });
    const { data, error } = await this.client.from(this.table).upsert(rows, { defaultToNull: false }).select('*');
    if (error) throw error;
    return data.map(this.toDomain);
  }

  async delete(id) {
    if (!isUuid(id)) return false;
    const { data, error } = await this.client.from(this.table).delete().eq('id', id).select('id');
    if (error) throw error;
    return data.length > 0;
  }
}
