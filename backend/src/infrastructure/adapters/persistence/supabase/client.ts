import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '../../../config/env.js';

export const createSupabase = ({ url, secretKey }: SupabaseConfig): SupabaseClient =>
  createClient(url, secretKey, { auth: { persistSession: false } });

// Postgres rechaza ids que no son UUID con un error 500; los tratamos como "no existe"
export const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
