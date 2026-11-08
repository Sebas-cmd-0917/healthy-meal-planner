import { InMemoryRecipeRepository } from './adapters/persistence/memory/InMemoryRecipeRepository.js';
import { InMemoryScheduleRepository } from './adapters/persistence/memory/InMemoryScheduleRepository.js';
import { SupabaseRecipeRepository } from './adapters/persistence/supabase/SupabaseRecipeRepository.js';
import { SupabaseScheduleRepository } from './adapters/persistence/supabase/SupabaseScheduleRepository.js';
import { InMemoryDatedRepository } from './adapters/persistence/memory/InMemoryDatedRepository.js';
import { SupabaseTaskRepository } from './adapters/persistence/supabase/SupabaseTaskRepository.js';
import { SupabaseExpenseRepository } from './adapters/persistence/supabase/SupabaseExpenseRepository.js';
import { N8nWebhookGateway } from './adapters/automation/n8n/N8nWebhookGateway.js';
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
import { Task } from '../domain/task/Task.js';
import { Expense } from '../domain/expense/Expense.js';

/**
 * Composition root: aquí (y solo aquí) se conectan puertos con adaptadores.
 * Se pueden inyectar overrides para tests.
 */
export function buildContainer(env, overrides = {}) {
  const useSupabase = env.persistence === 'supabase';

  const recipeRepository = overrides.recipeRepository
    ?? (useSupabase ? new SupabaseRecipeRepository(env.supabase) : new InMemoryRecipeRepository());

  const scheduleRepository = overrides.scheduleRepository
    ?? (useSupabase ? new SupabaseScheduleRepository(env.supabase) : new InMemoryScheduleRepository());

  const taskRepository = overrides.taskRepository
    ?? (useSupabase ? new SupabaseTaskRepository(env.supabase) : new InMemoryDatedRepository(Task));

  const expenseRepository = overrides.expenseRepository
    ?? (useSupabase ? new SupabaseExpenseRepository(env.supabase) : new InMemoryDatedRepository(Expense));

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
