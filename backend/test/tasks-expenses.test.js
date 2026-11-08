import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { buildContainer } from '../src/infrastructure/container.js';

const env = { corsOrigin: ['http://localhost:5174'], persistence: 'memory', n8n: {} };

async function startServer() {
  const events = [];
  const container = buildContainer(env, {
    automationGateway: { publish: async (event, payload) => { events.push({ event, payload }); } },
  });
  const server = createApp({ env, container }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = 'GET', body) => {
    const res = await fetch(`${base}${path}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  };
  return { server, call, events };
}

test('tareas: crear la semana, marcar hecha y resumen de cumplimiento', async () => {
  const { server, call } = await startServer();
  try {
    const created = await call('/tasks', 'POST', { tasks: [
      { date: '2026-11-09', title: 'Leer 30 min' },
      { date: '2026-11-09', title: 'Configurar modo descanso del celular' },
      { date: '2026-11-11', title: 'Leer 30 min' },
    ] });
    assert.equal(created.status, 201);
    const [first] = created.body.data;
    assert.equal(first.done, false);

    const patched = await call(`/tasks/${first.id}`, 'PATCH', { done: true });
    assert.equal(patched.body.data.done, true);

    const { body } = await call('/tasks?from=2026-11-09&to=2026-11-15');
    assert.deepEqual(body.data.summary, { total: 3, done: 1, pending: 2 });

    assert.equal((await call('/tasks', 'POST', { date: '2026-11-09', title: '  ' })).status, 400);
    assert.equal((await call(`/tasks/${first.id}`, 'PATCH', { done: 'si' })).status, 400);
    assert.equal((await call(`/tasks/${first.id}`, 'DELETE')).status, 204);
    assert.equal((await call(`/tasks/${first.id}`, 'DELETE')).status, 404);
  } finally {
    server.close();
  }
});

test('gastos: montos en COP, totales por categoría y por día', async () => {
  const { server, call, events } = await startServer();
  try {
    const created = await call('/expenses', 'POST', [
      { date: '2026-11-09', amount: '$15.000', category: 'comida', note: 'Almuerzo' },
      { date: '2026-11-09', amount: 8500, category: 'transporte' },
      { date: '2026-11-10', amount: 120000, category: 'mercado' },
    ]);
    assert.equal(created.status, 201);
    assert.equal(created.body.data[0].amount, 15000);
    assert.equal(events[0].event, 'expense.created');

    const week = (await call('/expenses?from=2026-11-09&to=2026-11-15')).body.data;
    assert.equal(week.summary.total, 143500);
    assert.equal(week.summary.count, 3);
    assert.deepEqual(week.summary.byCategory[0], { category: 'mercado', total: 120000 });
    assert.deepEqual(week.summary.byDay, [{ date: '2026-11-09', total: 23500 }, { date: '2026-11-10', total: 120000 }]);

    const day = (await call('/expenses?from=2026-11-09&to=2026-11-09')).body.data;
    assert.equal(day.summary.total, 23500);

    for (const bad of [
      { date: '2026-11-09', amount: 0 },
      { date: '2026-11-09', amount: 12.5 },
      { date: '2026-11-09', amount: 1000, category: 'lujos' },
      { date: '2026-13-01', amount: 1000 },
    ]) {
      assert.equal((await call('/expenses', 'POST', bad)).status, 400, JSON.stringify(bad));
    }
    assert.equal((await call('/expenses?from=2026-01-01&to=2026-12-31')).status, 400);
  } finally {
    server.close();
  }
});

test('agenda: marcar bloque realizado y descanso entre series', async () => {
  const { server, call } = await startServer();
  try {
    const { body } = await call('/schedule', 'POST', {
      date: '2026-11-09', start: '18:00', end: '19:00', kind: 'gym', title: 'Pierna',
      exercises: [{ name: 'Sentadilla', sets: 4, reps: 8, weightKg: 60, restSeconds: 120 }],
    });
    const [gym] = body.data;
    assert.equal(gym.done, false);
    assert.equal(gym.exercises[0].restSeconds, 120);
    const patched = await call(`/schedule/${gym.id}`, 'PATCH', { done: true });
    assert.equal(patched.body.data.done, true);
    assert.equal(patched.body.data.exercises[0].restSeconds, 120);
  } finally {
    server.close();
  }
});
