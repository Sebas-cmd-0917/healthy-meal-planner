const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `Error ${res.status}`);
  return body.data;
}

/** Recursos con fecha que siguen el mismo contrato (tareas, gastos). */
const crud = (path, batchKey) => ({
  list: (from, to) => request(`${path}?from=${from}&to=${to}`),
  create: (items) => request(path, { method: 'POST', body: JSON.stringify({ [batchKey]: items }) }),
  update: (id, changes) => request(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
});

export const api = {
  health: () => request('/health'),
  recipes: {
    list: () => request('/recipes'),
    create: (recipe) => request('/recipes', { method: 'POST', body: JSON.stringify(recipe) }),
  },
  schedule: {
    list: (from, to) => request(`/schedule?from=${from}&to=${to}`),
    create: (blocks) => request('/schedule', { method: 'POST', body: JSON.stringify({ blocks }) }),
    update: (id, changes) => request(`/schedule/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
    remove: (id) => request(`/schedule/${id}`, { method: 'DELETE' }),
  },
  tasks: crud('/tasks', 'tasks'),
  expenses: crud('/expenses', 'expenses'),
};
