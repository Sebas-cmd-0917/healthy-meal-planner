import 'dotenv/config';

export interface SupabaseConfig {
  url: string;
  secretKey: string;
}

export interface Env {
  port: number;
  nodeEnv: string;
  corsOrigin: string[];
  persistence: 'memory' | 'supabase';
  supabase: SupabaseConfig | null;
  n8n: { webhookBaseUrl: string | null; webhookSecret: string | null };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const rawPersistence = process.env.PERSISTENCE ?? 'memory';
if (rawPersistence !== 'memory' && rawPersistence !== 'supabase') {
  throw new Error(`PERSISTENCE debe ser "memory" o "supabase" (llegó "${rawPersistence}")`);
}
const persistence: Env['persistence'] = rawPersistence;

if (persistence === 'supabase' && process.env.SUPABASE_SECRET_KEY?.startsWith('sb_publishable_')) {
  throw new Error(
    'SUPABASE_SECRET_KEY tiene la llave pública (sb_publishable_...). ' +
      'El backend necesita la secret key (sb_secret_...): Supabase > Project Settings > API Keys.',
  );
}

export const env: Env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5174').split(',').map((s) => s.trim()),
  persistence,
  supabase: persistence === 'supabase'
    ? { url: required('SUPABASE_URL'), secretKey: required('SUPABASE_SECRET_KEY') }
    : null,
  n8n: {
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || null,
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || null,
  },
};
