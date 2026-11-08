/**
 * Contrato de la API del backend (lo que devuelve en JSON).
 * Si cambia un tipo en backend/src/domain, se actualiza aquí.
 */

/** Fecha en formato AAAA-MM-DD */
export type ISODate = string;

export interface Recipe {
  id: string;
  name: string;
  description: string;
  calories: number | null;
  tags: string[];
  createdAt: string;
}
export type NewRecipe = Pick<Recipe, 'name' | 'calories' | 'tags'> & Partial<Pick<Recipe, 'description'>>;

export type BlockKind = 'trabajo' | 'gym' | 'comida' | 'otro';

export interface Exercise {
  name: string;
  sets: number | null;
  /** Puede ser un rango: "8-10" */
  reps: string | null;
  weightKg: number | null;
  /** Descanso entre series, en segundos */
  restSeconds: number | null;
  notes: string;
}

export interface ScheduleBlock {
  id: string;
  date: ISODate;
  /** "HH:MM" */
  start: string;
  end: string;
  kind: BlockKind;
  title: string;
  notes: string;
  recipeId: string | null;
  exercises: Exercise[];
  done: boolean;
  createdAt: string;
}
export type NewScheduleBlock = Pick<ScheduleBlock, 'date' | 'start' | 'end' | 'kind'> &
  Partial<Pick<ScheduleBlock, 'title' | 'notes' | 'recipeId' | 'done'>> & { exercises?: Partial<Exercise>[] };
export type ScheduleBlockChanges = Partial<Omit<NewScheduleBlock, 'exercises'>> & { exercises?: Partial<Exercise>[] };

export interface Task {
  id: string;
  date: ISODate;
  title: string;
  notes: string;
  done: boolean;
  createdAt: string;
}
export type NewTask = Pick<Task, 'date' | 'title'> & Partial<Pick<Task, 'notes' | 'done'>>;
export interface TaskList {
  items: Task[];
  summary: { total: number; done: number; pending: number };
}

export type ExpenseCategory =
  | 'comida' | 'mercado' | 'transporte' | 'hogar' | 'servicios' | 'salud' | 'entretenimiento' | 'compras' | 'otros';

export interface Expense {
  id: string;
  date: ISODate;
  /** Pesos colombianos, sin decimales */
  amount: number;
  category: ExpenseCategory;
  note: string;
  createdAt: string;
}
/** El backend acepta el monto como número o texto ("$15.000") */
export type NewExpense = Pick<Expense, 'date' | 'category'> & { amount: number | string; note?: string };
export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: { category: ExpenseCategory; total: number }[];
  byDay: { date: ISODate; total: number }[];
}
export interface ExpenseList {
  items: Expense[];
  summary: ExpenseSummary;
}
