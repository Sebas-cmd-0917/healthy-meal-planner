/**
 * Puerto de salida para las tareas del tablero semanal.
 *
 * @typedef {import('../../domain/task/Task.js').Task} Task
 *
 * @typedef {Object} TaskRepository
 * @property {(from: string, to: string) => Promise<Task[]>} findBetween
 * @property {(id: string) => Promise<Task|null>} findById
 * @property {(tasks: Task[]) => Promise<Task[]>} saveMany
 * @property {(id: string) => Promise<boolean>} delete
 */
export {};
