import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { buildContainer } from '../src/infrastructure/container.js';
import { InMemoryRecipeRepository } from '../src/infrastructure/adapters/persistence/memory/InMemoryRecipeRepository.js';
import { InMemoryScheduleRepository } from '../src/infrastructure/adapters/persistence/memory/InMemoryScheduleRepository.js';

const env = { corsOrigin: ['http://localhost:5174'], persistence: 'memory', n8n: {} };

async function startServer() {
  const events = [];
  const container = buildContainer(env, {
    recipeRepository: new InMemoryRecipeRepository(),
    scheduleRepository: new InMemoryScheduleRepository(),
    automationGateway: { publish: async (event, payload) => { events.push({ event, payload }); } },
  });
  const server = createApp({ env, container }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = (path, method = 'GET', body) => fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { server, call, events };
}

const week = [
  { date: '2026-11-09', start: '8:00', end: '17:00', kind: 'trabajo' },
  {
    date: '2026-11-09', start: '18:00', end: '19:30', kind: 'gym', title: 'Pierna',
    exercises: [
      { name: 'Sentadilla', sets: 4, reps: '8-10', weightKg: 60 },
      { name: 'Prensa', sets: 3, reps: 12 },
    ],
  },
  { date: '2026-11-10', start: '12:30', end: '13:15', kind: 'comida', title: 'Almuerzo' },
];

test('crea la semana en una sola petición y la lista ordenada', async () => {
  const { server, call, events } = await startServer();
  try {
    const res = await call('/schedule', 'POST', { blocks: week });
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.equal(data.length, 3);
    assert.equal(data[0].start, '08:00');
    assert.equal(data[0].title, 'Trabajo');
    assert.deepEqual(data[1].exercises[0], { name: 'Sentadilla', sets: 4, reps: '8-10', weightKg: 60, restSeconds: null, notes: '' });
    assert.equal(events[0].event, 'schedule.created');

    const list = await (await call('/schedule?from=2026-11-09&to=2026-11-15')).json();
    assert.deepEqual(list.data.map((b) => b.title), ['Trabajo', 'Pierna', 'Almuerzo']);

    const onlyMonday = await (await call('/schedule?from=2026-11-09&to=2026-11-09')).json();
    assert.equal(onlyMonday.data.length, 2);
  } finally {
    server.close();
  }
});

test('si un bloque es inválido no se guarda ninguno', async () => {
  const { server, call } = await startServer();
  try {
    const res = await call('/schedule', 'POST', [
      week[0],
      { date: '2026-11-10', start: '19:00', end: '18:00', kind: 'gym' },
    ]);
    assert.equal(res.status, 400);
    const { error } = await res.json();
    assert.match(error.message, /Bloque 2/);
    const list = await (await call('/schedule?from=2026-11-09&to=2026-11-15')).json();
    assert.equal(list.data.length, 0);
  } finally {
    server.close();
  }
});

test('valida reglas del dominio', async () => {
  const { server, call } = await startServer();
  try {
    const cases = [
      { date: '2026-02-30', start: '08:00', end: '09:00', kind: 'otro' },
      { date: '2026-11-09', start: '25:00', end: '26:00', kind: 'otro' },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'siesta' },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'trabajo', exercises: [{ name: 'Curl' }] },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'gym', exercises: [{ name: 'Curl', sets: 0 }] },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'comida', recipeId: 'no-existe' },
    ];
    for (const block of cases) {
      const res = await call('/schedule', 'POST', block);
      assert.equal(res.status, 400, JSON.stringify(block));
    }
    const badRange = await call('/schedule?from=2026-11-15&to=2026-11-09');
    assert.equal(badRange.status, 400);
  } finally {
    server.close();
  }
});

test('actualiza y borra un bloque', async () => {
  const { server, call } = await startServer();
  try {
    const { data: [gym] } = await (await call('/schedule', 'POST', week[1])).json();

    const patched = await call(`/schedule/${gym.id}`, 'PATCH', { start: '18:30', exercises: [{ name: 'Peso muerto', sets: 3, reps: 5, weightKg: 80 }] });
    assert.equal(patched.status, 200);
    const { data } = await patched.json();
    assert.equal(data.start, '18:30');
    assert.equal(data.exercises.length, 1);
    assert.equal(data.title, 'Pierna');

    assert.equal((await call(`/schedule/${gym.id}`, 'PATCH', { kind: 'comida' })).status, 400);
    assert.equal((await call(`/schedule/${gym.id}`, 'DELETE')).status, 204);
    assert.equal((await call(`/schedule/${gym.id}`, 'DELETE')).status, 404);
    assert.equal((await call('/schedule/no-existe', 'PATCH', { title: 'x' })).status, 404);
  } finally {
    server.close();
  }
});
