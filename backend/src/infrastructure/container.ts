import type { Env } from './config/env.js';
import type { AutomationGateway } from '../application/ports/AutomationGateway.js';
import type { ExpenseRepository, RecipeRepository, ScheduleRepository, TaskRepository } from '../application/ports/repositories.js';
import { InMemoryRecipeRepository } from './adapters/persistence/memory/InMemoryRecipeRepository.js';
import { InMemoryDatedRepository } from './adapters/persistence/memory/InMemoryDatedRepository.js';
import { SupabaseRecipeRepository } from './adapters/persistence/supabase/SupabaseRecipeRepository.js';
import { SupabaseScheduleRepository } from './adapters/persistence/supabase/SupabaseScheduleRepository.js';
import { SupabaseTaskRepository } from './adapters/persistence/supabase/SupabaseTaskRepository.js';
import { SupabaseExpenseRepository } from './adapters/persistence/supabase/SupabaseExpenseRepository.js';
import { N8nWebhookGateway } from './adapters/automation/n8n/N8nWebhookGateway.js';
import { ScheduleBlock } from '../domain/schedule/ScheduleBlock.js';
import { Task } from '../domain/task/Task.js';
import { Expense } from '../domain/expense/Expense.js';
import { ListRecipes } from '../application/use-cases/recipe/ListRecipes.js';
import { CreateRecipe } from '../application/use-cases/recipe/CreateRecipe.js';
import { ListSchedule } from '../application/use-cases/schedule/ListSchedule.js';
import { CreateBlocks } from '../application/use-cases/schedule/CreateBlocks.js';
import { UpdateBlock } from '../application/use-cases/schedule/UpdateBlock.js';
import { DeleteBlock } from '../application/use-cases/schedule/DeleteBlock.js';
import { ListTasks } from '../application/use-cases/task/ListTasks.js';
import { CreateTasks } from '../application/use-cases/task/CreateTasks.js';
import { UpdateTask } from '../application/use-cases/task/UpdateTask.js';
import { DeleteTask } from '../application/use-cases/task/DeleteTask.js';
import { ListExpenses } from '../application/use-cases/expense/ListExpenses.js';
import { CreateExpenses } from '../application/use-cases/expense/CreateExpenses.js';
import { UpdateExpense } from '../application/use-cases/expense/UpdateExpense.js';
import { DeleteExpense } from '../application/use-cases/expense/DeleteExpense.js';

export interface Overrides {
  recipeRepository?: RecipeRepository;
  scheduleRepository?: ScheduleRepository;
  taskRepository?: TaskRepository;
  expenseRepository?: ExpenseRepository;
  automationGateway?: AutomationGateway;
}

/**
 * Composition root: aquí (y solo aquí) se conectan puertos con adaptadores.
 * Se pueden inyectar overrides para tests.
 */
export function buildContainer(env: Pick<Env, 'supabase' | 'n8n'>, overrides: Overrides = {}) {
  const supabase = env.supabase;

  const recipeRepository = overrides.recipeRepository
    ?? (supabase ? new SupabaseRecipeRepository(supabase) : new InMemoryRecipeRepository());
  const scheduleRepository = overrides.scheduleRepository
    ?? (supabase
      ? new SupabaseScheduleRepository(supabase)
      : new InMemoryDatedRepository((p) => new ScheduleBlock(p), (b) => `${b.date}${b.start}`));
  const taskRepository = overrides.taskRepository
    ?? (supabase ? new SupabaseTaskRepository(supabase) : new InMemoryDatedRepository((p) => new Task(p)));
  const expenseRepository = overrides.expenseRepository
    ?? (supabase ? new SupabaseExpenseRepository(supabase) : new InMemoryDatedRepository((p) => new Expense(p)));
  const automationGateway = overrides.automationGateway ?? new N8nWebhookGateway(env.n8n);

  return {
    useCases: {
      listRecipes: new ListRecipes({ recipeRepository }),
      createRecipe: new CreateRecipe({ recipeRepository, automationGateway }),
      listSchedule: new ListSchedule({ scheduleRepository }),
      createBlocks: new CreateBlocks({ scheduleRepository, recipeRepository, automationGateway }),
      updateBlock: new UpdateBlock({ scheduleRepository, recipeRepository }),
      deleteBlock: new DeleteBlock({ scheduleRepository }),
      listTasks: new ListTasks({ taskRepository }),
      createTasks: new CreateTasks({ taskRepository }),
      updateTask: new UpdateTask({ taskRepository }),
      deleteTask: new DeleteTask({ taskRepository }),
      listExpenses: new ListExpenses({ expenseRepository }),
      createExpenses: new CreateExpenses({ expenseRepository, automationGateway }),
      updateExpense: new UpdateExpense({ expenseRepository }),
      deleteExpense: new DeleteExpense({ expenseRepository }),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
export type UseCases = Container['useCases'];
