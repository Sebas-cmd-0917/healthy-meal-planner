import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const persistence = process.env.PERSISTENCE ?? 'memory';

if (persistence === 'supabase' && process.env.SUPABASE_SECRET_KEY?.startsWith('sb_publishable_')) {
  throw new Error(
    'SUPABASE_SECRET_KEY tiene la llave pública (sb_publishable_...). ' +
      'El backend necesita la secret key (sb_secret_...): Supabase > Project Settings > API Keys.',
  );
}

export const env = {
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
