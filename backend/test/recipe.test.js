import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { buildContainer } from '../src/infrastructure/container.js';
import { InMemoryRecipeRepository } from '../src/infrastructure/adapters/persistence/memory/InMemoryRecipeRepository.js';

const env = { corsOrigin: ['http://localhost:5173'], persistence: 'memory', n8n: {} };

async function startServer() {
  const events = [];
  const container = buildContainer(env, {
    recipeRepository: new InMemoryRecipeRepository(),
    automationGateway: { publish: async (event, payload) => { events.push({ event, payload }); } },
  });
  const server = createApp({ env, container }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  return { server, base, events };
}

test('crea y lista recetas, y avisa a n8n', async () => {
  const { server, base, events } = await startServer();
  try {
    const created = await fetch(`${base}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bowl de quinoa', calories: 450, tags: ['Vegano'] }),
    });
    assert.equal(created.status, 201);
    const { data } = await created.json();
    assert.equal(data.name, 'Bowl de quinoa');
    assert.deepEqual(data.tags, ['vegano']);
    assert.ok(data.id);

    const list = await (await fetch(`${base}/recipes`)).json();
    assert.equal(list.data.length, 1);
    assert.equal(events[0].event, 'recipe.created');
  } finally {
    server.close();
  }
});

test('rechaza recetas sin nombre con 400', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calories: 100 }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
