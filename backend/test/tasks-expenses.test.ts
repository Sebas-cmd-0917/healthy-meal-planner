import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

test('tareas: crear la semana, marcar hecha y resumen de cumplimiento', async () => {
  const { call, close } = await startServer();
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
    close();
  }
});

test('gastos: montos en COP, totales por categoría y por día', async () => {
  const { call, events, close } = await startServer();
  try {
    const created = await call('/expenses', 'POST', [
      { date: '2026-11-09', amount: '$15.000', category: 'comida', note: 'Almuerzo' },
      { date: '2026-11-09', amount: 8500, category: 'transporte' },
      { date: '2026-11-10', amount: 120000, category: 'mercado' },
    ]);
    assert.equal(created.status, 201);
    assert.equal(created.body.data[0].amount, 15000);
    assert.equal(events[0]?.event, 'expense.created');

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
      { date: '2026-11-09' },
    ]) {
      assert.equal((await call('/expenses', 'POST', bad)).status, 400, JSON.stringify(bad));
    }
    assert.equal((await call('/expenses?from=2026-01-01&to=2026-12-31')).status, 400);
  } finally {
    close();
  }
});
