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

export const api = {
  health: () => request('/health'),
  recipes: {
    list: () => request('/recipes'),
    create: (recipe) => request('/recipes', { method: 'POST', body: JSON.stringify(recipe) }),
  },
};
