/**
 * Puerto de salida para los gastos.
 *
 * @typedef {import('../../domain/expense/Expense.js').Expense} Expense
 *
 * @typedef {Object} ExpenseRepository
 * @property {(from: string, to: string) => Promise<Expense[]>} findBetween
 * @property {(id: string) => Promise<Expense|null>} findById
 * @property {(expenses: Expense[]) => Promise<Expense[]>} saveMany
 * @property {(id: string) => Promise<boolean>} delete
 */
export {};
