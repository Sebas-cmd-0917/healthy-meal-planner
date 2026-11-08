import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

test('crea y lista recetas, y avisa a n8n', async () => {
  const { call, events, close } = await startServer();
  try {
    const created = await call('/recipes', 'POST', { name: 'Bowl de quinoa', calories: 450, tags: ['Vegano'] });
    assert.equal(created.status, 201);
    const { data } = created.body;
    assert.equal(data.name, 'Bowl de quinoa');
    assert.deepEqual(data.tags, ['vegano']);
    assert.ok(data.id);

    const list = await call('/recipes');
    assert.equal(list.body.data.length, 1);
    assert.equal(events[0]?.event, 'recipe.created');
  } finally {
    close();
  }
});

test('rechaza recetas sin nombre con 400', async () => {
  const { call, close } = await startServer();
  try {
    assert.equal((await call('/recipes', 'POST', { calories: 100 })).status, 400);
  } finally {
    close();
  }
});

test('responde 400 si el JSON está mal formado', async () => {
  const { close, server } = await startServer();
  try {
    const port = (server.address() as { port: number }).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/recipes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name": ',
    });
    assert.equal(res.status, 400);
  } finally {
    close();
  }
});
