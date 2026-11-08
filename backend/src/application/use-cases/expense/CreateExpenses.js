import { Expense } from '../../../domain/expense/Expense.js';
import { buildAll } from '../shared/batch.js';

export class CreateExpenses {
  constructor({ expenseRepository, automationGateway }) {
    this.expenseRepository = expenseRepository;
    this.automationGateway = automationGateway;
  }

  async execute(input) {
    const expenses = buildAll(input, (item) => new Expense({ ...item, id: null, createdAt: null }), { label: 'Gasto' });
    const saved = await this.expenseRepository.saveMany(expenses);
    await this.automationGateway.publish('expense.created', { expenses: saved.map((e) => e.toJSON()) }).catch(() => {});
    return saved;
  }
}
