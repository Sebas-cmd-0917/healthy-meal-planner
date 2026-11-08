import type {
  Expense, ExpenseList, NewExpense, NewRecipe, NewScheduleBlock, NewTask, Recipe,
  ScheduleBlock, ScheduleBlockChanges, Task, TaskList, ISODate,
} from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Error de red o de la API, con un mensaje listo para mostrar. */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError('No pudimos conectar con el servidor.');
  }
  const body: { data?: T; error?: { message?: string } } = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error?.message ?? `Error ${res.status}`, res.status);
  return body.data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Recursos con fecha que siguen el mismo contrato (agenda, tareas, gastos). */
function crud<Item, List, New, Changes>(path: string, batchKey: string) {
  return {
    list: (from: ISODate, to: ISODate) => request<List>(`${path}?from=${from}&to=${to}`),
    create: (items: New[]) => request<Item[]>(path, json('POST', { [batchKey]: items })),
    update: (id: string, changes: Changes) => request<Item>(`${path}/${id}`, json('PATCH', changes)),
    remove: (id: string) => request<void>(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  recipes: {
    list: () => request<Recipe[]>('/recipes'),
    create: (recipe: NewRecipe) => request<Recipe>('/recipes', json('POST', recipe)),
  },
  schedule: crud<ScheduleBlock, ScheduleBlock[], NewScheduleBlock, ScheduleBlockChanges>('/schedule', 'blocks'),
  tasks: crud<Task, TaskList, NewTask, Partial<NewTask>>('/tasks', 'tasks'),
  expenses: crud<Expense, ExpenseList, NewExpense, Partial<NewExpense>>('/expenses', 'expenses'),
};

/** Mensaje legible de cualquier error capturado. */
export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
