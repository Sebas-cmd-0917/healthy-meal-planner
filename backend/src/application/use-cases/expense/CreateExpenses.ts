import { Expense } from '../../../domain/expense/Expense.js';
import type { AutomationGateway } from '../../ports/AutomationGateway.js';
import type { ExpenseRepository } from '../../ports/repositories.js';
import { buildAll } from '../shared/batch.js';

export class CreateExpenses {
  constructor(private readonly deps: { expenseRepository: ExpenseRepository; automationGateway: AutomationGateway }) {}

  async execute(input: unknown): Promise<Expense[]> {
    const expenses = buildAll(input, (item) => new Expense({ ...item, id: null, createdAt: null }), { label: 'Gasto' });
    const saved = await this.deps.expenseRepository.saveMany(expenses);
    await this.deps.automationGateway.publish('expense.created', { expenses: saved.map((e) => e.toJSON()) }).catch(() => {});
    return saved;
  }
}
