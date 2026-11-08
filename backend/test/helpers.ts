import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { buildContainer, type Overrides } from '../src/infrastructure/container.js';

export interface Published { event: string; payload: unknown }

/** Levanta la API en memoria en un puerto libre y devuelve un cliente HTTP mínimo. */
export async function startServer(overrides: Overrides = {}) {
  const events: Published[] = [];
  const container = buildContainer(
    { supabase: null, n8n: { webhookBaseUrl: null, webhookSecret: null } },
    { automationGateway: { publish: async (event, payload) => { events.push({ event, payload }); } }, ...overrides },
  );
  const server = createApp({ env: { corsOrigin: ['http://localhost:5174'] }, container }).listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async <T = any>(path: string, method = 'GET', body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: (res.status === 204 ? null : await res.json()) as T };
  };

  return { server, call, events, close: () => server.close() };
}
