import type { Recipe } from '../../domain/recipe/Recipe.js';
import type { ScheduleBlock } from '../../domain/schedule/ScheduleBlock.js';
import type { Task } from '../../domain/task/Task.js';
import type { Expense } from '../../domain/expense/Expense.js';
import type { ISODate } from '../../domain/shared/types.js';

/** Puerto de salida para recetas. */
export interface RecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  save(recipe: Recipe): Promise<Recipe>;
}

/**
 * Repositorio de entidades con fecha: la agenda, las tareas y los gastos
 * comparten el mismo contrato.
 */
export interface DatedRepository<T> {
  /** Entre dos fechas, ambas incluidas, en orden cronológico */
  findBetween(from: ISODate, to: ISODate): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  /** Crea o actualiza */
  saveMany(items: T[]): Promise<T[]>;
  /** true si existía */
  delete(id: string): Promise<boolean>;
}

export type ScheduleRepository = DatedRepository<ScheduleBlock>;
export type TaskRepository = DatedRepository<Task>;
export type ExpenseRepository = DatedRepository<Expense>;
