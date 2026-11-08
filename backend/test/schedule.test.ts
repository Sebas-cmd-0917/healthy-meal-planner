import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

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
  const { call, events, close } = await startServer();
  try {
    const res = await call('/schedule', 'POST', { blocks: week });
    assert.equal(res.status, 201);
    const { data } = res.body;
    assert.equal(data.length, 3);
    assert.equal(data[0].start, '08:00');
    assert.equal(data[0].title, 'Trabajo');
    assert.deepEqual(data[1].exercises[0], { name: 'Sentadilla', sets: 4, reps: '8-10', weightKg: 60, restSeconds: null, notes: '' });
    assert.equal(events[0]?.event, 'schedule.created');

    const list = await call('/schedule?from=2026-11-09&to=2026-11-15');
    assert.deepEqual(list.body.data.map((b: { title: string }) => b.title), ['Trabajo', 'Pierna', 'Almuerzo']);

    const onlyMonday = await call('/schedule?from=2026-11-09&to=2026-11-09');
    assert.equal(onlyMonday.body.data.length, 2);
  } finally {
    close();
  }
});

test('si un bloque es inválido no se guarda ninguno', async () => {
  const { call, close } = await startServer();
  try {
    const res = await call('/schedule', 'POST', [week[0], { date: '2026-11-10', start: '19:00', end: '18:00', kind: 'gym' }]);
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /Bloque 2/);
    const list = await call('/schedule?from=2026-11-09&to=2026-11-15');
    assert.equal(list.body.data.length, 0);
  } finally {
    close();
  }
});

test('valida reglas del dominio', async () => {
  const { call, close } = await startServer();
  try {
    const cases = [
      { date: '2026-02-30', start: '08:00', end: '09:00', kind: 'otro' },
      { date: '2026-11-09', start: '25:00', end: '26:00', kind: 'otro' },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'siesta' },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'trabajo', exercises: [{ name: 'Curl' }] },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'gym', exercises: [{ name: 'Curl', sets: 0 }] },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'comida', recipeId: 'no-existe' },
      { date: '2026-11-09', start: '08:00', end: '09:00', kind: 'otro', done: 'si' },
    ];
    for (const block of cases) {
      assert.equal((await call('/schedule', 'POST', block)).status, 400, JSON.stringify(block));
    }
    assert.equal((await call('/schedule?from=2026-11-15&to=2026-11-09')).status, 400);
    assert.equal((await call('/schedule')).status, 400);
  } finally {
    close();
  }
});

test('actualiza, marca realizado y borra un bloque', async () => {
  const { call, close } = await startServer();
  try {
    const { body: { data: [gym] } } = await call('/schedule', 'POST', week[1]);

    const patched = await call(`/schedule/${gym.id}`, 'PATCH', {
      start: '18:30', done: true, exercises: [{ name: 'Peso muerto', sets: 3, reps: 5, weightKg: 80, restSeconds: 150 }],
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.start, '18:30');
    assert.equal(patched.body.data.done, true);
    assert.equal(patched.body.data.exercises[0].restSeconds, 150);
    assert.equal(patched.body.data.title, 'Pierna');

    assert.equal((await call(`/schedule/${gym.id}`, 'PATCH', { kind: 'comida' })).status, 400);
    assert.equal((await call(`/schedule/${gym.id}`, 'PATCH', { color: 'rojo' })).status, 400);
    assert.equal((await call(`/schedule/${gym.id}`, 'DELETE')).status, 204);
    assert.equal((await call(`/schedule/${gym.id}`, 'DELETE')).status, 404);
    assert.equal((await call('/schedule/no-existe', 'PATCH', { title: 'x' })).status, 404);
  } finally {
    close();
  }
});
